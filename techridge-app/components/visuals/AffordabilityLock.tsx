'use client';

/**
 * AffordabilityLock - Visual indicator of purchasing power
 * Shows an open/closed lock with a specific product color.
 */

import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import { ProductType } from '@/lib/model';

interface AffordabilityLockProps {
    isAffordable: boolean;
    productType: ProductType;
    label: string;
}

const PRODUCT_COLORS: Record<ProductType, string> = {
    apartments: 'text-product-apt',
    condos: 'text-product-condo',
    blackridge: 'text-product-blackridge',
    townhouses: 'text-product-townhouse',
};

export default function AffordabilityLock({ isAffordable, productType, label }: AffordabilityLockProps) {
    return (
        <div className="flex flex-col items-center gap-2">
            <motion.div
                initial={false}
                animate={{
                    scale: isAffordable ? 1.1 : 0.9,
                    opacity: isAffordable ? 1 : 0.3,
                    filter: isAffordable ? 'grayscale(0%)' : 'grayscale(100%)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`p-2 rounded-full bg-space-900/50 border border-white/5 ${PRODUCT_COLORS[productType]}`}
            >
                {isAffordable ? <Unlock size={18} /> : <Lock size={18} />}
            </motion.div>
            <span
                className={`text-[10px] font-mono uppercase tracking-wider font-medium ${isAffordable ? 'text-white' : 'text-space-600'
                    }`}
            >
                {label}
            </span>
        </div>
    );
}
