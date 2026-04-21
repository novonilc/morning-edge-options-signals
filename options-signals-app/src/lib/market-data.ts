// Conditionally import yahoo-finance2
let yahooFinance: any = null;
try {
  yahooFinance = require('yahoo-finance2');
} catch (error) {
  console.warn('yahoo-finance2 not available, using mock data');
}

export interface MarketData {
  ticker: string;
  price: number;
  ivRank?: number; // Yahoo Finance may not provide this directly
}

export class YahooFinanceService {
  private static instance: YahooFinanceService;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    if (!yahooFinance) {
      throw new Error('Yahoo Finance not available');
    }

    try {
      const quote = await yahooFinance.quote(ticker);

      if (!quote || !quote.regularMarketPrice) {
        throw new Error(`No data available for ${ticker}`);
      }

      const data: MarketData = {
        ticker,
        price: quote.regularMarketPrice,
        // Yahoo Finance doesn't provide IV rank directly
        // We might need to calculate it or use a different source
      };

      // Cache the result
      this.cache.set(ticker, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error);
      throw error;
    }
  }

  async getQuotes(tickers: string[]): Promise<MarketData[]> {
    const promises = tickers.map(ticker => this.getQuote(ticker));
    return Promise.all(promises);
  }

  // For options data, Yahoo Finance has options chain data
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
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): MockYahooFinanceService {
    if (!MockYahooFinanceService.instance) {
      MockYahooFinanceService.instance = new MockYahooFinanceService();
    }
    return MockYahooFinanceService.instance;
  }

  async getQuote(ticker: string): Promise<MarketData> {
    // Check cache first
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Mock data
    const mockPrices: Record<string, number> = {
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

    const price = mockPrices[ticker] || 100 + Math.random() * 400;

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
    const promises = tickers.map(ticker => this.getQuote(ticker));
    return Promise.all(promises);
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

try {
  yahooFinanceService = YahooFinanceService.getInstance();
} catch (error) {
  console.warn('Yahoo Finance not available, using mock data:', error);
  yahooFinanceService = MockYahooFinanceService.getInstance();
}

export { yahooFinanceService };