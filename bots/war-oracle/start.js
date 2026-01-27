const { client } = require("./src/client");

async function startWarOracle() {
  if (!process.env.WAR_ORACLE_TOKEN) {
    throw new Error("Missing WAR_ORACLE_TOKEN");
  }

  await client.login(process.env.WAR_ORACLE_TOKEN);
  console.log("🟢 War Oracle connected");
}

module.exports = { startWarOracle };
