'use client';

/**
 * GlobalDock - Fixed bottom controller for rate, year, and scenario
 */

import { useAffordability } from '@/context/AffordabilityContext';
import { formatPercentage } from '@/lib/model';

export default function GlobalDock() {
  const {
    rate,
    year,
    scenario,
    useLiveFHA,
    setRate,
    setYear,
    setScenario,
    setUseLiveFHA,
    availableYears,
    liveFHARate,
  } = useAffordability();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-space-900/95 backdrop-blur-lg border border-space-700 rounded-2xl shadow-2xl px-6 py-4">
        <div className="flex items-center gap-8">
          {/* Rate Slider */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-space-300">Interest Rate</label>
            <input
              type="range"
              min="0.04"
              max="0.08"
              step="0.0025"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-48 h-2 bg-space-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="font-mono text-lg font-bold text-white min-w-[4rem]">
              {formatPercentage(rate * 100, 2)}
            </span>

            {/* Live FHA Toggle */}
            {liveFHARate && (
              <button
                onClick={() => setUseLiveFHA(!useLiveFHA)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  useLiveFHA
                    ? 'bg-cyan-500 text-white'
                    : 'bg-space-800 text-space-300 hover:bg-space-700'
                }`}
              >
                {useLiveFHA ? 'Live FHA' : 'Use Live FHA'}
              </button>
            )}
          </div>

          {/* Scenario Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-space-300">Income</label>
            <div className="flex bg-space-800 rounded-lg p-1">
              <button
                onClick={() => setScenario('base')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scenario === 'base'
                    ? 'bg-violet-500 text-white'
                    : 'text-space-300 hover:text-white'
                }`}
              >
                Base Only
              </button>
              <button
                onClick={() => setScenario('full')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scenario === 'full'
                    ? 'bg-violet-500 text-white'
                    : 'text-space-300 hover:text-white'
                }`}
              >
                Base + Bonus
              </button>
            </div>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-space-300">Year</label>
            <div className="flex gap-2">
              {availableYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    year === y
                      ? 'bg-amber-500 text-white'
                      : 'bg-space-800 text-space-300 hover:bg-space-700'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
