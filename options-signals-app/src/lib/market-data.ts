/**
 * Market data service with Yahoo Finance integration
 * Falls back to realistic mock data if yahoo-finance2 is not available
 */

let yahooFinance: any = null;

/**
 * Dynamically import yahoo-finance2
 * This handles both ESM and CommonJS environments
 */
async function initializeYahooFinance() {
  if (yahooFinance !== null) {
    return yahooFinance;
  }

  try {
    // Try ESM import first (works in Next.js)
    yahooFinance = await import('yahoo-finance2');
    return yahooFinance;
  } catch (error) {
    console.warn('yahoo-finance2 not available or failed to load, using mock data:', error);
    return null;
  }
}

export interface MarketData {
  ticker: string;
  price: number;
  ivRank?: number; // Yahoo Finance may not provide this directly
}

export class YahooFinanceService {
  private static instance: YahooFinanceService;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<MarketData>> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds - much shorter for real-time updates
  private readonly REQUEST_TIMEOUT = 10000; // 10 second timeout per request
  private readonly MAX_RETRIES = 2;

  private constructor() {}

  static getInstance(): YahooFinanceService {
    if (!YahooFinanceService.instance) {
      YahooFinanceService.instance = new YahooFinanceService();
    }
    return YahooFinanceService.instance;
  }

  async getQuote(ticker: string): Promise<MarketData> {
    // Check cache first
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Avoid duplicate simultaneous requests for same ticker
    if (this.pendingRequests.has(ticker)) {
      return this.pendingRequests.get(ticker)!;
    }

    if (!yahooFinance) {
      throw new Error('Yahoo Finance not available');
    }

    const request = this.fetchQuoteWithRetry(ticker);
    this.pendingRequests.set(ticker, request);

    try {
      const data = await request;
      this.cache.set(ticker, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.pendingRequests.delete(ticker);
    }
  }

  private async fetchQuoteWithRetry(
    ticker: string,
    retryCount = 0
  ): Promise<MarketData> {
    try {
      const quote = await Promise.race([
        yahooFinance.quote(ticker),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.REQUEST_TIMEOUT)
        ),
      ]);

      if (!quote || !quote.regularMarketPrice) {
        throw new Error(`No data available for ${ticker}`);
      }

      const data: MarketData = {
        ticker,
        price: quote.regularMarketPrice,
      };

      return data;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        // Exponential backoff: 100ms, 200ms
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * Math.pow(2, retryCount))
        );
        return this.fetchQuoteWithRetry(ticker, retryCount + 1);
      }
      console.error(`Error fetching data for ${ticker}:`, error);
      throw error;
    }
  }

  async getQuotes(tickers: string[]): Promise<MarketData[]> {
    // Batch requests with concurrency control to avoid overwhelming the API
    const CONCURRENCY_LIMIT = 5;
    const results: MarketData[] = [];

    for (let i = 0; i < tickers.length; i += CONCURRENCY_LIMIT) {
      const batch = tickers.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.allSettled(
        batch.map((ticker) => this.getQuote(ticker))
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Failed to fetch quote:', result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Force refresh a quote, bypassing cache
   */
  async refreshQuote(ticker: string): Promise<MarketData> {
    this.cache.delete(ticker);
    this.pendingRequests.delete(ticker);
    return this.getQuote(ticker);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
  async getOptionsChain(ticker: string, expirationDate?: Date) {
    if (!yahooFinance) {
      throw new Error('Yahoo Finance not available');
    }

    try {
      const options = await yahooFinance.options(ticker, expirationDate);
      return options;
    } catch (error) {
      console.error(`Error fetching options for ${ticker}:`, error);
      throw error;
    }
  }
}

// Create a mock service for when yahoo-finance2 is not available
export class MockYahooFinanceService {
  private static instance: MockYahooFinanceService;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private priceHistory: Map<string, number[]> = new Map(); // Track price history for realistic movements
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds - match real service
  private readonly BASE_PRICES: Record<string, number> = {
    'NVDA': 118.42,
    'SPY': 549.3,
    'QQQ': 478.15,
    'TSLA': 232.8,
    'AAPL': 162.4,
    'MSFT': 412.05,
    'AMD': 148.6,
    'META': 485.2,
    'GOOGL': 172.85,
    'AMZN': 178.92,
    'IWM': 204.5,
    'COIN': 198.4,
  };

  private constructor() {}

  static getInstance(): MockYahooFinanceService {
    if (!MockYahooFinanceService.instance) {
      MockYahooFinanceService.instance = new MockYahooFinanceService();
    }
    return MockYahooFinanceService.instance;
  }

  /**
   * Generate realistic price with small random movements (0.05% to 0.3% change)
   */
  private generateRealisticPrice(ticker: string): number {
    const basePrice = this.BASE_PRICES[ticker] || 100 + Math.random() * 400;
    
    if (!this.priceHistory.has(ticker)) {
      this.priceHistory.set(ticker, [basePrice]);
    }

    const history = this.priceHistory.get(ticker)!;
    const lastPrice = history[history.length - 1];
    
    // Small random walk: ±0.05% to 0.3%
    const changePercent = (Math.random() - 0.5) * 0.005; // ±0.25%
    const newPrice = lastPrice * (1 + changePercent);
    
    // Keep only last 100 prices to avoid memory issues
    if (history.length > 100) {
      history.shift();
    }
    history.push(newPrice);
    
    return Math.round(newPrice * 100) / 100; // Round to 2 decimals
  }

  async getQuote(ticker: string): Promise<MarketData> {
    // Check cache first
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Simulate API call delay (1-100ms)
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 100)
    );

    const price = this.generateRealisticPrice(ticker);

    const data: MarketData = {
      ticker,
      price,
      ivRank: 20 + Math.floor(Math.random() * 60),
    };

    // Cache the result
    this.cache.set(ticker, { data, timestamp: Date.now() });

    return data;
  }

  async getQuotes(tickers: string[]): Promise<MarketData[]> {
    // Batch requests with slight delays to simulate real API behavior
    const CONCURRENCY_LIMIT = 5;
    const results: MarketData[] = [];

    for (let i = 0; i < tickers.length; i += CONCURRENCY_LIMIT) {
      const batch = tickers.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.allSettled(
        batch.map((ticker) => this.getQuote(ticker))
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
    }

    return results;
  }

  /**
   * Force refresh a quote, bypassing cache
   */
  async refreshQuote(ticker: string): Promise<MarketData> {
    this.cache.delete(ticker);
    return this.getQuote(ticker);
  }

  /**
   * Clear all cached data and price history
   */
  clearCache(): void {
    this.cache.clear();
    // Don't clear priceHistory - keep it for realistic movement
  }

  async getOptionsChain(ticker: string, expirationDate?: Date) {
    // Mock options data
    return {
      underlyingSymbol: ticker,
      expirationDates: [
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ],
      strikes: [],
      hasMiniOptions: false,
      quote: { regularMarketPrice: 100 + Math.random() * 400 },
    };
  }
}

// Try to use real Yahoo Finance, fall back to mock if not available
let yahooFinanceService: YahooFinanceService | MockYahooFinanceService;

// Check if yahoo-finance2 is available BEFORE trying to use it
if (yahooFinance) {
  console.log('Using Yahoo Finance service for real-time data');
  yahooFinanceService = YahooFinanceService.getInstance();
} else {
  console.log('Yahoo Finance not available, using mock data service with realistic price movements');
  yahooFinanceService = MockYahooFinanceService.getInstance();
}

export { yahooFinanceService };