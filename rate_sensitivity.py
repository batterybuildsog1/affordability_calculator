import json
import os
from typing import Dict, List

import pandas as pd

# Core financial constants
DTI_LIMIT = 0.45
TAX_INS_HOA_RATE = 0.012  # 1.2% of property value annually
INCOME_GROWTH_RATE = 0.04  # 4% per year, compounded

# Product Definitions
PRODUCTS = {
    "Apartments": {"type": "Rent", "min_price": 1700, "max_price": 4500},
    "Condos": {"type": "Buy", "min_price": 450000, "max_price": 650000},
    "Blackridge": {"type": "Buy", "min_price": 620000, "max_price": 680000},
    "Townhouse": {"type": "Buy", "min_price": 1100000, "max_price": 2100000},
}

# Global income bands (can apply to both individual and household income)
INCOME_BANDS: List[Dict] = [
    {"name": "B1", "min": 35000, "max": 60000},
    {"name": "B2", "min": 60000, "max": 80000},
    {"name": "B3", "min": 80000, "max": 110000},
    {"name": "B4", "min": 110000, "max": 150000},
    {"name": "B5", "min": 150000, "max": 200000},
    {"name": "B6", "min": 200000, "max": 300000},
    {"name": "B7", "min": 300000, "max": None},  # open-ended top band
]

# Household archetypes
HOUSEHOLD_TYPES: Dict[str, float] = {
    "H1_single": 1.0,
    "H2_dual_moderate": 1.7,
    "H3_dual_peer": 2.0,
}

# Rate scenarios to test
RATE_SCENARIOS: Dict[str, float] = {
    "FHA_6.15": 0.0615,  # FHA-ish
    "Conv_6.45": 0.0645,  # Conventional baseline
    "Alt_5.50": 0.0550,
    "Alt_4.50": 0.0450,
}


def load_companies_from_dir(dir_path: str = "data") -> List[Dict]:
    """
    Load all company definitions from JSON files in the given directory.
    Supports either:
    - {"companies": [ {...}, {...} ]} at the top level, or
    - a single company object with a "name" key.
    """
    companies: List[Dict] = []
    if not os.path.isdir(dir_path):
        return companies

    for filename in os.listdir(dir_path):
        if not filename.endswith(".json"):
            continue

        path = os.path.join(dir_path, filename)
        with open(path, "r") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                raise RuntimeError(f"Failed to parse JSON in {path}: {e}") from e

        if isinstance(data, dict) and "companies" in data:
            companies.extend(data["companies"])
        elif isinstance(data, dict) and "name" in data:
            companies.append(data)

    return companies


def get_headcount_for_year(company: Dict, year: int) -> float:
    """
    Return a projected employee count for the given year.
    Uses optional 'projection_years' anchors if present; otherwise
    falls back to company['employee_count'].
    - For years before the first anchor, returns the first anchor count.
    - For years after the last anchor, returns the last anchor count.
    - For years between anchors, linearly interpolates.
    """
    base_count = company.get("employee_count")
    projection_years = company.get("projection_years")

    if not projection_years or base_count is None:
        return float(base_count or 0.0)

    anchors = sorted(projection_years, key=lambda x: x.get("year", 0))
    years = [a.get("year") for a in anchors]
    counts = [a.get("employee_count") for a in anchors]

    # Before first anchor
    if year <= years[0]:
        return float(counts[0])
    # After last anchor
    if year >= years[-1]:
        return float(counts[-1])

    # Between anchors: linear interpolation
    for i in range(len(anchors) - 1):
        y0, y1 = years[i], years[i + 1]
        if y0 <= year <= y1:
            c0, c1 = counts[i], counts[i + 1]
            # Avoid division by zero if anchors share the same year
            if y1 == y0:
                return float(c0)
            t = (year - y0) / (y1 - y0)
            return float(c0 + t * (c1 - c0))

    return float(base_count)


