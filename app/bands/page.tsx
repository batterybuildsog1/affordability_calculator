'use client';

import { BAND_RANGES, INCOME_BANDS } from '@/lib/model';

export default function IncomeBandsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Income Bands</h1>
                <p className="text-space-400 mt-2">
                    Standardized income ranges used for demographic analysis and affordability calculations.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {INCOME_BANDS.map((band) => {
                    const range = BAND_RANGES[band];
                    return (
                        <div
                            key={band}
                            className="glass p-6 rounded-xl border border-white/5 hover:bg-space-800/50 transition-colors"
                        >
                            <div className="text-xs font-mono text-space-500 mb-2">{band}</div>
                            <div className="text-2xl font-bold text-white">{range.label}</div>
                            <div className="mt-4 flex justify-between text-sm text-space-400">
                                <span>Min: ${range.min.toLocaleString()}</span>
                                <span>Max: {range.max === Infinity ? '∞' : `$${range.max.toLocaleString()}`}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
