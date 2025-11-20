# Techridge Affordability & Demand Model

This project is an **affordability and demand forecasting tool** for residential products on and around **Techridge in St. George, Utah**.  
It is designed to answer:

- **What can Techridge employees afford to buy or rent?**
- **What would they likely choose to buy, given their income, household type, and preferences?**
- **How sensitive is demand to interest rates and loan programs?**

The model focuses on **current and committed Techridge companies**, using **public wage data** and documented headcount projections as inputs, and projects demand for:

- **Techridge Apartments** – \$1,700–4,500 / month  
- **Techridge Condos** – \$450,000–650,000  
- **Blackridge Cove SFH** – \$620,000–680,000  
- **Townhouses (nightly rental capable)** – \$1.1M–2.1M (with separate future phase for rental-income underwriting)

---

## 1. Core Intent & Use Cases

The tool is intended for:

- **Development planning** – sizing and phasing apartments, condos, Blackridge homes, and townhouses.
- **Rate-sensitivity analysis** – understanding how shifts in mortgage rates (e.g. 7.0% → 5.5% → 4.5%) change:
  - the **number of households that can qualify**; and  
  - **which products** they can reach (rent vs buy; condo vs Blackridge vs townhouse).
- **Company-level “campus” conversations** – providing grounded, company-specific views like:
  - “At current rates, what % of Vasion’s staff could realistically buy a Techridge condo?”  
  - “If we add a Kirton McConkie office with 50 people in 5 years, how many of them are true townhouse buyers?”

The emphasis is **practical and strategic**, not academic: the tool exists to **support Techridge product and phasing decisions**, and to help pitch prospects on why a Techridge campus or HQ makes sense for their workforce.

---

## 2. Companies in Scope & Data Quality Flags

All of the following companies are either **on Techridge today**, **committed**, or **actively planning** a presence there.  
Headcounts are taken from the Techridge impact / company PDF you provided; wages come from Indeed, Glassdoor, Levels.fyi, job postings, and industry benchmarks.

Each company is tagged with a **data quality flag** so we remember which inputs are well-grounded vs approximate:

- **Vasion (PrinterLogic)** – *Data: rich*  
  - ~400+ global; large Techridge HQ (~200 used in the model).  
  - Well-documented salaries for product support, AEs, enterprise AEs, sales reps, software engineers, managers (Indeed, Levels.fyi, Glassdoor, Vasion careers).  

- **Zonos** – *Data: rich*  
  - 101 employees now on Techridge, +25 planned (build-out).  
  - Strong salary data for software engineers, senior data architects, product managers, admin assistants, customer success managers, customer specialists, technical support, and tax associates (Indeed salaries).

- **AlignOps (busybusy)** – *Data: medium (sales comp strong, other roles inferred)*  
  - 85 employees now on Techridge, goal 100.  
  - Clear public data for SDR/BDR and AE OTE via RepVue and job postings; CS, ops, and engineering approximated from similar SaaS firms.

- **Planstin Administration / Zion HealthShare / Primestin Care / Greystone** – *Data: rich for Planstin/Zion; thin for Primestin/Greystone*  
  - Planstin: 90 (2025) → 130 (2026) → 150 (2027).  
  - Zion HealthShare: 100 (2025) → 120 (2026) → 130 (2027).  
  - Primestin Care: 15 → 30 → 50.  
  - Greystone: 2 → 10 → 15.  
  - Planstin and Zion have detailed Indeed data for claims, member services, support, sales, benefits, and HR roles. Primestin and Greystone are mapped onto the same bands by function (health/benefits cluster).

- **Mango Voice** – *Data: thin*  
  - 40 employees on Techridge (120 company-wide).  
  - Few public salary datapoints; we approximate pay bands using similar VOIP/SaaS providers and Utah-market norms.

- **DigiVoice** – *Data: very thin*  
  - 5 employees now on Techridge, target ~10.  
  - Modeled as a scaled-down version of Mango Voice.

- **HFB Technologies** – *Data: thin*  
  - 40–50 employees on Techridge.  
  - Modeled as a digital agency: developers, designers, account managers, strategists, and leadership pay derived from St. George / Utah salary norms.

- **Eaglegate Title** – *Data: medium (industry-level, not firm-specific)*  
  - 15 starting employees, goal +5 (≈20).  
  - Salaries inferred from Utah title/escrow market data (escrow assistants, processors, escrow officers, title officers, branch managers).

- **CentraCom** – *Data: thin*  
  - Telecom / connectivity provider; Techridge headcount not fully disclosed (assume ~10–20 on site).  
  - Compensation approximated using Utah telecom CS, field tech, and network engineer wages.

- **Brodie Industries** – *Data: very thin*  
  - 2 specialized/owner-level employees; individual wages less important for aggregate demand, but they matter as potential high-end buyers.

- **Kirton McConkie (Law Firm)** – *Data: medium (Utah large-firm benchmarks)*  
  - Planning 25 employees in ~2 years, 50 in ~5 years on Techridge.  
  - Compensation for associates, partners, paralegals, and staff estimated from Utah large-firm market data.

> **Important**: We explicitly **label segments based on data strength** in the model so that future revisions can focus on improving “thin” areas (e.g. Mango, DigiVoice, HFB, CentraCom) without reworking the entire architecture.

---

## 3. Housing Products & Financial Assumptions

### 3.1 Product Types

The tool is designed around **four primary residential product types**:

- **Apartments (Techridge)**  
  - **Rent**: \$1,700–4,500 / month  
  - Studio, 2-bed, 3-bed, penthouse-style units.  
  - 5–10 minute walk to work for most Techridge locations.

- **Techridge Condos**  
  - **Price**: \$450,000–650,000  
  - **Size**: 1,100–2,200 sqft  
  - Strong appeal to mid/high-income singles & couples wanting ownership and walkability.

- **Blackridge Cove Single-Family Homes**  
  - **Price**: \$620,000–680,000  
  - **Size**: 2,100–2,500 sqft; 3–4 beds; 2–3 car garages; 8' between homes (no lot lines).  
  - Slightly longer walk (10–15 minutes, vs 5–10 for core Techridge), but more space and garages.

- **Townhouses (nightly-rental capable)**  
  - **Price**: \$1.1M–2.1M  
  - 80–110 units; can be rented nightly with projected **\$7,000–12,000/month** gross when operated as STRs.  
  - In the **first modeling phase**, we treat these as **high-end primary/second homes** *without* incorporating rental income. A later phase can explicitly model DSCR/second-home underwriting including rental cashflows.

### 3.2 Mortgage & Qualification Assumptions

These assumptions are **deliberate simplifications** that match your planning notes and provide stable baselines:

- **Loan Terms**
  - All loans modeled as **30-year fixed**.  
  - We distinguish **FHA** vs **Conventional/Jumbo** only by:
    - Max FHA **loan size** (effectively up to \$680,000 purchase price in this context).  
    - **Interest rate** and **down payment** assumptions.

- **Interest Rates (initial settings)**  
  - **FHA**: **6.15%** (including 0.25% MIP), for purchases up to \$680k.  
  - **Conventional/Jumbo**: **6.45%** for larger loans.  
  - We also run **sensitivity scenarios** at e.g. **5.50%** and **4.50%** to see how much demand shifts as rates change.

- **Down Payment & Loan Types**
  - Purchases ≤ \$680,000:
    - Treated as **FHA or high-LTV conventional**.  
    - **3–5% down** (we implement as ~3.5% in calculations).  
  - Purchases > \$680,000 (e.g. top-end Blackridge, Townhouses):
    - Switched to **Conventional/Jumbo**.  
    - Modeled with **10%+ down** (conservative baseline).  
    - Conceptually reserved for households with **\$200k+ income and/or meaningful savings/equity**.

- **Debt-to-Income (DTI)**
  - We use **0.45 front-end DTI** (housing costs / gross income), matching FHA upper limits and your stated assumption.  
  - Back-end DTI is not explicitly modeled; we approximate its impact through the front-end cap and conservative assumptions for non-housing debts.

- **Taxes, Insurance, HOA**
  - Total **non-principal & interest housing costs** (property tax + insurance + HOA + MIP) are modeled as a **fixed % of property value**:
    - Currently assumed at **~1.2% of value per year**, converted to a monthly component.  
  - This is folded into total monthly housing expense when we invert the mortgage formula to get **max affordable purchase price**.

- **Rent Affordability (Apartments)**
  - Rent is considered **“comfortably affordable”** if **≤ 30–35% of gross income**, loosely matching market rules of thumb and aligning with the 0.45 front-end DTI.

---

## 4. Income Modeling & Segmentation

### 4.1 Individual Income – QI_base and QI_full

For each role segment at each company, we define two key income measures:

- **QI_base** – *Base income only*  
  - Annual salary or annualized hourly wage (40 hours/week, 52 weeks).
  - Reflects **worst-case underwriting** where bonus/commission is ignored.

- **QI_full** – *Base + qualifying variable income*  
  - Base + “typical” annual **bonus/commission/OTE** based on public data.  
  - **Model assumption**: **1 year of income history is sufficient** for lenders to treat bonus/commission as **qualifying income** for both FHA and conventional, as long as it is reasonably stable and likely to continue.
  - This is a **simplification** of detailed FHA and Fannie/Freddie rules (which often prefer 2-year histories), chosen intentionally to avoid over-complication and to better match real-world approvals in this income band.

> We explicitly document this as an **implementation choice** so we can tighten it later (e.g. adding a strict “2-year history required for conventional” toggle) if needed.

### 4.2 Global Income Bands

To compare across companies, we bucket individual QI values into shared **income bands**:

- **B1:** \$35k–\$60k  
- **B2:** \$60k–\$80k  
- **B3:** \$80k–\$110k  
- **B4:** \$110k–\$150k  
- **B5:** \$150k–\$200k  
- **B6:** \$200k–\$300k  
- **B7:** \$300k+

Each segment is mapped into **one or two bands** under:

- **QI_base scenario** (conservative).  
- **QI_full scenario** (more realistic/optimistic, assuming bonus counts).

### 4.3 Household Archetypes (1 vs 2 incomes)

Rather than modeling detailed demographics (age, gender, family size) explicitly, we capture the **major affordability differences** through **household structures**:

- **H1 – Single-income household**  
  - Household income ≈ **1.0 × individual QI**.

- **H2 – Dual-income (moderate partner)**  
  - Partner earns ~70% of primary income.  
  - Household income ≈ **1.7 × individual QI**.

- **H3 – Dual-income (peer partner)**  
  - Partner earns ~100% of primary income (similar job market/education).  
  - Household income ≈ **2.0 × individual QI**.

For each segment, we will eventually assign a simple **H1/H2/H3 mix** (e.g. early-career support might be 60/30/10; mid-career engineers 40/30/30). This lets us turn **individual income bands → household income bands**, which matter directly for mortgage qualification and housing preferences.

---

## 5. Company Segments (High-Level Summary)

Each company is broken into **segments** with associated income ranges (QI_base and QI_full). A few illustrative examples:

- **Vasion**
  - Support: QI_base ≈ \$45–60k, QI_full ≈ \$50–65k.  
  - Sales: QI_base ≈ \$55–75k, QI_full ≈ \$100–130k.  
  - Engineering: QI_base ≈ \$95–135k, QI_full ≈ \$105–150k.

- **Zonos**
  - Support/Admin/Tax: QI_base ≈ \$40–50k, QI_full ≈ \$42–52k.  
  - CSMs: QI_base ≈ \$60–70k, QI_full ≈ \$70–80k.  
  - Product/Eng: QI_base ≈ \$85–100k, QI_full ≈ \$95–115k.  
  - Senior Tech/Architect: QI_base ≈ \$160–180k, QI_full ≈ \$180–210k.

- **AlignOps (busybusy)**
  - SDR/BDR: QI_base ≈ \$35–40k, QI_full ≈ \$65–70k (OTE from RepVue).  
  - AEs: QI_base ≈ \$50–60k, QI_full ≈ \$120–135k.  
  - Ops/Eng/Admin: QI_base ≈ \$75–95k, QI_full ≈ \$85–105k.  
  - Directors/Execs: QI_base ≈ \$130–200k+, QI_full ≈ \$170–250k+.

- **Planstin/Zion cluster**
  - Entry CS/Claims/Support: QI_base ≈ \$35–45k, QI_full ≈ \$38–50k.  
  - Mid-level ops/benefits/HR: QI_base ≈ \$55–75k, QI_full ≈ \$65–85k.  
  - Tech/Product: QI_base ≈ \$85–120k, QI_full ≈ \$95–135k.  
  - Sales Leaders: QI_base ≈ \$75–95k, QI_full ≈ \$90–120k.  
  - Exec: QI_base ≈ \$140–200k, QI_full ≈ \$160–240k.

- **Kirton McConkie**
  - Assistants/Admin: QI_base ≈ \$40–55k, QI_full ≈ \$45–60k.  
  - Paralegals: QI_base ≈ \$55–75k, QI_full ≈ \$60–80k.  
  - Associates: QI_base ≈ \$130–160k, QI_full ≈ \$140–175k.  
  - Partners: QI_base ≈ \$230–320k, QI_full ≈ \$260–380k.

Other companies (Mango, Digi, HFB, Eaglegate, CentraCom, Brodie) follow the same pattern, with **clear “thin data” labels** where we are relying on industry benchmarks rather than firm-specific salary datasets.

---

## 6. Modeling Pipeline (Current & Planned)

The end-to-end modeling flow is:

1. **Company → Role Segments**  
   - For each company, define segments (Support, Sales, Eng, etc.) with **counts** that sum to the known/target headcounts (2025/26/27).
   - Assign **QI_base** and **QI_full** to each segment using the online data above.

2. **Segments → Individual Income Bands (B1–B7)**  
   - Map each segment’s QI_base and QI_full into the global income bands.  
   - This gives, per company and scenario (base vs full), a count of employees per income band.

3. **Individual Bands → Household Bands (using H1/H2/H3)**  
   - For each segment, assign a simple split between H1 (single), H2 (dual-moderate), H3 (dual-peer).  
   - Multiply individual income by 1.0 / 1.7 / 2.0, then rebucket into the same B1–B7 bands.  
   - Result: **per-company household income distributions** for both QI_base and QI_full scenarios.

4. **Household Bands → Affordability (by Rate & Product)**  
   - For each household income band:
     - Compute **max monthly housing budget** using 0.45 front-end DTI.  
     - Invert the mortgage formula (with tax/ins/HOA component) to get **max purchase price** at:
       - 6.15% (FHA), 6.45% (Conventional), and alternative rates (5.5%, 4.5%).  
   - Determine which products (apartments, condos, Blackridge, townhouses) are affordable at each rate.

5. **Per-Company Demand Grids**  
   - Combine: household band counts × product affordability flags.  
   - Output (for each company, rate scenario, and year):
     - % and count of employees who can **rent** Techridge apartments comfortably.  
     - % and count who can **buy** Techridge condos.  
     - % and count who can **buy** Blackridge homes.  
     - % and count who can **reach** Townhouses (without rental income).

6. **Techridge-Wide Demand & Rate Sensitivity**  
   - Sum per-company grids to get total Techridge demand for each product type at each rate.  
   - Compare to **current and planned inventory** to identify:
     - Where you have **more demand than product** (e.g. condos at low rates).  
     - Where you are **over-building relative to local income**.

---

## 7. Roadmap – Detailed Upcoming Steps (Future Sessions)

This section outlines the **next steps** to continue the project in a structured way.

### Step A – Finalize Segment Counts & Income Band Mapping

- For each company:
  - Use your **headcount trajectories** (650 now, ~1,000 committed, ~1,500 next few years) to:
    - Allocate employees into the defined role segments (e.g. Vasion support vs sales vs eng).  
    - Ensure segment counts sum exactly to company-level headcount for each forecast year.
  - Map each segment’s QI_base and QI_full into the global income bands (B1–B7) and record results.

### Step B – Define Household Split Assumptions

- For each **segment type** (e.g. early-career support, mid-career engineer, senior manager), define:
  - Approximate % in **H1, H2, H3** (single vs dual-income households).  
  - Example starting points:
    - Support/CS: 60% H1, 30% H2, 10% H3.  
    - Engineers/Product: 40% H1, 30% H2, 30% H3.  
    - Management/Exec: 30% H1, 30% H2, 40% H3.
- Convert individual income bands into **household income distributions** per company and year.

### Step C – Implement Affordability Engine for Income Bands

- Code or spreadsheet formulas that:
  - Accept **household income** and **rate + loan type**.  
  - Compute **max monthly housing cost** with 0.45 front-end DTI.  
  - Invert the mortgage formula (with tax/ins/HOA) to get **max purchase price**.  
  - Compare against product price ranges (condos, Blackridge, townhouses) and rent ranges (apartments).
- Precompute a small **lookup table**:
  - (Household income band, rate scenario) → max purchase price and reachable product set.

### Step D – Build Per-Company Demand Grids

- For each company and year:
  - Combine: household band counts × lookup table to compute:
    - % and count of employees who can afford each product type at each rate.  
    - Two scenarios: **QI_base** vs **QI_full**.
- Pay special attention to segments that “cross thresholds,” e.g.:
  - AEs at Zonos/Vasion becoming Blackridge-capable when QI_full and/or rates fall.  
  - Kirton associates & partners underpinning Townhouse demand.

### Step E – Aggregate to Techridge and Compare to Supply

- Sum all companies’ grids to get **Techridge-wide demand curves**:
  - By **product type**, **rate scenario**, **year** (2025/26/27+).  
  - Highlight:
    - Number of likely **condo buyers** vs your planned condo count.  
    - Number of likely **Blackridge buyers** vs Blackridge inventory.  
    - Size of the **true Townhouse-capable** pool.
- Use this to:
  - Test whether you are **over- or under-building** each product type.  
  - Prioritize which products to accelerate or defer in each rate environment.

### Step F – Future Enhancements (After Core Model Is Stable)

- **Incorporate rental income** for townhouses (DSCR, STR underwriting).  
- **Refine bonus treatment** with optional “strict conventional” toggle (2-year history required).  
- **Add real survey data** on preferences (what employees actually want) to turn “can buy” into “will buy.”  
- **Integrate with live market data** (Zillow/MLS) to benchmark Techridge pricing vs off-site alternatives.

---

## 8. Key Modeling Choices & Assumptions (Explicitly Logged)

For future readers and collaborators:

- We **use public wage data** (Indeed, Glassdoor, Levels.fyi, job postings) and **your official Techridge PDF** (headcounts / projections) as the primary inputs.  
- We deliberately:
  - **Simplify bonus/commission rules** to “1 year history is sufficient”  
    - This is looser than strict Fannie/Freddie guidance but closer to practical approvals and avoids heavy tenure modeling.  
  - Focus on **on-site Techridge employees** and near-term committed hires, not remote staff.  
  - Treat townhouses as **owner-occupied second homes** in the first phase (no rental income), deferring STR underwriting to a later phase.
- Every company is tagged with a **data quality flag** (rich / medium / thin) so you know where to focus future data collection (e.g. talking directly with HR, or doing short anonymous employee surveys).

This README is intended to preserve the **full context of why and how** the model is structured the way it is, so future sessions can dive straight into implementation and refinement rather than rediscovering the reasoning.

## 9. Current Implementation – Files & Pipeline

This section documents how the concepts above are currently implemented in code, so you can see **where to plug in new companies and segments**.

### 9.1 Data Files (JSON, Company-Specific)

