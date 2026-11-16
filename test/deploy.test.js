// Checks the deploy files stay consistent. No Pi, no tokens, no network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const units = ['legacy-bot', 'war-oracle'];

test('each unit has the sections and hardening it needs', () => {
  for (const u of units) {
    const t = read(`systemd/${u}.service`);
    for (const must of ['[Unit]', '[Service]', '[Install]', 'Restart=always', 'NoNewPrivileges=true', 'ProtectSystem=strict', 'EnvironmentFile=@BOTS_DIR@', 'User=@BOTS_USER@', 'ExecStart=/usr/bin/node src/index.js']) {
      assert.ok(t.includes(must), `${u}: missing ${must}`);
    }
    assert.ok(!/(token|secret|key)\s*=\s*\S/i.test(t.replace(/EnvironmentFile=.*/g, '')), `${u}: looks like it holds a secret`);
  }
});

test('install.sh deploys both units and passes a bash syntax check', () => {
  const sh = read('install.sh');
  for (const u of units) assert.ok(sh.includes(u), `install.sh does not mention ${u}`);
  assert.ok(sh.includes('set -euo pipefail'));
  const r = spawnSync('bash', ['-n', path.join(root, 'install.sh')], { encoding: 'utf8' });
  if (r.error) return; // no bash on this machine (CI has one)
  assert.equal(r.status, 0, r.stderr);
});

test('env.example lists names only (no values)', () => {
  for (const line of read('env.example').split('\n')) {
    const m = /^#?\s*([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/\(.*$/, '').trim();
    if (['PORT', 'POLL_SECONDS', 'ALERT_MINUTES'].includes(m[1])) continue; // harmless defaults
    assert.equal(value, '', `${m[1]} must be empty in env.example`);
  }
});

test('env.example covers every variable the bots need', () => {
  const t = read('env.example');
  for (const v of ['DISCORD_TOKEN', 'GITHUB_WEBHOOK_SECRET', 'COC_TOKEN', 'CLAN_TAG', 'WAR_ALERTS_CHANNEL_ID']) assert.ok(t.includes(v), v);
});
