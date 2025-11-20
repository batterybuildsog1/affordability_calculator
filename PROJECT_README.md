# Techridge Affordability & Demand Forecasting Tool

Comprehensive affordability and demand analysis for residential development at Techridge in St. George, Utah.

## Repository Structure

```
.
├── techridge-app/          # Next.js web application
├── database/               # Database schema and migrations
├── data/                   # Company data JSON files
├── calc_affordability.py   # Python affordability calculator
├── README.md              # Detailed project documentation
├── design.md              # UI/UX design specifications
└── CLAUDE.md              # Development guidelines
```

## Components

### 1. Python Affordability Engine

Located in the root directory:
- `calc_affordability.py` - Core affordability calculations
- `data/*.json` - Company role and income data

**Usage:**
```bash
python calc_affordability.py
```

### 2. Next.js Web Application

Located in `techridge-app/`:
- Modern web UI with interactive rate sensitivity
- Real-time demand forecasting
- Company-level analysis
- Income band explorer

**Quick Start:**
```bash
cd techridge-app
npm install
npm run dev
```

See `techridge-app/README.md` for detailed setup instructions.

### 3. Database Schema

Located in `database/`:
- `schema.sql` - Complete Neon Postgres schema
- Stores rates, companies, roles, and assumptions
- Ready to deploy to Neon database

## Key Features

- **Multi-Company Analysis**: Track 14+ Techridge companies
- **Income Modeling**: Base salary vs OTE scenarios
- **Household Types**: Single, dual-moderate, dual-peer income households
- **Rate Sensitivity**: Test affordability at different interest rates
- **Product Types**: Apartments, Condos, Blackridge SFH, Townhouses
- **Projection Years**: 2025, 2026, 2027+

## Housing Products Analyzed

1. **Techridge Apartments**: $1,700-4,500/month
2. **Techridge Condos**: $450,000-650,000
3. **Blackridge Cove SFH**: $620,000-680,000
4. **Townhouses**: $1.1M-2.1M

## Underwriting Assumptions

- **DTI Limit**: 0.45 (front-end)
- **FHA Rate**: 6.15% (includes 0.25% MIP)
- **Conventional Rate**: 6.45%
- **FHA Down**: 3.5%
- **Conventional Down**: 10%
- **Tax/Ins/HOA**: 1.2% of property value annually
- **Income Growth**: 4% annually

## Quick Setup

### 1. Database Setup

```bash
# Connect to Neon
psql 'postgresql://neondb_owner:npg_LKbRm79dzwal@ep-twilight-unit-afuk0i13-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'

# Run schema
\i database/schema.sql
```

### 2. Run Web Application

```bash
cd techridge-app
npm install
npm run dev
```

Visit http://localhost:3000

### 3. Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

Then connect your GitHub repo to Vercel and deploy.

## Documentation

- **README.md** - Comprehensive methodology and data sources
- **design.md** - UI/UX architecture and component design
- **CLAUDE.md** - Development practices and guidelines
- **techridge-app/README.md** - Next.js application documentation
- **techridge-app/SETUP.md** - Step-by-step setup guide

## Data Quality

Companies are tagged with data quality indicators:
- **Rich**: Strong public salary data (Vasion, Zonos, Planstin, Zion)
- **Medium**: Industry benchmarks (AlignOps, Kirton McConkie, Eaglegate)
- **Thin**: Estimated using similar companies (Mango, DigiVoice, HFB, CentraCom, Brodie)

## Technology Stack

### Python Engine
- Python 3.13
- NumPy, Pandas

### Web Application
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Neon Postgres

### Deployment
- Vercel (Frontend)
- Neon (Database)

## Development Workflow

1. **Update Company Data**: Edit JSON files in `data/`
2. **Test Calculations**: Run Python scripts to verify
3. **Sync to Database**: Run migration scripts (Phase 2)
4. **Deploy**: Push to GitHub, auto-deploy via Vercel

## Roadmap

### Phase 1 (Complete)
- [x] Python affordability engine
- [x] Company data collection
- [x] Database schema design
- [x] Next.js application setup
- [x] Basic UI with rate controls
- [x] Ecosystem overview page

### Phase 2 (Planned)
- [ ] Neon Auth integration
- [ ] Live FHA rate fetching
- [ ] Admin interface for companies
- [ ] Rate history visualization
- [ ] Export functionality

### Phase 3 (Future)
- [ ] DSCR/STR underwriting for townhouses
- [ ] Survey data integration
- [ ] MLS/Zillow integration
- [ ] Advanced reporting

## Contributing

For development guidelines, see `CLAUDE.md`.

## License

Proprietary - Techridge Development

## Support

For questions or support, contact the development team.
