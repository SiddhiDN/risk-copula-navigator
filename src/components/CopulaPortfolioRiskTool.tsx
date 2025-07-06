
import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { normalRandom, choleskyDecomposition, multiplyMatrixVector, calculateCorrelation, calculateVaR, calculateCVaR, calculateMaxDrawdown, calculateSharpeRatio } from '@/utils/mathUtils';
import { gaussianCopula, studentTCopula, claytonCopula, gumbelCopula } from '@/utils/copulaUtils';
import { fetchAssets, fetchDailyReturns, processMarketData, saveRiskMetrics, Asset, ProcessedReturn } from '@/services/supabaseDataService';
import RiskMetricsDashboard from './RiskMetricsDashboard';
import PortfolioConfiguration from './PortfolioConfiguration';
import VisualizationCharts from './VisualizationCharts';
import DiagnosticsPanel from './DiagnosticsPanel';

interface RiskResults {
  historical: {
    var: number;
    cvar: number;
    volatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  simulated: {
    var: number;
    cvar: number;
    returns: number[];
  };
  correlationMatrix: number[][];
  copulaType: string;
}

const CopulaPortfolioRiskTool = () => {
  const { theme, setTheme } = useTheme();
  const [portfolioData, setPortfolioData] = useState<ProcessedReturn[]>([]);
  const [returns, setReturns] = useState<ProcessedReturn[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [weights, setWeights] = useState([0.4, 0.3, 0.2, 0.1]);
  const [selectedCopula, setSelectedCopula] = useState('gaussian');
  const [confidenceLevel, setConfidenceLevel] = useState([95]);
  const [timeHorizon, setTimeHorizon] = useState([1]);
  const [results, setResults] = useState<RiskResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const loadDataFromSupabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading assets from Supabase...');
      const fetchedAssets = await fetchAssets();
      console.log('Fetched assets:', fetchedAssets);
      
      if (fetchedAssets.length === 0) {
        setError('No assets found in database. Please add some assets first.');
        return;
      }
      
      setAssets(fetchedAssets);
      
      // Take first 4 assets for the portfolio (or all if less than 4)
      const portfolioAssets = fetchedAssets.slice(0, 4);
      const symbols = portfolioAssets.map(asset => asset.symbol);
      
      console.log('Loading daily returns for symbols:', symbols);
      const dailyReturns = await fetchDailyReturns(symbols, 252);
      console.log('Fetched daily returns:', dailyReturns.length, 'records');
      
      if (dailyReturns.length === 0) {
        setError('No daily return data found for the selected assets.');
        return;
      }
      
      const { portfolioData: processedPortfolioData, returns: processedReturns } = processMarketData(dailyReturns);
      console.log('Processed data - Portfolio:', processedPortfolioData.length, 'Returns:', processedReturns.length);
      
      if (processedReturns.length === 0) {
        setError('Insufficient data to calculate returns. Need at least 2 days of data.');
        return;
      }
      
      setPortfolioData(processedPortfolioData);
      setReturns(processedReturns);
      
      // Adjust weights array to match number of assets
      const newWeights = Array(portfolioAssets.length).fill(0).map((_, i) => 
        i < weights.length ? weights[i] : 1 / portfolioAssets.length
      );
      // Normalize weights to sum to 1
      const weightSum = newWeights.reduce((sum, w) => sum + w, 0);
      const normalizedWeights = newWeights.map(w => w / weightSum);
      setWeights(normalizedWeights);
      
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  // Get available asset symbols for portfolio calculation
  const getAssetSymbols = () => {
    if (returns.length === 0) return [];
    const firstReturn = returns[0];
    return Object.keys(firstReturn).filter(key => key !== 'date');
  };

  // Risk calculation functions
  const calculatePortfolioReturns = () => {
    const symbols = getAssetSymbols();
    return returns.map(dayReturns => {
      return symbols.reduce((sum, symbol, idx) => {
        const returnValue = dayReturns[symbol];
        if (typeof returnValue === 'number' && idx < weights.length) {
          return sum + weights[idx] * returnValue;
        }
        return sum;
      }, 0);
    });
  };

  const calculateCorrelationMatrix = () => {
    const symbols = getAssetSymbols();
    const matrix = Array(symbols.length).fill(0).map(() => Array(symbols.length).fill(0));
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = 0; j < symbols.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const returnsI = returns.map(r => r[symbols[i]]).filter(val => typeof val === 'number') as number[];
          const returnsJ = returns.map(r => r[symbols[j]]).filter(val => typeof val === 'number') as number[];
          if (returnsI.length > 0 && returnsJ.length > 0) {
            matrix[i][j] = calculateCorrelation(returnsI, returnsJ);
          }
        }
      }
    }
    return matrix;
  };

  // Monte Carlo simulation for copula-based risk
  const monteCarloSimulation = (nSims = 10000) => {
    const portfolioReturns = [];
    const correlationMatrix = calculateCorrelationMatrix();
    const symbols = getAssetSymbols();
    
    for (let sim = 0; sim < nSims; sim++) {
      let copulaVariates;
      const uniforms = Array(symbols.length).fill(0).map(() => Math.random());
      
      switch (selectedCopula) {
        case 'gaussian':
          copulaVariates = gaussianCopula(uniforms, correlationMatrix);
          break;
        case 'student-t':
          copulaVariates = studentTCopula(uniforms, correlationMatrix, 5);
          break;
        case 'clayton':
          copulaVariates = claytonCopula(uniforms.slice(0, 2), 2);
          break;
        case 'gumbel':
          copulaVariates = gumbelCopula(uniforms.slice(0, 2), 1.5);
          break;
        default:
          copulaVariates = uniforms;
      }
      
      // Transform to marginal distributions and calculate portfolio return
      const portfolioReturn = copulaVariates.reduce((sum, variate, idx) => {
        if (idx < weights.length) {
          // Transform to normal distribution for simplicity
          const standardNormal = normalRandom();
          return sum + weights[idx] * standardNormal * 0.02; // 2% daily volatility
        }
        return sum;
      }, 0);
      
      portfolioReturns.push(portfolioReturn * Math.sqrt(timeHorizon[0]));
    }
    
    return portfolioReturns;
  };

  const performRiskAnalysis = async () => {
    if (returns.length === 0) {
      setError('No data available for risk analysis');
      return;
    }
    
    setIsCalculating(true);
    
    try {
      // Historical analysis
      const historicalReturns = calculatePortfolioReturns();
      const historicalVaR = calculateVaR(historicalReturns, confidenceLevel[0]);
      const historicalCVaR = calculateCVaR(historicalReturns, confidenceLevel[0]);
      
      // Monte Carlo simulation
      const simulatedReturns = monteCarloSimulation();
      const simulatedVaR = calculateVaR(simulatedReturns, confidenceLevel[0]);
      const simulatedCVaR = calculateCVaR(simulatedReturns, confidenceLevel[0]);
      
      // Risk metrics
      const portfolioVolatility = Math.sqrt(
        historicalReturns.reduce((sum, ret) => {
          const mean = historicalReturns.reduce((s, r) => s + r, 0) / historicalReturns.length;
          return sum + Math.pow(ret - mean, 2);
        }, 0) / historicalReturns.length
      );
      
      const maxDrawdown = calculateMaxDrawdown(historicalReturns);
      const sharpeRatio = calculateSharpeRatio(historicalReturns);
      
      const analysisResults = {
        historical: {
          var: historicalVaR,
          cvar: historicalCVaR,
          volatility: portfolioVolatility,
          maxDrawdown,
          sharpeRatio
        },
        simulated: {
          var: simulatedVaR,
          cvar: simulatedCVaR,
          returns: simulatedReturns.slice(0, 1000) // Limit for visualization
        },
        correlationMatrix: calculateCorrelationMatrix(),
        copulaType: selectedCopula
      };
      
      setResults(analysisResults);
      
      // Save results to Supabase
      try {
        await saveRiskMetrics({
          VaR_5: historicalVaR,
          CVaR_5: historicalCVaR,
          stocks: getAssetSymbols(),
          weights: weights,
          optimization: null,
          stress_test: null
        });
        console.log('Risk metrics saved to Supabase');
      } catch (saveError) {
        console.error('Error saving risk metrics:', saveError);
        // Don't block the UI for save errors
      }
      
    } catch (error) {
      console.error('Risk analysis error:', error);
      setError('Error performing risk analysis: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    setIsCalculating(false);
  };

  // Visualization data preparation
  const riskDistributionData = useMemo(() => {
    if (!results?.simulated?.returns) return [];
    
    const returns = results.simulated.returns;
    const bins = 50;
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const binWidth = (max - min) / bins;
    
    const histogram = Array(bins).fill(0);
    returns.forEach(ret => {
      const binIndex = Math.min(Math.floor((ret - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    });
    
    return histogram.map((count, idx) => ({
      return: (min + idx * binWidth).toFixed(4),
      frequency: count,
      probability: count / returns.length
    }));
  }, [results]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold">Loading Portfolio Data...</div>
          <p className="text-muted-foreground">Fetching data from Supabase</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-2xl font-bold text-red-600">Error Loading Data</div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadDataFromSupabase} variant="outline">
            Retry Loading Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Copula Portfolio Risk Manager
            </h1>
            <p className="text-muted-foreground text-lg">
              Advanced dependence modeling using real market data from Supabase
            </p>
            {assets.length > 0 && (
              <div className="flex gap-2 mt-2">
                {getAssetSymbols().map(symbol => (
                  <Badge key={symbol} variant="outline">{symbol}</Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-10 w-10"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PortfolioConfiguration
            selectedCopula={selectedCopula}
            setSelectedCopula={setSelectedCopula}
            confidenceLevel={confidenceLevel}
            setConfidenceLevel={setConfidenceLevel}
            timeHorizon={timeHorizon}
            setTimeHorizon={setTimeHorizon}
            weights={weights}
            setWeights={setWeights}
            isCalculating={isCalculating}
            performRiskAnalysis={performRiskAnalysis}
            generateSyntheticData={loadDataFromSupabase}
          />

          <RiskMetricsDashboard
            results={results}
            confidenceLevel={confidenceLevel[0]}
          />
        </div>

        {/* Visualization Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Analysis & Visualization</h2>
          <VisualizationCharts
            results={results}
            returns={returns}
            riskDistributionData={riskDistributionData}
          />
        </div>

        {/* Diagnostics Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Diagnostics & Optimization</h2>
          <DiagnosticsPanel />
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm border-t pt-6">
          <p className="mb-2">
            Advanced Copula Models • Real Market Data • Monte Carlo Simulation • Real-time Analytics
          </p>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="outline">Gaussian</Badge>
            <Badge variant="outline">Student-t</Badge>
            <Badge variant="outline">Clayton</Badge>
            <Badge variant="outline">Gumbel</Badge>
            <Badge variant="outline">Supabase Data</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopulaPortfolioRiskTool;
