/**
 * Techridge Affordability Model - TypeScript Port
 * Port of Python affordability engine (calc_affordability.py and rate_sensitivity.py)
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export type IncomeBand = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7';
export type HouseholdType = 'H1_single' | 'H2_dual_moderate' | 'H3_dual_peer';
export type ProductType = 'apartments' | 'condos' | 'blackridge' | 'townhouses';
export type IncomeScenario = 'base' | 'full';

export interface Role {
  title: string;
  count: number;
  base_salary: number;
  ote: number;
  is_entry_level: boolean;
  segment_type: string;
  household_split: {
    H1_single: number;
    H2_dual_moderate: number;
    H3_dual_peer: number;
  };
}

export interface Company {
  name: string;
  base_year: number;
  employee_count: number;
  projection_years?: Array<{ year: number; employee_count: number }>;
  roles: Role[];
}

export interface ProductConfig {
  type: 'rent' | 'buy';
  range: [number, number];
}

export interface AffordabilityResult {
  maxPrice: number;
  affordableProducts: ProductType[];
  monthlyBudget: number;
}

export interface BandAffordability {
  band: IncomeBand;
  rate: number;
  maxPrice: number;
  affordableProducts: ProductType[];
  representativeIncome: number;
}

export interface DemandSummary {
  productType: ProductType;
  householdCount: number;
  percentage: number;
}

// ============================================
// CONSTANTS
// ============================================

export const CONSTANTS = {
  // Interest rates
  FHA_RATE: 0.0615, // 6.15% (includes 0.25% MIP)
  CONV_RATE: 0.0645, // 6.45%

  // Underwriting
  DTI_LIMIT: 0.45, // Front-end DTI
  FHA_LIMIT: 680000, // Max FHA purchase price
  FHA_DOWN_PAYMENT: 0.035, // 3.5%
  CONV_DOWN_PAYMENT: 0.10, // 10%

  // Costs
  TAX_INS_HOA_RATE: 0.012, // 1.2% of property value per year
  RENT_AFFORDABILITY: 0.35, // 35% of gross income for rent

  // Projections
  INCOME_GROWTH_RATE: 0.04, // 4% annual growth
} as const;

// Income bands (B1-B7)
export const INCOME_BANDS: Record<IncomeBand, [number, number]> = {
  B1: [35000, 60000],
  B2: [60000, 80000],
  B3: [80000, 110000],
  B4: [110000, 150000],
  B5: [150000, 200000],
  B6: [200000, 300000],
  B7: [300000, Infinity],
};

// Household type multipliers
export const HOUSEHOLD_MULTIPLIERS: Record<HouseholdType, number> = {
  H1_single: 1.0,
  H2_dual_moderate: 1.7,
  H3_dual_peer: 2.0,
};

// Product configurations
export const PRODUCTS: Record<ProductType, ProductConfig> = {
  apartments: { type: 'rent', range: [1700, 4500] },
  condos: { type: 'buy', range: [450000, 650000] },
  blackridge: { type: 'buy', range: [620000, 680000] },
  townhouses: { type: 'buy', range: [1100000, 2100000] },
};

// ============================================
// CORE AFFORDABILITY FUNCTIONS
// ============================================

/**
 * Calculate maximum affordable purchase price using inverted mortgage formula
 *
 * @param annualIncome - Gross annual household income
 * @param interestRate - Annual interest rate (e.g., 0.0615 for 6.15%)
 * @param downPaymentPct - Down payment as decimal (e.g., 0.035 for 3.5%)
 * @param dtiLimit - Front-end DTI limit (default 0.45)
 * @returns Maximum purchase price
 */
export function calculateMaxPurchasePrice(
  annualIncome: number,
  interestRate: number,
  downPaymentPct: number,
  dtiLimit: number = CONSTANTS.DTI_LIMIT
): number {
  const monthlyGross = annualIncome / 12;
  const maxMonthlyPayment = monthlyGross * dtiLimit;

  const monthlyRate = interestRate / 12;
  const numMonths = 360; // 30-year fixed

  // Monthly mortgage factor: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const mortgageFactor =
    (monthlyRate * Math.pow(1 + monthlyRate, numMonths)) /
    (Math.pow(1 + monthlyRate, numMonths) - 1);

  // Total housing cost = principal & interest + tax/ins/HOA
  // maxMonthlyPayment = price * [(1 - down%) * mortgageFactor + (taxRate / 12)]
  // Solve for price:
  const denominator =
    (1 - downPaymentPct) * mortgageFactor + (CONSTANTS.TAX_INS_HOA_RATE / 12);

  const maxPrice = maxMonthlyPayment / denominator;

  return Math.floor(maxPrice);
}

