<div align="center">
  <h1>Packerswise</h1>
  <p><strong>A calmer way to move home.</strong></p>
  <p>One clear moving estimate for household moves across India — without the phone-call runaround.</p>
  <p>
    <img src="https://img.shields.io/badge/React-19-123F3B?style=for-the-badge&logo=react&logoColor=F6F0E5" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-Fast-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Frontend--first-ED7655?style=for-the-badge" alt="Frontend first" />
  </p>
</div>

Packerswise turns a stressful first quote into one clear number: choose a home size, add the distance, share your details, and get a transparent starting fare in under a minute.

<p align="center">
  <img src="docs/tech-stack-loop.svg" alt="Infinity loop connecting the Packerswise technology stack" width="100%" />
</p>

<p align="center">
  <a href="#features">Features</a>
  ·
  <a href="#getting-started">Getting started</a>
  ·
  <a href="#how-the-fare-is-calculated">Fare calculation</a>
  ·
  <a href="#project-structure">Project structure</a>
</p>

---

## Built around clarity

The experience follows the emotional rhythm of moving day: reduce the unknowns, show the math, then make the next step feel easy. The animated stack loop above mirrors that idea — the product and its tools keep moving forward together.

## Features

- **Simple three-step flow** — choose a home size, add customer details, then review the estimate.
- **Transparent pricing** — base fare plus a fixed ₹30 per kilometre.
- **Indian mobile validation** — accepts valid 10-digit numbers beginning with 6–9.
- **Clear estimate breakdown** — home-size fare and travel fare are shown separately.
- **Payment preference UI** — customers can select Debit Card, Credit Card, or UPI.
- **Confirmation state** — generates a local booking reference and lets users copy it.
- **Responsive experience** — designed for mobile screens, tablets, and desktop.
- **Accessible interactions** — semantic labels, keyboard-friendly controls, pressed states, and live status messaging.

> **Payment note:** Payment methods are currently preferences captured in the front end only. No payment is processed and no payment gateway or backend is connected.

## How the fare is calculated

```text
Estimated fare = Home-size base fare + (Distance in km × ₹30)
```

| Home size | Base fare |
| --- | ---: |
| 1 BHK | ₹4,500 |
| 2 BHK | ₹6,500 |
| 3 BHK | ₹8,500 |
| 4+ BHK | ₹11,500 |

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS 4 + custom CSS tokens |
| Icons | Lucide React |
| Routing | Wouter |
| Workspace | pnpm monorepo |

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Install

```bash
pnpm install
```

### Start the app

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/packers-movers-estimator run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Validate the app

```bash
pnpm --filter @workspace/packers-movers-estimator run typecheck
pnpm --filter @workspace/packers-movers-estimator run build
```

## Project structure

```text
.
├── artifacts/
│   └── packers-movers-estimator/
│       └── src/
│           ├── App.tsx       # Estimator experience and local state
│           ├── index.css     # Design tokens and responsive styling
│           └── main.tsx      # React entry point
├── docs/
│   └── tech-stack-loop.svg   # GitHub README technology graphic
├── lib/                      # Shared workspace libraries
├── package.json              # Workspace scripts
└── pnpm-workspace.yaml       # pnpm package discovery
```

## Product direction

Packerswise is intentionally front-end first. The current experience demonstrates the customer journey without pretending to process money or save personal data. A future production version can connect the confirmation step to a real booking API and replace the payment preference selector with a trusted payment provider.

## License

This project is available under the MIT License.