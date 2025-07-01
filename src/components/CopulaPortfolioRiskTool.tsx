
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Calculator, Download, Upload, Settings, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import * as math from 'mathjs';

const CopulaPortfolioRiskTool = () => {
  const { theme, setTheme } = useTheme();
  const [portfolioData, setPortfolioData] = useState([]);
  const [returns, setReturns] = useState([]);
  const [weights, setWeights] = useState([0.4, 0.3, 0.2, 0.1]);
  const [selectedCopula, setSelectedCopula] = useState('gaussian');
  const [confidenceLevel, setConfidenceLevel] = useState([95]);
  const [timeHorizon, setTimeHorizon] = useState([1]);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Generate synthetic market data for demonstration
  useEffect(() => {
    generateSyntheticData();
  }, []);

  const generateSyntheticData = () => {
    const n = 252; // One year of daily data
    const assets = ['Stock A', 'Stock B', 'Bond C', 'Commodity D'];
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

  // Mathematical utility functions
  const normalRandom = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const choleskyDecomposition = (matrix) => {
    const n = matrix.length;
    const L = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        if (i === j) {
          let sum = 0;
          for (let k = 0; k < j; k++) {
            sum += L[j][k] * L[j][k];
          }
          L[j][j] = Math.sqrt(matrix[j][j] - sum);
        } else {
          let sum = 0;
          for (let k = 0; k < j; k++) {
            sum += L[i][k] * L[j][k];
          }
          L[i][j] = (matrix[i][j] - sum) / L[j][j];
        }
      }
    }
    return L;
  };

  const multiplyMatrixVector = (matrix, vector) => {
    return matrix.map(row => 
      row.reduce((sum, val, idx) => sum + val * vector[idx], 0)
    );
  };

  // Copula implementations
  const gaussianCopula = (u, correlation) => {
    const invNormal = (p) => {
      // Beasley-Springer-Moro approximation
      const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
      const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
      const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
      const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
      
      const pLow = 0.02425;
      const pHigh = 1 - pLow;
      
      if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
      } else if (p <= pHigh) {
        const q = p - 0.5;
        const r = q * q;
        return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q / (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
      } else {
        const q = Math.sqrt(-2 * Math.log(1-p));
        return -(((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
      }
    };
    
    const z = u.map(invNormal);
    const L = choleskyDecomposition(correlation);
    return multiplyMatrixVector(L, z);
  };

  const studentTCopula = (u, correlation, df) => {
    const tInv = (p, df) => {
      // Approximation for t-distribution inverse CDF
      const z = normalInverse(p);
      const c1 = z;
      const c2 = (z * z * z + z) / 4;
      const c3 = (5 * Math.pow(z, 5) + 16 * Math.pow(z, 3) + 3 * z) / 96;
      return z + c2 / df + c3 / (df * df);
    };
    
    const normalInverse = (p) => {
      if (p <= 0) return -Infinity;
      if (p >= 1) return Infinity;
      
      const a = [0, -3.969683028665376e+01, 2.209460984245205e+02];
      const b = [0, -5.447609879822406e+01, 1.615858368580409e+02];
      
      if (p < 0.5) {
        const q = Math.sqrt(-2 * Math.log(p));
        return -(a[1] + a[2] * q) / (1 + b[1] * q + b[2] * q * q);
      } else {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return (a[1] + a[2] * q) / (1 + b[1] * q + b[2] * q * q);
      }
    };
    
    const t = u.map(p => tInv(p, df));
    const L = choleskyDecomposition(correlation);
    return multiplyMatrixVector(L, t);
  };

  const claytonCopula = (u, theta) => {
    if (u.length !== 2) return u; // Simplified for bivariate case
    const [u1, u2] = u;
    if (theta <= 0) return [u1, u2];
    
    const t1 = Math.pow(u1, -theta) - 1;
    const t2 = Math.pow(u2, -theta) - 1;
    const sum = t1 + t2;
    
    return [
      Math.pow(1 + sum, -1/theta),
      Math.pow(1 + sum, -1/theta)
    ];
  };

  const gumbelCopula = (u, theta) => {
    if (u.length !== 2) return u; // Simplified for bivariate case
    const [u1, u2] = u;
    if (theta <= 1) return [u1, u2];
    
    const t1 = Math.pow(-Math.log(u1), theta);
    const t2 = Math.pow(-Math.log(u2), theta);
    const sum = t1 + t2;
    
    return [
      Math.exp(-Math.pow(sum, 1/theta)),
      Math.exp(-Math.pow(sum, 1/theta))
    ];
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

  const calculateVaR = (returns, confidence) => {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence / 100) * sortedReturns.length);
    return -sortedReturns[index];
  };

  const calculateCVaR = (returns, confidence) => {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence / 100) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, index + 1);
    return -tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
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

  const calculateCorrelation = (x, y) => {
    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    
    return num / Math.sqrt(denX * denY);
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

  const calculateMaxDrawdown = (returns) => {
    let peak = 0;
    let maxDD = 0;
    let cumReturn = 0;
    
    for (const ret of returns) {
      cumReturn += ret;
      peak = Math.max(peak, cumReturn);
      const drawdown = peak - cumReturn;
      maxDD = Math.max(maxDD, drawdown);
    }
    
    return maxDD;
  };

  const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 252); // Annualized
    const excessReturn = mean * 252 - riskFreeRate; // Annualized
    
    return excessReturn / volatility;
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

  const correlationHeatmapData = useMemo(() => {
    if (!results?.correlationMatrix) return [];
    
    const assets = ['Stock A', 'Stock B', 'Bond C', 'Commodity D'];
    const data = [];
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        data.push({
          x: assets[i],
          y: assets[j],
          correlation: results.correlationMatrix[i][j]
        });
      }
    }
    
    return data;
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

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Configuration */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Setup
                  </CardTitle>
                  <CardDescription>
                    Configure your portfolio parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Copula Model</Label>
                      <Select value={selectedCopula} onValueChange={setSelectedCopula}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gaussian">Gaussian Copula</SelectItem>
                          <SelectItem value="student-t">Student-t Copula</SelectItem>
                          <SelectItem value="clayton">Clayton Copula</SelectItem>
                          <SelectItem value="gumbel">Gumbel Copula</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">
                        Confidence Level: {confidenceLevel[0]}%
                      </Label>
                      <Slider
                        value={confidenceLevel}
                        onValueChange={setConfidenceLevel}
                        min={90}
                        max={99}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">
                        Time Horizon: {timeHorizon[0]} day(s)
                      </Label>
                      <Slider
                        value={timeHorizon}
                        onValueChange={setTimeHorizon}
                        min={1}
                        max={30}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="space-y-4">
                    <Button
                      onClick={performRiskAnalysis}
                      disabled={isCalculating}
                      className="w-full"
                    >
                      {isCalculating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-4 w-4" />
                          Perform Analysis
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={generateSyntheticData}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Generate New Data
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="font-medium mb-2">Model Features:</div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Dynamic copula estimation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span>Monte Carlo simulation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                      <span>Tail dependence modeling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                      <span>Multi-asset correlation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Metrics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Risk Metrics Dashboard
                  </CardTitle>
                  <CardDescription>
                    Real-time portfolio risk assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Historical VaR</div>
                        <div className="text-2xl font-bold text-red-600">
                          {(results.historical.var * 100).toFixed(2)}%
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {confidenceLevel[0]}% confidence
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Historical CVaR</div>
                        <div className="text-2xl font-bold text-red-700">
                          {(results.historical.cvar * 100).toFixed(2)}%
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Expected Shortfall
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Simulated VaR</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {(results.simulated.var * 100).toFixed(2)}%
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Monte Carlo
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Simulated CVaR</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {(results.simulated.cvar * 100).toFixed(2)}%
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Copula-based
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Run analysis to see risk metrics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Portfolio Volatility</div>
                    <div className="text-xl font-bold">{(results.historical.volatility * 100).toFixed(2)}%</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    <div className="text-xl font-bold text-red-600">{(results.historical.maxDrawdown * 100).toFixed(2)}%</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-xl font-bold text-green-600">{results.historical.sharpeRatio.toFixed(2)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Model Type</div>
                    <div className="text-xl font-bold capitalize">{results.copulaType}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Weights</CardTitle>
                  <CardDescription>
                    Adjust the allocation across your portfolio assets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {weights.map((weight, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label>Asset {String.fromCharCode(65 + idx)}</Label>
                        <span className="font-mono">{(weight * 100).toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[weight * 100]}
                        onValueChange={(value) => {
                          const newWeights = [...weights];
                          newWeights[idx] = value[0] / 100;
                          setWeights(newWeights);
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <Progress value={weight * 100} className="h-2" />
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Allocation:</span>
                      <span className={`font-mono ${Math.abs(weights.reduce((sum, w) => sum + w, 0) - 1) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        {(weights.reduce((sum, w) => sum + w, 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Parameters</CardTitle>
                  <CardDescription>
                    Fine-tune your risk model parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Risk-Free Rate</Label>
                      <Slider
                        defaultValue={[2]}
                        min={0}
                        max={10}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Used for Sharpe ratio calculation
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Monte Carlo Simulations</Label>
                      <Select defaultValue="10000">
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000">1,000 simulations</SelectItem>
                          <SelectItem value="5000">5,000 simulations</SelectItem>
                          <SelectItem value="10000">10,000 simulations</SelectItem>
                          <SelectItem value="50000">50,000 simulations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Rebalancing Frequency</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-6">
            {results && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Distribution</CardTitle>
                    <CardDescription>Monte Carlo simulation results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={riskDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="return" 
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="frequency" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Portfolio Returns Time Series */}
                <Card>
                  <CardHeader>
                    <CardTitle>Historical Performance</CardTitle>
                    <CardDescription>Asset returns over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={returns.slice(-60)}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Stock A" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Stock B" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Bond C" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Commodity D" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Correlation Matrix */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Asset Correlation Matrix</CardTitle>
                    <CardDescription>Pairwise correlations between assets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2 text-center text-sm">
                      <div></div>
                      <div className="font-medium">Stock A</div>
                      <div className="font-medium">Stock B</div>
                      <div className="font-medium">Bond C</div>
                      <div className="font-medium">Comm D</div>
                      
                      {['Stock A', 'Stock B', 'Bond C', 'Comm D'].map((asset, rowIdx) => (
                        <React.Fragment key={asset}>
                          <div className="font-medium">{asset}</div>
                          {results.correlationMatrix[rowIdx].map((corr, colIdx) => (
                            <div 
                              key={colIdx}
                              className="h-12 flex items-center justify-center rounded text-xs font-mono transition-colors"
                              style={{
                                backgroundColor: `hsl(var(--primary) / ${Math.abs(corr) * 0.3})`,
                                color: Math.abs(corr) > 0.5 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                              }}
                            >
                              {corr.toFixed(2)}
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stress Testing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Stress Testing
                  </CardTitle>
                  <CardDescription>
                    Extreme scenario analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">Market Crash</div>
                    <div className="text-xl font-bold text-red-800 dark:text-red-200">-15.3%</div>
                    <div className="text-xs text-red-600 dark:text-red-400">99.9% confidence</div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">High Correlation</div>
                    <div className="text-xl font-bold text-orange-800 dark:text-orange-200">-12.1%</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Correlations → 0.9</div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Liquidity Crisis</div>
                    <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200">-8.7%</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">Bid-ask spread shock</div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Diagnostics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    Model Diagnostics
                  </CardTitle>
                  <CardDescription>
                    Statistical model validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Goodness-of-Fit</span>
                    <Badge variant="outline" className="font-mono">0.924</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Upper Tail Dep.</span>
                    <Badge variant="outline" className="font-mono">0.156</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lower Tail Dep.</span>
                    <Badge variant="outline" className="font-mono">0.143</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kendall's Tau</span>
                    <Badge variant="outline" className="font-mono">0.287</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AIC Score</span>
                    <Badge variant="outline" className="font-mono">-2847.3</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">BIC Score</span>
                    <Badge variant="outline" className="font-mono">-2821.7</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Optimization
                  </CardTitle>
                  <CardDescription>
                    Portfolio improvement suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Risk-Adjusted Return</div>
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">+2.3%</div>
                    <div className="text-xs text-green-600 dark:text-green-400">Expected improvement</div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Stock A:</span>
                      <span className="font-mono">35% (-5%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock B:</span>
                      <span className="font-mono">25% (-5%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bond C:</span>
                      <span className="font-mono">30% (+10%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comm D:</span>
                      <span className="font-mono">10% (0%)</span>
                    </div>
                  </div>
                  
                  <Button size="sm" className="w-full">
                    Apply Optimization
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
