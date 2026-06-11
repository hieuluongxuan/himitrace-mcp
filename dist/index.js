import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { TraceChain } from "./blockchain.js";
const chain = new TraceChain();
const server = new Server({
    name: "HimiTrace",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Resources List
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RESOURCES = {
    "himitrace://info": {
        name: "HimiTrace Info",
        mimeType: "text/plain",
        description: "General information about HimiTrace system and capabilities",
        read: () => `
    HimiTrace — Blockchain Product Traceability System
    
    Developed by HimiTek (himitek.com), HimiTrace provides immutable, 
    tamper-proof product traceability on the Polygon blockchain.
    
    Key Features:
    - Product registration with blockchain anchoring
    - Supply chain event tracking (GS1 EPCIS compatible)
    - Certificate management (stored on IPFS)
    - BOM (Bill of Materials) merge/split tracking
    - QR code generation for consumer verification
    - AI-powered natural language input
    
    Industries Served:
    - Agriculture (coffee, pepper, cashew nuts)
    - Seafood (shrimp, fish, aquaculture)
    - Manufacturing (components, materials)
    - Food & Beverage processing
    
    Compliance Standards:
    - EU Digital Product Passport (DPP)
    - GS1 EPCIS 2.0 event format
    - VietGAP, GlobalGAP, USDA Organic compatible
    
    Contact: https://himitek.com | Zalo: 0963123389
    `
    },
    "himitrace://contract": {
        name: "Contract Info",
        mimeType: "application/json",
        description: "Smart contract and blockchain network information",
        read: () => {
            if (!chain.connected)
                return "Blockchain not connected";
            return JSON.stringify({
                network: chain.config.network || "polygon_mainnet",
                chain_id: chain.config.chain_id || 137,
                contract_address: chain.config.contract_address,
                rpc_url: chain.config.rpc_url,
                explorer: `https://polygonscan.com/address/${chain.config.contract_address}`,
                deployer: chain.config.deployer || "",
                contract_version: "HimiTraceRegistryV2"
            }, null, 2);
        }
    },
    "himitrace://pricing": {
        name: "Pricing Info",
        mimeType: "text/plain",
        description: "HimiTrace MCP Server pricing tiers",
        read: () => `
    HimiTrace MCP Server — Pricing
    
    FREE Tier:
    - 100 read queries/day
    - Product verification
    - Supply chain history
    - Perfect for testing and development
    
    PRO ($49/month):
    - 10,000 queries/day
    - All read operations
    - Priority support
    - Compliance reporting
    
    ENTERPRISE ($299/month):
    - Unlimited queries
    - Write access (register products, add events)
    - Custom integration support
    - SLA guarantee
    - Dedicated support channel
    
    Contact: mcp@himitek.com
    `
    }
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Handlers setup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "verify_product",
                description: "Verify if a product exists on the HimiTrace blockchain and retrieve its basic information including name, origin, owner, and registration date.",
                inputSchema: {
                    type: "object",
                    properties: {
                        product_id: { type: "string", description: "The product/batch ID (e.g., LOT-20260315-A1B2C3)" }
                    },
                    required: ["product_id"]
                }
            },
            {
                name: "get_trace_history",
                description: "Get the complete supply chain timeline (events like harvest, process, ship) for a product registered on the Polygon blockchain.",
                inputSchema: {
                    type: "object",
                    properties: {
                        product_id: { type: "string", description: "The product/batch ID" }
                    },
                    required: ["product_id"]
                }
            },
            {
                name: "get_certificates",
                description: "Get all quality certificates (VietGAP, USDA Organic, Fair Trade) attached to a product, with IPFS download links.",
                inputSchema: {
                    type: "object",
                    properties: {
                        product_id: { type: "string", description: "The product/batch ID" }
                    },
                    required: ["product_id"]
                }
            },
            {
                name: "get_batch_lineage",
                description: "Get the Bill of Materials (BOM) lineage for a batch showing merge/split history of ingredients.",
                inputSchema: {
                    type: "object",
                    properties: {
                        batch_id: { type: "string", description: "The batch/lot ID to trace" }
                    },
                    required: ["batch_id"]
                }
            },
            {
                name: "check_product_exists",
                description: "Quick check if a product ID is registered on the blockchain. Returns boolean status.",
                inputSchema: {
                    type: "object",
                    properties: {
                        product_id: { type: "string", description: "The product/batch ID to check" }
                    },
                    required: ["product_id"]
                }
            },
            {
                name: "get_system_stats",
                description: "Get overall statistics of the HimiTrace system, including total registered products, wallet balance, and contract info.",
                inputSchema: {
                    type: "object",
                    properties: {}
                }
            }
        ]
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    let resultText = "";
    try {
        if (!chain.connected) {
            throw new Error("Blockchain not connected. Running in demo mode.");
        }
        switch (name) {
            case "verify_product": {
                const productId = String(args?.product_id);
                const exists = await chain.productExists(productId);
                if (!exists) {
                    resultText = JSON.stringify({
                        verified: false,
                        product_id: productId,
                        message: `Product '${productId}' NOT FOUND on blockchain.`,
                        note: "This product has not been registered on HimiTrace. It may be counterfeit or not yet enrolled in the traceability system."
                    }, null, 2);
                }
                else {
                    const product = await chain.getProduct(productId);
                    if (!product) {
                        throw new Error("Failed to read product data from blockchain");
                    }
                    resultText = JSON.stringify({
                        verified: true,
                        product_id: productId,
                        name: product.name,
                        origin: product.origin,
                        owner: product.owner,
                        registered_at: product.created_at,
                        total_events: product.event_count,
                        blockchain: {
                            network: "Polygon Mainnet",
                            contract: chain.config.contract_address,
                            explorer: `https://polygonscan.com/address/${chain.config.contract_address}`
                        },
                        verify_url: `https://trace.himitek.vn/?id=${productId}`
                    }, null, 2);
                }
                break;
            }
            case "get_trace_history": {
                const productId = String(args?.product_id);
                const exists = await chain.productExists(productId);
                if (!exists) {
                    throw new Error(`Product '${productId}' not found on blockchain`);
                }
                const product = await chain.getProduct(productId);
                const history = await chain.getHistory(productId);
                const parsedEvents = history.map((ev) => {
                    let eventData = { raw: ev.data };
                    try {
                        eventData = JSON.parse(ev.data);
                    }
                    catch (e) {
                        // keep raw data
                    }
                    return {
                        timestamp: ev.timestamp,
                        event_type: ev.event_type,
                        data: eventData,
                        recorder_address: ev.recorder
                    };
                });
                resultText = JSON.stringify({
                    product_id: productId,
                    product_name: product?.name || "",
                    origin: product?.origin || "",
                    total_events: parsedEvents.length,
                    timeline: parsedEvents,
                    blockchain: {
                        network: "Polygon Mainnet",
                        contract: chain.config.contract_address
                    }
                }, null, 2);
                break;
            }
            case "get_certificates": {
                const productId = String(args?.product_id);
                const exists = await chain.productExists(productId);
                if (!exists) {
                    throw new Error(`Product '${productId}' not found`);
                }
                const certs = await chain.getCertificates(productId);
                const certsWithUrl = certs.map((c) => ({
                    ...c,
                    ipfs_url: c.ipfsCID ? `https://gateway.pinata.cloud/ipfs/${c.ipfsCID}` : undefined
                }));
                resultText = JSON.stringify({
                    product_id: productId,
                    total_certificates: certsWithUrl.length,
                    certificates: certsWithUrl,
                    note: "Certificate files are stored on IPFS. Hashes are anchored on Polygon blockchain for tamper-proof verification."
                }, null, 2);
                break;
            }
            case "get_batch_lineage": {
                const batchId = String(args?.batch_id);
                const links = await chain.getBatchLinks(batchId);
                if (links.length === 0) {
                    resultText = JSON.stringify({
                        batch_id: batchId,
                        has_lineage: false,
                        message: "No BOM lineage found. This batch has no merge/split history."
                    }, null, 2);
                }
                else {
                    resultText = JSON.stringify({
                        batch_id: batchId,
                        has_lineage: true,
                        total_links: links.length,
                        relationships: links
                    }, null, 2);
                }
                break;
            }
            case "check_product_exists": {
                const productId = String(args?.product_id);
                const exists = await chain.productExists(productId);
                resultText = JSON.stringify({
                    product_id: productId,
                    exists: exists,
                    blockchain: "Polygon Mainnet"
                }, null, 2);
                break;
            }
            case "get_system_stats": {
                const count = await chain.getProductCount();
                // deployer address from config
                const deployer = chain.config.deployer || "0x798F966f678353c470facA26964924979e17b8E9";
                const balance = await chain.getBalance(deployer);
                resultText = JSON.stringify({
                    total_products_registered: count,
                    wallet_balance_pol: Number(balance.toFixed(4)),
                    network: chain.config.network === "polygon_mainnet" ? "Polygon Mainnet" : "Polygon Amoy Testnet",
                    contract_address: chain.config.contract_address,
                    contract_explorer: `https://polygonscan.com/address/${chain.config.contract_address}`,
                    verify_portal: "https://trace.himitek.vn",
                    powered_by: "HimiTek — himitek.com"
                }, null, 2);
                break;
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
        resultText = JSON.stringify({ error: err.message || String(err) }, null, 2);
    }
    return {
        content: [
            {
                type: "text",
                text: resultText
            }
        ]
    };
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Resources Handlers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: Object.keys(RESOURCES).map((uri) => {
            const res = RESOURCES[uri];
            return {
                uri,
                name: res.name,
                mimeType: res.mimeType,
                description: res.description
            };
        })
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const res = RESOURCES[uri];
    if (!res) {
        throw new Error(`Resource not found: ${uri}`);
    }
    return {
        contents: [
            {
                uri,
                mimeType: res.mimeType,
                text: res.read()
            }
        ]
    };
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Run
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("HimiTrace MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
