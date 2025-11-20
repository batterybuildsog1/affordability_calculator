# Setup Guide for Techridge Affordability Tool

## Step 1: Database Setup (Neon)

### 1.1 Connect to Your Neon Database

```bash
psql 'postgresql://neondb_owner:npg_LKbRm79dzwal@ep-twilight-unit-afuk0i13-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

### 1.2 Run the Schema Script

Once connected to Neon, run:

```sql
\i database/schema.sql
```

This will create all necessary tables:
- `rates` - Mortgage rate history
- `companies` - Company profiles
- `company_projections` - Future headcount projections
- `roles` - Role segments with income data
- `household_splits` - H1/H2/H3 distributions
- `assumptions` - Global modeling assumptions
- `supply_inventory` - Planned housing supply

The script also includes default data for assumptions and supply inventory.

### 1.3 Verify Tables Were Created

```sql
\dt
```

You should see all the tables listed above.

## Step 2: Application Setup

### 2.1 Environment Variables

The `.env.local` file has been created with your Neon connection string. No changes needed unless you want to use a different database.

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

## Step 3: Neon Auth Setup (Optional - Phase 2)

### 3.1 Enable Neon Auth

1. Go to your Neon project dashboard
2. Navigate to the "Auth" tab
3. Click "Enable Neon Auth"

### 3.2 Get Your Credentials

Copy these values:
- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

### 3.3 Add to Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
STACK_SECRET_SERVER_KEY=your_secret_key
```

### 3.4 Install Neon Auth Package

```bash
npm install @neondatabase/auth-nextjs
```

## Step 4: Vercel Deployment

### 4.1 Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 4.2 Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository: `batterybuildsog1/affordability_calculator`
4. Select the `techridge-app` directory as the root

### 4.3 Configure Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

```
DATABASE_URL=postgresql://neondb_owner:npg_LKbRm79dzwal@ep-twilight-unit-afuk0i13-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
```

If using Neon Auth, also add:
```
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
STACK_SECRET_SERVER_KEY=your_secret_key
```

### 4.4 Deploy

Click "Deploy" and Vercel will build and deploy your application.

## Step 5: Populate Database (Optional)

If you want to migrate your existing company data from JSON files to the database, you can create a migration script. The application currently loads data from JSON files in the `data/` directory, which works fine for Phase 1.

For Phase 2, we'll create an admin interface to manage companies directly in the database.

## Troubleshooting

### "Failed to fetch live rate"

This is expected in Phase 1. The API returns a static rate. In Phase 2, we'll implement live rate fetching from Mortgage News Daily.

### Database Connection Errors

Make sure your `DATABASE_URL` is correct and that your Neon database is running. You can test the connection with:

```bash
psql "your-connection-string" -c "SELECT NOW();"
```

### Build Errors

If you encounter TypeScript errors during build, make sure all dependencies are installed:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Test the Application**: Open http://localhost:3000 and verify all pages load
2. **Review Companies**: Check the homepage to see the list of companies
3. **Adjust Rates**: Use the GlobalDock at the bottom to change rates and see demand shift
4. **Add More Companies**: Create new JSON files in `data/` following the existing format

## Support

For questions or issues, refer to the main README.md or contact the development team.