/**
 * Determine loan type and parameters based on purchase price
 */
export function getLoanParams(purchasePrice: number): {
  rate: number;
  downPayment: number;
  loanType: 'FHA' | 'Conventional' | 'Jumbo';
} {
  if (purchasePrice <= CONSTANTS.FHA_LIMIT) {
    return {
      rate: CONSTANTS.FHA_RATE,
      downPayment: CONSTANTS.FHA_DOWN_PAYMENT,
      loanType: 'FHA',
    };
  }

  return {
    rate: CONSTANTS.CONV_RATE,
    downPayment: CONSTANTS.CONV_DOWN_PAYMENT,
    loanType: purchasePrice > CONSTANTS.FHA_LIMIT ? 'Jumbo' : 'Conventional',
  };
}

/**
 * Calculate what products are affordable for a given income
 */
export function calculateAffordability(
  annualIncome: number,
  customRate?: number
): AffordabilityResult {
  const monthlyIncome = annualIncome / 12;
  const monthlyBudget = monthlyIncome * CONSTANTS.DTI_LIMIT;

  // Calculate max purchase price
  const rate = customRate ?? CONSTANTS.FHA_RATE;
  let maxPrice = calculateMaxPurchasePrice(
    annualIncome,
    rate,
    CONSTANTS.FHA_DOWN_PAYMENT
  );

  // If exceeds FHA limit, recalculate with conventional
  if (maxPrice > CONSTANTS.FHA_LIMIT) {
    maxPrice = calculateMaxPurchasePrice(
      annualIncome,
      customRate ?? CONSTANTS.CONV_RATE,
      CONSTANTS.CONV_DOWN_PAYMENT
    );
  }

  // Determine affordable products
  const affordableProducts: ProductType[] = [];

  // Check rent affordability (35% of gross income)
  const maxRent = monthlyIncome * CONSTANTS.RENT_AFFORDABILITY;
  if (maxRent >= PRODUCTS.apartments.range[0]) {
    affordableProducts.push('apartments');
  }

  // Check buy affordability
  if (maxPrice >= PRODUCTS.condos.range[0]) {
    affordableProducts.push('condos');
  }

  if (maxPrice >= PRODUCTS.blackridge.range[0]) {
    affordableProducts.push('blackridge');
  }

  // Townhouse threshold - only from B6/B7 income bands
  if (maxPrice >= PRODUCTS.townhouses.range[0] && annualIncome >= INCOME_BANDS.B6[0]) {
    affordableProducts.push('townhouses');
  }

  return {
    maxPrice,
    affordableProducts,
    monthlyBudget,
  };
}

/**
 * Assign an income to a band
 */
export function assignIncomeBand(annualIncome: number): IncomeBand {
  const bands: IncomeBand[] = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];

  for (const band of bands) {
    const [min, max] = INCOME_BANDS[band];
    if (annualIncome >= min && annualIncome < max) {
      return band;
    }
  }

  return 'B7'; // Default to highest band
}

/**
 * Apply income growth for projection years
 */
export function applyIncomeGrowth(baseIncome: number, yearsAfterBase: number): number {
  return Math.round(baseIncome * Math.pow(1 + CONSTANTS.INCOME_GROWTH_RATE, yearsAfterBase));
}

// ============================================
// BAND-BASED AFFORDABILITY
// ============================================

/**
 * Get representative income for a band (midpoint)
 */
export function getRepresentativeIncome(band: IncomeBand): number {
  const [min, max] = INCOME_BANDS[band];
  if (max === Infinity) {
    return min + 100000; // Use min + 100k for top band
  }
  return Math.floor((min + max) / 2);
}

/**
 * Build affordability lookup table for all income bands at given rates
 */
