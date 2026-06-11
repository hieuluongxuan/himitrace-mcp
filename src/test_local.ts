import { TraceChain } from "./blockchain.js";

async function runTests() {
  console.log("============================================================");
  console.log("  Testing HimiTrace MCP Server (TypeScript Port)");
  console.log("  Connecting to Polygon Mainnet...");
  console.log("============================================================");
  console.log();

  const chain = new TraceChain();
  if (!chain.connected) {
    console.error("[FAIL] Could not connect to Polygon Mainnet.");
    process.exit(1);
  }

  console.log("[OK] Blockchain Connected successfully.");
  console.log(`     Contract Address: ${chain.config.contract_address}`);
  console.log(`     RPC Node:         ${chain.config.rpc_url}`);
  console.log();

  try {
    // 1. Get stats
    console.log("[TEST] getProductCount...");
    const count = await chain.getProductCount();
    console.log(`  [OK] Total products registered: ${count}`);
    console.log();

    // 2. Get wallet balance
    console.log("[TEST] getBalance for deployer...");
    const deployer = chain.config.deployer || "0x798F966f678353c470facA26964924979e17b8E9";
    const balance = await chain.getBalance(deployer);
    console.log(`  [OK] Balance: ${balance} POL`);
    console.log();

    // 3. Verify product
    const testProductId = "LOT-20260315-A1B2C3";
    console.log(`[TEST] checkProductExists for ${testProductId}...`);
    const exists = await chain.productExists(testProductId);
    console.log(`  [OK] Exists: ${exists}`);
    
    if (exists) {
      console.log(`[TEST] getProduct details...`);
      const details = await chain.getProduct(testProductId);
      console.log("  [OK] Product details:", details);
      
      console.log(`[TEST] getHistory...`);
      const history = await chain.getHistory(testProductId);
      console.log(`  [OK] History events count: ${history.length}`);
      
      console.log(`[TEST] getCertificates...`);
      const certs = await chain.getCertificates(testProductId);
      console.log(`  [OK] Certificates count: ${certs.length}`);
    } else {
      console.log("  (Test product not found on chain, which is expected if not registered)");
    }
    console.log();

  } catch (err) {
    console.error("[FAIL] Error running tests:", err);
    process.exit(1);
  }

  console.log("============================================================");
  console.log("  ALL TESTS PASSED");
  console.log("============================================================");
}

runTests();
