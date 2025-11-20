'use client';

/**
 * Ecosystem Overview Page
 * Shows aggregated demand across all Techridge companies
 */

import { useAffordability } from '@/context/AffordabilityContext';
import { getAllCompanies } from '@/lib/companies';
import { computeHouseholdBandCounts, summarizeDemandByProduct } from '@/lib/model';
import { useMemo } from 'react';

export default function HomePage() {
  const { rate, year, scenario, affordabilityLookup } = useAffordability();

  // Compute aggregated demand
  const aggregatedDemand = useMemo(() => {
    const companies = getAllCompanies();
    const totalDemand = {
      apartments: 0,
      condos: 0,
      blackridge: 0,
      townhouses: 0,
    };

    let totalEmployees = 0;

    for (const company of companies) {
      const bandCounts = computeHouseholdBandCounts(company, year, scenario);
      const demand = summarizeDemandByProduct(bandCounts, affordabilityLookup, rate);

      // Sum up demand
      for (const item of demand) {
        totalDemand[item.productType] += item.householdCount;
      }

      // Count employees
      totalEmployees += company.employee_count;
    }

    return { totalDemand, totalEmployees, companyCount: companies.length };
  }, [rate, year, scenario, affordabilityLookup]);

  const { totalDemand, totalEmployees, companyCount } = aggregatedDemand;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Techridge Ecosystem Overview
        </h1>
        <p className="text-xl text-space-300">
          Analyzing housing demand for {companyCount} companies and {totalEmployees.toLocaleString()} employees
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="text-sm font-medium text-space-400 mb-2">Apartments</div>
          <div className="text-3xl font-bold text-product-apt font-mono">
            {totalDemand.apartments.toLocaleString()}
          </div>
          <div className="text-xs text-space-500 mt-1">households</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="text-sm font-medium text-space-400 mb-2">Condos</div>
          <div className="text-3xl font-bold text-product-condo font-mono">
            {totalDemand.condos.toLocaleString()}
          </div>
          <div className="text-xs text-space-500 mt-1">households</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="text-sm font-medium text-space-400 mb-2">Blackridge</div>
          <div className="text-3xl font-bold text-product-blackridge font-mono">
            {totalDemand.blackridge.toLocaleString()}
          </div>
          <div className="text-xs text-space-500 mt-1">households</div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="text-sm font-medium text-space-400 mb-2">Townhouses</div>
          <div className="text-3xl font-bold text-product-townhouse font-mono">
            {totalDemand.townhouses.toLocaleString()}
          </div>
          <div className="text-xs text-space-500 mt-1">households</div>
        </div>
      </div>

      {/* Companies List */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Techridge Companies</h2>
        <div className="grid gap-4">
          {getAllCompanies().map((company) => {
            const bandCounts = computeHouseholdBandCounts(company, year, scenario);
            const demand = summarizeDemandByProduct(bandCounts, affordabilityLookup, rate);

            return (
              <a
                key={company.name}
                href={`/companies/${company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                className="glass glass-hover rounded-xl p-6 block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                    <p className="text-sm text-space-400">
                      {company.employee_count} employees • {company.roles.length} role segments
                    </p>
                  </div>

                  <div className="flex gap-4">
                    {demand.map((item) => (
                      <div key={item.productType} className="text-right">
                        <div className={`text-lg font-mono font-semibold text-product-${item.productType}`}>
                          {item.householdCount}
                        </div>
                        <div className="text-xs text-space-500 capitalize">{item.productType}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
