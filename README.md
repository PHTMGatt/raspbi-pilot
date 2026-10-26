# raspbi-pilot

<p align="center">
  <img src="https://raw.githubusercontent.com/PHTMGatt/12-React-Portfolio/a2c43d8301679dbda14ad06dc225d61e5515e431/src/assets/project-images/raspbi.png" width="900" alt="raspbi-pilot project artwork">
</p>

**raspbi-pilot** is a lightweight Node.js launcher that runs multiple Discord bots
under **one runtime and one hosting service**.

It is designed to keep bots independent while avoiding duplicated infrastructure
costs.

---

## What It Does

- Starts multiple Discord bots in a single Node process
- Runs under one Render service (or one Raspberry Pi process)
- Acts as a supervisor/launcher, not a merged bot
- Works the same locally, on Render, or on a Pi

---

## Bots Managed

- Clash Commander
- War Oracle

Each bot lives in its own repository and exposes a `start()` function that
raspbi-pilot calls during boot.

---

## Project Structure

```
raspbi-pilot/
│
├── index.js          # Launcher entrypoint
├── package.json
├── bots/
│   ├── clash-commander/
│   └── war-oracle/
│
└── README.md
```

---

## Usage

```bash
npm install
npm start
```

This will boot all configured bots at the same time.

---

## Deployment

- **Render:** Use a single Background Worker
- **Raspberry Pi:** Run directly with Node or under PM2

No code changes are required between environments.

---

## License

Private / internal use.
