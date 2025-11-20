# Techridge Affordability Tool – Frontend Design & Implementation

This document contains **complete frontend design and implementation specifications** for the Techridge Affordability Tool Next.js UI.

**Goal:** Build a **minimal, high-clarity internal tool** that:
- Surfaces **who can afford what** by company, income band, household type, year, and rate scenario
- Puts **interest rate and assumption controls** front and center
- Uses a modern dark UI that feels premium but is **not over-designed** – interaction and data first
- Avoids bloat – every page and component must answer a concrete question

> **Design Philosophy:** This spec is intentionally narrow to prevent feature creep. If a new question can't be answered with the existing data shape, we either extend the Python model or add a new focused page instead of overloading existing views.

---

## 1. Tech Stack & Architecture

### 1.1 Frontend Framework

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.0 (with "dark glass" theme)
- **Animation**: Framer Motion (only for subtle transitions & layout)
- **Charts**: Recharts
- **Auth**: Stack Auth
- **Database**: Neon Postgres

### 1.2 Data & Modeling

- **Source of truth**: Company JSON files and Python model (`rate_sensitivity.py`) in this repo
- **Frontend model layer (TypeScript)**:
  - Port of Python band-based engine in `lib/model.ts`
  - Exposes:
    - `buildAffordabilityLookup`
    - `computeHouseholdBandCounts`
    - `summarizeDemandByProduct`
  - Functions **mirror Python math exactly**: DTI 0.45, tax/ins/HOA, income bands B1–B7, household types H1–H3

### 1.3 Rates & External Data

**Interest Rates:**
- FHA 30-yr rate sourced from **Mortgage News Daily (MND)**
- Storage:
  - **Phase 1**: In-memory / static config
  - **Phase 2**: Neon Postgres `rates` table
- Next.js API route `/api/fha-rate` returns latest snapshot

**Property Tax & HOA/Insurance:**
- **Phase 1**: Single combined % of property value per year (currently 1.2%)
- **Phase 2**: Split into `propertyTaxRate`, `insuranceRate`, and `hoaPerMonth` using Washington County official rates

---

## 2. Data Contracts

### 2.1 Overview JSON (Primary Contract)

Source: `build_techridge_overview_json` in Python `rate_sensitivity.py`

```typescript
type RateLabel = "FHA_6.15" | "Conv_6.45" | "Alt_5.50" | "Alt_4.50";
type Scenario = "QI_base" | "QI_full";

type DemandRecord = {
  year: number;
  scenario: Scenario;
  rate_label: RateLabel;
  rate: number;
  total_households: number;
  Apartments: number;
  Apartments_pct: number;
  Condos: number;
  Condos_pct: number;
  Blackridge: number;
  Blackridge_pct: number;
  Townhouse: number;
  Townhouse_pct: number;
};

type SupplyRecord = {
  year: number;
  Apartments?: number;
  Condos?: number;
  Blackridge?: number;
  Townhouse?: number;
};

type TechridgeOverview = {
  years: number[];
  scenarios: Scenario[];
  demand_by_product: DemandRecord[];
  supply_by_product: SupplyRecord[];
};
```

**The frontend should treat this as the single source of truth** for top-level demand + supply. No band-level or role-level details needed for Overview and Graphs pages.

---

## 3. Application Structure

### 3.1 Directory Structure

```
affordability_calculator/
├── app/
│   ├── layout.tsx              # Root layout with AffordabilityProvider
│   ├── page.tsx                # Ecosystem Overview (main page)
│   ├── companies/
│   │   └── [slug]/
│   │       └── page.tsx        # Company Deep Dive
│   ├── bands/
│   │   └── page.tsx            # Income Band Explorer
│   ├── assumptions/
│   │   └── page.tsx            # Rates & Assumptions Admin
│   ├── graphs/
│   │   └── page.tsx            # Demand vs Supply Charts
│   └── api/
│       ├── overview/
│       │   └── route.ts        # Returns TechridgeOverview JSON
│       └── fha-rate/
│           └── route.ts        # Returns latest FHA rate
├── components/
│   ├── ui/                     # Base components (GlassCard, Badge, Button)
│   ├── visuals/                # Charts, RoleStrip, Heatmaps
│   └── controllers/            # GlobalDock (rate/year/scenario controls)
├── context/
│   └── AffordabilityContext.tsx # Global state for rate, year, scenario
├── lib/
│   ├── model.ts                # TypeScript port of Python engine
│   ├── companies.ts            # Company JSON loader
│   └── db.ts                   # Neon database client
├── data/                       # Company JSON files + supply
└── stack/                      # Stack Auth configuration
```

