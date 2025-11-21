'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Car, GraduationCap, CreditCard, Baby,
    DollarSign, Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import {
    PERSONA_PRESETS,
    calculateDiscretionaryIncome,
    calculateRealBuyingPower,
    estimateLivingExpenses,
    Persona,
    FinancialProfile
} from '@/lib/demographics';
import { PRODUCTS, Company, Role } from '@/lib/model';
import { getAllCompanies } from '@/lib/companies';
import { Building2, Briefcase } from 'lucide-react';

// --- Types ---
type PersonaId = keyof typeof PERSONA_PRESETS;

// --- Components ---

const PersonaCard = ({
    persona,
    isSelected,
    onClick
}: {
    persona: Persona;
    isSelected: boolean;
    onClick: () => void;
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
        flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 w-full text-center h-24
        ${isSelected
                    ? 'bg-white/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'}
      `}
        >
            <div className={`mb-2 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>
                <Users size={20} />
            </div>
            <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {persona.name}
            </span>
        </motion.button>
    );
};

const MoneyInput = ({
    label,
    value,
    onChange,
    icon: Icon
}: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    icon: any
}) => (
    <div className="group relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-blue-500 transition-colors pointer-events-none">
            <Icon size={14} />
        </div>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full bg-black/20 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all text-right font-mono"
        />
        <label className="absolute -top-2 left-2 bg-[#0a0a0a] px-1 text-[10px] text-gray-500 group-hover:text-blue-400 transition-colors">
            {label}
        </label>
    </div>
);

