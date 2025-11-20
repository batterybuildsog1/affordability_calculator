'use client';

/**
 * SankeyDiagram - Visualizes the flow of demand
 * Companies -> Roles -> Housing Products
 */

import { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { Company, IncomeScenario, computeHouseholdBandCounts, buildAffordabilityLookup, CONSTANTS, ProductType, INCOME_BANDS, calculateAffordability, applyIncomeGrowth, HOUSEHOLD_MULTIPLIERS } from '@/lib/model';
import { useAffordability } from '@/context/AffordabilityContext';

interface SankeyDiagramProps {
    companies: Company[];
}

// Custom node for the Sankey to match the dark theme
const CustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const isOut = x + width + 6 > containerWidth;

    return (
        <Layer key={`node-${index}`}>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={payload.color || '#8884d8'}
                fillOpacity={0.9}
            />
            <text
                x={x < containerWidth / 2 ? x + width + 6 : x - 6}
                y={y + height / 2}
                textAnchor={x < containerWidth / 2 ? "start" : "end"}
                alignmentBaseline="middle"
                fontSize={12}
                fill="#fff"
                fontWeight="bold"
                style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
                {payload.name}
            </text>
        </Layer>
    );
};

export default function SankeyDiagram({ companies }: SankeyDiagramProps) {
    const { rate, year, scenario } = useAffordability();

    const data = useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];

        // 1. Define Company Colors
        const companyColors = [
            '#3b82f6', // Blue
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#6366f1', // Indigo
            '#84cc16', // Lime
            '#d946ef', // Fuchsia
        ];

        // 2. Create Nodes
        // Structure: [Companies...] -> [Roles...] -> [Products...]

        let nodeIndex = 0;
        const companyIndices: Record<string, number> = {};
        const roleIndices: Record<string, number> = {}; // Key: "Company_Role"
        const productIndices: Record<string, number> = {};

        // Add Company Nodes
        companies.forEach((c, i) => {
            nodes.push({ name: c.name, color: companyColors[i % companyColors.length] });
            companyIndices[c.name] = nodeIndex++;
        });

        // Add Role Nodes (Grouped by Company visually, but we need unique nodes per company-role combo)
        // Actually, to avoid too many nodes, maybe we just do Company -> Outcome directly?
        // User asked for: "shows the purchasing power for the demographic groups of each company... Color code the company... so that employees from that company are categorized together"
        // And "Label the outcome... explicitly"
        // If we do Company -> Role -> Outcome, it might be very tall.
        // But "demographic groups" implies Roles.
        // Let's try Company -> Role -> Outcome.

        companies.forEach((c, i) => {
            const color = companyColors[i % companyColors.length];
            c.roles.forEach(r => {
                const key = `${c.name}_${r.title}`;
                // Use a slightly lighter/darker shade or same color
                nodes.push({ name: r.title, color: color });
                roleIndices[key] = nodeIndex++;
            });
        });

        // Add Product Nodes
        const products: { type: ProductType | 'gap'; color: string; label: string }[] = [
            { type: 'apartments', color: '#06b6d4', label: 'Apartment' },
            { type: 'condos', color: '#8b5cf6', label: 'Condo' },
            { type: 'blackridge', color: '#f59e0b', label: 'Black Ridge Cove' },
            { type: 'townhouses', color: '#10b981', label: 'Townhouse' },
            { type: 'gap', color: '#ef4444', label: 'Gap' }
        ];

        products.forEach(p => {
            nodes.push({ name: p.label, color: p.color });
            productIndices[p.type] = nodeIndex++;
        });

        // 3. Create Links

        companies.forEach(company => {
            const yearsAfterBase = year - company.base_year;

            // Calculate scaling factor
            let scaleFactor = 1.0;
            if (company.projection_years && company.projection_years.length > 0) {
                const baseYearProj = company.projection_years.find(p => p.year === company.base_year);
                const targetYearProj = company.projection_years.find(p => p.year === year);
                if (baseYearProj && targetYearProj) {
                    scaleFactor = targetYearProj.employee_count / baseYearProj.employee_count;
                }
            }

            company.roles.forEach(role => {
                const roleKey = `${company.name}_${role.title}`;
                const scaledCount = role.count * scaleFactor;

                if (Math.round(scaledCount) < 1) return;

                // Link: Company -> Role
                links.push({
                    source: companyIndices[company.name],
                    target: roleIndices[roleKey],
                    value: Math.round(scaledCount)
                });

                // Calculate Affordability for this Role
                // We need to split by household type
                const baseIncome = scenario === 'base' ? role.base_salary : role.ote;
                const projectedIncome = applyIncomeGrowth(baseIncome, yearsAfterBase);

                const { H1_single, H2_dual_moderate, H3_dual_peer } = role.household_split;

                // Helper to add flow to product
                const addFlow = (count: number, incomeMultiplier: number) => {
                    if (count < 1) return;
                    const income = projectedIncome * incomeMultiplier;
                    const { affordableProducts } = calculateAffordability(income, rate);

                    // Determine highest affordable product
                    let targetProduct: string = 'gap';
                    if (affordableProducts.includes('townhouses')) targetProduct = 'townhouses';
                    else if (affordableProducts.includes('blackridge')) targetProduct = 'blackridge';
                    else if (affordableProducts.includes('condos')) targetProduct = 'condos';
                    else if (affordableProducts.includes('apartments')) targetProduct = 'apartments';

                    links.push({
                        source: roleIndices[roleKey],
                        target: productIndices[targetProduct],
                        value: Math.round(count)
                    });
                };

                addFlow(scaledCount * H1_single, HOUSEHOLD_MULTIPLIERS.H1_single);
                addFlow(scaledCount * H2_dual_moderate, HOUSEHOLD_MULTIPLIERS.H2_dual_moderate);
                addFlow(scaledCount * H3_dual_peer, HOUSEHOLD_MULTIPLIERS.H3_dual_peer);
            });
        });

        return { nodes, links };
    }, [companies, rate, year, scenario]);

    if (data.nodes.length === 0) return null;

    return (
        <div className="h-[800px] w-full bg-space-900/20 rounded-2xl border border-white/5 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={data}
                    node={CustomNode}
                    nodePadding={10}
                    margin={{ left: 20, right: 150, top: 20, bottom: 20 }}
                    link={{ strokeOpacity: 0.3 }}
                >
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                </Sankey>
            </ResponsiveContainer>
        </div>
    );
}
