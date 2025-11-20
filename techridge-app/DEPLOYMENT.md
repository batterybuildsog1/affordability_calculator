# Deployment Guide - Techridge Affordability Tool

## Overview

This guide walks you through deploying the Techridge Affordability Tool to Vercel with Neon Postgres and Neon Auth.

---

## Prerequisites

- ✅ Neon database created and schema deployed
- ✅ Neon Auth enabled with credentials
- ✅ GitHub repository created: `batterybuildsog1/affordability_calculator`
- ✅ Vercel account (free tier works fine)

---

## Part 1: Configure Neon Auth Domains (IMPORTANT!)

### Why This Matters

Stack Auth requires you to specify which domains are allowed to handle authentication callbacks. By default, only `localhost` is allowed for development. **You must add your production domain before deployment.**

### Option 1: Via Neon Console (Recommended - Easier)

1. Go to **Neon Console**: https://console.neon.tech
2. Select your project
3. Click **Auth** in the left sidebar
4. Click **Configuration** tab
5. Scroll to **Domains** section
6. Click **Add Domain**
7. Add your localhost for testing:
   ```
   http://localhost:3000
   ```
8. **After deploying to Vercel**, come back and add your production domain:
   ```
   https://your-app-name.vercel.app
   ```

### Option 2: Via Stack Auth Dashboard (Alternative)

1. Go to https://app.stack-auth.com
2. Log in with your Neon credentials
3. Select your project: `35f658ee-f7d9-4162-bc93-4964cdb4dde5`
4. Navigate to **Domain & Handlers** tab
5. Add your domains (same as above)

### Important Notes:

- ✅ Localhost is already allowed by default for development
- ⚠️ **You MUST add your Vercel domain after first deployment**
- ⚠️ If you forget this step, auth will fail with a redirect error
- 🔄 You can add multiple domains (staging, production, preview URLs)

---

## Part 2: Push to GitHub

### 1. Set Remote Repository

```bash
cd "/Users/alanknudson/Techridge apartment cost analysis and design/Affordability Calculator for Techridge residential plans"

git remote add origin https://github.com/batterybuildsog1/affordability_calculator.git
git branch -M main
```

### 2. Push to GitHub

```bash
git push -u origin main
```

Your code is now on GitHub!

---

## Part 3: Deploy to Vercel

### 1. Create Vercel Project

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repository: `batterybuildsog1/affordability_calculator`
4. **Important**: Set **Root Directory** to `techridge-app`
   - Vercel needs to know the Next.js app is in a subdirectory

### 2. Configure Environment Variables

In the Vercel project settings, add these environment variables:

```env
DATABASE_URL=postgresql://neondb_owner:npg_LKbRm79dzwal@ep-twilight-unit-afuk0i13-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

NEXT_PUBLIC_STACK_PROJECT_ID=35f658ee-f7d9-4162-bc93-4964cdb4dde5

NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_wpwygb6hegyphsat8hz7twy23xjg7ntmrxz82y2ez9gz8

STACK_SECRET_SERVER_KEY=ssk_wp70bdfdgckj86zn3hsrtkvv08g97egmxaeccqg3bc3h0

NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
```

⚠️ **Update `NEXT_PUBLIC_SITE_URL`** with your actual Vercel domain after deployment!

### 3. Deploy

Click **Deploy**

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your Next.js app
4. Deploy to a production URL

This takes about 2-3 minutes.

---

## Part 4: Post-Deployment Configuration

### 1. Get Your Vercel URL

After deployment, Vercel will show your production URL, e.g.:
```
https://affordability-calculator-xyz123.vercel.app
```

### 2. Update Environment Variable

Go back to Vercel project settings → Environment Variables → Edit `NEXT_PUBLIC_SITE_URL`:

```env
NEXT_PUBLIC_SITE_URL=https://affordability-calculator-xyz123.vercel.app
```

Redeploy for this to take effect.

### 3. Add Vercel Domain to Neon Auth (CRITICAL!)

Go back to **Part 1** and add your Vercel production URL to the allowed domains:

**Neon Console → Auth → Configuration → Domains → Add Domain:**
```
https://affordability-calculator-xyz123.vercel.app
```

Without this, authentication will fail in production!

### 4. Test Authentication

Visit your production app:
```
https://your-app.vercel.app/handler/sign-up
```

Create a test user and verify it appears in your Neon database.

---

## Part 5: Verify Database Connection

### 1. Check Tables in Neon

Connect to your Neon database:

