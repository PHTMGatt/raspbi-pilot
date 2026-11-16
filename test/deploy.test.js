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

const envFiles = { 'legacy-bot': 'env/legacy-bot.env.example', 'war-oracle': 'env/war-oracle.env.example' };
const needs = {
  'legacy-bot': ['DISCORD_TOKEN', 'GITHUB_WEBHOOK_SECRET'],
  'war-oracle': ['DISCORD_TOKEN', 'COC_TOKEN', 'CLAN_TAG', 'WAR_ALERTS_CHANNEL_ID'],
};
const foreign = { 'legacy-bot': ['COC_TOKEN', 'CLAN_TAG', 'WAR_ALERTS_CHANNEL_ID', 'POLL_SECONDS'], 'war-oracle': ['GITHUB_WEBHOOK_SECRET', 'OPENAI_API_KEY', 'PORT'] };
const active = (file) => (read(file).match(/^[A-Z][A-Z0-9_]*=.*$/gm) || []).map((l) => [l, l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]);

test('env templates list names only (no values)', () => {
  for (const file of Object.values(envFiles)) {
    for (const m of active(file)) {
      if (['PORT', 'POLL_SECONDS', 'ALERT_MINUTES'].includes(m[1])) continue; // harmless defaults
      assert.equal(m[2].trim(), '', `${file}: ${m[1]} must be empty`);
    }
  }
});

test('each bot template has an ACTIVE line for every variable that bot needs, and none of the other bot', () => {
  for (const [unit, file] of Object.entries(envFiles)) {
    const names = active(file).map((m) => m[1]);
    for (const v of needs[unit]) assert.ok(names.includes(v), `${file}: no active ${v}= line`);
    assert.equal(names.filter((n) => n === 'DISCORD_TOKEN').length, 1, `${file}: exactly one DISCORD_TOKEN`);
    for (const v of foreign[unit]) assert.ok(!names.includes(v), `${file}: ${v} belongs to the other bot`);
    assert.ok(!names.includes('DATA_DIR'), `${file}: DATA_DIR must stay unset (read-only filesystem)`);
  }
});

test('install.sh copies each unit its own template, and the units explain DATA_DIR', () => {
  const sh = read('install.sh');
  assert.ok(sh.includes('env/$unit.env.example'));
  for (const unit of units) {
    assert.ok(fs.existsSync(path.join(root, envFiles[unit])));
    assert.ok(/DATA_DIR/.test(read(`systemd/${unit}.service`)), `${unit}: unit should mention DATA_DIR / ReadWritePaths`);
  }
});

test('the Legacy template tells you about the Message Content intent', () => {
  assert.match(read(envFiles['legacy-bot']), /Message Content Intent/);
});
