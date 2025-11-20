'use client';

/**
 * GlobalDock - The "Command Center" for the application
 * Floating glass dock with rate dial, scenario toggle, and year selector.
 */

import { useAffordability } from '@/context/AffordabilityContext';
import { formatPercentage } from '@/lib/model';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, TrendingUp, Calendar, DollarSign, Percent, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalDock() {
  const {
    rate,
    year,
    scenario,
    setRate,
    setYear,
    setScenario,
    availableYears,
  } = useAffordability();

  // Local state for "Ripple" effect visual feedback
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
    >
      <div className="relative group">
        {/* Glass Container */}
        <div className="absolute inset-0 bg-space-900/80 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" />

        {/* Content */}
        <div className="relative flex items-center justify-between px-8 py-4 gap-8">

          {/* 1. Rate Control (The "Dial") */}
          <div className="flex flex-col gap-2 min-w-[240px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-medium text-space-400 uppercase tracking-wider">
                <Percent size={12} />
                <span>Interest Rate</span>
              </div>
              <motion.span
                key={rate}
                initial={{ scale: 1.2, color: '#fff' }}
                animate={{ scale: 1, color: '#fff' }}
                className="font-mono text-lg font-bold text-white"
              >
                {formatPercentage(rate * 100, 2)}
              </motion.span>
            </div>

            <div className="relative h-6 flex items-center">
              <input
                type="range"
                min="0.04"
                max="0.08"
                step="0.00125"
                value={rate}
                onChange={(e) => {
                  setRate(parseFloat(e.target.value));
                  setIsInteracting(true);
                }}
                onMouseUp={() => setIsInteracting(false)}
                onTouchEnd={() => setIsInteracting(false)}
                className="w-full h-1.5 bg-space-700 rounded-lg appearance-none cursor-pointer accent-product-apt hover:accent-product-condo transition-all"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/10" />

          {/* 2. Scenario Toggle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-space-400 uppercase tracking-wider">
              <DollarSign size={12} />
              <span>Income Basis</span>
            </div>
            <div className="flex bg-space-800/50 rounded-lg p-1 border border-white/5">
              <button
                onClick={() => setScenario('base')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${scenario === 'base'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-space-400 hover:text-white'
                  }`}
              >
                Base Salary
              </button>
              <button
                onClick={() => setScenario('full')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${scenario === 'full'
                  ? 'bg-product-condo/20 text-product-condo shadow-sm border border-product-condo/20'
                  : 'text-space-400 hover:text-white'
                  }`}
              >
                Full OTE
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/10" />

          {/* 3. Year Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-space-400 uppercase tracking-wider">
              <Calendar size={12} />
              <span>Projection</span>
            </div>
            <div className="flex gap-1">
              {availableYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-200 ${year === y
                    ? 'bg-product-blackridge/20 text-product-blackridge border border-product-blackridge/20'
                    : 'text-space-500 hover:text-space-300 hover:bg-white/5'
                    }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/10" />

          {/* 4. Tools */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-space-400 uppercase tracking-wider">
              <Settings2 size={12} />
              <span>Tools</span>
            </div>
            <div className="flex gap-1">
              <Link href="/investigator" className="p-2 rounded-md text-space-400 hover:text-white hover:bg-white/5 transition-colors" title="Demographic Investigator">
                <Users size={18} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
