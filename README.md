# raspbi-pilot

<p align="center">
  <img src="https://raw.githubusercontent.com/PHTMGatt/12-React-Portfolio/main/src/assets/photos/raspbi.png" width="900" alt="raspbi-pilot project artwork">
</p>

**raspbi-pilot** is the Raspberry Pi steward: the systemd units and one installer that keep Bryen's Discord bots running on an always-on Pi.

It does not contain bot code. Each bot lives in its own repo and runs as its **own service**, so one crash never takes the other down.

| Service | Repo | What it is |
| --- | --- | --- |
| `legacy-bot` | [Discord-Legacy-Bot](https://github.com/PHTMGatt/Discord-Legacy-Bot) | Commit formatter + GitHub push alerts |
| `war-oracle` | [War-Oracle-Bot](https://github.com/PHTMGatt/War-Oracle-Bot) | Clash of Clans war alerts + channel tools |

> This replaces the old single-process launcher, which could not run (it required files that were never in the repo) and launched two bots that are now merged into these two.

---

## What you need

- A Raspberry Pi with Raspberry Pi OS (64-bit) and internet.
- `git` and **Node 20+**. If Node is missing or old:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs git
  ```
- Two Discord bot tokens, one per bot (from the Discord developer portal).
- A Clash of Clans API key, **created for the Pi's public IP** (keys are IP-locked, so the PC's key will not work on the Pi).

## Install

```bash
git clone https://github.com/PHTMGatt/raspbi-pilot.git
cd raspbi-pilot
sudo ./install.sh
```

The installer:

1. Creates a locked-down service user `bots` (no login shell) with home `/opt/bots`.
2. Clones both bots (branch `claude-forge` until it is merged; then run with `BRANCH=main sudo -E ./install.sh`) and runs `npm ci --omit=dev`.
3. Creates an `.env` per bot from `env.example`, `chmod 600`, with **empty values**. It never asks for or stores tokens.
4. Installs and enables the two systemd units (hardened: no new privileges, read-only filesystem except the bot's own `data/` folder). It does not start them.

Then:

```bash
sudo -u bots nano /opt/bots/Discord-Legacy-Bot/.env   # tokens go here, nowhere else
sudo -u bots nano /opt/bots/War-Oracle-Bot/.env
sudo systemctl start legacy-bot war-oracle
journalctl -u legacy-bot -u war-oracle -f
```

### Variables (names only)

`env.example` lists them; the bot READMEs explain each one.

| Bot | Needs |
| --- | --- |
| Legacy Bot | `DISCORD_TOKEN`, `GITHUB_WEBHOOK_SECRET` (for push alerts) |
| War Oracle | `DISCORD_TOKEN` (its own), `COC_TOKEN`, `CLAN_TAG`, `WAR_ALERTS_CHANNEL_ID` |

Overrides for the installer: `BOTS_USER`, `BOTS_DIR`, `BRANCH`, `OWNER`.

## Operate

```bash
systemctl status legacy-bot war-oracle      # state
sudo systemctl restart war-oracle           # restart one
sudo ./install.sh && sudo systemctl restart legacy-bot war-oracle   # update both
```

Services restart on crash and start on boot.

## GitHub push alerts need a way in

Legacy Bot receives GitHub webhooks on port 3000 (`/github`). From a home network, use a tunnel (for example a Cloudflare Tunnel to `http://localhost:3000`) instead of opening router ports. Slash commands, Legacy mode and all of War Oracle only make outbound connections and need nothing opened.

## Not here yet (plan)

Heartbeat and monitoring, Mongo backups, wake-on-LAN for the PC, a job queue and a read-only dashboard are planned as later steps, each one approved separately.

## CI

Every PR and `claude-forge` push runs tests, `npm audit`, a gitleaks secrets scan and a config check (the same DELTA gates as the bots). `npm test` checks the unit files, `install.sh` syntax and that `env.example` holds no values.

---

Private / internal use.
