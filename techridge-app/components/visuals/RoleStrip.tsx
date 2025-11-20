'use client';

/**
 * RoleStrip - A "Server Blade" style visualization of a workforce segment
 * Shows income, headcount, and real-time affordability status.
 */

import { motion } from 'framer-motion';
import { Role, calculateMaxPurchasePrice, CONSTANTS, PRODUCTS } from '@/lib/model';
import AffordabilityLock from './AffordabilityLock';
import { Users, DollarSign } from 'lucide-react';

interface RoleStripProps {
    role: Role;
    rate: number;
    scenario: 'base' | 'full';
}

export default function RoleStrip({ role, rate, scenario }: RoleStripProps) {
    // 1. Determine Income
    const income = scenario === 'base' ? role.base_salary : role.ote;

    // 2. Calculate Max Purchase Price
    // We use the standard FHA down payment for the calculation baseline
    const maxPrice = calculateMaxPurchasePrice(income, rate, CONSTANTS.FHA_DOWN_PAYMENT);

    // 3. Define Products to check
    const products = [
        { type: 'apartments', label: 'Apt', price: 0 }, // Rent check is different, but for lock visual we can use income
        { type: 'condos', label: 'Condo', price: PRODUCTS.condos.range[0] },
        { type: 'blackridge', label: 'Blackridge', price: PRODUCTS.blackridge.range[0] },
        { type: 'townhouses', label: 'Townhouse', price: PRODUCTS.townhouses.range[0] },
    ] as const;

    // Helper for rent check
    const monthlyIncome = income / 12;
    const maxRent = monthlyIncome * CONSTANTS.RENT_AFFORDABILITY;
    const canAffordRent = maxRent >= PRODUCTS.apartments.range[0];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-space-900/40 border border-white/5 rounded-xl p-4 hover:bg-space-800/40 transition-colors overflow-hidden"
        >
            <div className="relative z-10 flex items-center justify-between gap-4">

                {/* Left: Role Info */}
                <div className="min-w-[200px]">
                    <h3 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {role.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-mono mt-1.5 text-space-400">
                        <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span>{role.count}</span>
                        </div>
                        <span className="text-space-600">|</span>
                        <div className="flex items-center gap-1 text-space-300">
                            <DollarSign size={12} />
                            <span>{(income / 1000).toFixed(0)}k</span>
                        </div>
                    </div>
                </div>

                {/* Right: The Locks */}
                <div className="flex items-center gap-6">
                    {products.map((prod) => {
                        let isAffordable = false;
                        if (prod.type === 'apartments') {
                            isAffordable = canAffordRent;
                        } else {
                            isAffordable = maxPrice >= prod.price;
                        }

                        return (
                            <AffordabilityLock
                                key={prod.type}
                                productType={prod.type}
                                label={prod.label}
                                isAffordable={isAffordable}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 h-1 bg-space-800 w-full" />

            {/* Active Progress Bar */}
            {/* We scale this based on maxPrice relative to Townhouse max (approx 2.1M) or a reasonable cap */}
            <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-product-apt via-product-condo to-product-blackridge"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((maxPrice / 1500000) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            />
        </motion.div>
    );
}