### 3.2 Routing Strategy

Minimal routes to avoid clutter:

- `app/layout.tsx` – Shared shell (header, dark theme, global controls)
- `app/page.tsx` – **Overview** (ecosystem-wide demand/supply)
- `app/companies/[slug]/page.tsx` – Per-company analysis
- `app/graphs/page.tsx` – Dedicated visualization page
- `app/assumptions/page.tsx` – Lightweight assumptions editor
- `app/api/overview/route.ts` – Overview data endpoint

> Avoid adding more pages unless they answer a concrete new question.

---

## 4. Visual & Interaction Design

### 4.1 Theme (Tailwind Configuration)

**Color Palette:**
- **Backgrounds**:
  - `space.950` – Main background
  - `space.900` – Card backgrounds
  - `space.800` – Hover states
- **Product Colors**:
  - `product.apt` – Cyan (Apartments)
  - `product.condo` – Violet (Condos)
  - `product.blackridge` – Amber (Blackridge SFH)
  - `product.townhouse` – Emerald (Townhouses)

**Typography:**
- `font-sans`: Inter (body text)
- `font-mono`: JetBrains Mono (numeric values only – rates, incomes, counts)

### 4.2 Design Principles

1. **Data over decoration**: Avoid noisy gradients or animations that obscure values
2. **Stable layouts**: Charts and cards don't jump around when controls change; only values and bars update
3. **Readable at a distance**: Assume projection in meetings; maintain clear text and contrasts
4. **Minimal animation**: Only use Framer Motion for subtle transitions, never decorative effects

### 4.3 GlobalDock (Global Controls)

**Location:** Fixed at bottom center, visible across all pages

**Controls:**
- **Rate Slider**:
  - Range: 4%–8%
  - Display format: `(rate * 100).toFixed(2)%` in monospace
  - "Use live FHA" chip next to slider (click sets rate from `/api/fha-rate`)
- **Scenario Toggle**:
  - "Base income only (QI_base)" vs "Base + bonus (QI_full)"
- **Year Selector**:
  - Derived from data (not hard-coded)
  - Renders chips for available years (2025, 2026, 2027, etc.)

**Implementation:** Updates `AffordabilityContext`, consumed by all pages and components.

---

## 5. API Routes

### 5.1 Overview Endpoint

**Purpose:** Expose overview JSON to all pages without duplicating logic

```typescript
// app/api/overview/route.ts
import { NextResponse } from "next/server";
import overview from "../../../data/overview.json";

export async function GET() {
  // In production might fetch from Python service or Neon
  // For now, static JSON snapshot keeps it simple and fast
  return NextResponse.json(overview);
}
```

**Data Generation:**
```bash
python rate_sensitivity.py overview > data/overview.json
```

This keeps **Next.js code thin** and avoids re-implementing the model until necessary.

### 5.2 FHA Rate Endpoint

**Purpose:** Provide latest FHA 30-yr rate for live rate feature

```typescript
// app/api/fha-rate/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch from MND or fallback to static default
    const rate = await fetchLatestFHARate(); // Implementation varies
    return NextResponse.json({ rate, source: "MND", date: new Date() });
  } catch (error) {
    // Fallback to static default
    return NextResponse.json({ rate: 6.15, source: "static", date: new Date() });
  }
}
```

---

## 6. Page Implementations

### 6.1 Overview Page (`app/page.tsx`)

**Responsibilities:**
- Fetch `TechridgeOverview` once (server component, cached)
- Let user choose: Year, Scenario, Rate
- Show four simple cards for chosen combination:
  - Demand households
  - Supply units
  - Gap (demand - supply) with color-coded badge

