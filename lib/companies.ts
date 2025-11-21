/**
 * Company data loader - loads from JSON files as fallback for initial setup
 * Later will be replaced by database queries
 */

import type { Company } from './model';
import companiesData from '@/data/companies.json';
import vasionData from '@/data/vasion.json';
import zonosData from '@/data/zonos.json';
import busybusyData from '@/data/busybusy.json';
import intergalacticData from '@/data/intergalactic.json';
import planstinData from '@/data/planstin.json';
import awardcoData from '@/data/awardco.json';
import zionHealthshareData from '@/data/zion_healthshare.json';
import digivoiceData from '@/data/digivoice.json';
import eaglegateTitleData from '@/data/eaglegate_title.json';
import mangoVoiceData from '@/data/mango_voice.json';
import brodieIndustriesData from '@/data/brodie_industries.json';
import centracomData from '@/data/centracom.json';
import hfbTechnologiesData from '@/data/hfb_technologies.json';
import kirtonMcconkieData from '@/data/kirton_mcconkie.json';
import primestinCareData from '@/data/primestin_care.json';

export function getAllCompanies(): Company[] {
  const companies: Company[] = [];

  // Load from companies.json
  if ('companies' in companiesData && Array.isArray(companiesData.companies)) {
    companies.push(...(companiesData.companies as Company[]));
  }

  // Load individual company files
  const individualCompanies = [
    vasionData,
    zonosData,
    busybusyData,
    intergalacticData,
    planstinData,
    awardcoData,
    zionHealthshareData,
    digivoiceData,
    eaglegateTitleData,
    mangoVoiceData,
    brodieIndustriesData,
    centracomData,
    hfbTechnologiesData,
    kirtonMcconkieData,
    primestinCareData
  ];

  for (const companyData of individualCompanies) {
    if (companyData && 'name' in companyData) {
      companies.push(companyData as Company);
    }
  }

  // Add new companies (Hardcoded for now as requested)
  const newCompanies: Company[] = [];

  companies.push(...newCompanies);

  return companies;
}

export function getCompanyBySlug(slug: string): Company | null {
  const companies = getAllCompanies();
  return companies.find((c) => slugify(c.name) === slug) || null;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function getCompanyNames(): string[] {
  return getAllCompanies().map((c) => c.name);
}

export function getCompanySlugs(): string[] {
  return getAllCompanies().map((c) => slugify(c.name));
}
