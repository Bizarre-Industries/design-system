#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';
const SSE_URL = process.env.AFFINITY_MCP_SSE_URL ?? 'http://localhost:6767/sse';
const CONNECT_TIMEOUT_MS = parsePositiveInteger(
  process.env.AFFINITY_MCP_CONNECT_TIMEOUT_MS,
  8_000,
);
const IDLE_DISCONNECT_MS = parsePositiveInteger(
  process.env.AFFINITY_MCP_IDLE_DISCONNECT_MS,
  30_000,
);

const toolsPath = new URL('./tools.json', import.meta.url);
let cachedTools = JSON.parse(await readFile(fileURLToPath(toolsPath), 'utf8'));

let upstream = null;
let upstreamTransport = null;
let connecting = null;
let idleTimer = null;
let lastError = null;
let shuttingDown = false;
let connectionGeneration = 0;

const statusTool = {
  name: 'affinity_status',
  description: 'Check whether the lazy bridge can connect to Affinity by Canva local MCP server.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  annotations: {
    title: 'Check Affinity MCP status',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function cancelIdleClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = null;
}

function scheduleIdleClose() {
  cancelIdleClose();
  idleTimer = setTimeout(() => {
    void closeUpstream();
  }, IDLE_DISCONNECT_MS);
  idleTimer.unref();
}

async function closeClient(client, transport) {
  try {
    await client?.close();
  } catch {
    try {
      await transport?.close();
    } catch {
      // The connection is already gone.
    }
  }
}

async function closeUpstream() {
  cancelIdleClose();
  const client = upstream;
  const transport = upstreamTransport;
  upstream = null;
  upstreamTransport = null;
  await closeClient(client, transport);
}

async function connectWithTimeout(client, transport) {
  let timeout;
  try {
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Connection timed out after ${CONNECT_TIMEOUT_MS} ms`)),
          CONNECT_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    await closeClient(client, transport);
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function freshConnect() {
  await closeUpstream();
  const transport = new SSEClientTransport(new URL(SSE_URL));
  const client = new Client(
    { name: 'bizarre-affinity-mcp-bridge-lazy', version: VERSION },
    { capabilities: {} },
  );
  await connectWithTimeout(client, transport);
  upstream = client;
  upstreamTransport = transport;
  connectionGeneration += 1;
  lastError = null;
  return client;
}

async function getUpstream() {
  cancelIdleClose();
  if (upstream) return upstream;
  if (!connecting) {
    connecting = freshConnect().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

async function callWithReconnect(fn) {
  try {
    let firstError;
    try {
      return await fn(await getUpstream());
    } catch (error) {
      firstError = error;
      await closeUpstream();
    }

    try {
      return await fn(await getUpstream());
    } catch (error) {
      lastError = error ?? firstError;
      await closeUpstream();
      throw error;
    }
  } finally {
    if (upstream) scheduleIdleClose();
  }
}

function connectionHelp(error) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: [
        `Could not connect to Affinity MCP at ${SSE_URL}.`,
        '',
        'Affinity 3.2 or newer must be running with Settings > Model Context Protocol > Enable MCP server turned on.',
        `Last error: ${errorMessage(error)}`,
      ].join('\n'),
    }],
    structuredContent: {
      connected: false,
      sseUrl: SSE_URL,
      lastError: errorMessage(error),
    },
  };
}

async function statusResult() {
  try {
    const result = await callWithReconnect((client) => client.listTools());
    cachedTools = result.tools;
    return {
      content: [{
        type: 'text',
        text: `Connected to Affinity MCP at ${SSE_URL}. Found ${cachedTools.length} upstream tools.`,
      }],
      structuredContent: {
        connected: true,
        sseUrl: SSE_URL,
        upstreamToolCount: cachedTools.length,
        idleDisconnectMs: IDLE_DISCONNECT_MS,
        connectionGeneration,
        upstreamTools: cachedTools.map((tool) => tool.name),
      },
    };
  } catch (error) {
    return connectionHelp(error);
  }
}

const server = new Server(
  { name: 'bizarre-affinity-mcp-bridge-lazy', version: VERSION },
  { capabilities: { tools: {}, resources: {}, prompts: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [statusTool, ...cachedTools.filter((tool) => tool.name !== statusTool.name)],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === statusTool.name) return statusResult();
  try {
    return await callWithReconnect((client) => client.callTool(request.params));
  } catch (error) {
    return connectionHelp(error);
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({ resourceTemplates: [] }));
server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [] }));
server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
  callWithReconnect((client) => client.readResource(request.params)),
);
server.setRequestHandler(GetPromptRequestSchema, async (request) =>
  callWithReconnect((client) => client.getPrompt(request.params)),
);

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await closeUpstream();
  await server.close();
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    void shutdown().finally(() => process.exit(0));
  });
}

process.stdin.on('end', () => {
  void shutdown();
});

const stdio = new StdioServerTransport();
await server.connect(stdio);
