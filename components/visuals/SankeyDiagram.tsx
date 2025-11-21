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
    // Determine if node is on the left (Company), middle (Band), or right (Product)
    // We can infer this roughly by x position relative to container width
    const isLeft = x < containerWidth * 0.33;
    const isRight = x > containerWidth * 0.66;

    let textX = x + width / 2;
    let textAnchor: "middle" | "end" | "start" | "inherit" | undefined = "middle";
    let dx = 0;

    if (isLeft) {
        textX = x - 10;
        textAnchor = "end";
    } else if (isRight) {
        textX = x + width + 10;
        textAnchor = "start";
    } else {
        // Middle nodes (Bands) - keep inside or centered if space permits
        // If the band is very thin, maybe hide text or move it?
        // For now, center it.
        textX = x + width / 2;
        textAnchor = "middle";
    }

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
                x={textX}
                y={y + height / 2}
                textAnchor={textAnchor}
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
            '#14b8a6', // Teal
            '#f97316', // Orange
            '#64748b', // Slate
            '#a855f7', // Purple
            '#e11d48', // Rose
        ];

        // 2. Define Income Bands
        const bands = [
            { label: '< $50k', min: 0, max: 50000 },
            { label: '$50k - $60k', min: 50000, max: 60000 },
            { label: '$60k - $70k', min: 60000, max: 70000 },
            { label: '$70k - $80k', min: 70000, max: 80000 },
            { label: '$80k - $90k', min: 80000, max: 90000 },
            { label: '$90k - $100k', min: 90000, max: 100000 },
            { label: '$100k - $110k', min: 100000, max: 110000 },
            { label: '$110k - $120k', min: 110000, max: 120000 },
            { label: '$120k - $130k', min: 120000, max: 130000 },
            { label: '$130k - $140k', min: 130000, max: 140000 },
            { label: '$140k - $150k', min: 140000, max: 150000 },
            { label: '$150k - $200k', min: 150000, max: 200000 },
            { label: '$200k - $250k', min: 200000, max: 250000 },
            { label: '$250k+', min: 250000, max: Infinity },
        ];

        // 3. Create Nodes
        let nodeIndex = 0;
        const companyIndices: Record<string, number> = {};
        const bandIndices: Record<string, number> = {};
        const productIndices: Record<string, number> = {};

        // Level 0: Companies
        companies.forEach((c, i) => {
            nodes.push({ name: c.name, color: companyColors[i % companyColors.length] });
            companyIndices[c.name] = nodeIndex++;
        });

        // Level 1: Income Bands
        bands.forEach(b => {
            nodes.push({ name: b.label, color: '#64748b' }); // Neutral color for bands
            bandIndices[b.label] = nodeIndex++;
        });

        // Level 2: Products
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

        // 4. Calculate Links
        // We need to aggregate flow from Company -> Band, and then Band -> Product
        // Since Sankey requires flow conservation (in = out), we calculate everything first.

        // Temporary storage for Band -> Product flows to aggregate them
        // Map<BandLabel, Map<ProductType, Count>>
        const bandToProductMap = new Map<string, Map<string, number>>();
        bands.forEach(b => bandToProductMap.set(b.label, new Map()));

        companies.forEach(company => {
            const yearsAfterBase = year - company.base_year;
            let scaleFactor = 1.0;
            if (company.projection_years && company.projection_years.length > 0) {
                const baseYearProj = company.projection_years.find(p => p.year === company.base_year);
                const targetYearProj = company.projection_years.find(p => p.year === year);
                if (baseYearProj && targetYearProj) {
                    scaleFactor = targetYearProj.employee_count / baseYearProj.employee_count;
                }
            }

            company.roles.forEach(role => {
                const scaledCount = role.count * scaleFactor;
                if (Math.round(scaledCount) < 1) return;

                const baseIncome = scenario === 'base' ? role.base_salary : role.ote;
                const projectedIncome = applyIncomeGrowth(baseIncome, yearsAfterBase);
                const { H1_single, H2_dual_moderate, H3_dual_peer } = role.household_split;

                // Helper to process a household segment
                const processSegment = (count: number, incomeMultiplier: number) => {
                    if (count < 1) return;
                    const totalHouseholdIncome = projectedIncome * incomeMultiplier;

                    // Find Band
                    const band = bands.find(b => totalHouseholdIncome >= b.min && totalHouseholdIncome < b.max);
                    if (!band) return; // Should not happen given $250k+ catch-all

                    // Link: Company -> Band
                    links.push({
                        source: companyIndices[company.name],
                        target: bandIndices[band.label],
                        value: Math.round(count),
                        // We can't easily color individual links in Recharts Sankey based on source without custom rendering,
                        // but Recharts usually handles source-coloring by default or we can try to force it.
                    });

                    // Determine Product Affordability
                    const { affordableProducts } = calculateAffordability(totalHouseholdIncome, rate);
                    let targetProduct: string = 'gap';
                    if (affordableProducts.includes('townhouses')) targetProduct = 'townhouses';
                    else if (affordableProducts.includes('blackridge')) targetProduct = 'blackridge';
                    else if (affordableProducts.includes('condos')) targetProduct = 'condos';
                    else if (affordableProducts.includes('apartments')) targetProduct = 'apartments';

                    // Aggregate Band -> Product flow
                    const productMap = bandToProductMap.get(band.label)!;
                    const currentVal = productMap.get(targetProduct) || 0;
                    productMap.set(targetProduct, currentVal + Math.round(count));
                };

                processSegment(scaledCount * H1_single, HOUSEHOLD_MULTIPLIERS.H1_single);
                processSegment(scaledCount * H2_dual_moderate, HOUSEHOLD_MULTIPLIERS.H2_dual_moderate);
                processSegment(scaledCount * H3_dual_peer, HOUSEHOLD_MULTIPLIERS.H3_dual_peer);
            });
        });

        // Consolidate Company -> Band links (Recharts might need unique links or it sums them up?
        // Recharts Sankey usually sums multiple links between same nodes.
        // But to be safe and cleaner, let's aggregate them ourselves.)
        const aggregatedCompanyToBand = new Map<string, number>(); // Key: "CompIdx_BandIdx"
        const finalLinks: any[] = [];

        links.forEach(l => {
            const key = `${l.source}_${l.target}`;
            const current = aggregatedCompanyToBand.get(key) || 0;
            aggregatedCompanyToBand.set(key, current + l.value);
        });

        aggregatedCompanyToBand.forEach((value, key) => {
            const [source, target] = key.split('_').map(Number);
            finalLinks.push({ source, target, value });
        });

        // Create Band -> Product links
        bandToProductMap.forEach((productMap, bandLabel) => {
            const bandIndex = bandIndices[bandLabel];
            productMap.forEach((count, productType) => {
                if (count > 0) {
                    finalLinks.push({
                        source: bandIndex,
                        target: productIndices[productType],
                        value: count
                    });
                }
            });
        });

        return { nodes, links: finalLinks };
    }, [companies, rate, year, scenario]);

    if (data.nodes.length === 0) return null;

    return (
        <div className="h-[900px] w-full bg-space-900/20 rounded-2xl border border-white/5 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={data}
                    node={CustomNode}
                    nodePadding={20}
                    margin={{ left: 200, right: 200, top: 20, bottom: 20 }}
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
