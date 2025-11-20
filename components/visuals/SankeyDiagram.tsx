'use client';

/**
 * SankeyDiagram - Visualizes the flow of demand
 * Companies -> Income Bands -> Housing Products
 */

import { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { Company, IncomeScenario, computeHouseholdBandCounts, buildAffordabilityLookup, CONSTANTS, ProductType, INCOME_BANDS } from '@/lib/model';
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
                fillOpacity={0.8}
            />
            <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={10}
                fill="#fff"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
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

        // 1. Create Nodes
        // We need indices for nodes.
        // Structure: [Companies...] -> [Bands...] -> [Products...]

        let nodeIndex = 0;
        const companyIndices: Record<string, number> = {};
        const bandIndices: Record<string, number> = {};
        const productIndices: Record<string, number> = {};

        // Add Company Nodes
        companies.forEach(c => {
            nodes.push({ name: c.name, color: '#64748b' }); // Slate-500
            companyIndices[c.name] = nodeIndex++;
        });

        // Add Band Nodes
        const bands = INCOME_BANDS;
        bands.forEach(b => {
            nodes.push({ name: b, color: '#94a3b8' }); // Slate-400
            bandIndices[b] = nodeIndex++;
        });

        // Add Product Nodes
        const products: { type: ProductType; color: string; label: string }[] = [
            { type: 'apartments', color: '#06b6d4', label: 'Apt' },
            { type: 'condos', color: '#8b5cf6', label: 'Condo' },
            { type: 'blackridge', color: '#f59e0b', label: 'Blackridge' },
            { type: 'townhouses', color: '#10b981', label: 'Townhouse' },
            { type: 'unaffordable' as any, color: '#ef4444', label: 'Gap' } // Fallback
        ];

        products.forEach(p => {
            nodes.push({ name: p.label, color: p.color });
            productIndices[p.type] = nodeIndex++;
        });

        // 2. Create Links
        // Company -> Band
        const affordabilityLookup = buildAffordabilityLookup([rate]);

        companies.forEach(company => {
            const bandCounts = computeHouseholdBandCounts(company, year, scenario);

            Object.entries(bandCounts).forEach(([band, count]) => {
                if (count < 1) return; // Skip small flows

                // Link: Company -> Band
                links.push({
                    source: companyIndices[company.name],
                    target: bandIndices[band],
                    value: Math.round(count)
                });

                // Link: Band -> Product
                // This is tricky because bands aggregate. 
                // We can't just link Band -> Product directly for each company without overcounting or complex logic if we want to trace flow.
                // But Sankey in Recharts sums up inputs.
                // So we just need to ensure the total flow out of a Band matches total flow in.

                // Actually, we should aggregate Band -> Product links globally, not per company, 
                // otherwise we get multiple links between same nodes which Recharts might merge or handle.
                // Let's aggregate the "Band -> Product" flow logic separately.
            });
        });

        // Aggregate Band -> Product flows
        // We need to know total count per band across all companies to distribute to products
        const totalBandCounts: Record<string, number> = {};
        companies.forEach(company => {
            const counts = computeHouseholdBandCounts(company, year, scenario);
            Object.entries(counts).forEach(([band, count]) => {
                totalBandCounts[band] = (totalBandCounts[band] || 0) + count;
            });
        });

        Object.entries(totalBandCounts).forEach(([band, count]) => {
            if (count < 1) return;

            const key = `${band}_${(rate * 100).toFixed(2)}`;
            const affordability = affordabilityLookup[key];

            // Logic: Assign to highest affordable product? Or distribute?
            // The model implies "Buckets". Usually people buy the best they can afford or what's available.
            // For this viz, let's assume they qualify for the highest tier they can afford, 
            // but that might hide lower tiers.
            // Let's simplify: If they can afford Townhouse, they go to Townhouse.
            // If not, check Blackridge, etc.

            let targetProduct: string = 'unaffordable';
            if (affordability) {
                if (affordability.affordableProducts.includes('townhouses')) targetProduct = 'townhouses';
                else if (affordability.affordableProducts.includes('blackridge')) targetProduct = 'blackridge';
                else if (affordability.affordableProducts.includes('condos')) targetProduct = 'condos';
                else if (affordability.affordableProducts.includes('apartments')) targetProduct = 'apartments';
            }

            links.push({
                source: bandIndices[band],
                target: productIndices[targetProduct],
                value: Math.round(count)
            });
        });

        return { nodes, links };
    }, [companies, rate, year, scenario]);

    if (data.nodes.length === 0) return null;

    return (
        <div className="h-[500px] w-full bg-space-900/20 rounded-2xl border border-white/5 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={data}
                    node={{ stroke: 'none' }}
                    nodePadding={50}
                    margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                    link={{ stroke: '#334155', strokeOpacity: 0.3 }}
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
