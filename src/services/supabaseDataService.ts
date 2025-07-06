
import { supabase } from '@/integrations/supabase/client';

export interface Asset {
  id: number;
  symbol: string;
  name: string | null;
  sector: string | null;
}

export interface DailyReturn {
  id: string;
  symbol: string;
  date: string | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface ProcessedReturn {
  date: string;
  [key: string]: number | string;
}

export const fetchAssets = async (): Promise<Asset[]> => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('symbol');
  
  if (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchDailyReturns = async (symbols: string[], limit: number = 252): Promise<DailyReturn[]> => {
  const { data, error } = await supabase
    .from('daily_return')
    .select('*')
    .in('symbol', symbols)
    .order('date', { ascending: false })
    .limit(limit * symbols.length);
  
  if (error) {
    console.error('Error fetching daily returns:', error);
    throw error;
  }
  
  return data || [];
};

export const processMarketData = (dailyReturns: DailyReturn[]): { portfolioData: ProcessedReturn[], returns: ProcessedReturn[] } => {
  // Group data by date
  const dataByDate = new Map<string, { [symbol: string]: DailyReturn }>();
  
  dailyReturns.forEach(item => {
    if (!item.date || !item.close) return;
    
    if (!dataByDate.has(item.date)) {
      dataByDate.set(item.date, {});
    }
    dataByDate.get(item.date)![item.symbol] = item;
  });
  
  // Convert to portfolio data format
  const sortedDates = Array.from(dataByDate.keys()).sort();
  const portfolioData: ProcessedReturn[] = [];
  const returns: ProcessedReturn[] = [];
  
  let previousPrices: { [symbol: string]: number } = {};
  
  sortedDates.forEach((date, index) => {
    const dayData = dataByDate.get(date)!;
    const portfolioEntry: ProcessedReturn = { date };
    
    // Add price data
    Object.keys(dayData).forEach(symbol => {
      const item = dayData[symbol];
      if (item.close !== null) {
        portfolioEntry[symbol] = item.close;
      }
    });
    
    portfolioData.push(portfolioEntry);
    
    // Calculate returns (skip first day)
    if (index > 0) {
      const returnEntry: ProcessedReturn = { date };
      let hasReturns = false;
      
      Object.keys(dayData).forEach(symbol => {
        const item = dayData[symbol];
        if (item.close !== null && previousPrices[symbol] !== undefined) {
          const currentPrice = item.close;
          const previousPrice = previousPrices[symbol];
          if (previousPrice > 0) {
            returnEntry[symbol] = Math.log(currentPrice / previousPrice);
            hasReturns = true;
          }
        }
      });
      
      if (hasReturns) {
        returns.push(returnEntry);
      }
    }
    
    // Update previous prices
    Object.keys(dayData).forEach(symbol => {
      const item = dayData[symbol];
      if (item.close !== null) {
        previousPrices[symbol] = item.close;
      }
    });
  });
  
  return { portfolioData: portfolioData.reverse(), returns: returns.reverse() };
};

export const saveRiskMetrics = async (metrics: {
  VaR_5: number;
  CVaR_5: number;
  stocks: string[];
  weights: number[];
  optimization?: any;
  stress_test?: any;
}) => {
  const { data, error } = await supabase
    .from('risk_metrics')
    .insert({
      VaR_5: metrics.VaR_5,
      CVaR_5: metrics.CVaR_5,
      stocks: metrics.stocks,
      weights: metrics.weights,
      optimization: metrics.optimization,
      stress_test: metrics.stress_test
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving risk metrics:', error);
    throw error;
  }
  
  return data;
};
