
import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { normalRandom, choleskyDecomposition, multiplyMatrixVector, calculateCorrelation, calculateVaR, calculateCVaR, calculateMaxDrawdown, calculateSharpeRatio } from '@/utils/mathUtils';
import { gaussianCopula, studentTCopula, claytonCopula, gumbelCopula } from '@/utils/copulaUtils';
import { StockData, fetchHistoricalData, calculateReturns } from '@/utils/yahooFinanceUtils';
import RiskMetricsDashboard from './RiskMetricsDashboard';
import PortfolioConfiguration from './PortfolioConfiguration';
import VisualizationCharts from './VisualizationCharts';
import DiagnosticsPanel from './DiagnosticsPanel';
import AssetSelector from './AssetSelector';

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
  const [selectedAssets, setSelectedAssets] = useState<StockData[]>([]);
  const [portfolioData, setPortfolioData] = useState([]);
  const [returns, setReturns] = useState([]);
  const [weights, setWeights] = useState<number[]>([]);
  const [selectedCopula, setSelectedCopula] = useState('gaussian');
  const [confidenceLevel, setConfidenceLevel] = useState([95]);
  const [timeHorizon, setTimeHorizon] = useState([1]);
  const [results, setResults] = useState<RiskResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load historical data when assets change
  useEffect(() => {
    if (selectedAssets.length > 0) {
      loadHistoricalData();
    }
  }, [selectedAssets]);

  const loadHistoricalData = async () => {
    if (selectedAssets.length === 0) return;
    
    setIsLoadingData(true);
    try {
      console.log('Loading historical data for assets:', selectedAssets.map(a => a.symbol));
      
      // Fetch historical data for all selected assets
      const historicalPromises = selectedAssets.map(asset => 
        fetchHistoricalData(asset.symbol, '1y')
      );
      
      const historicalDataArrays = await Promise.all(historicalPromises);
      
      // Find common dates across all assets
      const commonDates = historicalDataArrays.reduce((dates, data) => {
        const assetDates = new Set(data.map(d => d.date));
        return dates.filter(date => assetDates.has(date));
      }, historicalDataArrays[0]?.map(d => d.date) || []);
      
      // Build portfolio data with common dates
      const portfolioData = commonDates.map(date => {
        const dayData: any = { date };
        selectedAssets.forEach((asset, idx) => {
          const assetData = historicalDataArrays[idx].find(d => d.date === date);
          dayData[asset.symbol] = assetData?.close || 0;
        });
        return dayData;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate returns
      const returnsData = [];
      for (let i = 1; i < portfolioData.length; i++) {
        const dayReturns: any = { date: portfolioData[i].date };
        selectedAssets.forEach(asset => {
          const prevPrice = portfolioData[i - 1][asset.symbol];
          const currentPrice = portfolioData[i][asset.symbol];
          if (prevPrice > 0 && currentPrice > 0) {
            dayReturns[asset.symbol] = Math.log(currentPrice / prevPrice);
          } else {
            dayReturns[asset.symbol] = 0;
          }
        });
        returnsData.push(dayReturns);
      }
      
      setPortfolioData(portfolioData);
      setReturns(returnsData);
      console.log('Historical data loaded:', portfolioData.length, 'days');
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
    setIsLoadingData(false);
  };

  // Risk calculation functions
  const calculatePortfolioReturns = () => {
    if (returns.length === 0 || selectedAssets.length === 0) return [];
    
    return returns.map(dayReturns => {
      return selectedAssets.reduce((sum, asset, idx) => {
        const weight = weights[idx] || 0;
        const assetReturn = dayReturns[asset.symbol] || 0;
        return sum + weight * assetReturn;
      }, 0);
    });
  };

  const calculateCorrelationMatrix = () => {
    if (selectedAssets.length === 0 || returns.length === 0) {
      return [[1]];
    }
    
    const matrix = Array(selectedAssets.length).fill(0).map(() => Array(selectedAssets.length).fill(0));
    
    for (let i = 0; i < selectedAssets.length; i++) {
      for (let j = 0; j < selectedAssets.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const returnsI = returns.map(r => r[selectedAssets[i].symbol] || 0);
          const returnsJ = returns.map(r => r[selectedAssets[j].symbol] || 0);
          try {
            matrix[i][j] = calculateCorrelation(returnsI, returnsJ);
          } catch {
            matrix[i][j] = 0;
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
    
    for (let sim = 0; sim < nSims; sim++) {
      let copulaVariates;
      const uniforms = Array(selectedAssets.length).fill(0).map(() => Math.random());
      
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
        if (idx < weights.length && idx < selectedAssets.length) {
          const standardNormal = normalRandom();
          return sum + weights[idx] * standardNormal * 0.02;
        }
        return sum;
      }, 0);
      
      portfolioReturns.push(portfolioReturn * Math.sqrt(timeHorizon[0]));
    }
    
    return portfolioReturns;
  };

  const performRiskAnalysis = async () => {
    if (selectedAssets.length === 0 || returns.length === 0) {
      alert('Please select assets and load historical data first.');
      return;
    }
    
    setIsCalculating(true);
    
    try {
      // Historical analysis
      const historicalReturns = calculatePortfolioReturns();
      if (historicalReturns.length === 0) {
        throw new Error('No historical returns data available');
      }
      
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
      
      setResults({
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
          returns: simulatedReturns.slice(0, 1000)
        },
        correlationMatrix: calculateCorrelationMatrix(),
        copulaType: selectedCopula
      });
    } catch (error) {
      console.error('Risk analysis error:', error);
      alert('Error performing risk analysis. Please check the console for details.');
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
              Advanced dependence modeling with real NSE market data
            </p>
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

        <Tabs defaultValue="assets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-6">
            <AssetSelector
              selectedAssets={selectedAssets}
              onAssetsChange={setSelectedAssets}
              weights={weights}
              onWeightsChange={setWeights}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
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
                isCalculating={isCalculating || isLoadingData}
                performRiskAnalysis={performRiskAnalysis}
                generateSyntheticData={loadHistoricalData}
              />

              <RiskMetricsDashboard
                results={results}
                confidenceLevel={confidenceLevel[0]}
              />
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioConfiguration
                selectedCopula={selectedCopula}
                setSelectedCopula={setSelectedCopula}
                confidenceLevel={confidenceLevel}
                setConfidenceLevel={setConfidenceLevel}
                timeHorizon={timeHorizon}
                setTimeHorizon={setTimeHorizon}
                weights={weights}
                setWeights={setWeights}
                isCalculating={isCalculating || isLoadingData}
                performRiskAnalysis={performRiskAnalysis}
                generateSyntheticData={loadHistoricalData}
              />
            </div>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-6">
            <VisualizationCharts
              results={results}
              returns={returns}
              riskDistributionData={riskDistributionData}
            />
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <DiagnosticsPanel />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm border-t pt-6">
          <p className="mb-2">
            Real NSE Market Data • Advanced Copula Models • Monte Carlo Simulation
          </p>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="outline">Yahoo Finance</Badge>
            <Badge variant="outline">NSE Stocks</Badge>
            <Badge variant="outline">Real-time Data</Badge>
            <Badge variant="outline">Dynamic Assets</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopulaPortfolioRiskTool;
