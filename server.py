"""
=====================================================================
  HimiTrace MCP Server — PRODUCTION
  Blockchain Product Traceability for AI Agents
  
  Connects to REAL Polygon Mainnet smart contract.
  All read operations are FREE (no gas cost).
  
  Contract: 0xFF7A3429427aFda56b2994B2F3eeF4464b851EE0
  Network: Polygon Mainnet (chain_id: 137)
  
  Usage:
    Local:  python server.py
    HTTP:   fastmcp run server.py --transport sse --port 8900
    
  Any MCP-compatible AI agent can connect and use these tools:
    Claude, ChatGPT, Gemini, Cursor, Windsurf, etc.
=====================================================================
"""

import os
import sys
import json
import logging
from datetime import datetime

from fastmcp import FastMCP

# ── Setup paths so we can import chain.py from parent dir ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
sys.path.insert(0, PARENT_DIR)

logging.basicConfig(
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    level=logging.INFO
)
logger = logging.getLogger("himitrace-mcp")

# ── Initialize blockchain connection ──
try:
    from chain import TraceChain
    chain = TraceChain()
    BLOCKCHAIN_CONNECTED = True
    logger.info(f"Blockchain connected: {chain.config['contract_address']}")
    logger.info(f"Network: {'Testnet' if chain.is_testnet else 'Mainnet'}")
except Exception as e:
    logger.warning(f"Blockchain connection failed: {e}")
    logger.warning("Running in DEMO mode with sample data")
    BLOCKCHAIN_CONNECTED = False
    chain = None

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MCP Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

