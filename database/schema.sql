-- Techridge Affordability Tool Database Schema
-- Neon PostgreSQL Database

-- ============================================
-- TABLE: rates
-- Stores historical FHA and Conventional mortgage rates
-- ============================================
CREATE TABLE IF NOT EXISTS rates (
    date DATE PRIMARY KEY,
    fha_30y NUMERIC(5, 3) NOT NULL,
    conv_30y NUMERIC(5, 3) NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rates_date ON rates(date DESC);

-- ============================================
-- TABLE: companies
-- Stores company information and metadata
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    base_year INTEGER NOT NULL,
    employee_count INTEGER NOT NULL,
    data_quality TEXT CHECK (data_quality IN ('rich', 'medium', 'thin')) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_slug ON companies(slug);

-- ============================================
-- TABLE: company_projections
-- Stores future headcount projections for companies
-- ============================================
CREATE TABLE IF NOT EXISTS company_projections (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    employee_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, year)
);

CREATE INDEX idx_projections_company ON company_projections(company_id, year);

-- ============================================
-- TABLE: roles
-- Stores role segments for each company
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    count INTEGER NOT NULL,
    base_salary INTEGER NOT NULL,
    ote INTEGER NOT NULL,
    is_entry_level BOOLEAN DEFAULT false,
    segment_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_company ON roles(company_id);
CREATE INDEX idx_roles_segment ON roles(segment_type);

-- ============================================
-- TABLE: household_splits
-- Stores H1/H2/H3 distribution for each role
-- ============================================
CREATE TABLE IF NOT EXISTS household_splits (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    h1_single NUMERIC(3, 2) NOT NULL CHECK (h1_single >= 0 AND h1_single <= 1),
    h2_dual_moderate NUMERIC(3, 2) NOT NULL CHECK (h2_dual_moderate >= 0 AND h2_dual_moderate <= 1),
    h3_dual_peer NUMERIC(3, 2) NOT NULL CHECK (h3_dual_peer >= 0 AND h3_dual_peer <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sum_equals_one CHECK (h1_single + h2_dual_moderate + h3_dual_peer = 1.0)
);

CREATE INDEX idx_household_role ON household_splits(role_id);

-- ============================================
-- TABLE: assumptions
-- Stores modeling assumptions (DTI, tax rates, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS assumptions (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    value NUMERIC NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default assumptions
INSERT INTO assumptions (name, value, description, category) VALUES
    ('DTI_LIMIT', 0.45, 'Front-end debt-to-income ratio limit', 'underwriting'),
    ('TAX_INS_HOA_RATE', 0.012, 'Combined property tax, insurance, and HOA as % of property value per year', 'costs'),
    ('INCOME_GROWTH_RATE', 0.04, 'Annual income growth rate (4%)', 'projections'),
    ('FHA_LIMIT', 680000, 'Maximum FHA loan purchase price', 'underwriting'),
    ('FHA_DOWN_PAYMENT', 0.035, 'FHA down payment percentage (3.5%)', 'underwriting'),
    ('CONV_DOWN_PAYMENT', 0.10, 'Conventional/Jumbo down payment percentage (10%)', 'underwriting')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TABLE: supply_inventory
-- Stores planned supply for each product type
-- ============================================
CREATE TABLE IF NOT EXISTS supply_inventory (
    id SERIAL PRIMARY KEY,
    product_type TEXT NOT NULL CHECK (product_type IN ('apartments', 'condos', 'blackridge', 'townhouses')),
    year INTEGER NOT NULL,
    planned_units INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_type, year)
);

CREATE INDEX idx_supply_product_year ON supply_inventory(product_type, year);

-- Insert initial supply data (these can be updated via admin interface)
INSERT INTO supply_inventory (product_type, year, planned_units) VALUES
    ('apartments', 2025, 200),
    ('condos', 2025, 150),
    ('blackridge', 2025, 75),
    ('townhouses', 2025, 80),
    ('apartments', 2026, 250),
    ('condos', 2026, 200),
    ('blackridge', 2026, 100),
    ('townhouses', 2026, 80),
    ('apartments', 2027, 300),
    ('condos', 2027, 250),
    ('blackridge', 2027, 125),
    ('townhouses', 2027, 110)
ON CONFLICT (product_type, year) DO NOTHING;

-- ============================================
-- FUNCTION: update_updated_at_column
-- Trigger function to auto-update updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_rates_updated_at BEFORE UPDATE ON rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assumptions_updated_at BEFORE UPDATE ON assumptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supply_updated_at BEFORE UPDATE ON supply_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEW: company_overview
-- Convenient view for company listing with projection summary
-- ============================================
CREATE OR REPLACE VIEW company_overview AS
SELECT
    c.id,
    c.slug,
    c.name,
    c.base_year,
    c.employee_count as current_employees,
    c.data_quality,
    MAX(cp.employee_count) as projected_max_employees,
    MAX(cp.year) as projection_year,
    COUNT(r.id) as role_count
FROM companies c
LEFT JOIN company_projections cp ON c.id = cp.company_id
LEFT JOIN roles r ON c.id = r.company_id
GROUP BY c.id, c.slug, c.name, c.base_year, c.employee_count, c.data_quality;

-- ============================================
-- COMMENTS for documentation
-- ============================================
COMMENT ON TABLE rates IS 'Historical FHA and Conventional mortgage rates fetched from external sources';
COMMENT ON TABLE companies IS 'Techridge companies with basic metadata';
COMMENT ON TABLE company_projections IS 'Future headcount projections for companies';
COMMENT ON TABLE roles IS 'Role segments within each company with income data';
COMMENT ON TABLE household_splits IS 'Distribution of single vs dual-income households for each role';
COMMENT ON TABLE assumptions IS 'Global modeling assumptions for affordability calculations';
COMMENT ON TABLE supply_inventory IS 'Planned supply of housing units by product type and year';
COMMENT ON VIEW company_overview IS 'Convenient summary view of companies with projection data';
