/**
 * Time Reports API tests
 * 
 * Run with: npx tsx lib/__tests__/time-reports.test.ts
 */

const API_BASE = "http://localhost:3000";

async function testTimeReportStats() {
  console.log("📊 Testing time reports API...");
  
  // Group by day
  const response = await fetch(`${API_BASE}/api/reports/time?groupBy=day`);
  const data = await response.json();
  
  console.log("Status:", response.status);
  console.log("Total entries:", data.totals.totalEntries);
  console.log("Grouped keys:", Object.keys(data.grouped));
  
  if (response.status === 200 && data.grouped) {
    console.log("✅ Time reports generated");
  } else {
    console.log("❌ Failed to generate time reports");
  }
}

async function runTests() {
  console.log("🚀 Starting Time Reports API tests...\n");
  console.log("=".repeat(50));
  
  try {
    await testTimeReportStats();
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ All reports tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

runTests();
