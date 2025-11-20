# Techridge Affordability Tool – UI & Integration Design

This document tracks the **design** and **implementation steps** for the Techridge Affordability Tool UI, and how it connects to the existing affordability model in this repo.

The goal is to build a **minimal, high‑clarity internal tool** that:

- Surfaces **who can afford what**, by **company**, **income band**, **household type**, **year**, and **rate scenario**.
- Puts **interest rate and assumption controls** front and center.
- Uses a modern dark UI that feels premium but is **not over‑designed** – interaction and data first.

---

## 1. Tech Stack & High-Level Architecture

### 1.1 Frontend

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS (with a “dark glass” theme)
- **Animation**: Framer Motion (only for subtle transitions & layout)
- **Charts**: Recharts

### 1.2 Data & Modeling

- **Source of truth for assumptions & company profiles**: The JSONs and Python model in this repo.
- **Frontend model layer (TS)**:
  - We will **port the Python band-based engine** (`rate_sensitivity.py`) to TypeScript in a new Next.js app.
  - TS module will expose:
    - `buildAffordabilityLookup`
    - `computeHouseholdBandCounts`
    - `summarizeDemandByProduct`
  - These functions will **mirror the Python math exactly** (DTI 0.45, tax/ins/HOA, income bands B1–B7, household types H1–H3).

### 1.3 Rates & External Data

- **Interest rates**:
  - FHA 30‑yr rate sourced from **Mortgage News Daily (MND)** (or existing `useMortgageRates` logic in `Money_heaven`).
  - Stored as a daily snapshot in:
    - Phase 1: in‑memory / static config.
    - Phase 2: Neon Postgres table `rates(date, fha_30y, conv_30y, source)`.
  - Next.js API route `/api/fha-rate` returns the latest snapshot.
- **Property tax & HOA / insurance**:
  - Phase 1: continue to model as a **single combined % of property value per year** (currently 1.2%).
  - Phase 2: split into `propertyTaxRate`, `insuranceRate`, and `hoaPerMonth` once we lock a Washington County effective tax rate from official sources.

---

## 2. App Structure (Next.js)

Planned file structure in the **Next.js UI repo** (not this Python repo, but referenced for clarity):

```text
/src
 ├── /app
 │    ├── layout.tsx          # Wraps app in AffordabilityProvider & base layout
 │    ├── page.tsx            # Ecosystem Overview (all companies)
 │    ├── /companies
 │    │     └── [slug]
 │    │          └── page.tsx # Company Deep Dive
 │    ├── /bands
 │    │     └── page.tsx      # Income Band Explorer
 │    └── /assumptions
 │          └── page.tsx      # Rates & Assumptions Admin
 ├── /components
 │    ├── /ui                 # GlassCard, Badge, Button, etc.
 │    ├── /visuals            # Charts, RoleStrip, Heatmaps
 │    └── /controllers        # GlobalDock (rate/year/scenario)
 ├── /context
 │    └── AffordabilityContext.tsx
 ├── /lib
 │    ├── model.ts            # TS port of Python affordability engine
 │    └── companies.ts        # Loads company JSON configs
 └── /data
      ├── busybusy.json
      ├── vasion.json
      ├── zonos.json
      └── ...
```

---

## 3. Visual & Interaction Design

### 3.1 Theme (Tailwind)

- Backgrounds: `space.950` main, `space.900` cards, `space.800` hover.
- Product colors:
  - `product.apt` – cyan (Apartments)
  - `product.condo` – violet (Condos)
  - `product.blackridge` – amber (Blackridge)
  - `product.townhouse` – emerald (Townhouses)
- Typography:
  - `font-sans`: Inter
  - `font-mono`: JetBrains or similar; used **only** for numeric values (rates, incomes, counts).

Design principles:

- **Data over decoration**: avoid noisy gradients or animations that obscure values.
- **Stable layouts**: charts and cards don’t jump around as controls change; only values and bars change.
- **Readable at a distance**: assume this will be projected in meetings; text and contrasts must stay clear.

### 3.2 GlobalDock (controller)

- Fixed at bottom center across all pages.
- Controls:
  - **Rate slider**:
    - Range: 4%–8%  
    - Displays `(rate * 100).toFixed(2)%` in mono.
    - Next to it: “Use live FHA” chip (click sets rate from `/api/fha-rate`).
  - **Scenario toggle**:
    - “Base income only (QI_base)” vs “Base + bonus (QI_full)”.
  - **Year selector**:
    - Derived from the data (projectionYears) not hard-coded; renders chips for available years (e.g. 2025, 2026, 2027).

The Dock updates **AffordabilityContext**, which is consumed by pages and components.

### 3.3 Key pages

#### `/` – Ecosystem Overview

- Top KPI cards:
  - Total high-wage jobs (now, committed, projected).
  - Condo-capable / Blackridge-capable / Townhouse-capable households at current rate & scenario.
- Center visual:
  - **Product vs Supply bar chart** (Recharts):
    - X-axis: Apartments, Condos, Blackridge, Townhouses.
    - Bars:
      - Demand (household counts from model).
      - Planned supply (from a simple config).
