
import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { normalRandom, choleskyDecomposition, multiplyMatrixVector, calculateCorrelation, calculateVaR, calculateCVaR, calculateMaxDrawdown, calculateSharpeRatio } from '@/utils/mathUtils';
import { gaussianCopula, studentTCopula, claytonCopula, gumbelCopula } from '@/utils/copulaUtils';
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
  const [portfolioData, setPortfolioData] = useState([]);
  const [returns, setReturns] = useState([]);
  const [weights, setWeights] = useState([0.4, 0.3, 0.2, 0.1]);
  const [selectedCopula, setSelectedCopula] = useState('gaussian');
  const [confidenceLevel, setConfidenceLevel] = useState([95]);
  const [timeHorizon, setTimeHorizon] = useState([1]);
  const [results, setResults] = useState<RiskResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Generate synthetic market data for demonstration
  useEffect(() => {
    generateSyntheticData();
  }, []);

  const generateSyntheticData = () => {
    const n = 252; // One year of daily data
    const correlationMatrix = [
      [1.0, 0.7, 0.2, 0.3],
      [0.7, 1.0, 0.1, 0.4],
      [0.2, 0.1, 1.0, -0.2],
      [0.3, 0.4, -0.2, 1.0]
    ];
    
    // Generate correlated returns using Cholesky decomposition
    const L = choleskyDecomposition(correlationMatrix);
    const data = [];
    const returnsData = [];
    
    for (let t = 0; t < n; t++) {
      const independentNormals = Array(4).fill(0).map(() => normalRandom());
      const correlatedReturns = multiplyMatrixVector(L, independentNormals);
      
      const dayData = {
        date: new Date(2023, 0, 1 + t).toISOString().split('T')[0],
        'Stock A': 100 * Math.exp(correlatedReturns[0] * 0.02),
        'Stock B': 100 * Math.exp(correlatedReturns[1] * 0.025),
        'Bond C': 100 * Math.exp(correlatedReturns[2] * 0.01),
        'Commodity D': 100 * Math.exp(correlatedReturns[3] * 0.03)
      };
      
      data.push(dayData);
      
      if (t > 0) {
        const dayReturns = {
          date: dayData.date,
          'Stock A': Math.log(dayData['Stock A'] / data[t-1]['Stock A']),
          'Stock B': Math.log(dayData['Stock B'] / data[t-1]['Stock B']),
          'Bond C': Math.log(dayData['Bond C'] / data[t-1]['Bond C']),
          'Commodity D': Math.log(dayData['Commodity D'] / data[t-1]['Commodity D'])
        };
        returnsData.push(dayReturns);
      }
    }
    
    setPortfolioData(data);
    setReturns(returnsData);
  };

  // Risk calculation functions
  const calculatePortfolioReturns = () => {
    return returns.map(dayReturns => {
      const assets = ['Stock A', 'Stock B', 'Bond C', 'Commodity D'];
      return assets.reduce((sum, asset, idx) => 
        sum + weights[idx] * dayReturns[asset], 0
      );
    });
  };

  const calculateCorrelationMatrix = () => {
    const assets = ['Stock A', 'Stock B', 'Bond C', 'Commodity D'];
    const matrix = Array(4).fill(0).map(() => Array(4).fill(0));
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const returnsI = returns.map(r => r[assets[i]]);
          const returnsJ = returns.map(r => r[assets[j]]);
          matrix[i][j] = calculateCorrelation(returnsI, returnsJ);
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
      const uniforms = Array(4).fill(0).map(() => Math.random());
      
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
          returns: simulatedReturns.slice(0, 1000) // Limit for visualization
        },
        correlationMatrix: calculateCorrelationMatrix(),
        copulaType: selectedCopula
      });
    } catch (error) {
      console.error('Risk analysis error:', error);
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
              Advanced dependence modeling for sophisticated risk analysis
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
            generateSyntheticData={generateSyntheticData}
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
            Advanced Copula Models • Monte Carlo Simulation • Real-time Analytics
          </p>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="outline">Gaussian</Badge>
            <Badge variant="outline">Student-t</Badge>
            <Badge variant="outline">Clayton</Badge>
            <Badge variant="outline">Gumbel</Badge>
            <Badge variant="outline">Archimedean</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopulaPortfolioRiskTool;
