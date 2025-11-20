'use client';

/**
 * Company Details Page
 * Deep dive into a specific company's workforce and affordability
 */

import { useAffordability } from '@/context/AffordabilityContext';
import { getCompanyBySlug } from '@/lib/companies';
import { computeHouseholdBandCounts, summarizeDemandByProduct } from '@/lib/model';
import { notFound, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import RoleStrip from '@/components/visuals/RoleStrip';
import { ArrowLeft, Users, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function CompanyPage() {
    const params = useParams();
    const slug = params.slug as string;
    const company = getCompanyBySlug(slug);
    const { rate, year, scenario, affordabilityLookup } = useAffordability();

    if (!company) {
        return notFound();
    }

    // Compute demand for this company
    const bandCounts = computeHouseholdBandCounts(company, year, scenario);
    const demand = summarizeDemandByProduct(bandCounts, affordabilityLookup, rate);

    return (
        <div className="space-y-8 pb-32">
            {/* Header */}
            <div>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-space-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Back to Ecosystem
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end justify-between"
                >
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{company.name}</h1>
                        <div className="flex items-center gap-6 text-space-300">
                            <div className="flex items-center gap-2">
                                <Users size={18} />
                                <span>{company.employee_count.toLocaleString()} Employees</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 size={18} />
                                <span>{company.roles.length} Role Segments</span>
                            </div>
                        </div>
                    </div>

                    {/* Mini Dashboard for Company */}
                    <div className="flex gap-4">
                        {demand.map((item) => (
                            <div key={item.productType} className="text-right">
                                <div className={`text-2xl font-mono font-bold text-product-${item.productType}`}>
                                    {item.householdCount}
                                </div>
                                <div className="text-xs text-space-500 uppercase tracking-wider">{item.productType}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Workforce DNA Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-semibold text-white">Workforce DNA</h2>
                    <div className="text-xs text-space-500 font-mono">
                        SCENARIO: {scenario === 'base' ? 'BASE SALARY' : 'FULL OTE'}
                    </div>
                </div>

                <div className="grid gap-3">
                    {company.roles.map((role, i) => (
                        <motion.div
                            key={role.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <RoleStrip role={role} rate={rate} scenario={scenario} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
