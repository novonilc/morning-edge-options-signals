// Test script for market data integration
// This tests both real Yahoo Finance (if available) and mock fallback

async function testMarketData() {
  console.log('Testing market data integration...');

  try {
    // Dynamic import to handle missing yahoo-finance2 gracefully
    const { yahooFinanceService } = await import('./src/lib/market-data');

    // Test single quote
    console.log('Fetching NVDA quote...');
    const nvda = await yahooFinanceService.getQuote('NVDA');
    console.log('NVDA:', JSON.stringify(nvda, null, 2));

    // Test multiple quotes
    console.log('Fetching multiple quotes...');
    const quotes = await yahooFinanceService.getQuotes(['AAPL', 'MSFT']);
    console.log('Quotes:', JSON.stringify(quotes, null, 2));

    console.log('✅ Market data test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing market data:', error);
    console.log('This might be expected if yahoo-finance2 is not installed.');
    console.log('The app will fall back to mock data.');
  }
}

testMarketData().catch(console.error);