def calculate_max_purchase_price(
    annual_income: float, interest_rate: float, down_payment_pct: float = 0.035
) -> float:
    """
    Calculates max purchase price based on DTI and interest rate.
    Formula derived to include Property Tax/Ins/HOA in the DTI limit.
    """
    monthly_gross = annual_income / 12
    max_monthly_payment = monthly_gross * DTI_LIMIT

    r_monthly = interest_rate / 12
    n_months = 360  # 30 years

    # Mortgage Payment Factor (Principal + Interest per dollar borrowed)
    mortgage_factor = (r_monthly * (1 + r_monthly) ** n_months) / (
        (1 + r_monthly) ** n_months - 1
    )

    # Total Monthly Cost = (Price * (1-Down) * MortgageFactor) + (Price * TaxRate/12)
    # MaxPayment = Price * [ (1-Down)*Factor + TaxRate/12 ]

    denominator = (1 - down_payment_pct) * mortgage_factor + (TAX_INS_HOA_RATE / 12)
    max_price = max_monthly_payment / denominator

    return max_price


def apply_income_growth(base_income: float, years_after_base: int) -> float:
    """
    Apply 4% annual growth compounded for a given number of years after the base year.
    """
    if years_after_base <= 0:
        return base_income
    return base_income * ((1 + INCOME_GROWTH_RATE) ** years_after_base)


def assign_income_band(annual_income: float) -> str:
    """
    Map a given income to a band name (B1–B7).
    """
    for band in INCOME_BANDS:
        band_min = band["min"]
        band_max = band["max"]
        if band_max is None:
            if annual_income >= band_min:
                return band["name"]
        else:
            if band_min <= annual_income < band_max:
                return band["name"]
    return "Unknown"


def build_affordability_lookup() -> pd.DataFrame:
    """
    For each income band and rate scenario, compute:
    - representative household income (band midpoint, or min for open-ended)
    - max purchase price at that income
    - which products are reachable
    """
    rows = []
    for band in INCOME_BANDS:
        band_name = band["name"]
        band_min = band["min"]
        band_max = band["max"]

        if band_max is None:
            # For open-ended band, use min * 1.1 as a conservative representative
            rep_income = band_min * 1.1
        else:
            rep_income = (band_min + band_max) / 2.0

        for rate_label, rate in RATE_SCENARIOS.items():
            # Dynamic down payment: FHA-style 3.5% up to ~680k, else 10% (Conventional/Jumbo)
            est_price = calculate_max_purchase_price(rep_income, rate, 0.035)
            down_pct = 0.035
            if est_price > 680000:
                down_pct = 0.10
                est_price = calculate_max_purchase_price(rep_income, rate, 0.10)

            reachable_products = []
            for product_name, details in PRODUCTS.items():
                if details["type"] == "Buy":
                    if est_price >= details["min_price"]:
                        # Extra guardrail: Townhouse only counted for higher-income bands
                        if (
                            product_name == "Townhouse"
                            and band_name not in ("B6", "B7")
                        ):
                            continue
                        reachable_products.append(product_name)
                else:
                    monthly_gross = rep_income / 12
                    if (monthly_gross * 0.35) >= details["min_price"]:
                        reachable_products.append(product_name)

            rows.append(
                {
                    "income_band": band_name,
                    "rep_income": rep_income,
                    "rate_label": rate_label,
                    "rate": rate,
                    "max_price": est_price,
                    "reachable_products": reachable_products,
                }
            )

    return pd.DataFrame(rows)


def compute_household_band_counts(
    company: Dict, year: int, scenario: str
) -> pd.DataFrame:
    """
    For a given company, year, and income scenario ("QI_base" or "QI_full"),
    compute household counts by income band and household type.
    """
    assert scenario in ("QI_base", "QI_full")

    base_year = company.get("base_year", year)
    years_after_base = max(0, year - base_year)

    base_headcount = company.get("employee_count")
    target_headcount = get_headcount_for_year(company, year)
    headcount_scale = (
        float(target_headcount) / float(base_headcount)
        if base_headcount not in (None, 0)
        else 1.0
    )

    rows = []
    for role in company["roles"]:
        base_role_count = role["count"]

        if scenario == "QI_base":
            income = role["base_salary"]
        else:
            income = role["ote"]

        grown_income = apply_income_growth(income, years_after_base)

        household_split: Dict[str, float] = role.get("household_split", {})

        for hh_type, multiplier in HOUSEHOLD_TYPES.items():
            share = household_split.get(hh_type, 0.0)
            if share <= 0:
                continue

            hh_income = grown_income * multiplier
            band_name = assign_income_band(hh_income)

            effective_count = base_role_count * headcount_scale
            household_count = effective_count * share

            rows.append(
                {
                    "company": company["name"],
                    "year": year,
                    "scenario": scenario,
                    "role_title": role["title"],
                    "household_type": hh_type,
                    "hh_income": hh_income,
                    "income_band": band_name,
                    "household_count": household_count,
                }
            )

    df = pd.DataFrame(rows)
    if df.empty:
        return df

    grouped = (
        df.groupby(
            ["company", "year", "scenario", "income_band"],
            as_index=False,
        )["household_count"]
        .sum()
        .sort_values(["scenario", "income_band"])
    )
    return grouped


def summarize_demand_by_product(
    hh_band_counts: pd.DataFrame, affordability_lookup: pd.DataFrame
) -> pd.DataFrame:
    """
    Join household income-band counts with the affordability lookup
    to get product-level demand (counts) per rate scenario.
    """
    if hh_band_counts.empty:
        return hh_band_counts

    merge_cols = ["income_band"]
    merged = hh_band_counts.merge(
        affordability_lookup, how="left", left_on="income_band", right_on="income_band"
    )

    rows: List[Dict] = []

    grouped = merged.groupby(
        ["company", "year", "scenario", "rate_label", "rate"], as_index=False
    )

    for (company, year, scen, rate_label, rate), group in grouped:
        total_households = group["household_count"].sum()

        product_counts: Dict[str, float] = {
            "Apartments": 0.0,
            "Condos": 0.0,
            "Blackridge": 0.0,
            "Townhouse": 0.0,
        }

        for _, row in group.iterrows():
            hh_count = row["household_count"]
            reachable = row["reachable_products"] or []
            for product in reachable:
                product_counts[product] += hh_count

        row_dict = {
            "company": company,
            "year": year,
            "scenario": scen,
            "rate_label": rate_label,
            "rate": rate,
            "total_households": total_households,
        }
        row_dict.update(product_counts)
        rows.append(row_dict)

    demand_df = pd.DataFrame(rows)

    for scenario in demand_df["scenario"].unique():
        mask = demand_df["scenario"] == scenario
        subset = demand_df[mask]
        total_hh = subset["total_households"]
        for product in ["Apartments", "Condos", "Blackridge", "Townhouse"]:
            demand_df.loc[mask, f"{product}_pct"] = (
                subset[product] / total_hh * 100.0
            ).round(1)

    return demand_df


def compute_techridge_demand(
    companies: List[Dict],
    years: List[int],
    scenarios: List[str],
    affordability_lookup: pd.DataFrame,
) -> pd.DataFrame:
    """
    Aggregate demand across all companies to get Techridge-wide
    demand by product for each year, scenario, and rate.
    """
    per_company_results = []

    for company in companies:
        for year in years:
            for scen in scenarios:
                hh_bands = compute_household_band_counts(company, year, scen)
                if hh_bands.empty:
                    continue
                demand = summarize_demand_by_product(hh_bands, affordability_lookup)
                per_company_results.append(demand)

    if not per_company_results:
        return pd.DataFrame()

    combined = pd.concat(per_company_results, ignore_index=True)

    # Aggregate over companies to get Techridge-wide totals
    group_cols = ["year", "scenario", "rate_label", "rate"]
    agg_cols = [
        "total_households",
        "Apartments",
        "Condos",
        "Blackridge",
        "Townhouse",
    ]

    techridge = (
        combined.groupby(group_cols, as_index=False)[agg_cols].sum().sort_values(
            group_cols
        )
    )

    # Recompute percentages at Techridge level
    for _, row in techridge.iterrows():
        total_hh = row["total_households"]
        if total_hh <= 0:
            continue
    for product in ["Apartments", "Condos", "Blackridge", "Townhouse"]:
        techridge[f"{product}_pct"] = (
            techridge[product] / techridge["total_households"] * 100.0
        ).round(1)

    return techridge


