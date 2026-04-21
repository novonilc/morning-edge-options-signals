/**
 * Utility function to get live market data with optional force refresh
 * Usage in API routes to bypass cache when needed
 */

import { yahooFinanceService } from './market-data';

export async function getLiveQuotes(
  tickers: string[],
  forceRefresh = false
): Promise<any[]> {
  if (forceRefresh) {
    // Refresh each ticker
    const promises = tickers.map((ticker) =>
      yahooFinanceService.refreshQuote(ticker)
    );
    return Promise.allSettled(promises);
  }

  // Normal cached request
  return yahooFinanceService.getQuotes(tickers);
}

export async function getLiveQuote(
  ticker: string,
  forceRefresh = false
): Promise<any> {
  if (forceRefresh) {
    return yahooFinanceService.refreshQuote(ticker);
  }

  return yahooFinanceService.getQuote(ticker);
}

/**
 * Clear market data cache - useful for manual refresh
 */
export function clearMarketDataCache(): void {
  yahooFinanceService.clearCache();
}