export function buildAffordabilityLookup(
  rateScenarios: number[] = [CONSTANTS.FHA_RATE, CONSTANTS.CONV_RATE, 0.055, 0.045]
): Record<string, BandAffordability> {
  const lookup: Record<string, BandAffordability> = {};
  const bands: IncomeBand[] = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];

  for (const band of bands) {
    for (const rate of rateScenarios) {
      const income = getRepresentativeIncome(band);
      const { maxPrice, affordableProducts } = calculateAffordability(income, rate);

      const key = `${band}_${(rate * 100).toFixed(2)}`;
      lookup[key] = {
        band,
        rate,
        maxPrice,
        affordableProducts,
        representativeIncome: income,
      };
    }
  }

  return lookup;
}

// ============================================
// HOUSEHOLD BAND COMPUTATION
// ============================================

/**
 * Compute household band counts for a company, year, and scenario
 */
export function computeHouseholdBandCounts(
  company: Company,
  targetYear: number,
  scenario: IncomeScenario
): Record<IncomeBand, number> {
  const yearsAfterBase = targetYear - company.base_year;

  // Initialize band counts
  const bandCounts: Record<IncomeBand, number> = {
    B1: 0, B2: 0, B3: 0, B4: 0, B5: 0, B6: 0, B7: 0
  };

  // Calculate scaling factor for target year
  let scaleFactor = 1.0;
  if (company.projection_years && company.projection_years.length > 0) {
    const baseYearProj = company.projection_years.find(p => p.year === company.base_year);
    const targetYearProj = company.projection_years.find(p => p.year === targetYear);

    if (baseYearProj && targetYearProj) {
      scaleFactor = targetYearProj.employee_count / baseYearProj.employee_count;
    }
  }

  // Process each role
  for (const role of company.roles) {
    const scaledCount = role.count * scaleFactor;

    // Get income based on scenario
    const baseIncome = scenario === 'base' ? role.base_salary : role.ote;
    const projectedIncome = applyIncomeGrowth(baseIncome, yearsAfterBase);

    // Apply household splits
    const { H1_single, H2_dual_moderate, H3_dual_peer } = role.household_split;

    // H1 - Single income
    const h1Income = projectedIncome * HOUSEHOLD_MULTIPLIERS.H1_single;
    const h1Band = assignIncomeBand(h1Income);
    bandCounts[h1Band] += scaledCount * H1_single;

    // H2 - Dual moderate
    const h2Income = projectedIncome * HOUSEHOLD_MULTIPLIERS.H2_dual_moderate;
    const h2Band = assignIncomeBand(h2Income);
    bandCounts[h2Band] += scaledCount * H2_dual_moderate;

    // H3 - Dual peer
    const h3Income = projectedIncome * HOUSEHOLD_MULTIPLIERS.H3_dual_peer;
    const h3Band = assignIncomeBand(h3Income);
    bandCounts[h3Band] += scaledCount * H3_dual_peer;
  }

  return bandCounts;
}

/**
 * Summarize demand by product for a company
 */
export function summarizeDemandByProduct(
  householdBandCounts: Record<IncomeBand, number>,
  affordabilityLookup: Record<string, BandAffordability>,
  rate: number
): DemandSummary[] {
  const productCounts: Record<ProductType, number> = {
    apartments: 0,
    condos: 0,
    blackridge: 0,
    townhouses: 0,
  };

  let totalHouseholds = 0;
  const bands: IncomeBand[] = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];

  for (const band of bands) {
    const count = householdBandCounts[band];
    totalHouseholds += count;

    const key = `${band}_${(rate * 100).toFixed(2)}`;
    const affordability = affordabilityLookup[key];

    if (affordability) {
      for (const product of affordability.affordableProducts) {
        productCounts[product] += count;
      }
    }
  }

  // Convert to summary array
  const summary: DemandSummary[] = [];
  for (const [product, count] of Object.entries(productCounts)) {
    summary.push({
      productType: product as ProductType,
      householdCount: Math.round(count),
      percentage: totalHouseholds > 0 ? (count / totalHouseholds) * 100 : 0,
    });
  }

  return summary;
}

// ============================================
// RATE SENSITIVITY HELPERS
// ============================================

export const RATE_SCENARIOS = {
  FHA_CURRENT: CONSTANTS.FHA_RATE,
  CONV_CURRENT: CONSTANTS.CONV_RATE,
  OPTIMISTIC: 0.055,
  VERY_OPTIMISTIC: 0.045,
} as const;

export function getRateLabel(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
