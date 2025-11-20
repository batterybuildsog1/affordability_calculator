/**
 * Database client configuration for Neon Postgres
 */

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the SQL client
export const sql = neon(process.env.DATABASE_URL);

// Helper function to safely execute queries
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T> {
  try {
    const result = await sql(query, params);
    return result as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Database helper functions
export const db = {
  /**
   * Get the latest FHA rate
   */
  async getLatestRate() {
    const result = await sql`
      SELECT date, fha_30y, conv_30y, source, created_at
      FROM rates
      ORDER BY date DESC
      LIMIT 1
    `;
    return result[0] || null;
  },

  /**
   * Insert or update a rate
   */
  async upsertRate(
    date: Date,
    fha30y: number,
    conv30y: number,
    source: string
  ) {
    return sql`
      INSERT INTO rates (date, fha_30y, conv_30y, source)
      VALUES (${date}, ${fha30y}, ${conv30y}, ${source})
      ON CONFLICT (date)
      DO UPDATE SET
        fha_30y = ${fha30y},
        conv_30y = ${conv30y},
        source = ${source},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
  },

  /**
   * Get rate history for a time range
   */
  async getRateHistory(days: number = 90) {
    return sql`
      SELECT date, fha_30y, conv_30y, source
      FROM rates
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `;
  },

  /**
   * Get all companies with basic info
   */
  async getCompanies() {
    return sql`
      SELECT id, slug, name, base_year, employee_count, data_quality
      FROM companies
      ORDER BY name ASC
    `;
  },

  /**
   * Get company by slug with roles and projections
   */
  async getCompanyBySlug(slug: string) {
    const companies = await sql`
      SELECT id, slug, name, base_year, employee_count, data_quality
      FROM companies
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (companies.length === 0) return null;

    const company = companies[0];

    // Get projections
    const projections = await sql`
      SELECT year, employee_count
      FROM company_projections
      WHERE company_id = ${company.id}
      ORDER BY year ASC
    `;

    // Get roles with household splits
    const roles = await sql`
      SELECT
        r.id, r.title, r.count, r.base_salary, r.ote,
        r.is_entry_level, r.segment_type,
        hs.h1_single, hs.h2_dual_moderate, hs.h3_dual_peer
      FROM roles r
      LEFT JOIN household_splits hs ON r.id = hs.role_id
      WHERE r.company_id = ${company.id}
      ORDER BY r.count DESC
    `;

    return {
      ...company,
      projection_years: projections,
      roles: roles.map((r) => ({
        title: r.title,
        count: r.count,
        base_salary: r.base_salary,
        ote: r.ote,
        is_entry_level: r.is_entry_level,
        segment_type: r.segment_type,
        household_split: {
          H1_single: parseFloat(r.h1_single),
          H2_dual_moderate: parseFloat(r.h2_dual_moderate),
          H3_dual_peer: parseFloat(r.h3_dual_peer),
        },
      })),
    };
  },

  /**
   * Get supply inventory for a year
   */
  async getSupplyInventory(year: number) {
    return sql`
      SELECT product_type, year, planned_units
      FROM supply_inventory
      WHERE year = ${year}
      ORDER BY product_type ASC
    `;
  },

  /**
   * Get all assumptions
   */
  async getAssumptions() {
    return sql`
      SELECT name, value, description, category
      FROM assumptions
      ORDER BY category, name ASC
    `;
  },

  /**
   * Update an assumption
   */
  async updateAssumption(name: string, value: number) {
    return sql`
      UPDATE assumptions
      SET value = ${value}, updated_at = CURRENT_TIMESTAMP
      WHERE name = ${name}
      RETURNING *
    `;
  },
};