mcp = FastMCP(
    name="HimiTrace",
    instructions="""
    HimiTrace — Blockchain Product Traceability for Vietnamese Exports.
    
    This server provides real-time access to product origin verification,
    supply chain tracking, and compliance checking — all anchored on 
    the Polygon blockchain for tamper-proof transparency.
    
    Use cases:
    - Verify product authenticity and origin
    - Track supply chain events (farm → export)
    - Check EU Digital Product Passport compliance
    - View BOM (Bill of Materials) lineage
    - Access product certificates (stored on IPFS)
    
    All read operations are FREE (no gas cost).
    Data is sourced directly from Polygon Mainnet smart contract.
    
    Contract: 0xFF7A3429427aFda56b2994B2F3eeF4464b851EE0
    Explorer: https://polygonscan.com/address/0xFF7A3429427aFda56b2994B2F3eeF4464b851EE0
    """
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOOL 1: Verify Product
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@mcp.tool()
def verify_product(product_id: str) -> str:
    """
    Verify if a product exists on the HimiTrace blockchain and retrieve 
    its basic information including name, origin, owner, and registration date.
    
    This is the primary tool for checking product authenticity.
    The data is read directly from Polygon blockchain (immutable, tamper-proof).
    
    Args:
        product_id: The product/batch ID (e.g., LOT-20260315-A1B2C3)
    
    Returns:
        Product details if found, or error message if not registered.
    """
    if not BLOCKCHAIN_CONNECTED:
        return json.dumps({"error": "Blockchain not connected. Running in demo mode."})
    
    exists = chain.product_exists(product_id)
    if not exists:
        return json.dumps({
            "verified": False,
            "product_id": product_id,
            "message": f"Product '{product_id}' NOT FOUND on blockchain.",
            "note": "This product has not been registered on HimiTrace. "
                    "It may be counterfeit or not yet enrolled in the traceability system."
        }, ensure_ascii=False, indent=2)
    
    product = chain.get_product(product_id)
    if not product:
        return json.dumps({"error": "Failed to read product data from blockchain"})
    
    return json.dumps({
        "verified": True,
        "product_id": product_id,
        "name": product["name"],
        "origin": product["origin"],
        "owner": product["owner"],
        "registered_at": product["created_at"],
        "total_events": product["event_count"],
        "blockchain": {
            "network": "Polygon Mainnet",
            "contract": chain.config["contract_address"],
            "explorer": chain._contract_url()
        },
        "verify_url": f"https://trace.himitek.vn/?id={product_id}"
    }, ensure_ascii=False, indent=2)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOOL 2: Get Trace History (Supply Chain Timeline)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@mcp.tool()
def get_trace_history(product_id: str) -> str:
    """
    Get the complete supply chain timeline for a product.
    Each event (harvest, processing, packaging, shipping, etc.) 
    is recorded immutably on the Polygon blockchain.
    
    Events follow GS1 EPCIS standard format when available.
    
    Args:
        product_id: The product/batch ID
    
    Returns:
        Complete chronological timeline of all supply chain events,
        including event type, timestamp, details, and recorder address.
    """
    if not BLOCKCHAIN_CONNECTED:
        return json.dumps({"error": "Blockchain not connected"})
    
    if not chain.product_exists(product_id):
        return json.dumps({"error": f"Product '{product_id}' not found on blockchain"})
    
    product = chain.get_product(product_id)
    history = chain.get_history(product_id)
    
    # Parse event data (may contain JSON with GS1 EPCIS fields)
    parsed_events = []
    for ev in history:
        event_data = {"raw": ev["data"]}
        try:
            data = json.loads(ev["data"])
            event_data = data
        except (json.JSONDecodeError, TypeError):
            pass
        
        parsed_events.append({
            "timestamp": ev["timestamp"],
            "event_type": ev["event_type"],
            "data": event_data,
            "recorder_address": ev["recorder"]
        })
    
    return json.dumps({
        "product_id": product_id,
        "product_name": product["name"],
        "origin": product["origin"],
        "total_events": len(parsed_events),
        "timeline": parsed_events,
        "blockchain": {
            "network": "Polygon Mainnet",
            "contract": chain.config["contract_address"]
        }
    }, ensure_ascii=False, indent=2)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOOL 3: Get Certificates
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@mcp.tool()
def get_certificates(product_id: str) -> str:
    """
    Get all quality certificates attached to a product.
    Certificates (VietGAP, USDA Organic, Fair Trade, ASC, etc.) 
    are stored on IPFS with their hashes anchored on blockchain.
    
    Args:
        product_id: The product/batch ID
    
    Returns:
        List of certificates with type, issuer, dates, and IPFS links.
    """
    if not BLOCKCHAIN_CONNECTED:
        return json.dumps({"error": "Blockchain not connected"})
    
    if not chain.product_exists(product_id):
        return json.dumps({"error": f"Product '{product_id}' not found"})
    
    certs = chain.get_certificates(product_id)
    
    # Add IPFS gateway URLs
    for cert in certs:
        if cert.get("ipfsCID"):
            cert["ipfs_url"] = f"https://gateway.pinata.cloud/ipfs/{cert['ipfsCID']}"
    
    return json.dumps({
        "product_id": product_id,
        "total_certificates": len(certs),
        "certificates": certs,
        "note": "Certificate files are stored on IPFS. "
                "Hashes are anchored on Polygon blockchain for tamper-proof verification."
    }, ensure_ascii=False, indent=2)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOOL 4: Get Batch Links (BOM Lineage)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@mcp.tool()
def get_batch_lineage(batch_id: str) -> str:
    """
    Get the Bill of Materials (BOM) lineage for a batch.
    Shows merge/split relationships: which input batches were combined 
    or how a batch was split into sub-batches.
    
    Useful for tracing raw material origins in manufacturing/processing.
    
    Args:
        batch_id: The batch/lot ID to trace
    
    Returns:
        Parent-child relationships with quantities and units.
    """
    if not BLOCKCHAIN_CONNECTED:
        return json.dumps({"error": "Blockchain not connected"})
    
    links = chain.get_batch_links(batch_id)
    
    if not links:
        return json.dumps({
            "batch_id": batch_id,
            "has_lineage": False,
            "message": "No BOM lineage found. This batch has no merge/split history."
        })
    
    return json.dumps({
        "batch_id": batch_id,
        "has_lineage": True,
        "total_links": len(links),
        "relationships": links
    }, ensure_ascii=False, indent=2)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOOL 5: Check Product Exists
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@mcp.tool()
def check_product_exists(product_id: str) -> str:
    """
    Quick check if a product ID is registered on the blockchain.
    Faster than verify_product — returns only existence status.
    
    Args:
        product_id: The product/batch ID to check
    
    Returns:
        Boolean existence status.
    """
    if not BLOCKCHAIN_CONNECTED:
        return json.dumps({"error": "Blockchain not connected"})
    
    exists = chain.product_exists(product_id)
    return json.dumps({
        "product_id": product_id,
        "exists": exists,
        "blockchain": "Polygon Mainnet"
    })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOOL 6: Get System Stats
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@mcp.tool()
def get_system_stats() -> str:
    """
    Get overall statistics of the HimiTrace system.
    Includes total products registered, wallet balance, and network info.
    
    Returns:
        System statistics including product count and network status.
    """
    if not BLOCKCHAIN_CONNECTED:
        return json.dumps({"error": "Blockchain not connected"})
    
    count = chain.get_product_count()
    balance = chain.get_balance()
    
    return json.dumps({
        "total_products_registered": count,
        "wallet_balance_pol": round(balance, 4),
        "network": "Polygon Mainnet" if not chain.is_testnet else "Polygon Amoy Testnet",
        "contract_address": chain.config["contract_address"],
        "contract_explorer": chain._contract_url(),
        "verify_portal": "https://trace.himitek.vn",
        "powered_by": "HimiTek — himitek.com"
    }, ensure_ascii=False, indent=2)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RESOURCES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@mcp.resource("himitrace://info")
def system_info() -> str:
    """General information about HimiTrace system and capabilities."""
    return """
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
    """


@mcp.resource("himitrace://contract")
def contract_info() -> str:
    """Smart contract and blockchain network information."""
    if not BLOCKCHAIN_CONNECTED:
        return "Blockchain not connected"
    
    return json.dumps({
        "network": chain.config.get("network", "polygon_mainnet"),
        "chain_id": chain.config.get("chain_id", 137),
        "contract_address": chain.config["contract_address"],
        "rpc_url": chain.config["rpc_url"],
        "explorer": chain._contract_url(),
        "deployer": chain.config.get("deployer", ""),
        "contract_version": "HimiTraceRegistryV2"
    }, indent=2)


@mcp.resource("himitrace://pricing")
def pricing_info() -> str:
    """HimiTrace MCP Server pricing tiers."""
    return """
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
    """


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Entry point
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    status = "LIVE (Polygon Mainnet)" if BLOCKCHAIN_CONNECTED else "DEMO MODE"
    print("=" * 60)
    print(f"  HimiTrace MCP Server — {status}")
    print("=" * 60)
    print()
    if BLOCKCHAIN_CONNECTED:
        print(f"  Contract: {chain.config['contract_address']}")
        print(f"  Network:  {'Testnet' if chain.is_testnet else 'Mainnet'}")
        print(f"  Products: {chain.get_product_count()}")
        print(f"  Balance:  {chain.get_balance():.4f} POL")
    print()
    print("  Tools: verify_product, get_trace_history,")
    print("         get_certificates, get_batch_lineage,")
    print("         check_product_exists, get_system_stats")
    print()
    print("  Ready for AI agents!")
    print("=" * 60)
    
    mcp.run()
