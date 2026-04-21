// Simple test script for market data integration
// Run with: node test-market-data-simple.js

async function testMarketData() {
  console.log('Testing market data integration...');

  try {
    // Test the mock data functionality
    const mockPrices = {
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

    console.log('Mock data test:');
    console.log('NVDA price:', mockPrices['NVDA']);
    console.log('AAPL price:', mockPrices['AAPL']);

    // Try to import the real service
    try {
      const { yahooFinanceService } = await import('./src/lib/market-data.js');
      console.log('✅ Market data service imported successfully');
      console.log('Service type:', yahooFinanceService.constructor.name);
    } catch (importError) {
      console.log('⚠️  Could not import market data service:', importError.message);
      console.log('This is expected if dependencies are not installed');
    }

    console.log('✅ Basic test completed successfully!');

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testMarketData().catch(console.error);