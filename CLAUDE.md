# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Techridge Affordability & Demand Forecasting Tool** for residential development planning in St. George, Utah. The tool analyzes what Techridge employees can afford to buy or rent, projects demand across different housing products, and tests rate sensitivity for development decisions.

## Core Architecture

### Housing Products Modeled
- **Apartments**: $1,700–4,500/month rent (studio to penthouse)
- **Techridge Condos**: $450,000–650,000 purchase price
- **Blackridge Cove SFH**: $620,000–680,000 purchase price
- **Townhouses**: $1.1M–2.1M (nightly rental capable, but modeled as primary/second homes without rental income in Phase 1)

### Affordability Engine Logic
The core calculation in `calc_affordability.py` implements:
- **Front-end DTI**: 0.45 (max housing cost / gross income)
- **FHA loans**: 6.15% rate (includes 0.25% MIP), up to $680k purchase price, 3.5% down
- **Conventional/Jumbo**: 6.45% rate for purchases > $680k, 10%+ down
- **Tax/Insurance/HOA**: Combined 1.2% of property value per year
- **Rent affordability**: 30-35% of gross income

The `calc_max_price()` function inverts the mortgage formula to compute maximum affordable purchase price given income, rate, DTI, and down payment.

### Income Modeling Framework

**Two income scenarios per role:**
- `QI_base`: Base salary only (conservative underwriting)
- `QI_full`: Base + typical bonus/commission/OTE (assumes 1 year income history qualifies)

**Global income bands (B1-B7):**
- B1: $35k–$60k
- B2: $60k–$80k
- B3: $80k–$110k
- B4: $110k–$150k
- B5: $150k–$200k
- B6: $200k–$300k
- B7: $300k+

**Household archetypes (H1-H3):**
- H1 (single-income): 1.0× individual income
- H2 (dual-moderate): 1.7× individual income (~70% partner)
- H3 (dual-peer): 2.0× individual income (equal earners)

Each role segment has a `household_split` defining the H1/H2/H3 distribution.

### Data Structure (Company Segments)

Company data is stored in `data/*.json` files. Each company defines:
- `base_year`: Starting year for income projections (typically 2025)
- `employee_count`: Current on-site Techridge headcount
- `projection_years`: Future headcount targets with years
- `roles`: Array of role segments with:
  - `title`: Role name
  - `count`: Number of employees in this segment
  - `base_salary`: QI_base value
  - `ote`: QI_full value (includes bonus/commission)
  - `is_entry_level`: Boolean flag
  - `segment_type`: Grouping label (e.g., "entry_support_sales", "sales_ae", "ops_eng")
  - `household_split`: Object with H1_single, H2_dual_moderate, H3_dual_peer percentages

**Companies currently modeled:**
- busybusy/AlignOps, Vasion, Zonos, Planstin, Zion HealthShare, Primestin Care, Greystone, Mango Voice, DigiVoice, HFB Technologies, Eaglegate Title, CentraCom, Brodie Industries, Kirton McConkie

### Data Quality Flags
Each company is tagged with a data quality indicator in the README:
- **Rich**: Strong public salary data from Indeed, Glassdoor, Levels.fyi, job postings
- **Medium**: Industry-level benchmarks or partial firm data
- **Thin**: Estimated using similar companies or role proxies

When improving salary data, prioritize "thin" companies.

## Development Commands

### Running the Basic Affordability Calculator
```bash
# Activate virtual environment
source venv/bin/activate

# Run the simple affordability calculator (busybusy/AlignOps example)
python calc_affordability.py
```

This prints a table showing max purchase price and affordable products for each role at different household scenarios.

### Python Environment
- Python 3.13
- Virtual environment in `venv/`
- No requirements.txt currently exists; numpy and pandas appear to be installed but not actively used in main code

## Key Implementation Patterns

### Adding a New Company
1. Create `data/[company_name].json` following the structure in `data/companies.json`
2. Define all role segments with counts summing to company headcount
3. Assign `base_salary` and `ote` based on public wage data (Indeed, Glassdoor, Levels.fyi)
4. Set `household_split` based on role seniority (entry-level: ~60/30/10, mid-career: ~40/30/30, senior: ~30/30/40)
5. Tag data quality in the README

### Income Growth Assumption
Per README Section 9.2:
- 4% annual income growth compounded from each company's `base_year`
- Applied via `apply_income_growth(base_income, years_after_base)` in future implementations

### Rate Sensitivity Testing
The README describes planned scenarios at:
- 6.15% (FHA current)
- 6.45% (Conventional current)
- 5.50% (optimistic)
- 4.50% (very optimistic)

These show how many households shift from "can't buy" → "condo" → "Blackridge" → "townhouse" as rates fall.

## Important Constraints & Simplifications

### Intentional Simplifications (from README Section 8)
1. **Bonus/commission treatment**: 1 year of history qualifies (looser than strict Fannie/Freddie 2-year rules, but closer to real approvals)
2. **No remote workers**: Only on-site Techridge employees
3. **Townhouse modeling**: Phase 1 treats as primary/second homes without rental income; future phases will add DSCR/STR underwriting
4. **Back-end DTI**: Not explicitly modeled; effects approximated through front-end DTI cap

### Mortgage Calculation Details
- All loans modeled as 30-year fixed
- FHA vs Conventional determined by purchase price (≤ $680k → FHA, > $680k → Conventional)
- Tax/insurance/HOA combined into single 1.2%/year factor
- Down payment: 3.5% for FHA, 10% for Conventional/Jumbo

## Future Enhancements (README Section 7)
- Incorporate rental income for townhouse underwriting (DSCR, STR cashflow)
- Add strict conventional bonus toggle (2-year history requirement)
- Integrate real survey data on employee preferences (turn "can buy" into "will buy")
- Live market data integration (Zillow/MLS comparisons)
- Next.js UI with live FHA rate fetching and Neon database for rate history

## README as Primary Documentation
The `README.md` file is extremely comprehensive (500+ lines) and serves as the authoritative source for:
- Detailed company wage data and sources
- Full modeling pipeline (Sections 5-7)
- Rationale for all assumptions (Section 8)
- Planned roadmap (Section 7)
- Rate data implementation strategy (Section 10)

Always consult the README when questions arise about methodology, data sources, or future direction.
