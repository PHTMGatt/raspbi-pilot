#!/usr/bin/env bash
# raspbi-pilot installer: sets up Legacy Bot and War Oracle as systemd services on a Raspberry Pi.
# Run as root on the Pi:   sudo ./install.sh
# Safe to re-run. It never writes tokens: it creates .env files with empty values for YOU to fill in.
#
# Optional environment overrides:
#   BOTS_USER  service user to create/use     (default: bots)
#   BOTS_DIR   where the bots are cloned       (default: /opt/bots)
#   BRANCH     git branch to deploy            (default: main)
#   OWNER      GitHub owner                    (default: PHTMGatt)
set -euo pipefail

BOTS_USER="${BOTS_USER:-bots}"
BOTS_DIR="${BOTS_DIR:-/opt/bots}"
BRANCH="${BRANCH:-main}"
OWNER="${OWNER:-PHTMGatt}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "Run as root: sudo ./install.sh" >&2; exit 1; }

# Node 20+ and git are required
command -v git >/dev/null || { echo "git is missing: sudo apt install git" >&2; exit 1; }
command -v node >/dev/null || { echo "Node 20+ is missing (see README, NodeSource)" >&2; exit 1; }
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || { echo "Node 20+ required, found $(node -v)" >&2; exit 1; }
[ "$(command -v node)" = "/usr/bin/node" ] || echo "Note: node is at $(command -v node), the units expect /usr/bin/node. Edit ExecStart in /etc/systemd/system/*.service if needed."

# Service user without a login shell
id "$BOTS_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$BOTS_DIR" --shell /usr/sbin/nologin "$BOTS_USER"
mkdir -p "$BOTS_DIR"
chown "$BOTS_USER":"$BOTS_USER" "$BOTS_DIR"

deploy() {
  local repo="$1" unit="$2"
  local dir="$BOTS_DIR/$repo"
  if [ -d "$dir/.git" ]; then
    sudo -u "$BOTS_USER" git -C "$dir" fetch --quiet origin "$BRANCH"
    sudo -u "$BOTS_USER" git -C "$dir" checkout --quiet "$BRANCH"
    sudo -u "$BOTS_USER" git -C "$dir" merge --ff-only --quiet "origin/$BRANCH"
  else
    sudo -u "$BOTS_USER" git clone --quiet --branch "$BRANCH" "https://github.com/$OWNER/$repo.git" "$dir"
  fi
  (cd "$dir" && sudo -u "$BOTS_USER" npm ci --omit=dev --no-fund --no-audit)
  sudo -u "$BOTS_USER" mkdir -p "$dir/data"

  # Empty .env, created once, readable only by the service user. Fill it in by hand.
  if [ ! -f "$dir/.env" ]; then
    sudo -u "$BOTS_USER" cp "$HERE/env.example" "$dir/.env"
    chmod 600 "$dir/.env"
    echo "Created $dir/.env (edit it: keep only the variables for $repo)"
  fi

  sed -e "s#@BOTS_USER@#$BOTS_USER#g" -e "s#@BOTS_DIR@#$BOTS_DIR#g" "$HERE/systemd/$unit.service" > "/etc/systemd/system/$unit.service"
  systemctl daemon-reload
  systemctl enable "$unit" >/dev/null
  echo "Installed and enabled $unit (not started yet)"
}

deploy Discord-Legacy-Bot legacy-bot
deploy War-Oracle-Bot war-oracle

cat <<EOF

Next:
  1. Fill in the tokens:   sudo -u $BOTS_USER nano $BOTS_DIR/Discord-Legacy-Bot/.env
                           sudo -u $BOTS_USER nano $BOTS_DIR/War-Oracle-Bot/.env
  2. Register the Pi's public IP on your Clash of Clans API key (keys are IP-locked).
  3. Start:                sudo systemctl start legacy-bot war-oracle
  4. Watch:                journalctl -u legacy-bot -u war-oracle -f
Update later:              sudo ./install.sh   (pulls the branch, reinstalls deps), then: sudo systemctl restart legacy-bot war-oracle
EOF
