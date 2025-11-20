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

  // Add new companies (Hardcoded for now as requested)
  const newCompanies: Company[] = [
    {
      name: 'Intergalactic',
      base_year: 2024,
      employee_count: 150,
      roles: [
        {
          title: 'Entry Level Engineer',
          count: 40,
          base_salary: 85000,
          ote: 95000,
          is_entry_level: true,
          segment_type: 'Engineering',
          household_split: { H1_single: 0.4, H2_dual_moderate: 0.4, H3_dual_peer: 0.2 }
        },
        {
          title: 'Senior Engineer',
          count: 60,
          base_salary: 160000,
          ote: 180000,
          is_entry_level: false,
          segment_type: 'Engineering',
          household_split: { H1_single: 0.2, H2_dual_moderate: 0.5, H3_dual_peer: 0.3 }
        },
        {
          title: 'Management',
          count: 20,
          base_salary: 200000,
          ote: 250000,
          is_entry_level: false,
          segment_type: 'Management',
          household_split: { H1_single: 0.1, H2_dual_moderate: 0.4, H3_dual_peer: 0.5 }
        }
      ]
    },
    {
      name: 'Planstin Administration',
      base_year: 2024,
      employee_count: 80,
      roles: [
        {
          title: 'Admin Specialist',
          count: 50,
          base_salary: 55000,
          ote: 60000,
          is_entry_level: true,
          segment_type: 'Operations',
          household_split: { H1_single: 0.5, H2_dual_moderate: 0.4, H3_dual_peer: 0.1 }
        },
        {
          title: 'Manager',
          count: 15,
          base_salary: 90000,
          ote: 100000,
          is_entry_level: false,
          segment_type: 'Management',
          household_split: { H1_single: 0.2, H2_dual_moderate: 0.6, H3_dual_peer: 0.2 }
        }
      ]
    },
    {
      name: 'DigiVoice',
      base_year: 2024,
      employee_count: 45,
      roles: [
        {
          title: 'Support Rep',
          count: 30,
          base_salary: 45000,
          ote: 50000,
          is_entry_level: true,
          segment_type: 'Support',
          household_split: { H1_single: 0.6, H2_dual_moderate: 0.3, H3_dual_peer: 0.1 }
        }
      ]
    },
    {
      name: 'Awardco',
      base_year: 2024,
      employee_count: 200,
      roles: [
        {
          title: 'Sales Rep',
          count: 80,
          base_salary: 60000,
          ote: 120000,
          is_entry_level: true,
          segment_type: 'Sales',
          household_split: { H1_single: 0.5, H2_dual_moderate: 0.3, H3_dual_peer: 0.2 }
        },
        {
          title: 'Developer',
          count: 60,
          base_salary: 130000,
          ote: 140000,
          is_entry_level: false,
          segment_type: 'Engineering',
          household_split: { H1_single: 0.3, H2_dual_moderate: 0.4, H3_dual_peer: 0.3 }
        }
      ]
    },
    {
      name: 'Zion HealthShare',
      base_year: 2024,
      employee_count: 120,
      roles: [
        {
          title: 'Member Services',
          count: 80,
          base_salary: 50000,
          ote: 55000,
          is_entry_level: true,
          segment_type: 'Support',
          household_split: { H1_single: 0.5, H2_dual_moderate: 0.4, H3_dual_peer: 0.1 }
        }
      ]
    },
    {
      name: 'Eagle Gate Title',
      base_year: 2024,
      employee_count: 30,
      roles: [
        {
          title: 'Escrow Officer',
          count: 15,
          base_salary: 75000,
          ote: 90000,
          is_entry_level: false,
          segment_type: 'Operations',
          household_split: { H1_single: 0.3, H2_dual_moderate: 0.5, H3_dual_peer: 0.2 }
        }
      ]
    }
  ];

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
