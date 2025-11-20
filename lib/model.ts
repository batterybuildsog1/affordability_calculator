/**
 * Techridge Affordability Model - TypeScript Port
 * Port of Python affordability engine (calc_affordability.py and rate_sensitivity.py)
 */

// ============================================
// TYPES & INTERFACES
// ============================================

// Removed duplicate type definition
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

// Granular Income Bands ($10k increments)
export const INCOME_BANDS = [
  'B_30K', 'B_40K', 'B_50K', 'B_60K', 'B_70K', 'B_80K', 'B_90K',
  'B_100K', 'B_110K', 'B_120K', 'B_130K', 'B_140K', 'B_150K',
  'B_160K', 'B_170K', 'B_180K', 'B_190K', 'B_200K', 'B_225K',
  'B_250K', 'B_300K', 'B_350K', 'B_400K_PLUS'
] as const;

export type IncomeBand = typeof INCOME_BANDS[number];

export const BAND_RANGES: Record<IncomeBand, { min: number; max: number; label: string }> = {
  'B_30K': { min: 0, max: 39999, label: '< $40k' },
  'B_40K': { min: 40000, max: 49999, label: '$40k - $50k' },
  'B_50K': { min: 50000, max: 59999, label: '$50k - $60k' },
  'B_60K': { min: 60000, max: 69999, label: '$60k - $70k' },
  'B_70K': { min: 70000, max: 79999, label: '$70k - $80k' },
  'B_80K': { min: 80000, max: 89999, label: '$80k - $90k' },
  'B_90K': { min: 90000, max: 99999, label: '$90k - $100k' },
  'B_100K': { min: 100000, max: 109999, label: '$100k - $110k' },
  'B_110K': { min: 110000, max: 119999, label: '$110k - $120k' },
  'B_120K': { min: 120000, max: 129999, label: '$120k - $130k' },
  'B_130K': { min: 130000, max: 139999, label: '$130k - $140k' },
  'B_140K': { min: 140000, max: 149999, label: '$140k - $150k' },
  'B_150K': { min: 150000, max: 159999, label: '$150k - $160k' },
  'B_160K': {
    min: 160000, max: 169999, label: '$160k - $170k'
  },
  'B_170K': { min: 170000, max: 179999, label: '$170k - $180k' },
  'B_180K': { min: 180000, max: 189999, label: '$180k - $190k' },
  'B_190K': { min: 190000, max: 199999, label: '$190k - $200k' },
  'B_200K': { min: 200000, max: 224999, label: '$200k - $225k' },
  'B_225K': { min: 225000, max: 249999, label: '$225k - $250k' },
  'B_250K': { min: 250000, max: 299999, label: '$250k - $300k' },
  'B_300K': { min: 300000, max: 349999, label: '$300k - $350k' },
  'B_350K': { min: 350000, max: 399999, label: '$350k - $400k' },
  'B_400K_PLUS': { min: 400000, max: Infinity, label: '$400k+' },
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
  if (maxPrice >= PRODUCTS.townhouses.range[0] && annualIncome >= BAND_RANGES['B_200K'].min) {
    affordableProducts.push('townhouses');
  }

  return {
    maxPrice,
    affordableProducts,
    monthlyBudget,
  };
}

// Helper to get band for a given income
export function getIncomeBand(income: number): IncomeBand {
  for (const band of INCOME_BANDS) {
    const range = BAND_RANGES[band];
    if (income >= range.min && income <= range.max) {
      return band;
    }
  }
  return 'B_400K_PLUS';
}

// Helper to get mid-point of a band
export function getBandMidpoint(band: IncomeBand): number {
  const range = BAND_RANGES[band];
  if (range.max === Infinity) return range.min;
  return (range.min + range.max) / 2;
}

// Helper to apply growth rate
export function applyIncomeGrowth(income: number, years: number): number {
  return income * Math.pow(1 + CONSTANTS.INCOME_GROWTH_RATE, years);
}

// ============================================
// BAND-BASED AFFORDABILITY
// ============================================

/**
 * Build affordability lookup table for all income bands at given rates
 */
export function buildAffordabilityLookup(
  rateScenarios: number[] = [CONSTANTS.FHA_RATE, CONSTANTS.CONV_RATE, 0.055, 0.045]
): Record<string, BandAffordability> {
  const lookup: Record<string, BandAffordability> = {};
  const bands: readonly IncomeBand[] = INCOME_BANDS; // Use the new INCOME_BANDS

  for (const band of bands) {
    for (const rate of rateScenarios) {
      const income = getBandMidpoint(band); // Use the new getBandMidpoint
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
  const bandCounts: Record<string, number> = {};
  for (const band of INCOME_BANDS) {
    bandCounts[band] = 0;
  }

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
    const h1Band = getIncomeBand(h1Income);
    bandCounts[h1Band] = (bandCounts[h1Band] || 0) + (scaledCount * H1_single);

    // H2 - Dual moderate
    const h2Income = projectedIncome * HOUSEHOLD_MULTIPLIERS.H2_dual_moderate;
    const h2Band = getIncomeBand(h2Income);
    bandCounts[h2Band] = (bandCounts[h2Band] || 0) + (scaledCount * H2_dual_moderate);

    // H3 - Dual peer
    const h3Income = projectedIncome * HOUSEHOLD_MULTIPLIERS.H3_dual_peer;
    const h3Band = getIncomeBand(h3Income);
    bandCounts[h3Band] = (bandCounts[h3Band] || 0) + (scaledCount * H3_dual_peer);
  }

  return bandCounts as Record<IncomeBand, number>;
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

  for (const band of INCOME_BANDS) {
    const count = householdBandCounts[band] || 0;
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