**Implementation:**

```typescript
// app/page.tsx
import { OverviewCards } from "../components/OverviewCards";

async function fetchOverview(): Promise<TechridgeOverview> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/overview`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to load overview");
  return res.json();
}

export default async function OverviewPage() {
  const overview = await fetchOverview();

  // Defaults
  const defaultYear = 2025;
  const defaultScenario: Scenario = "QI_full";
  const defaultRate: RateLabel = "FHA_6.15";

  return (
    <main className="px-6 py-8 space-y-8">
      <OverviewCards
        overview={overview}
        year={defaultYear}
        scenario={defaultScenario}
        rateLabel={defaultRate}
      />
    </main>
  );
}
```

### 6.2 Overview Cards Component

**Purpose:** Map one `DemandRecord` and `SupplyRecord` to four product cards

```typescript
// components/OverviewCards.tsx
type ProductKey = "Apartments" | "Condos" | "Blackridge" | "Townhouse";

const PRODUCTS: ProductKey[] = ["Apartments", "Condos", "Blackridge", "Townhouse"];

export function OverviewCards(props: {
  overview: TechridgeOverview;
  year: number;
  scenario: Scenario;
  rateLabel: RateLabel;
}) {
  const { overview, year, scenario, rateLabel } = props;

  const demand = overview.demand_by_product.find(
    (d) =>
      d.year === year && d.scenario === scenario && d.rate_label === rateLabel
  );

  const supply = overview.supply_by_product.find((s) => s.year === year);

  if (!demand || !supply) {
    return <div className="text-sm text-muted-foreground">No data for selection.</div>;
  }

  return (
    <section className="grid gap-4 md:grid-cols-4">
      {PRODUCTS.map((product) => {
        const demandCount = (demand as any)[product] ?? 0;
        const supplyUnits = (supply as any)[product] ?? 0;
        const gap = demandCount - supplyUnits;

        return (
          <article
            key={product}
            className="rounded-xl border border-white/5 bg-zinc-900/60 p-4 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-400">
              {product}
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {Math.round(demandCount).toLocaleString()}
              <span className="ml-2 text-xs text-zinc-400">households</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span>Supply: {supplyUnits}</span>
              <span
                className={
                  gap >= 0 ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"
                }
              >
                Gap: {gap >= 0 ? "+" : ""}
                {Math.round(gap)}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
```

**This keeps the Overview visually light and focused on four key numbers, not charts.**

### 6.3 Graphs Page (`app/graphs/page.tsx`)

**Purpose:** Show time-series demand vs supply (does NOT duplicate Overview cards)

**Charts:**
1. **Demand vs Supply by Product over Years**
   - X-axis: Years
   - Y-axis: Households/Units
   - For each product: demand line + supply line

```typescript
// components/DemandSupplyLineChart.tsx
import { Line } from "react-chartjs-2";

type ProductKey = "Apartments" | "Condos" | "Blackridge" | "Townhouse";

export function DemandSupplyLineChart(props: {
  overview: TechridgeOverview;
  scenario: Scenario;
  rateLabel: RateLabel;
  product: ProductKey;
}) {
  const { overview, scenario, rateLabel, product } = props;

  const demandSeries = overview.demand_by_product
    .filter((d) => d.scenario === scenario && d.rate_label === rateLabel)
    .sort((a, b) => a.year - b.year);

  const supplySeries = overview.supply_by_product
    .slice()
    .sort((a, b) => a.year - b.year);

  const labels = demandSeries.map((d) => d.year.toString());
  const demandData = demandSeries.map((d) => (d as any)[product] ?? 0);

  const supplyByYear = new Map<number, number>();
  for (const s of supplySeries) {
    supplyByYear.set(s.year, (s as any)[product] ?? 0);
  }
  const supplyData = demandSeries.map((d) => supplyByYear.get(d.year) ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: `${product} demand (households)`,
        data: demandData,
        borderColor: "rgb(56, 189, 248)", // sky-400
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        tension: 0.25,
      },
      {
        label: `${product} supply (units)`,
        data: supplyData,
        borderColor: "rgb(251, 191, 36)", // amber-400
        backgroundColor: "rgba(251, 191, 36, 0.2)",
        borderDash: [6, 4],
        tension: 0.0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: `${product}: Demand vs Supply` },
    },
    scales: { y: { beginAtZero: true } },
  };

  return <Line data={data} options={options} />;
}
```

**Graphs Page Implementation:**

```typescript
// app/graphs/page.tsx
import { DemandSupplyLineChart } from "../components/DemandSupplyLineChart";

async function fetchOverview(): Promise<TechridgeOverview> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/overview`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to load overview");
  return res.json();
}

export default async function GraphsPage() {
  const overview = await fetchOverview();
  const scenario: Scenario = "QI_full";
  const rateLabel: RateLabel = "FHA_6.15";

  return (
    <main className="px-6 py-8 space-y-8">
      <h1 className="text-2xl font-semibold text-white">
        Demand vs Supply – Techridge
      </h1>
      <section className="grid gap-8 md:grid-cols-2">
        <DemandSupplyLineChart
          overview={overview}
          scenario={scenario}
          rateLabel={rateLabel}
          product="Apartments"
        />
        <DemandSupplyLineChart
          overview={overview}
          scenario={scenario}
          rateLabel={rateLabel}
          product="Condos"
        />
        <DemandSupplyLineChart
          overview={overview}
          scenario={scenario}
          rateLabel={rateLabel}
          product="Blackridge"
        />
        <DemandSupplyLineChart
          overview={overview}
          scenario={scenario}
          rateLabel={rateLabel}
          product="Townhouse"
        />
      </section>
    </main>
  );
}
```

### 6.4 Company Deep Dive (`app/companies/[slug]/page.tsx`)

**Sections:**

**Header:**
- Company name
- Data quality tag (rich/medium/thin)
- Headcount (current & projected)

**Section 1: Household Income Distribution**
- Chart showing B1–B7 distribution for the company

**Section 2: Role Segments**
- **RoleStrip** component for each role:
  - Employee count
  - Income (base or full based on scenario)
  - Affordability locks/unlocks (Condo/Blackridge/Townhouse icons)
  - Max purchase price from `lib/model.ts`

**Section 3: Product Demand Over Time**
- Line chart: demand for each product type across years

### 6.5 Income Band Explorer (`app/bands/page.tsx`)

**Controls:**
- Income band selector (B1–B7)
- Household type selector (H1/H2/H3/All)
- Year, rate, scenario (from context)

**Visual:**
- Table/heatmap: companies vs products for selected band
- Shows counts and percentages

### 6.6 Assumptions Admin (`app/assumptions/page.tsx`)

**Features:**

**Live FHA Rate Card:**
- Shows current rate, source (MND), as-of date
- Mini sparkline if Neon history exists
- Toggle: "Use live FHA as default"

**Editable Assumptions:**
- `DTI_LIMIT` (default 0.45)
- Combined `TAX_INS_HOA_RATE` (default 1.2% per year)
- Income growth (default 4%)

**Future:** Per-company overrides, role editing (once backed by Neon)

---

## 7. Rate Data Implementation Plan

### 7.1 Backend (Next.js / Neon)

**Phase 1 – Static + Live Fetch (No DB)**
- Create `GET /api/fha-rate` in Next.js
- Attempts to fetch latest FHA 30-yr rate from MND
- Falls back to static default (6.15%) if fetch fails
- No persistence; "live" means "latest fetch this session"

**Phase 2 – Neon-Backed History**
- Create `rates` table in Neon:
  ```sql
  CREATE TABLE rates (
    date DATE PRIMARY KEY,
    fha_30y NUMERIC,
    conv_30y NUMERIC,
    source TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- `/api/fha-rate` logic:
  - Check for today's record
  - If not found, fetch from MND, insert, and return
- Optional: Add Vercel Cron to hit endpoint daily for pre-population

**Phase 3 – UI Integration**
- **GlobalDock:**
  - Fetches `/api/fha-rate` on mount
  - Sets initial rate in context if "Use live FHA" is enabled
- **/assumptions:**
  - Displays latest FHA rate
  - Shows 30/90-day sparkline from `rates` table
  - Allows manual override for scenarios

### 7.2 Backend (Python Model)

For the Python repo:
- `rate_sensitivity.py` uses static `RATE_SCENARIOS`
- **Future enhancement (optional):**
  - Add loader to read current FHA rate from:
    - Local JSON file exported from Next.js, or
    - HTTP call to `/api/fha-rate`
  - Regenerate band tables periodically with latest rate
  - Compare against Next.js results for validation

---

## 8. Component Patterns

### 8.1 RoleStrip Component

**Purpose:** Show a single role segment with affordability indicators

```typescript
// components/visuals/RoleStrip.tsx
export function RoleStrip(props: {
  role: Role;
  scenario: Scenario;
  rate: number;
}) {
  const { role, scenario, rate } = props;
  const income = scenario === "QI_base" ? role.base_salary : role.ote;
  const maxPrice = calculateMaxPurchasePrice(income, rate, 0.035);

  const canAffordCondo = maxPrice >= 450000;
  const canAffordBlackridge = maxPrice >= 620000;
  const canAffordTownhouse = maxPrice >= 1100000;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/40">
      <div>
        <div className="font-medium">{role.title}</div>
        <div className="text-sm text-zinc-400">
          {role.count} employees • ${income.toLocaleString()}
        </div>
      </div>
      <div className="flex gap-2">
        {canAffordCondo && <Badge variant="violet">Condo</Badge>}
        {canAffordBlackridge && <Badge variant="amber">Blackridge</Badge>}
        {canAffordTownhouse && <Badge variant="emerald">Townhouse</Badge>}
      </div>
    </div>
  );
}
```

### 8.2 AffordabilityLock Component

**Purpose:** Visual indicator of product affordability thresholds

```typescript
// components/visuals/AffordabilityLock.tsx
export function AffordabilityLock(props: {
  product: "Condo" | "Blackridge" | "Townhouse";
  unlocked: boolean;
}) {
  return (
    <div className={`flex items-center gap-1 ${props.unlocked ? "text-emerald-400" : "text-zinc-600"}`}>
      <LockIcon locked={!props.unlocked} />
      <span className="text-xs">{props.product}</span>
    </div>
  );
}
```

---

## 9. Non-Goals (Preventing Bloat)

**What we explicitly DON'T do:**

1. **No band-level or role-level details on Overview/Graphs pages**
   - Those belong in per-company detail views or analysis notebooks

2. **No in-browser recreation of full Python model yet**
   - Rely on offline JSON snapshots or thin API calling Python side

3. **No extra dashboards** (map view, ten extra charts)
   - Wait until core Overview + Graphs views are truly used and stable

4. **No premature optimization**
   - Keep it simple, add features only when needed

---

## 10. Development Checklist

### Phase 1 – Frontend Model & Basic UI ✅
- [x] Set up Next.js 16 + Tailwind + Framer Motion + Recharts
- [x] Port Python model to `lib/model.ts`
- [x] Implement `AffordabilityContext` & `GlobalDock`
- [x] Implement `/` Overview page with aggregated demand
- [x] Implement `/companies/[slug]` with RoleStrip

### Phase 2 – Band Explorer & Assumptions
- [ ] Implement `/bands` with band/company/product view
- [ ] Implement `/assumptions` with static controls
- [ ] Add `/api/fha-rate` (Phase 1 mode: transient fetch + fallback)
- [ ] Wire GlobalDock and Assumptions to live FHA rate

### Phase 3 – Persistence & Refinements
- [ ] Set up Neon `rates` table and persistence
- [ ] Add Vercel Cron for daily rate ingestion
- [ ] Add admin editing for company configs (when moved to Neon)
- [ ] Tighten visuals & performance based on real usage

---

## 11. Documentation Index

For complete project documentation:

- **README.md** – Main project overview, Python engine, methodology, installation
- **CLAUDE.md** – Development workflow and guidelines
- **FRONTEND.md** – This file (complete frontend design & implementation)

---

**This document contains everything needed to implement the Next.js UI without over-designing the interface or duplicating backend logic.**
