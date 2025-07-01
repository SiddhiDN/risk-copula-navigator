
// Yahoo Finance utility functions for NSE stock data
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Top NSE stocks by market cap and performance
const TOP_NSE_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
  'LT.NS', 'HCLTECH.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS',
  'SUNPHARMA.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'WIPRO.NS', 'NESTLEIND.NS',
  'POWERGRID.NS', 'NTPC.NS', 'TECHM.NS', 'JSWSTEEL.NS', 'TATAMOTORS.NS',
  'ADANIENT.NS', 'ONGC.NS', 'COALINDIA.NS', 'CIPLA.NS', 'DRREDDY.NS',
  'EICHERMOT.NS', 'GRASIM.NS', 'INDUSINDBK.NS', 'BAJFINANCE.NS', 'BPCL.NS',
  'TATACONSUM.NS', 'HEROMOTOCO.NS', 'HINDALCO.NS', 'BRITANNIA.NS', 'DIVISLAB.NS',
  'APOLLOHOSP.NS', 'BAJAJFINSV.NS', 'SHREECEM.NS', 'TATASTEEL.NS', 'PIDILITIND.NS',
  'GODREJCP.NS', 'SBILIFE.NS', 'ADANIPORTS.NS', 'HDFCLIFE.NS', 'UPL.NS'
];

export const fetchStockQuote = async (symbol: string): Promise<StockData | null> => {
  try {
    const yahooFinance = await import('yahoo-finance2');
    const quote = await yahooFinance.default.quote(symbol);
    
    return {
      symbol: quote.symbol || symbol,
      name: quote.longName || quote.shortName || symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

export const fetchTopNSEStocks = async (limit: number = 50): Promise<StockData[]> => {
  const stocks: StockData[] = [];
  const stocksToFetch = TOP_NSE_STOCKS.slice(0, limit);
  
  console.log('Fetching NSE stock data...');
  
  // Fetch stocks in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < stocksToFetch.length; i += batchSize) {
    const batch = stocksToFetch.slice(i, i + batchSize);
    const batchPromises = batch.map(symbol => fetchStockQuote(symbol));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(stock => stock !== null) as StockData[];
      stocks.push(...validResults);
      
      // Add delay between batches
      if (i + batchSize < stocksToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error fetching batch:', error);
    }
  }
  
  // Sort by performance (change percent) descending
  return stocks.sort((a, b) => b.changePercent - a.changePercent);
};

export const fetchHistoricalData = async (
  symbol: string, 
  period: string = '1y'
): Promise<HistoricalData[]> => {
  try {
    const yahooFinance = await import('yahoo-finance2');
    const endDate = new Date();
    const startDate = new Date();
    
    // Set start date based on period
    switch (period) {
      case '1m':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1y':
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    const historical = await yahooFinance.default.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    return historical.map(day => ({
      date: day.date.toISOString().split('T')[0],
      open: day.open || 0,
      high: day.high || 0,
      low: day.low || 0,
      close: day.close || 0,
      volume: day.volume || 0
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
};

export const calculateReturns = (prices: number[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = Math.log(prices[i] / prices[i - 1]);
    returns.push(dailyReturn);
  }
  return returns;
};
