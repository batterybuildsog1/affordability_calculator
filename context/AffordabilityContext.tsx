'use client';

/**
 * AffordabilityContext - Global state management for affordability model
 * Manages rate, year, scenario, and provides computed affordability lookup
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  buildAffordabilityLookup,
  CONSTANTS,
  type IncomeScenario,
  type BandAffordability,
} from '@/lib/model';

interface AffordabilityContextType {
  // User-controlled inputs
  rate: number;
  year: number;
  scenario: IncomeScenario;
  useLiveFHA: boolean;

  // Setters
  setRate: (rate: number) => void;
  setYear: (year: number) => void;
  setScenario: (scenario: IncomeScenario) => void;
  setUseLiveFHA: (use: boolean) => void;

  // Computed affordability lookup
  affordabilityLookup: Record<string, BandAffordability>;

  // Available years from data
  availableYears: number[];
  setAvailableYears: (years: number[]) => void;

  // Live FHA rate from API
  liveFHARate: number | null;
  setLiveFHARate: (rate: number | null) => void;
}

const AffordabilityContext = createContext<AffordabilityContextType | undefined>(undefined);

export function AffordabilityProvider({ children }: { children: React.ReactNode }) {
  // Load from localStorage on mount
  const [rate, setRateState] = useState<number>(CONSTANTS.FHA_RATE);
  const [year, setYearState] = useState<number>(2025);
  const [scenario, setScenarioState] = useState<IncomeScenario>('full');
  const [useLiveFHA, setUseLiveFHAState] = useState<boolean>(false);
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026, 2027]);
  const [liveFHARate, setLiveFHARate] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const savedRate = localStorage.getItem('techridge_rate');
    const savedYear = localStorage.getItem('techridge_year');
    const savedScenario = localStorage.getItem('techridge_scenario');
    const savedUseLiveFHA = localStorage.getItem('techridge_use_live_fha');

    if (savedRate) setRateState(parseFloat(savedRate));
    if (savedYear) setYearState(parseInt(savedYear, 10));
    if (savedScenario) setScenarioState(savedScenario as IncomeScenario);
    if (savedUseLiveFHA) setUseLiveFHAState(savedUseLiveFHA === 'true');

    setIsHydrated(true);
  }, []);

  // Fetch live FHA rate on mount
  useEffect(() => {
    if (!isHydrated) return;

    async function fetchLiveRate() {
      try {
        const response = await fetch('/api/fha-rate');
        if (response.ok) {
          const data = await response.json();
          if (data.rate) {
            setLiveFHARate(data.rate);

            // Auto-apply the live rate if we haven't explicitly disabled it
            // Or just always apply it on load to ensure freshness, user can override
            setRateState(data.rate);

            // Also update the toggle state to reflect we are using live data
            setUseLiveFHAState(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch live FHA rate:', error);
      }
    }

    fetchLiveRate();
  }, [isHydrated]); // Removed useLiveFHA dependency to avoid loops, just run once on hydration

  // Setters with localStorage persistence
  const setRate = (newRate: number) => {
    setRateState(newRate);
    if (isHydrated) {
      localStorage.setItem('techridge_rate', newRate.toString());
    }
  };

  const setYear = (newYear: number) => {
    setYearState(newYear);
    if (isHydrated) {
      localStorage.setItem('techridge_year', newYear.toString());
    }
  };

  const setScenario = (newScenario: IncomeScenario) => {
    setScenarioState(newScenario);
    if (isHydrated) {
      localStorage.setItem('techridge_scenario', newScenario);
    }
  };

  const setUseLiveFHA = (use: boolean) => {
    setUseLiveFHAState(use);
    if (isHydrated) {
      localStorage.setItem('techridge_use_live_fha', use.toString());
    }

    // Update rate if live FHA is enabled
    if (use && liveFHARate) {
      setRate(liveFHARate);
    }
  };

  // Compute affordability lookup based on current rate
  const affordabilityLookup = useMemo(() => {
    return buildAffordabilityLookup([rate, CONSTANTS.CONV_RATE, 0.055, 0.045]);
  }, [rate]);

  const value: AffordabilityContextType = {
    rate,
    year,
    scenario,
    useLiveFHA,
    setRate,
    setYear,
    setScenario,
    setUseLiveFHA,
    affordabilityLookup,
    availableYears,
    setAvailableYears,
    liveFHARate,
    setLiveFHARate,
  };

  return (
    <AffordabilityContext.Provider value={value}>
      {children}
    </AffordabilityContext.Provider>
  );
}

export function useAffordability() {
  const context = useContext(AffordabilityContext);
  if (context === undefined) {
    throw new Error('useAffordability must be used within AffordabilityProvider');
  }
  return context;
}
