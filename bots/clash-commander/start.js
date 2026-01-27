const { client } = require("./src/client");

async function startClashCommander() {
  if (!process.env.CLASH_COMMANDER_TOKEN) {
    throw new Error("Missing CLASH_COMMANDER_TOKEN");
  }

  await client.login(process.env.CLASH_COMMANDER_TOKEN);
  console.log("🟢 Clash Commander connected");
}

module.exports = { startClashCommander };
