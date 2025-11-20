## Techridge Affordability – Frontend & Graphs Spec

This file defines a **lean, non-cluttered** Next.js UI that consumes the Python model outputs.  
It focuses on:

- A simple **Overview** page (no heavy charts).
- A dedicated **Graphs** page for demand vs supply.
- Clean routing so company and assumptions pages don’t 404.
- A single **overview data contract** to keep backend & frontend in sync.

> This spec is intentionally narrow to avoid bloat. If a new question can’t be answered with this data shape, we either extend the Python model or add a new, focused page instead of overloading the Overview.

---

## 1. Data Contract – Overview JSON

Source in Python: `build_techridge_overview_json` in `rate_sensitivity.py`.

Shape (simplified):

```ts
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

The **frontend should treat this as the single source of truth** for top-level demand + supply.  
No band-level or role-level details are needed on the UI side to render Overview and Graphs.

---

## 2. Next.js Routing Structure (App Router)

Minimal routes to avoid clutter:

- `app/layout.tsx` – shared shell (header, dark theme, global controls).
- `app/page.tsx` – **Overview**.
- `app/companies/[slug]/page.tsx` – per-company pages (busybusy, Vasion, etc.).
- `app/graphs/page.tsx` – dedicated graphs / analysis.
- `app/assumptions/page.tsx` – light assumptions + supply editor.
- `app/api/overview/route.ts` – returns `TechridgeOverview` JSON (or imports a precomputed JSON file).

> If you already have some of these routes, align them with this structure to eliminate 404s.  
> Avoid adding more pages unless they answer a concrete new question.

---

## 3. API Route – `/api/overview`

Goal: expose the **overview JSON** to all pages without duplicating logic.

Example (Next.js App Router, TypeScript):

```ts
// app/api/overview/route.ts
import { NextResponse } from "next/server";
import overview from "../../../data/overview.json"; // or fetch from Python backend

export async function GET() {
  // In production you might fetch from a Python service or Neon;
  // for now, importing a static JSON snapshot keeps it simple and fast.
  return NextResponse.json(overview);
}
```

The `overview.json` file would be generated offline by:

```bash
python rate_sensitivity.py overview > data/overview.json
```

This keeps **Next.js code thin** and avoids re-implementing the model in JavaScript until you really need to.

---

## 4. Overview Page (`app/page.tsx`)

Responsibilities:

- Fetch `TechridgeOverview` once (server component, cached).
- Let the user choose:
  - Year (2025/26/27/28/29),
  - Scenario (Base vs Base+Bonus),
  - Rate option (e.g. FHA 6.15 vs Conv 6.45).
- For the **chosen combination**, show four simple cards:
  - **Demand households**,
  - **Supply units**,
  - **Gap** (`demand - supply`, with a small badge).

Pseudo-implementation (simplified, server component):

```tsx
// app/page.tsx
import { Suspense } from "react";
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

  // Defaults: 2025, QI_full, FHA_6.15
  const defaultYear = 2025;
  const defaultScenario: Scenario = "QI_full";
  const defaultRate: RateLabel = "FHA_6.15";

  return (
    <main className="px-6 py-8 space-y-8">
      {/* Global controls could eventually be lifted into a context provider; 
         keep them minimal here to avoid clutter. */}
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

`OverviewCards` should contain only **layout and mapping** from the data contract to UI, nothing else.

---

## 5. Overview Cards Component

Goal: map one `DemandRecord` and one `SupplyRecord` to four cards.

Key steps:

1. Filter `overview.demand_by_product` by `year`, `scenario`, `rate_label`.
2. Find the matching `SupplyRecord` for `year`.
3. For each product (Apts, Condos, Blackridge, Townhouse):
   - `demand = record[product]`
   - `supply = supplyRecord[product] ?? 0`
   - `gap = demand - supply`

Skeleton:

```tsx
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

This keeps the Overview visually light and focused on **four numbers**, not charts.

---

## 6. Graphs Page (`app/graphs/page.tsx`)

The Graphs page should **not** duplicate Overview cards.  
Its sole job: show time-series relationships (demand vs supply) for a selected scenario + rate.

Recommended charts:

1. **Demand vs Supply by Product over Years**  
   - X-axis: years.  
   - Y-axis: households/units.  
   - For each product:
     - One line for demand (Techridge-wide).  
     - One line (or stepped area) for supply.

Implementation approach using `react-chartjs-2` (Line chart):

```tsx
// components/DemandSupplyLineChart.tsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `${product}: Demand vs Supply`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
}
```

Graphs page (server component):

```tsx
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

> Note: This page uses **four focused charts**, each in its own panel, similar to the reference dashboards.  
> If this ever feels busy, you can switch to a product selector instead of showing all four at once.

---

## 7. Company Pages and Assumptions (Lightweight)

To avoid duplication:

- Company pages (`/companies/[slug]`) should fetch a **company-specific JSON** (separate contract, e.g. `GET /api/company/[slug]`) that reuses the same model but focuses on that company only.
- Assumptions (`/assumptions`) should:
  - Read `overview` plus a small `rates.json` or live FHA endpoint.
  - Expose just a few editable fields:
    - Rate, DTI, tax/HOA %, and supply counts / years (backed by a simple admin-only API).

Both of these can be designed later; the key is they **do not re-implement demand vs supply logic**—they just adjust inputs and regenerate overview / company results via the same backend model.

---

## 8. Non-goals (to prevent bloat)

- No attempt to show **band-level** or **role-level** details on the Overview or Graphs pages. Those belong in:
  - per-company detail views, or  
  - internal analysis notebooks.
- No in-browser recreation of the full Python model yet. We rely on:
  - offline JSON snapshots, or  
  - a thin API that calls the Python side.
- No extra dashboards (e.g. “map view”, “ten extra charts”) until the core Overview + Graphs views are truly used and stable.

This spec should be enough for a single engineer to implement the Next.js UI and charts **without over-designing** the interface or duplicating backend logic.


