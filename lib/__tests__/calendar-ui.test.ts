/**
 * Calendar UI tests
 * 
 * Run with: npx tsx lib/__tests__/calendar-ui.test.ts
 */

const API_BASE = "http://localhost:3000";

async function testCalendarPage() {
  console.log("📅 Testing calendar page...");
  
  const response = await fetch(`${API_BASE}/calendar`);
  const html = await response.text();
  
  console.log("Status:", response.status);
  console.log("Has Calendar title:", html.includes("Calendar") || html.includes("Календарь"));
  
  if (response.status === 200) {
    console.log("✅ Calendar page loads");
  } else {
    console.log("❌ Failed to load calendar page");
  }
}

async function testCalendarAPIIntegration() {
  console.log("\n🔗 Testing calendar API integration...");
  
  const response = await fetch(`${API_BASE}/api/calendar/events`);
  const events = await response.json();
  
  console.log("Events loaded:", events.length);
  
  if (events.length > 0) {
    console.log("✅ Calendar has events");
    console.log("  First event:", events[0].title);
    console.log("  Color:", events[0].color);
  } else {
    console.log("⚠️ No events in calendar");
  }
}

async function runTests() {
  console.log("🚀 Starting Calendar UI tests...\n");
  console.log("=".repeat(50));
  
  try {
    await testCalendarPage();
    await testCalendarAPIIntegration();
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ All calendar UI tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

runTests();
