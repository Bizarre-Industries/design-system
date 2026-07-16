# Affinity MCP lazy bridge

This is a local hardening wrapper for
[`affinity-mcp-bridge`](https://github.com/andre-carbajal/affinity-mcp-bridge),
used under its MIT license.

It fixes two operational problems that appear when Affinity MCP is enabled
system-wide across many Codex tasks:

1. Tool discovery no longer opens an upstream SSE connection. The bridge
   advertises the Affinity 3.2.3 tool schema locally and connects only when a
   tool is actually called.
2. Upstream connections close after an idle period, and failed or timed-out
   connections are explicitly closed.

Environment variables:

- `AFFINITY_MCP_SSE_URL`, default `http://localhost:6767/sse`
- `AFFINITY_MCP_CONNECT_TIMEOUT_MS`, default `8000`
- `AFFINITY_MCP_IDLE_DISCONNECT_MS`, default `30000`

Run `npm test` with Affinity 3.2.3 or newer running to validate the bridge.
