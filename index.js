require("dotenv").config();

const { startClashCommander } = require("./bots/clash-commander/start");
const { startWarOracle } = require("./bots/war-oracle/start");

async function boot() {
  console.log("🚁 raspbi-pilot initializing...");

  await Promise.all([
    startClashCommander(),
    startWarOracle(),
  ]);

  console.log("✅ All bots online and operational");
}

boot().catch(err => {
  console.error("❌ raspbi-pilot failed to launch:", err);
  process.exit(1);
});