- **`data/companies.json`**  
  - Currently holds **busybusy / AlignOps** as a worked example.  
  - Structure (per company):
    - `name`: Company name.  
    - `base_year`: First modeled year for incomes (e.g. 2025).  
    - `employee_count`: Base-year on-site Techridge headcount used to normalize role counts.  
    - `projection_years`: *(optional)* list of `{ "year", "employee_count" }` anchors (e.g. `[{2025,85},{2027,100}]`) used to scale role counts for future years.  
    - `roles`: List of role segments, each with:
      - `title`: Segment label (e.g. `"SDR / BDR"`, `"Client Success"`).  
      - `count`: Number of employees in this segment (for the base year).  
      - `base_salary`: Used as **QI_base** (conservative scenario).  
      - `ote`: Used as **QI_full** (base + qualifying bonus/commission).  
      - `is_entry_level`: Flag to help you remember segment seniority.  
      - `segment_type`: Free-text tag for grouping (e.g. `"entry_support_sales"`, `"ops_eng"`, `"management_exec"`).  
      - `household_split`: Per-segment assumptions for **H1/H2/H3**, e.g.  
        - `H1_single`: 0.6  
        - `H2_dual_moderate`: 0.3  
        - `H3_dual_peer`: 0.1  

> **Planned usage**: going forward, you can either keep multiple companies in `companies.json`, or move toward **one JSON per company** (e.g. `data/vasion.json`, `data/zonos.json`) that follow the same inner structure. The Python loader can be extended to handle either a `"companies"` wrapper or a single company object.

### 9.2 Affordability Engine & Band Pipeline (`rate_sensitivity.py`)

The file `rate_sensitivity.py` implements the **band-based affordability pipeline** described in Sections 3–7:

- **Global configuration**
  - `INCOME_BANDS` B1–B7 (shared across companies) for both individual and household income.  
  - `HOUSEHOLD_TYPES`:
    - `H1_single = 1.0`  
    - `H2_dual_moderate = 1.7`  
    - `H3_dual_peer = 2.0`  
  - `INCOME_GROWTH_RATE = 0.04` – **4% annual income growth**, compounded from each company’s `base_year`.  
  - `RATE_SCENARIOS` – FHA-style 6.15%, Conventional 6.45%, plus 5.50% and 4.50% sensitivity rates.

- **Core functions**
  - `calculate_max_purchase_price(annual_income, interest_rate, down_payment_pct)`  
    - Inverts the mortgage formula with **DTI = 0.45** and **TAX_INS_HOA_RATE ≈ 1.2%/yr** to get max purchase price.  
  - `assign_income_band(annual_income)`  
    - Maps a given income into B1–B7.  
  - `apply_income_growth(base_income, years_after_base)`  
    - Applies the 4% annual growth assumption to get incomes for future years.  
  - `build_affordability_lookup()`  
    - For each **income band** and **rate scenario**, computes:
      - Representative household income for the band.  
      - Max affordable purchase price.  
      - Which products are reachable (Apt/Condo/Blackridge/Townhouse).  
    - Includes a guardrail that **Townhouses are only counted from B6/B7** even if raw math might stretch lower.
  - `compute_household_band_counts(company, year, scenario)`  
    - For each segment and company-specific `household_split`:
      - Applies **H1/H2/H3 multipliers** to QI_base or QI_full.  
      - Applies income growth for the target year.  
      - Buckets resulting household incomes into **B1–B7**.  
    - Returns total **households per income band** for that company/year/scenario.
  - `summarize_demand_by_product(hh_band_counts, affordability_lookup)`  
    - Joins household band counts with the band-level affordability table to produce, for each company, year, and rate:
      - Household counts and percentages that can reach **Apartments, Condos, Blackridge, Townhouses**.
  - `demo_busybusy_pipeline()`  
    - Runs the full pipeline for **busybusy / AlignOps** using the current JSON data, and prints a compact demand summary by product and rate for both QI_base and QI_full.

