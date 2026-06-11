# HimiTrace MCP Server — Blockchain Product Traceability for AI Agents (TypeScript Port)

[![Polygon Mainnet](https://img.shields.io/badge/Network-Polygon_Mainnet-8247E5?style=flat-square&logo=polygon&logoColor=white)](https://polygonscan.com/address/0xFF7A3429427aFda56b2994B2F3eeF4464b851EE0)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP-blue?style=flat-square)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

HimiTrace is a Model Context Protocol (MCP) server that connects AI agents directly to the Polygon Mainnet blockchain to check product authenticity, verify origins, and inspect supply chain event lineages. Developed by **HimiTek** (himitek.com), it bridges immutable on-chain trust data with natural language queries for AI agents.

This allows any MCP-compatible AI agent (such as Claude Desktop, Cursor, Windsurf, or ChatGPT) to query, track, and audit physical goods on-chain in plain language.

---

## Key Features

- **On-Chain Verification:** Verify if a product or batch ID is registered on the Polygon blockchain (tamper-proof, immutable).
- **Supply Chain Timeline (GS1 EPCIS compatible):** Retrieve the full chronological event log of a product (harvesting, processing, packaging, shipping) directly from Polygon.
- **Certificate Verification:** Access quality certificates (USDA Organic, VietGAP, Fair Trade, etc.) stored on IPFS with their hashes anchored on-chain.
- **BOM (Bill of Materials) Lineage:** Trace parent-child merge/split relationships of raw material batches.
- **Zero Gas Cost:** All read operations from the smart contract are 100% free and do not require any crypto tokens (POL) to be spent by the AI agent.

---

## Technical Specifications

- **Contract Address:** `0xFF7A3429427aFda56b2994B2F3eeF4464b851EE0`
- **Network:** Polygon Mainnet (Chain ID: `137`)
- **Framework:** built on Anthropic's Model Context Protocol (MCP) SDK using TypeScript and `ethers.js` (v6).

---

## Installation & Setup

### 1. Prerequisites
- Node.js v20 or higher
- npm

### 2. Install Dependencies
Clone the repository and install the packages:
```bash
npm install
```

### 3. Build the Project
Compile TypeScript to Javascript:
```bash
npm run build
```

### 4. Test Connection
Ensure that the server can connect to the Polygon contract and query tools locally:
```bash
npm run test:local
```
If you see `ALL TESTS PASSED`, your environment is configured correctly.

---

## Connecting to AI Clients

### 1. Claude Desktop
Add HimiTrace MCP to your Claude Desktop configuration file.

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following to the `mcpServers` object:
```json
{
  "mcpServers": {
    "himitrace-mcp": {
      "command": "node",
      "args": [
        "C:/path/to/your/himitrace-mcp/dist/index.js"
      ]
    }
  }
}
```
*Note: Make sure to replace `C:/path/to/your/himitrace-mcp/dist/index.js` with the actual absolute path to your compiled entry point.*

### 2. Cursor or Windsurf IDE
In Cursor settings:
1. Go to **Settings > Features > MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the fields:
   - **Name:** `HimiTrace`
   - **Type:** `command`
   - **Command:** `node "C:/path/to/your/himitrace-mcp/dist/index.js"`

---

## Available Tools

AI agents can execute the following tools:

### 1. `verify_product`
Checks if a product exists on-chain and retrieves its registration parameters.
- **Argument:** `product_id` (string, e.g., `LOT-20260315-A1B2C3`)
- **Returns:** JSON containing verification status, name, origin, owner, registration date, and explorer links.

### 2. `get_trace_history`
Retrieves the complete supply chain history (timeline) of a product.
- **Argument:** `product_id` (string)
- **Returns:** Chronological array of events, including event types, timestamps, custom payload data (GS1 EPCIS standard), and the recorder's blockchain wallet address.

### 3. `get_certificates`
Retrieves certificates attached to a product.
- **Argument:** `product_id` (string)
- **Returns:** Lists certificate types, issuers, dates of issue/expiration, and secure IPFS gateway links.

### 4. `get_batch_lineage`
Traces the Bill of Materials (BOM) lineage (splits and merges of batches).
- **Argument:** `batch_id` (string)
- **Returns:** Parent-child relationships, quantities, and units of raw material inputs.

### 5. `check_product_exists`
Quick check for product presence.
- **Argument:** `product_id` (string)
- **Returns:** True/False status.

### 6. `get_system_stats`
Provides overall system statistics.
- **Returns:** Registered products count, contract details, and wallet balance.

---

## Available Resources

AI agents can reference the following static resources:

- `himitrace://info`: General system documentation, compliant industries, and standards.
- `himitrace://contract`: Blockchain metadata (chain_id, RPC node, contract code version).
- `himitrace://pricing`: Pricing tiers for API limits (Free, Pro, Enterprise).

---

## License & Support
Developed and maintained by **HimiTek Joint Stock Company**.
- Website: [himitek.com](https://himitek.com)
- Support Email: [mcp@himitek.com](mailto:mcp@himitek.com)
- Portal: [trace.himitek.vn](https://trace.himitek.vn)