def demo_busybusy_pipeline():
    """
    Run the new pipeline for busybusy / AlignOps as a concrete example:
    - compute household band counts for QI_base and QI_full
    - join with affordability lookup
    - print a compact demand summary by product and rate
    """
    companies = load_companies_from_dir("data")
    company = next(
        (c for c in companies if c.get("name") == "busybusy / AlignOps"), None
    )
    if company is None:
        print("busybusy / AlignOps company not found in data directory.")
        return

    affordability_lookup = build_affordability_lookup()

    years = [company.get("base_year", 2025)]
    scenarios = ["QI_base", "QI_full"]

    all_results = []
    for year in years:
        for scen in scenarios:
            hh_bands = compute_household_band_counts(company, year, scen)
            demand = summarize_demand_by_product(hh_bands, affordability_lookup)
            all_results.append(demand)

    if not all_results:
        print("No results generated.")
        return

    result_df = pd.concat(all_results, ignore_index=True)

    cols_to_show = [
        "company",
        "year",
        "scenario",
        "rate_label",
        "total_households",
        "Apartments",
        "Apartments_pct",
        "Condos",
        "Condos_pct",
        "Blackridge",
        "Blackridge_pct",
        "Townhouse",
        "Townhouse_pct",
    ]
    print("\nBusybusy / AlignOps – Demand by Product, Band-Based Pipeline")
    print("=" * 80)
    print(result_df[cols_to_show].to_string(index=False))


def generate_test_outputs():
    """
    Generate JSON test outputs for validating the TypeScript port.
    Creates detailed output files in test_outputs/ directory for key scenarios.
    """
    import os

    output_dir = "test_outputs"
    os.makedirs(output_dir, exist_ok=True)

    companies = load_companies_from_dir("data")
    affordability_lookup = build_affordability_lookup()

    # Define test scenarios: mix of companies, years, scenarios, and rates
    test_cases = [
        {"company_name": "busybusy / AlignOps", "year": 2025, "scenario": "QI_base", "rate_key": "FHA_6.15"},
        {"company_name": "busybusy / AlignOps", "year": 2025, "scenario": "QI_full", "rate_key": "Alt_5.50"},
        {"company_name": "Vasion", "year": 2025, "scenario": "QI_base", "rate_key": "FHA_6.15"},
        {"company_name": "Zonos", "year": 2025, "scenario": "QI_full", "rate_key": "Conv_6.45"},
    ]

    for test in test_cases:
        company = next((c for c in companies if c.get("name") == test["company_name"]), None)
        if not company:
            print(f"Warning: Company '{test['company_name']}' not found, skipping")
            continue

        year = test["year"]
        scenario = test["scenario"]
        rate_key = test["rate_key"]
        rate_value = RATE_SCENARIOS[rate_key]

        # Compute household band counts
        hh_bands_df = compute_household_band_counts(company, year, scenario)

        # Convert to dict for JSON
        hh_bands_dict = {}
        for _, row in hh_bands_df.iterrows():
            band = row["income_band"]
            count = row["household_count"]
            hh_bands_dict[band] = hh_bands_dict.get(band, 0.0) + count

        # Get affordability lookup for this rate
        rate_affordability = affordability_lookup[affordability_lookup["rate_label"] == rate_key].to_dict('records')

        # Compute demand summary
        demand_df = summarize_demand_by_product(hh_bands_df, affordability_lookup)
        demand_row = demand_df[demand_df["rate_label"] == rate_key].iloc[0] if not demand_df.empty else None

        if demand_row is None:
            print(f"Warning: No demand data for {test['company_name']}, skipping")
            continue

        # Build output structure
        output = {
            "company": company["name"],
            "year": year,
            "scenario": scenario,
            "rate": rate_value,
            "rate_label": rate_key,
            "household_band_counts": hh_bands_dict,
            "affordability_lookup": rate_affordability,
            "demand_summary": {
                "total_households": float(demand_row["total_households"]),
                "products": {
                    "Apartments": {
                        "count": float(demand_row["Apartments"]),
                        "percentage": float(demand_row["Apartments_pct"])
                    },
                    "Condos": {
                        "count": float(demand_row["Condos"]),
                        "percentage": float(demand_row["Condos_pct"])
                    },
                    "Blackridge": {
                        "count": float(demand_row["Blackridge"]),
                        "percentage": float(demand_row["Blackridge_pct"])
                    },
                    "Townhouse": {
                        "count": float(demand_row["Townhouse"]),
                        "percentage": float(demand_row["Townhouse_pct"])
                    }
                }
            }
        }

        # Create filename
        company_slug = company["name"].lower().replace(" / ", "_").replace(" ", "_")
        filename = f"{company_slug}_{year}_{scenario}_{rate_key}.json"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, 'w') as f:
            json.dump(output, f, indent=2)

        print(f"Generated: {filename}")

    print(f"\nTest outputs written to {output_dir}/")


