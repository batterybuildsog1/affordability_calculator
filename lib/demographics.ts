import { CONSTANTS } from './model';

export type FilingStatus = 'single' | 'married_joint';

export interface Persona {
    id: string;
    name: string;
    description: string;
    filingStatus: FilingStatus;
    children: number;
    cars: number;
    isDualIncome: boolean;
    studentLoans: boolean;
    lifestyleTier: 'frugal' | 'standard' | 'high_spender';
}

export interface FinancialProfile {
    grossIncome: number;
    retirementContribution: number; // Annual 401k/IRA contribution
    monthlyDebts: {
        carPayment: number;
        studentLoans: number;
        creditCards: number;
        childCare: number;
    };
    assets: {
        savings: number; // For down payment
    };
}

export const TAX_CONSTANTS = {
    UTAH_FLAT_RATE: 0.0455, // Updated to 4.55% (2024)
    FICA_RATE: 0.0765,
    CHILD_TAX_CREDIT: 2000,
    STANDARD_DEDUCTION: {
        single: 14600, // 2024 estimate
        married_joint: 29200, // 2024 estimate
    },
    // Simplified 2024 Federal Brackets (Taxable Income)
    FED_BRACKETS: {
        single: [
            { limit: 11600, rate: 0.10 },
            { limit: 47150, rate: 0.12 },
            { limit: 100525, rate: 0.22 },
            { limit: 191950, rate: 0.24 },
            { limit: 243725, rate: 0.32 },
            { limit: 609350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 },
        ],
        married_joint: [
            { limit: 23200, rate: 0.10 },
            { limit: 94300, rate: 0.12 },
            { limit: 201050, rate: 0.22 },
            { limit: 383900, rate: 0.24 },
            { limit: 487450, rate: 0.32 },
            { limit: 731200, rate: 0.35 },
            { limit: Infinity, rate: 0.37 },
        ],
    },
};

export function calculateTaxes(grossIncome: number, filingStatus: FilingStatus, children: number, retirementContribution: number) {
    // 1. Adjusted Gross Income (AGI) - simplified
    const agi = grossIncome - retirementContribution;

    // 2. Taxable Income
    const deduction = TAX_CONSTANTS.STANDARD_DEDUCTION[filingStatus];
    const taxableIncome = Math.max(0, agi - deduction);

    // 3. Federal Tax Calculation
    let fedTax = 0;
    let previousLimit = 0;
    const brackets = TAX_CONSTANTS.FED_BRACKETS[filingStatus];

    for (const bracket of brackets) {
        if (taxableIncome > previousLimit) {
            const taxableAmount = Math.min(taxableIncome, bracket.limit) - previousLimit;
            fedTax += taxableAmount * bracket.rate;
            previousLimit = bracket.limit;
        } else {
            break;
        }
    }

    // Apply Child Tax Credit
    fedTax = Math.max(0, fedTax - (children * TAX_CONSTANTS.CHILD_TAX_CREDIT));

    // 4. State Tax (Utah Flat)
    const stateTax = taxableIncome * TAX_CONSTANTS.UTAH_FLAT_RATE;

    // 5. FICA (Social Security + Medicare) - applied to Gross
    const ficaTax = grossIncome * TAX_CONSTANTS.FICA_RATE;

    return {
        federal: fedTax,
        state: stateTax,
        fica: ficaTax,
        total: fedTax + stateTax + ficaTax,
    };
}

export function calculateDiscretionaryIncome(
    profile: FinancialProfile,
    filingStatus: FilingStatus,
    children: number
) {
    const taxes = calculateTaxes(profile.grossIncome, filingStatus, children, profile.retirementContribution);
    const netAnnual = profile.grossIncome - profile.retirementContribution - taxes.total;
    const netMonthly = netAnnual / 12;

    const totalMonthlyDebt =
        profile.monthlyDebts.carPayment +
        profile.monthlyDebts.studentLoans +
        profile.monthlyDebts.creditCards +
        profile.monthlyDebts.childCare;

    const discretionaryMonthly = netMonthly - totalMonthlyDebt;

    return {
        netMonthly,
        totalMonthlyDebt,
        discretionaryMonthly,
        taxes
    };
}

export function calculateRealBuyingPower(
    discretionaryMonthly: number,
    grossIncome: number,
    bankDebts: number, // Debts that count against DTI (Car, Student Loans, CC)
    lifestyleExpenses: number, // Expenses that affect budget but NOT DTI (Childcare)
    interestRate: number,
    downPayment: number
) {
    // 1. Bank Qualification (The Hard Limit)
    // Banks typically allow up to 43-50% DTI (Debt-to-Income)
    // Housing Payment + Bank Debts <= Gross Monthly * DTI_LIMIT
    // CRITICAL: Childcare is NOT a bank debt for DTI purposes
    const monthlyGross = grossIncome / 12;
    const dtiLimit = CONSTANTS.DTI_LIMIT;

    // Max housing payment allowed by bank (PITI + HOA)
    const maxHousingPayment = Math.max(0, (monthlyGross * dtiLimit) - bankDebts);

    // Calculate Max Price based on this payment
    const monthlyRate = interestRate / 12;
    const numMonths = 360; // 30-year fixed

    // Mortgage Factor: P = L * [c(1+c)^n] / [(1+c)^n - 1]
    const mortgageFactor =
        (monthlyRate * Math.pow(1 + monthlyRate, numMonths)) /
        (Math.pow(1 + monthlyRate, numMonths) - 1);

    // Estimated Tax/Ins/HOA monthly rate (as a % of price)
    const taxRateMonthly = CONSTANTS.TAX_INS_HOA_RATE / 12;

    // Solve for Price:
    // Payment = (Price - Down) * Factor + (Price * TaxRate)
    // Payment + Down * Factor = Price * (Factor + TaxRate)
    // Price = (Payment + Down * Factor) / (Factor + TaxRate)
    const maxPrice = (maxHousingPayment + (downPayment * mortgageFactor)) / (mortgageFactor + taxRateMonthly);

    // 2. Lifestyle Reality (The Soft Limit)
    // If they bought at maxPrice, what is left?
    // Surplus = Discretionary (Net - Debts) - Housing Cost
    // Note: Discretionary already includes deduction of ALL debts (bank + lifestyle)
    const projectedHousingCost = maxHousingPayment;
    const monthlySurplus = discretionaryMonthly - projectedHousingCost;

    let lifestyleHealth: 'Healthy' | 'Stretch' | 'Dangerous' = 'Healthy';
    if (monthlySurplus < 0) lifestyleHealth = 'Dangerous';
    else if (monthlySurplus < 500) lifestyleHealth = 'Stretch';

    return {
        maxPrice: Math.floor(maxPrice),
        maxMonthlyPayment: maxHousingPayment,
        monthlySurplus,
        lifestyleHealth
    };
}

export const PERSONA_PRESETS: Record<string, Persona> = {
    'solo_climber': {
        id: 'solo_climber',
        name: 'The Solo Climber',
        description: 'Single, early career, renting. High potential but limited by single income.',
        filingStatus: 'single',
        children: 0,
        cars: 1,
        isDualIncome: false,
        studentLoans: true,
        lifestyleTier: 'standard'
    },
    'dink': {
        id: 'dink',
        name: 'The Power Couple (DINK)',
        description: 'Dual Income, No Kids. High borrowing power, high lifestyle spend (Tesla/Truck).',
        filingStatus: 'married_joint',
        children: 0,
        cars: 2,
        isDualIncome: true,
        studentLoans: true,
        lifestyleTier: 'high_spender'
    },
    'working_parents': {
        id: 'working_parents',
        name: 'Working Parents (Young Kids)',
        description: 'Married, 2 kids (<5yo). High income but crushed by Child Care costs.',
        filingStatus: 'married_joint',
        children: 2,
        cars: 2,
        isDualIncome: true,
        studentLoans: true,
        lifestyleTier: 'standard'
    },
    'school_age_family': {
        id: 'school_age_family',
        name: 'Established Family (School Age)',
        description: 'Married, 3 kids (School Age). No child care costs, higher discretionary income.',
        filingStatus: 'married_joint',
        children: 3,
        cars: 2,
        isDualIncome: true,
        studentLoans: false, // Assume paid off or lower
        lifestyleTier: 'high_spender'
    },
    'single_income_family': {
        id: 'single_income_family',
        name: 'Single Income Family',
        description: 'Married, 3 kids, one earner. Low tax liability but tighter monthly budget.',
        filingStatus: 'married_joint',
        children: 3,
        cars: 1,
        isDualIncome: false,
        studentLoans: false,
        lifestyleTier: 'frugal'
    }
};
