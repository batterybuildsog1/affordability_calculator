'use client';

/**
 * Ecosystem Overview Page
 * Shows aggregated demand across all Techridge companies
 */

import { useAffordability } from '@/context/AffordabilityContext';
import { getAllCompanies } from '@/lib/companies';
import { computeHouseholdBandCounts, summarizeDemandByProduct } from '@/lib/model';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import SankeyDiagram from '@/components/visuals/SankeyDiagram';
import { Building2, Home, Building, Hotel } from 'lucide-react';

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

    return { totalDemand, totalEmployees, companyCount: companies.length, companies };
  }, [rate, year, scenario, affordabilityLookup]);

  const { totalDemand, totalEmployees, companyCount, companies } = aggregatedDemand;

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <div className="text-center py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Techridge Demand Capacity
          </h1>
          <p className="text-xl text-space-300 max-w-2xl mx-auto">
            Forecasting housing requirements for <span className="text-white font-semibold">{companyCount} companies</span> and <span className="text-white font-semibold">{totalEmployees.toLocaleString()} households</span>.
          </p>
        </motion.div>

        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full -z-0" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Apartments"
          count={totalDemand.apartments}
          color="text-product-apt"
          icon={<Building2 size={24} />}
          delay={0.1}
        />
        <KPICard
          title="Condos"
          count={totalDemand.condos}
          color="text-product-condo"
          icon={<Building size={24} />}
          delay={0.2}
        />
        <KPICard
          title="Blackridge"
          count={totalDemand.blackridge}
          color="text-product-blackridge"
          icon={<Hotel size={24} />}
          delay={0.3}
        />
        <KPICard
          title="Townhouses"
          count={totalDemand.townhouses}
          color="text-product-townhouse"
          icon={<Home size={24} />}
          delay={0.4}
        />
      </div>

      {/* The River of Affordability */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="glass rounded-3xl p-8 border border-white/5"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">The River of Affordability</h2>
            <p className="text-sm text-space-400 mt-1">Tracing demand flow from employer to housing product</p>
          </div>
        </div>

        <SankeyDiagram companies={companies} />
      </motion.div>

      {/* Companies Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white px-2">Company Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((company, i) => (
            <CompanyCard key={company.name} company={company} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, count, color, icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
      className="glass p-6 rounded-2xl border border-white/5 hover:bg-space-800/50 transition-colors group"
    >
      <div className={`mb-4 p-3 rounded-xl bg-space-900/50 w-fit ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-sm font-medium text-space-400 mb-1">{title}</div>
      <div className={`text-4xl font-bold font-mono ${color}`}>
        {count.toLocaleString()}
      </div>
      <div className="text-xs text-space-500 mt-2">Qualified Households</div>
    </motion.div>
  )
}

function CompanyCard({ company, index }: { company: any, index: number }) {
  return (
    <motion.a
      href={`/companies/${company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass glass-hover p-6 rounded-xl border border-white/5 flex items-center justify-between group"
    >
      <div>
        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
          {company.name}
        </h3>
        <p className="text-sm text-space-400 mt-1">
          {company.employee_count} Employees
        </p>
      </div>
      <div className="w-8 h-8 rounded-full bg-space-800 flex items-center justify-center text-space-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-all">
        →
      </div>
    </motion.a>
  )
}