def load_supply(filepath: str = "data/supply.json") -> Dict:
    """
    Load simple supply configuration from JSON.
    Expected shape:
    {
      "products": [
        {"name": "Apartments", "units": 200, "first_delivery_year": 2028},
        ...
      ]
    }
    """
    with open(filepath, "r") as f:
        return json.load(f)


def compute_supply_by_year(
    supply_cfg: Dict, years: List[int]
) -> pd.DataFrame:
    """
    For each product and year, compute available supply (cumulative units
    from first_delivery_year onwards).
    """
    rows = []
    products = supply_cfg.get("products", [])

    for product in products:
        name = product["name"]
        units = product["units"]
        first_year = product["first_delivery_year"]

        for year in years:
            available = units if year >= first_year else 0
            rows.append(
                {
                    "product": name,
                    "year": year,
                    "supply_units": available,
                }
            )

    return pd.DataFrame(rows)


def build_techridge_overview_json(
    years: List[int],
    scenarios: List[str],
    supply_path: str = "data/supply.json",
) -> Dict:
    """
    High-level entry point to generate Techridge-wide demand vs supply
    for use by the frontend.

    Returns a JSON-serializable dict with:
    - demand_by_product: Techridge-wide demand per year/scenario/rate
    - supply_by_product: supply units per product and year
    """
    companies = load_companies_from_dir("data")
    if not companies:
        raise RuntimeError("No companies found in data directory")

    affordability_lookup = build_affordability_lookup()
    techridge_demand_df = compute_techridge_demand(
        companies, years, scenarios, affordability_lookup
    )

    supply_cfg = load_supply(supply_path)
    supply_df = compute_supply_by_year(supply_cfg, years)

    # Pivot supply so each product is a column for easier merging on frontend
    supply_pivot = supply_df.pivot_table(
        index="year", columns="product", values="supply_units", aggfunc="sum"
    ).reset_index()

    # Convert demand and supply to JSON-serializable structures
    demand_records = techridge_demand_df.to_dict(orient="records")
    supply_records = supply_pivot.to_dict(orient="records")

    return {
        "years": years,
        "scenarios": scenarios,
        "demand_by_product": demand_records,
        "supply_by_product": supply_records,
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "test":
        generate_test_outputs()
    elif len(sys.argv) > 1 and sys.argv[1] == "overview":
        # Example: python rate_sensitivity.py overview
        overview = build_techridge_overview_json(
            years=[2025, 2026, 2027, 2028, 2029],
            scenarios=["QI_base", "QI_full"],
        )
        print(json.dumps(overview, indent=2))
    else:
        demo_busybusy_pipeline()

