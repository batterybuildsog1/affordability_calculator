import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { unstable_cache } from 'next/cache';

// Cached function to fetch and scrape the rate
const getFHARate = unstable_cache(
  async () => {
    try {
      console.log('Fetching FHA rate from Mortgage News Daily...');
      const response = await fetch('https://www.mortgagenewsdaily.com/mortgage-rates/30-year-fha', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Find the first rate cell in the table
      // Structure: <tr><td class="rate-date">...</td><td class="rate">5.98%</td>...</tr>
      const rateText = $('td.rate').first().text().trim();

      if (!rateText) {
        throw new Error('Could not find rate element');
      }

      // Parse "5.98%" -> 0.0598
      const rateValue = parseFloat(rateText.replace('%', ''));

      if (isNaN(rateValue)) {
        throw new Error(`Failed to parse rate: ${rateText}`);
      }

      return rateValue / 100;
    } catch (error) {
      console.error('Error scraping FHA rate:', error);
      return null;
    }
  },
  ['fha-rate'], // Cache key
  { revalidate: 86400 } // 24 hours
);

export async function GET() {
  const rate = await getFHARate();

  if (rate === null) {
    return NextResponse.json({ error: 'Failed to fetch rate' }, { status: 500 });
  }

  return NextResponse.json({
    rate,
    source: 'Mortgage News Daily',
    timestamp: new Date().toISOString()
  });
}
