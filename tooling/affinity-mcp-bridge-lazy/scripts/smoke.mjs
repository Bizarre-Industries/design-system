import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const bridgePath = fileURLToPath(new URL('../index.mjs', import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [bridgePath],
  env: {
    ...process.env,
    AFFINITY_MCP_IDLE_DISCONNECT_MS: '250',
  },
  stderr: 'pipe',
});
const client = new Client({ name: 'affinity-lazy-smoke', version: '1.0.0' });

await client.connect(transport);
try {
  const discovery = await client.listTools();
  assert.equal(discovery.tools.length, 12);
  assert.equal(discovery.tools[0].name, 'affinity_status');
  assert.equal(new Set(discovery.tools.map((tool) => tool.name)).size, 12);

  const status = await client.callTool({ name: 'affinity_status', arguments: {} });
  assert.equal(status.isError, undefined);
  assert.equal(status.structuredContent?.connected, true);
  assert.equal(status.structuredContent?.upstreamToolCount, 11);
  assert.equal(status.structuredContent?.connectionGeneration, 1);

  await new Promise((resolve) => setTimeout(resolve, 750));
  const reconnected = await client.callTool({ name: 'affinity_status', arguments: {} });
  assert.equal(reconnected.structuredContent?.connected, true);
  assert.equal(reconnected.structuredContent?.connectionGeneration, 2);
  process.stdout.write('Affinity lazy bridge smoke test passed.\n');
} finally {
  await client.close();
}