This implementation is intended as the **reference pattern** for adding more companies (Vasion, Zonos, Planstin/Zion, Kirton, etc.): you define segments and household splits in JSON, and the Python pipeline handles banding, affordability, and demand aggregation consistently across firms.

---

## 10. Rate Data Implementation Plan (Frontend & Backend)

Over time, the Techridge Affordability Tool will have **two layers** of rate handling:

1. The **Python model** in this repo (for offline analysis and validation).  
2. A **Next.js UI** that fetches live FHA rates (and later stores them in Neon) for interactive scenarios.

### 10.1 Python Model (This Repo)

In `rate_sensitivity.py`:

- We currently define **static rate scenarios**:
  - `FHA_6.15` → 6.15% (FHA-style, including MIP).  
  - `Conv_6.45` → 6.45% (Conventional baseline).  
  - `Alt_5.50` and `Alt_4.50` as sensitivity cases.
- These are used to build the **affordability lookup table** and drive the demand results.

Planned enhancements (optional, if/when we want dynamic rates here):

- Add a simple loader that:
  - Reads a JSON file such as `data/rates.json` (exported by the Next.js app), or  
  - Calls a local `/api/fha-rate` endpoint to fetch the latest FHA rate.
- Update `RATE_SCENARIOS` at runtime based on:
  - Latest FHA 30‑yr rate (for `FHA_live`), and  
  - A simple spread for conventional (e.g. `Conv_live = FHA_live + 0.25–0.35%`).
- Keep the **band-based pipeline unchanged**, so we can validate that Next.js and Python implementations agree.

### 10.2 Next.js UI (Hosted on Vercel)

The Next.js app will be the **interactive front-end** that:

- Holds current **rate/year/scenario** in a global context (`AffordabilityContext`).  
- Calls a TS port of the Python model to compute company- and ecosystem-level demand.  
- Fetches and stores **FHA 30‑yr rates** using a small backend + (optionally) Neon.

Rate handling plan:

1. **Phase 1 – Fetch-on-demand (no DB)**  
   - Implement `GET /api/fha-rate` in Next.js:
     - Attempts to fetch FHA 30‑yr from a trusted source (e.g. MND via scraping/API or reused `useMortgageRates` logic from `Money_heaven` adapted to Node).  
     - On failure, falls back to a static default (e.g. 6.15%).  
   - GlobalDock:
     - Uses this endpoint to **seed** the initial rate in context.  
     - Provides a “Use live FHA” control; the slider can then move off that value for scenario testing.

2. **Phase 2 – Persisted rates with Neon (optional, but recommended)**  
   - Create a `rates` table in Neon:
     - `date DATE PRIMARY KEY`  
     - `fha_30y NUMERIC`  
     - `conv_30y NUMERIC`  
     - `source TEXT`  
     - `created_at TIMESTAMP`
   - Update `/api/fha-rate` to:
     - Return today’s row if it exists.  
     - If not, fetch from MND, insert, and then return.  
   - Optionally add a **Vercel Cron** job to call `/api/fha-rate` once per day, so data is always up to date.
   - `/assumptions` page in the UI will:
     - Show the latest FHA rate and a small historical sparkline.  
     - Let users choose whether that live rate is the default for new sessions.

3. **Phase 3 – Deeper scenario controls (UI)**  
   - Add controls in the `/assumptions` page to:
     - Adjust DTI limit (0.35–0.50).  
     - Tune combined tax/insurance/HOA % used in the affordability engine.  
     - Override income growth rates for sensitivity testing.
   - All such controls use the same TS model that underpins the core pages, so any rate assumption change is immediately reflected across:
     - Ecosystem Overview,  
     - Company Deep Dives, and  
     - Income Band Explorer.

This architecture ensures that:

- The **Python model** remains a stable, transparent reference implementation.  
- The **Next.js UI** can react to real-world rate changes (FHA from MND), while still respecting the underwriting and DTI logic defined here.  
- Future integrations (Neon, stricter conforming-loan rules, rental-income modeling) can evolve without rewriting the core math.