# structured-id demo

Interactive demo for [**structured-id**](https://www.npmjs.com/package/structured-id) — a TypeScript library to generate & validate **structured IDs/codes** (numeric or alphanumeric) with optional **checksums** (Luhn / mod36), grouping & formatting, and zero runtime deps.

**Live demo:** https://structured-id-demo.vercel.app/
**Library:** https://www.npmjs.com/package/structured-id • https://github.com/SteveFosterUK/structured-id

---

## ✨ Features

- Generate IDs/codes:
    - **Charsets:** `numeric (0–9)` or `alphanumeric (0–9, A–Z)`
    - **Checksums:** `luhn` (numeric) or `mod36` (alphanumeric) – optional
    - **Structure:** configurable `groups × groupSize` with a separator (e.g. `1234-5678-...`)
    - **RNG:** Web Crypto when available, fallback to `Math.random`
- Validate codes using the **same settings** (charset, groups, checksum).
- Smooth UI:
    - **Slot-machine** animation on generate
    - **Reduced motion** support (respects OS/Browser prefers-reduced-motion)
    - **Copy to clipboard** for generated/structured outputs
- Built with **React + Vite + Tailwind + shadcn/ui + Framer Motion**.
- Deployed on **Vercel**.

---

## 🛠️ Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS (+ shadcn/ui)
- Framer Motion
- Vercel

---

## 🚀 Local Development

```bash
# 1) Clone
git clone https://github.com/SteveFosterUK/structured-id-demo
cd structured-id-demo

# 2) Install
npm i

# 3) Run dev server
npm run dev

# 4) Open
# Vite will print a local URL (usually http://localhost:5173)