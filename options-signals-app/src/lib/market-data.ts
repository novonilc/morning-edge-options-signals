export interface MarketData {
  ticker: string;
  price: number;
  ivRank?: number;
}

// ─── Yahoo Finance HTTP Service ─────────────────────────────────────────────
// Calls Yahoo Finance's public REST API directly via fetch.
// No API key, no npm package, works from anywhere including Canada.
// Uses the bulk /v7/finance/quote endpoint — one request for all tickers.

export class YahooHttpService {
  private static instance: YahooHttpService;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  private constructor() {}

  static getInstance(): YahooHttpService {
    if (!YahooHttpService.instance) {
      YahooHttpService.instance = new YahooHttpService();
    }
    return YahooHttpService.instance;
  }

  async getQuote(ticker: string): Promise<MarketData> {
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    );

    if (!res.ok) throw new Error(`Yahoo HTTP error for ${ticker}: ${res.status}`);

    const json = await res.json() as {
      chart: { result: { meta: { regularMarketPrice: number; previousClose: number } }[] };
    };

    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`No Yahoo data for ${ticker}`);

    const price = meta.regularMarketPrice || meta.previousClose;
    if (!price) throw new Error(`Zero price from Yahoo for ${ticker}`);

    const data: MarketData = { ticker, price };
    this.cache.set(ticker, { data, timestamp: Date.now() });
    return data;
  }

  async getQuotes(tickers: string[]): Promise<MarketData[]> {
    // Yahoo bulk endpoint — all tickers in a single request
    const symbols = tickers.join(',');
    try {
      const res = await fetch(
        `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );

      if (!res.ok) throw new Error(`Yahoo bulk quote failed: ${res.status}`);

      const json = await res.json() as {
        quoteResponse: {
          result: { symbol: string; regularMarketPrice: number; regularMarketPreviousClose: number }[];
        };
      };

      const results = json?.quoteResponse?.result ?? [];
      return results
        .map((q) => {
          const price = q.regularMarketPrice || q.regularMarketPreviousClose;
          if (!price) return null;
          const data: MarketData = { ticker: q.symbol, price };
          this.cache.set(q.symbol, { data, timestamp: Date.now() });
          return data;
        })
        .filter((d): d is MarketData => d !== null);
    } catch {
      // Bulk failed — fall back to per-ticker calls
      const results = await Promise.allSettled(tickers.map((t) => this.getQuote(t)));
      return results
        .filter((r): r is PromiseFulfilledResult<MarketData> => r.status === 'fulfilled')
        .map((r) => r.value);
    }
  }

  async refreshQuote(ticker: string): Promise<MarketData> {
    this.cache.delete(ticker);
    return this.getQuote(ticker);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async getOptionsChain(ticker: string, _expirationDate?: Date) {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/options/${ticker}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    );
    if (!res.ok) throw new Error(`Yahoo options chain failed for ${ticker}: ${res.status}`);
    return res.json();
  }
}

// ─── Finnhub Data Service ───────────────────────────────────────────────────
// Free tier: 60 calls/min, real-time US quotes.
// Set FINNHUB_API_KEY in .env.local to enable.
// Falls back to previous close when market is closed (c === 0).

export class FinnhubDataService {
  private static instance: FinnhubDataService;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 15 * 1000; // 15 seconds
  private readonly BASE_URL = 'https://finnhub.io/api/v1';

  private constructor(private readonly apiKey: string) {}

  static getInstance(apiKey: string): FinnhubDataService {
    if (!FinnhubDataService.instance) {
      FinnhubDataService.instance = new FinnhubDataService(apiKey);
    }
    return FinnhubDataService.instance;
  }

  async getQuote(ticker: string): Promise<MarketData> {
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const res = await fetch(
      `${this.BASE_URL}/quote?symbol=${ticker}&token=${this.apiKey}`,
    );

    if (!res.ok) throw new Error(`Finnhub error for ${ticker}: ${res.status}`);

    const json = await res.json() as { c: number; pc: number };

    // c = current price (0 when market closed), pc = previous close
    const price = json.c || json.pc;
    if (!price) throw new Error(`No Finnhub price for ${ticker}`);

    const data: MarketData = { ticker, price };
    this.cache.set(ticker, { data, timestamp: Date.now() });
    return data;
  }

  async getQuotes(tickers: string[]): Promise<MarketData[]> {
    const results: MarketData[] = [];
    for (const ticker of tickers) {
      try {
        results.push(await this.getQuote(ticker));
        await new Promise((r) => setTimeout(r, 100)); // stay under 60 req/min
      } catch (err) {
        console.error(`Finnhub: failed to fetch ${ticker}:`, err);
      }
    }
    return results;
  }

  async refreshQuote(ticker: string): Promise<MarketData> {
    this.cache.delete(ticker);
    return this.getQuote(ticker);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async getOptionsChain(ticker: string, _expirationDate?: Date) {
    const res = await fetch(
      `${this.BASE_URL}/stock/option-chain?symbol=${ticker}&token=${this.apiKey}`,
    );
    if (!res.ok) throw new Error(`Finnhub options chain failed for ${ticker}: ${res.status}`);
    return res.json();
  }
}

// ─── Mock Service ───────────────────────────────────────────────────────────
// Last-resort fallback when all live sources fail.

export class MockMarketDataService {
  private static instance: MockMarketDataService;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private readonly CACHE_DURATION = 30 * 1000;
  private readonly BASE_PRICES: Record<string, number> = {
    NVDA: 131.0, SPY: 578.0, QQQ: 498.0, TSLA: 248.0,
    AAPL: 207.0, MSFT: 415.0, AMD: 128.0, META: 545.0,
    GOOGL: 183.0, AMZN: 205.0, IWM: 218.0, COIN: 232.0,
  };

  private constructor() {}

  static getInstance(): MockMarketDataService {
    if (!MockMarketDataService.instance) {
      MockMarketDataService.instance = new MockMarketDataService();
    }
    return MockMarketDataService.instance;
  }

  private nextPrice(ticker: string): number {
    const base = this.BASE_PRICES[ticker] ?? 150;
    if (!this.priceHistory.has(ticker)) this.priceHistory.set(ticker, [base]);
    const history = this.priceHistory.get(ticker)!;
    const last = history[history.length - 1];
    const next = last * (1 + (Math.random() - 0.5) * 0.005);
    if (history.length > 100) history.shift();
    history.push(next);
    return Math.round(next * 100) / 100;
  }

  async getQuote(ticker: string): Promise<MarketData> {
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) return cached.data;
    const data: MarketData = { ticker, price: this.nextPrice(ticker), ivRank: 20 + Math.floor(Math.random() * 60) };
    this.cache.set(ticker, { data, timestamp: Date.now() });
    return data;
  }

  async getQuotes(tickers: string[]): Promise<MarketData[]> {
    return Promise.all(tickers.map((t) => this.getQuote(t)));
  }

  async refreshQuote(ticker: string): Promise<MarketData> {
    this.cache.delete(ticker);
    return this.getQuote(ticker);
  }

  clearCache(): void { this.cache.clear(); }

  async getOptionsChain(ticker: string, _expirationDate?: Date) {
    return {
      underlyingSymbol: ticker,
      expirationDates: [
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      ],
      strikes: [],
    };
  }
}

// ─── Service selection ──────────────────────────────────────────────────────
// Priority: Finnhub (if FINNHUB_API_KEY set) → Yahoo Finance HTTP → Mock
//
// Yahoo Finance HTTP requires no API key and works from Canada.
// It is used automatically as the free real-time source.

export type MarketDataService = FinnhubDataService | YahooHttpService | MockMarketDataService;

function buildService(): MarketDataService {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    console.log('[market-data] Using Finnhub');
    return FinnhubDataService.getInstance(finnhubKey);
  }
  console.log('[market-data] Using Yahoo Finance HTTP (no API key required)');
  return YahooHttpService.getInstance();
}

export const yahooFinanceService: MarketDataService = buildService();
