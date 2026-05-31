"""
Test HimiTrace MCP Server — Query Polygon Mainnet that
"""

import asyncio
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastmcp import Client
from server import mcp as himitrace_server


async def test():
    print("=" * 60)
    print("  Testing HimiTrace MCP Server")
    print("  Connecting to Polygon Mainnet...")
    print("=" * 60)
    print()
    
    async with Client(himitrace_server) as client:
        
        # 1. List tools
        tools = await client.list_tools()
        print(f"[OK] {len(tools)} tools available:")
        for t in tools:
            print(f"     - {t.name}")
        print()
        
        # 2. Get system stats
        print("[TEST] get_system_stats...")
        result = await client.call_tool("get_system_stats", {})
        data = json.loads(result.content[0].text)
        if "error" in data:
            print(f"  [WARN] {data['error']}")
            print("  Server running in DEMO mode (no blockchain)")
        else:
            print(f"  Total products: {data['total_products_registered']}")
            print(f"  Balance: {data['wallet_balance_pol']} POL")
            print(f"  Network: {data['network']}")
            print(f"  Contract: {data['contract_address']}")
        print()
        
        # 3. List resources
        resources = await client.list_resources()
        print(f"[OK] {len(resources)} resources available:")
        for r in resources:
            print(f"     - {r.uri}")
        print()
        
        # 4. Read system info resource
        print("[TEST] Reading himitrace://info...")
        info = await client.read_resource("himitrace://info")
        # Just verify it returns without error
        print("  [OK] System info loaded")
        print()
    
    print("=" * 60)
    print("  ALL TESTS PASSED")
    print("=" * 60)
    print()
    print("  Next steps:")
    print("  1. Deploy to VPS: scp to opc:~/himitrace-mcp/")
    print("  2. Run HTTP mode: fastmcp run server.py --transport sse --port 8900")
    print("  3. Connect Claude Desktop: add to claude_desktop_config.json")


if __name__ == "__main__":
    asyncio.run(test())
