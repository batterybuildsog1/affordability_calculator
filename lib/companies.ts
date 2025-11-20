/**
 * Company data loader - loads from JSON files as fallback for initial setup
 * Later will be replaced by database queries
 */

import type { Company } from './model';
import companiesData from '@/data/companies.json';
import vasionData from '@/data/vasion.json';
import zonosData from '@/data/zonos.json';

export function getAllCompanies(): Company[] {
  const companies: Company[] = [];

  // Load from companies.json
  if ('companies' in companiesData && Array.isArray(companiesData.companies)) {
    companies.push(...(companiesData.companies as Company[]));
  }

  // Load individual company files
  const individualCompanies = [vasionData, zonosData];

  for (const companyData of individualCompanies) {
    if (companyData && 'name' in companyData) {
      companies.push(companyData as Company);
    }
  }

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