export default function DemographicInvestigator() {
    const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId>('solo_climber');
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [incomeMode, setIncomeMode] = useState<'base' | 'ote'>('base');

    const companies = useMemo(() => getAllCompanies(), []);
    const currentCompany = useMemo(() => companies.find(c => c.name === selectedCompany), [companies, selectedCompany]);
    const currentRole = useMemo(() => currentCompany?.roles.find(r => r.title === selectedRole), [currentCompany, selectedRole]);

    const [profile, setProfile] = useState<FinancialProfile>({
        grossIncome: 85000,
        retirementContribution: 5000,
        monthlyDebts: {
            carPayment: 450,
            studentLoans: 300,
            creditCards: 100,
            childCare: 0
        },
        assets: { savings: 20000 }
    });

    // Update income when Company/Role changes
    useEffect(() => {
        if (currentRole) {
            const income = incomeMode === 'base' ? currentRole.base_salary : currentRole.ote;
            setProfile(prev => ({ ...prev, grossIncome: income }));
        }
    }, [currentRole, incomeMode]);

    // Reset profile when persona changes (but keep company/role if selected, or maybe reset them? Let's keep them independent for now, but persona sets defaults)
    useEffect(() => {
        const persona = PERSONA_PRESETS[selectedPersonaId];
        // If a role is selected, keep the income from the role, otherwise use persona default
        const defaultIncome = currentRole
            ? (incomeMode === 'base' ? currentRole.base_salary : currentRole.ote)
            : (selectedPersonaId === 'dink' ? 180000 : selectedPersonaId === 'working_parents' ? 140000 : 85000); // Fallbacks if needed

        let newProfile: FinancialProfile = { ...profile };

        switch (selectedPersonaId) {
            case 'solo_climber':
                newProfile = {
                    grossIncome: currentRole ? newProfile.grossIncome : 85000,
                    retirementContribution: 4000,
                    monthlyDebts: { carPayment: 400, studentLoans: 350, creditCards: 150, childCare: 0 },
                    assets: { savings: 15000 }
                };
                break;
            case 'dink':
                newProfile = {
                    grossIncome: currentRole ? newProfile.grossIncome : 180000,
                    retirementContribution: 15000,
                    monthlyDebts: { carPayment: 1200, studentLoans: 800, creditCards: 500, childCare: 0 },
                    assets: { savings: 60000 }
                };
                break;
            case 'working_parents':
                newProfile = {
                    grossIncome: currentRole ? newProfile.grossIncome : 140000,
                    retirementContribution: 8000,
                    monthlyDebts: { carPayment: 600, studentLoans: 400, creditCards: 200, childCare: 2500 },
                    assets: { savings: 30000 }
                };
                break;
            case 'school_age_family':
                newProfile = {
                    grossIncome: currentRole ? newProfile.grossIncome : 160000,
                    retirementContribution: 12000,
                    monthlyDebts: { carPayment: 800, studentLoans: 0, creditCards: 300, childCare: 0 },
                    assets: { savings: 80000 }
                };
                break;
            case 'single_income_family':
                newProfile = {
                    grossIncome: currentRole ? newProfile.grossIncome : 95000,
                    retirementContribution: 5000,
                    monthlyDebts: { carPayment: 350, studentLoans: 0, creditCards: 100, childCare: 0 },
                    assets: { savings: 25000 }
                };
                break;
        }
        setProfile(newProfile);
    }, [selectedPersonaId]);

    const persona = PERSONA_PRESETS[selectedPersonaId];

    // Calculations
    const discretionary = useMemo(() =>
        calculateDiscretionaryIncome(profile, persona.filingStatus, persona.children),
        [profile, persona]
    );

    const livingExpenses = useMemo(() => estimateLivingExpenses(persona), [persona]);

    const buyingPower = useMemo(() => {
        const bankDebts =
            profile.monthlyDebts.carPayment +
            profile.monthlyDebts.studentLoans +
            profile.monthlyDebts.creditCards;

        profile.monthlyDebts.creditCards;

        const lifestyleExpenses = profile.monthlyDebts.childCare + livingExpenses.total;

        return calculateRealBuyingPower(
            discretionary.discretionaryMonthly,
            profile.grossIncome,
            bankDebts,
            lifestyleExpenses,
            0.0615, // Rate
            profile.assets.savings
        );
    }, [discretionary, profile]);

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Demographic Investigator</h2>
                    <p className="text-gray-400 text-sm mt-1">Modeling the gap between bank qualification and lifestyle reality.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Controls (Minimalist) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Persona Selector Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {Object.values(PERSONA_PRESETS).map(p => (
                            <PersonaCard
                                key={p.id}
                                persona={p}
                                isSelected={selectedPersonaId === p.id}
                                onClick={() => setSelectedPersonaId(p.id as PersonaId)}
                            />
                        ))}
                    </div>



                    {/* Company & Role Selector */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Context</h3>
                            <Building2 size={14} className="text-gray-600" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Company</label>
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => {
                                        setSelectedCompany(e.target.value);
                                        setSelectedRole(''); // Reset role when company changes
                                    }}
                                    className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Select Company...</option>
                                    {companies.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedCompany && (
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="">Select Role...</option>
                                        {currentCompany?.roles.map(r => (
                                            <option key={r.title} value={r.title}>{r.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedRole && (
                                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                                    <button
                                        onClick={() => setIncomeMode('base')}
                                        className={`flex-1 py-1 text-xs font-medium rounded ${incomeMode === 'base' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Base Salary
                                    </button>
                                    <button
                                        onClick={() => setIncomeMode('ote')}
                                        className={`flex-1 py-1 text-xs font-medium rounded ${incomeMode === 'ote' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        OTE
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financial Controls */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Financial Inputs</h3>
                            <RefreshCw size={14} className="text-gray-600" />
                        </div>

                        <div className="space-y-5">
                            <MoneyInput
                                label="Annual Gross Income"
                                value={profile.grossIncome}
                                onChange={(v) => setProfile({ ...profile, grossIncome: v })}
                                icon={DollarSign}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <MoneyInput
                                    label="Car Payments"
                                    value={profile.monthlyDebts.carPayment}
                                    onChange={(v) => setProfile({ ...profile, monthlyDebts: { ...profile.monthlyDebts, carPayment: v } })}
                                    icon={Car}
                                />
                                <MoneyInput
                                    label="Student Loans"
                                    value={profile.monthlyDebts.studentLoans}
                                    onChange={(v) => setProfile({ ...profile, monthlyDebts: { ...profile.monthlyDebts, studentLoans: v } })}
                                    icon={GraduationCap}
                                />
                                <MoneyInput
                                    label="Credit Cards"
                                    value={profile.monthlyDebts.creditCards}
                                    onChange={(v) => setProfile({ ...profile, monthlyDebts: { ...profile.monthlyDebts, creditCards: v } })}
                                    icon={CreditCard}
                                />
                                <MoneyInput
                                    label="Child Care"
                                    value={profile.monthlyDebts.childCare}
                                    onChange={(v) => setProfile({ ...profile, monthlyDebts: { ...profile.monthlyDebts, childCare: v } })}
                                    icon={Baby}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Narrative Context */}
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                        <div className="flex gap-3">
                            <Info className="text-blue-400 shrink-0" size={20} />
                            <p className="text-sm text-blue-200/80 leading-relaxed">
                                {persona.description} This profile assumes <span className="text-white font-medium">{persona.filingStatus === 'married_joint' ? 'Married Filing Jointly' : 'Single Filing'}</span> with <span className="text-white font-medium">{persona.children} children</span>.
                            </p>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: The Reality */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Hero Metric: Bank Qualification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Bank View */}
                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign size={120} />
                            </div>

                            <h3 className="text-sm font-medium text-gray-400 mb-1">Bank Qualified Price</h3>
                            <div className="text-5xl font-bold text-white tracking-tight mb-2">
                                ${buyingPower.maxPrice.toLocaleString()}
                            </div>
                            <p className="text-sm text-gray-400">
                                Based on Gross Income & DTI Limit
                            </p>

                            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Max Monthly Pmt</div>
                                    <div className="text-xl font-mono text-white">${Math.round(buyingPower.maxMonthlyPayment).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Gross Monthly</div>
                                    <div className="text-xl font-mono text-gray-300">${Math.round(profile.grossIncome / 12).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Lifestyle Reality */}
                        <div className={`rounded-2xl p-8 border relative overflow-hidden transition-colors duration-500 ${buyingPower.lifestyleHealth === 'Healthy' ? 'bg-emerald-900/20 border-emerald-500/30' :
                            buyingPower.lifestyleHealth === 'Stretch' ? 'bg-yellow-900/20 border-yellow-500/30' :
                                'bg-rose-900/20 border-rose-500/30'
                            }`}>
                            <h3 className="text-sm font-medium text-gray-400 mb-1">Lifestyle Reality</h3>

                            <div className="flex items-baseline gap-2 mb-2">
                                <div className={`text-5xl font-bold tracking-tight ${buyingPower.lifestyleHealth === 'Healthy' ? 'text-emerald-400' :
                                    buyingPower.lifestyleHealth === 'Stretch' ? 'text-yellow-400' :
                                        'text-rose-400'
                                    }`}>
                                    {buyingPower.monthlySurplus > 0 ? '+' : ''}${Math.round(buyingPower.monthlySurplus).toLocaleString()}
                                </div>
                                <span className="text-lg text-gray-500">/mo</span>
                            </div>

                            <p className={`text-sm font-medium flex items-center gap-2 ${buyingPower.lifestyleHealth === 'Healthy' ? 'text-emerald-300' :
                                buyingPower.lifestyleHealth === 'Stretch' ? 'text-yellow-300' :
                                    'text-rose-300'
                                }`}>
                                {buyingPower.lifestyleHealth === 'Healthy' && <CheckCircle size={16} />}
                                {buyingPower.lifestyleHealth === 'Stretch' && <AlertTriangle size={16} />}
                                {buyingPower.lifestyleHealth === 'Dangerous' && <AlertTriangle size={16} />}
                                {buyingPower.lifestyleHealth} Cash Flow
                            </p>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {buyingPower.lifestyleHealth === 'Healthy'
                                        ? "You have a healthy surplus after housing and debts."
                                        : buyingPower.lifestyleHealth === 'Stretch'
                                            ? "Budget is tight. Little room for savings or emergencies."
                                            : "WARNING: You would be house poor. Expenses exceed income."}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* The Stack (Simplified) */}
                    <div className="bg-black/40 rounded-xl p-6 border border-white/10 backdrop-blur-md">
                        <h3 className="text-sm font-semibold text-gray-400 mb-6">Where the money goes</h3>

                        {/* Horizontal Stack Bar */}
                        <div className="h-16 w-full bg-white/5 rounded-lg relative overflow-hidden flex">

                            {/* Taxes */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(discretionary.taxes.total / 12 / (profile.grossIncome / 12)) * 100}%` }}
                                className="h-full bg-orange-500/80 relative group border-r border-black/20"
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                    <span className="text-xs font-bold text-white">Taxes</span>
                                </div>
                            </motion.div>

                            {/* Debts */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(discretionary.totalMonthlyDebt / (profile.grossIncome / 12)) * 100}%` }}
                                className="h-full bg-rose-500/80 relative group border-r border-black/20"
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                    <span className="text-xs font-bold text-white">Debt</span>
                                </div>
                            </motion.div>

                            {/* Housing (Projected) */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(buyingPower.maxMonthlyPayment / (profile.grossIncome / 12)) * 100}%` }}
                                className="h-full bg-blue-500/80 relative group border-r border-black/20"
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                    <span className="text-xs font-bold text-white">Housing</span>
                                </div>
                            </motion.div>

                            {/* Surplus/Deficit */}
                            <div className="flex-1 bg-emerald-500/20 relative flex items-center justify-center">
                                <span className="text-xs font-medium text-emerald-400/50">Life</span>
                            </div>

                        </div>

                        <div className="flex justify-between text-xs text-gray-500 mt-3 px-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100% of Gross Income</span>
                        </div>
                    </div>

                    {/* Living Expenses Breakdown */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Estimated Living Costs</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Groceries</span>
                                <span className="text-white font-mono">${livingExpenses.groceries}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Utilities</span>
                                <span className="text-white font-mono">${livingExpenses.utilities}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Gas/Ins</span>
                                <span className="text-white font-mono">${livingExpenses.transportation}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Misc/Phone</span>
                                <span className="text-white font-mono">${livingExpenses.misc}</span>
                            </div>
                            <div className="col-span-2 border-t border-white/10 pt-2 mt-2 flex justify-between font-medium">
                                <span className="text-gray-300">Total Estimated</span>
                                <span className="text-white font-mono">${livingExpenses.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Affordability Locks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Apartments */}
                        <div className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${buyingPower.maxMonthlyPayment >= PRODUCTS.apartments.range[0]
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                            }`}>
                            {buyingPower.maxMonthlyPayment >= PRODUCTS.apartments.range[0] ? <Unlock size={20} className="text-emerald-400" /> : <Lock size={20} className="text-rose-400" />}
                            <span className="text-sm font-medium text-gray-300">Apartments</span>
                        </div>

                        {/* Condos */}
                        <div className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${buyingPower.maxPrice >= PRODUCTS.condos.range[0]
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                            }`}>
                            {buyingPower.maxPrice >= PRODUCTS.condos.range[0] ? <Unlock size={20} className="text-emerald-400" /> : <Lock size={20} className="text-rose-400" />}
                            <span className="text-sm font-medium text-gray-300">Condos</span>
                        </div>

                        {/* Black Ridge */}
                        <div className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${buyingPower.maxPrice >= PRODUCTS.blackridge.range[0]
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                            }`}>
                            {buyingPower.maxPrice >= PRODUCTS.blackridge.range[0] ? <Unlock size={20} className="text-emerald-400" /> : <Lock size={20} className="text-rose-400" />}
                            <span className="text-sm font-medium text-gray-300">Black Ridge</span>
                        </div>

                        {/* Townhouses */}
                        <div className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${buyingPower.maxPrice >= PRODUCTS.townhouses.range[0]
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                            }`}>
                            {buyingPower.maxPrice >= PRODUCTS.townhouses.range[0] ? <Unlock size={20} className="text-emerald-400" /> : <Lock size={20} className="text-rose-400" />}
                            <span className="text-sm font-medium text-gray-300">Townhouses</span>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
}