- Second visual:
  - **Income band vs product heatmap**:
    - Rows: B1–B7.
    - Columns: product types.
    - Color: % of households in band that can reach each product.
- Simple table listing companies with their key stats.

#### `/companies/[slug]` – Company Deep Dive

- Header:
  - Name, data quality tag (rich/medium/thin), headcount now & projected.
- Section 1:
  - Chart: household income distribution (bands) for the company.
- Section 2:
  - **RoleStrip** list: one strip per role segment, showing:
    - Count, income (base or full based on scenario), and locks/unlocks for Condo, Blackridge, Townhouse.
    - Max price computed via shared `model.ts`, not ad-hoc math.
- Section 3:
  - Line chart: demand for each product type over years (for selected rate/scenario).

#### `/bands` – Income Band Explorer

- Controls:
  - Income band selector (B1–B7).
  - Household type selector (H1/H2/H3/All).
  - Year + rate + scenario (from context).
- Visual:
  - Table and/or heatmap: companies vs products for that band, with counts and percentages.

#### `/assumptions` – Rates & Assumptions

- Live FHA rate card (from `/api/fha-rate`):
  - Shows current rate, source (MND), as-of date, and mini sparkline (if Neon history exists).
  - Toggle: “Use live FHA as default”.
- Fields for:
  - `DTI_LIMIT` (default 0.45).
  - Combined `TAX_INS_HOA_RATE` (default 1.2% per year).
  - Income growth (default 4%).
- Later: per-company overrides, editing roles, etc. (once backed by Neon).

---

## 4. Rate Implementation Plan (Frontend & Backend)

This complements the extended rate plan we will add to `README.md`.

### 4.1 Backend (Next.js / Neon)

Phases:

1. **Phase 1 – Static + Live Fetch (no DB)**  
   - Create `GET /api/fha-rate` in Next.js:
     - Tries to fetch the latest FHA 30‑yr rate from an internal or external source (e.g. a simple MND scraper, or reuse logic from `Money_heaven` adapted to Node/TS).  
     - Falls back to a static default (e.g. 6.15%) if fetch fails.  
   - No persistence; “live” means “latest fetch this session”.

2. **Phase 2 – Neon-backed history**  
   - Create `rates` table in Neon:
     - `date DATE PRIMARY KEY`
     - `fha_30y NUMERIC`
     - `conv_30y NUMERIC`
     - `source TEXT`
     - `created_at TIMESTAMP`
   - `/api/fha-rate`:
     - On request:
       - If there’s a record for today, return it.
       - Otherwise, fetch from MND, insert, and return.
   - Optionally, add a Vercel Cron to hit `/api/fha-rate` once per day so data is pre-populated.

3. **Phase 3 – UI integration**  
   - GlobalDock:
     - Fetches `/api/fha-rate` on mount.  
     - Sets initial `rate` in context if “Use live FHA as default” is on (stored in localStorage or user profile).
   - `/assumptions`:
     - Displays the latest FHA rate and a 30/90‑day sparkline from `rates` table.
     - Allows manual override for modeling scenarios without changing the stored base rate.

### 4.2 Backend (Python model in this repo)

For this Python repo, the rate implementation is simpler:

- `rate_sensitivity.py` uses static `RATE_SCENARIOS`.  
- Future enhancement (optional):
  - Add a small loader that reads the current FHA rate from:
    - A local JSON file exported from the Next.js app, or  
    - A simple HTTP call to `/api/fha-rate` (if we want tight coupling).
  - Regenerate band-based tables periodically with the latest rate to compare against the Next.js results.

---

## 5. Task Checklist (Updated as We Go)

### Phase 0 – Documentation & Alignment (this repo)

- [x] Document conceptual model and company data (README).  
- [x] Add implementation section for Python engine (README §9).  
- [x] Create `design.md` to track UI & integration work.  
- [x] Document rate implementation plan (this file + README update).

### Phase 1 – Frontend Model & Basic UI (Next.js repo)

- [ ] Set up Next.js 14 + Tailwind + Framer Motion + Recharts.  
- [ ] Port Python model to `lib/model.ts` (with small tests).  
- [ ] Implement `AffordabilityContext` & `GlobalDock`.  
- [ ] Implement `/` Overview page with aggregated demand chart and heatmap.  
- [ ] Implement `/companies/[slug]` with RoleStrip and per-company charts.

### Phase 2 – Band Explorer & Assumptions Page

- [ ] Implement `/bands` with band/company/product view.  
- [ ] Implement `/assumptions` with static controls (DTI, tax rate, income growth).  
- [ ] Add `/api/fha-rate` (Phase 1 mode: transient fetch + fallback).  
- [ ] Wire GlobalDock and Assumptions to live FHA rate.

### Phase 3 – Persistence & Refinements

- [ ] Set up Neon `rates` table and persistence.  
- [ ] Add Vercel Cron for daily rate ingestion.  
- [ ] Add simple admin editing for company configs (if/when moved into Neon).  
- [ ] Tighten visuals & performance based on real usage.

We will update this checklist and flesh out later phases as we progress.


