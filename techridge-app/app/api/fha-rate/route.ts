/**
 * FHA Rate API Endpoint
 * Returns the latest FHA 30-year rate
 * Phase 1: Returns static fallback (6.15%)
 * Phase 2: Will fetch from external source and cache in Neon
 */

import { NextResponse } from 'next/server';
import { CONSTANTS } from '@/lib/model';

export async function GET() {
  try {
    // Phase 1: Return static rate
    // TODO Phase 2: Check Neon database for today's rate
    // TODO Phase 2: If not found, fetch from external source (MND) and store

    const rateData = {
      rate: CONSTANTS.FHA_RATE,
      date: new Date().toISOString().split('T')[0],
      source: 'static',
      message: 'Using static FHA rate. Connect to Neon database to enable live rates.',
    };

    return NextResponse.json(rateData);
  } catch (error) {
    console.error('Error fetching FHA rate:', error);

    // Fallback to static rate on error
    return NextResponse.json(
      {
        rate: CONSTANTS.FHA_RATE,
        date: new Date().toISOString().split('T')[0],
        source: 'fallback',
        error: 'Failed to fetch live rate, using fallback',
      },
      { status: 200 }
    );
  }
}
