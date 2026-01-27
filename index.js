require("dotenv").config();
const express = require("express");

const { startClashCommander } = require("./bots/clash-commander/start");
const { startWarOracle } = require("./bots/war-oracle/start");

const app = express();
const PORT = process.env.PORT || 3000;

// simple runtime state
const status = {
  pilot: "BOOTING",
  clashCommander: "OFFLINE",
  warOracle: "OFFLINE",
};

// status page
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>raspbi-pilot status</title>
  <style>
    body {
      background:#0b0f14;
      color:#e6edf3;
      font-family: system-ui, sans-serif;
      display:flex;
      justify-content:center;
      align-items:center;
      height:100vh;
    }
    .card {
      background:#111826;
      padding:24px 32px;
      border-radius:12px;
      width:320px;
      box-shadow:0 10px 30px rgba(0,0,0,.5);
    }
    h1 {
      margin-top:0;
      text-align:center;
    }
    .row {
      display:flex;
      justify-content:space-between;
      padding:8px 0;
      border-bottom:1px solid #1f2937;
    }
    .row:last-child { border-bottom:none; }
    .ok { color:#22c55e; }
    .bad { color:#ef4444; }
    small {
      display:block;
      text-align:center;
      margin-top:12px;
      color:#9aa4b2;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚁 raspbi-pilot</h1>

    <div class="row">
      <span>Process</span>
      <span class="ok">${status.pilot}</span>
    </div>

    <div class="row">
      <span>Clash Commander</span>
      <span class="${status.clashCommander === "ONLINE" ? "ok" : "bad"}">
        ${status.clashCommander}
      </span>
    </div>

    <div class="row">
      <span>War Oracle</span>
      <span class="${status.warOracle === "ONLINE" ? "ok" : "bad"}">
        ${status.warOracle}
      </span>
    </div>

    <small>render runtime</small>
  </div>
</body>
</html>
`);
});

// boot everything
async function boot() {
  console.log("🚁 raspbi-pilot booting...");
  status.pilot = "ONLINE";

  await startClashCommander();
  status.clashCommander = "ONLINE";

  await startWarOracle();
  status.warOracle = "ONLINE";

  console.log("✅ all bots online");
}

boot().catch(err => {
  console.error("❌ boot failure", err);
  process.exit(1);
});

// start web server
app.listen(PORT, () => {
  console.log(`🌐 status page on port ${PORT}`);
});