```bash
psql 'postgresql://neondb_owner:npg_LKbRm79dzwal@ep-twilight-unit-afuk0i13-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
```

Verify tables exist:

```sql
\dt
```

You should see:
- rates
- companies
- company_projections
- roles
- household_splits
- assumptions
- supply_inventory
- (Stack Auth will add user tables automatically)

### 2. Test the App

Visit your production URL and verify:
- ✅ Homepage loads with company data
- ✅ GlobalDock controls work
- ✅ Rate slider updates demand
- ✅ Year/scenario toggles work
- ✅ Sign-up/sign-in works

---

## Part 6: Continuous Deployment

### Automatic Deployments

Vercel is now connected to your GitHub repository. Every time you push to `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy to production
4. Run tests (if configured)

### Preview Deployments

Every pull request gets its own preview URL. You can test changes before merging.

---

## Troubleshooting

### "Redirect URI not allowed" Error

**Problem**: Authentication redirects fail

**Solution**: Add your Vercel domain to Neon Auth allowed domains (see Part 1)

### "Database connection failed"

**Problem**: App can't connect to Neon

**Solution**:
1. Verify `DATABASE_URL` is correctly set in Vercel
2. Check Neon database is not paused (free tier auto-pauses after inactivity)
3. Ensure connection string includes `?sslmode=require`

### Build Fails on Vercel

**Problem**: TypeScript errors or missing dependencies

**Solution**:
1. Test build locally: `npm run build`
2. Fix any errors
3. Ensure `package.json` dependencies are correct
4. Push fixes to GitHub

### "Module not found" Errors

**Problem**: Vercel can't find Next.js app

**Solution**: Ensure Root Directory is set to `techridge-app` in Vercel settings

### Auth Works Locally but Not in Production

**Problem**: Sign-in works on localhost but fails on Vercel

**Solution**:
1. Verify production domain is added to Neon Auth
2. Check `NEXT_PUBLIC_SITE_URL` matches actual Vercel URL
3. Ensure all three Stack Auth env vars are set in Vercel

---

## Optional: Custom Domain

### Add Your Own Domain

1. In Vercel project → Settings → Domains
2. Add your custom domain (e.g., `techridge-affordability.com`)
3. Update DNS records as instructed by Vercel
4. Update environment variables:
   ```env
   NEXT_PUBLIC_SITE_URL=https://techridge-affordability.com
   ```
5. Add custom domain to Neon Auth allowed domains

---

## Security Checklist

Before going live:

- [ ] Database credentials are in Vercel environment variables (not in code)
- [ ] Stack Auth keys are in Vercel environment variables
- [ ] `.env.local` is in `.gitignore` (yes, already done)
- [ ] Production domain is whitelisted in Neon Auth
- [ ] Localhost callbacks are disabled in production (optional, for max security)
- [ ] SSL/HTTPS is enabled (Vercel does this automatically)

---

## Monitoring & Logs

### Vercel Logs

View real-time logs:
1. Vercel Dashboard → Your Project → Deployments
2. Click on a deployment
3. View **Build Logs** and **Function Logs**

### Neon Metrics

Monitor database:
1. Neon Console → Your Project → Monitoring
2. View query performance, connection count, storage usage

---

## Next Steps After Deployment

1. **Test with Real Data**: Add more companies to `data/` and push
2. **Enable FHA Live Rates**: Implement Phase 2 rate fetching
3. **Add Admin Features**: Create protected admin routes
4. **Set Up Analytics**: Add Vercel Analytics or Plausible
5. **Configure Alerts**: Set up Vercel notifications for failed deployments

---

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Stack Auth Docs**: https://docs.stack-auth.com
- **Next.js Docs**: https://nextjs.org/docs

---

## Quick Reference - All Your Credentials

### GitHub
```
Repository: https://github.com/batterybuildsog1/affordability_calculator
```

### Neon Database
```
Connection String: postgresql://neondb_owner:npg_LKbRm79dzwal@ep-twilight-unit-afuk0i13-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

Console: https://console.neon.tech
```

### Stack Auth
```
Project ID: 35f658ee-f7d9-4162-bc93-4964cdb4dde5
JWKS URL: https://api.stack-auth.com/api/v1/projects/35f658ee-f7d9-4162-bc93-4964cdb4dde5/.well-known/jwks.json
Dashboard: https://app.stack-auth.com
```

### Vercel
```
Dashboard: https://vercel.com/dashboard
(Your project URL will be here after deployment)
```

---

**You're all set! 🚀**

The Techridge Affordability Tool is now deployed and ready to use.
