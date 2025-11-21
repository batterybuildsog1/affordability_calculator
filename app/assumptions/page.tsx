'use client';

import { CONSTANTS, PRODUCTS, HOUSEHOLD_MULTIPLIERS } from '@/lib/model';
import { TAX_CONSTANTS } from '@/lib/demographics';

export default function AssumptionsPage() {
    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold text-white">Global Assumptions</h1>
                <p className="text-space-400 mt-2">
                    Key financial parameters and constants driving the affordability model.
                </p>
            </div>

            {/* Financial Constants */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Financial Parameters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card label="FHA Interest Rate" value={`${(CONSTANTS.FHA_RATE * 100).toFixed(2)}%`} />
                    <Card label="Conventional Rate" value={`${(CONSTANTS.CONV_RATE * 100).toFixed(2)}%`} />
                    <Card label="DTI Limit" value={`${(CONSTANTS.DTI_LIMIT * 100).toFixed(0)}%`} />
                    <Card label="Rent Affordability" value={`${(CONSTANTS.RENT_AFFORDABILITY * 100).toFixed(0)}% of Gross`} />
                    <Card label="Income Growth Rate" value={`${(CONSTANTS.INCOME_GROWTH_RATE * 100).toFixed(1)}% / yr`} />
                    <Card label="FHA Limit" value={`$${CONSTANTS.FHA_LIMIT.toLocaleString()}`} />
                    <Card label="Tax/Ins/HOA Rate" value={`${(CONSTANTS.TAX_INS_HOA_RATE * 100).toFixed(1)}% / yr`} />
                </div>
            </section>

            {/* Tax Constants */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Tax Assumptions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card label="Utah State Tax" value={`${(TAX_CONSTANTS.UTAH_FLAT_RATE * 100).toFixed(2)}%`} />
                    <Card label="FICA Tax" value={`${(TAX_CONSTANTS.FICA_RATE * 100).toFixed(2)}%`} />
                    <Card label="Child Tax Credit" value={`$${TAX_CONSTANTS.CHILD_TAX_CREDIT.toLocaleString()} / child`} />
                </div>
            </section>

            {/* Product Ranges */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Housing Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PRODUCTS).map(([key, config]) => (
                        <div key={key} className="glass p-6 rounded-xl border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <div className="capitalize text-lg font-medium text-white">{key}</div>
                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${config.type === 'rent' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {config.type}
                                </div>
                            </div>
                            <div className="text-space-400 font-mono">
                                ${config.range[0].toLocaleString()} - ${config.range[1].toLocaleString()}
                                {config.type === 'rent' ? '/mo' : ''}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Household Multipliers */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Household Multipliers</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(HOUSEHOLD_MULTIPLIERS).map(([key, value]) => (
                        <Card key={key} label={key.replace(/_/g, ' ')} value={`${value}x Base Income`} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function Card({ label, value }: { label: string, value: string }) {
    return (
        <div className="glass p-6 rounded-xl border border-white/5">
            <div className="text-xs text-space-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    );
}
