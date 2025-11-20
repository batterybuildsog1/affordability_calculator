# Techridge Affordability Tool

Next.js application for analyzing housing affordability and demand forecasting for Techridge residential development in St. George, Utah.

## Features

- Real-time affordability calculations based on income, rates, and household types
- Interactive UI with rate sensitivity analysis
- Company-level demand forecasting
- Income band explorer
- Dark glass UI theme optimized for presentations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon Postgres
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Auth**: Neon Auth (Phase 2)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon Postgres database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/batterybuildsog1/affordability_calculator.git
cd affordability_calculator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Neon database connection string.

4. Initialize the database:
```bash
# Connect to your Neon database using psql
psql "your-neon-connection-string"

# Run the schema file
\i ../database/schema.sql
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
techridge-app/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── companies/         # Company detail pages
│   ├── bands/            # Income band explorer
│   └── assumptions/      # Assumptions admin page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── visuals/          # Charts and visualizations
│   └── controllers/      # GlobalDock and controls
├── context/              # React context providers
├── lib/                  # Core logic and utilities
│   ├── model.ts          # Affordability engine (ported from Python)
│   ├── db.ts             # Database client
│   └── companies.ts      # Company data loader
└── data/                 # Company JSON files

## Database Setup

The database schema is located in `../database/schema.sql`. It includes:

- `rates` - Historical mortgage rates
- `companies` - Company information
- `roles` - Role segments with income data
- `household_splits` - H1/H2/H3 distributions
- `assumptions` - Global modeling assumptions
- `supply_inventory` - Planned housing supply

## Development

### Adding a New Company

1. Create a JSON file in `data/[company-name].json` following the schema in `data/companies.json`
2. The application will automatically load and display the new company

### Modifying the Affordability Model

The core affordability engine is in `lib/model.ts`. It's a TypeScript port of the Python implementation in the parent directory.

Key functions:
- `calculateMaxPurchasePrice()` - Computes max affordable price
- `computeHouseholdBandCounts()` - Maps roles to household income bands
- `summarizeDemandByProduct()` - Aggregates demand by product type

## Deployment

### Vercel Deployment

1. Push to GitHub:
```bash
git push origin main
```

2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your Neon connection string
4. Deploy

The application will automatically deploy on every push to main.

## Phase 2 Enhancements

- [ ] Neon Auth integration for user management
- [ ] Live FHA rate fetching from Mortgage News Daily
- [ ] Admin interface for editing companies and assumptions
- [ ] Rate history visualization
- [ ] Export to PDF/Excel functionality
- [ ] DSCR/STR underwriting for townhouses

## License

Proprietary - Techridge Development

## Contact

For questions or support, contact the development team.
