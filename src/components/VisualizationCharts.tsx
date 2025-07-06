
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface VisualizationChartsProps {
  results: RiskResults | null;
  returns: any[];
  riskDistributionData: any[];
  selectedAssets: string[];
}

const VisualizationCharts: React.FC<VisualizationChartsProps> = ({
  results,
  returns,
  riskDistributionData,
  selectedAssets
}) => {
  if (!results) return null;

  // Get valid selected assets for display
  const validAssets = selectedAssets.filter(asset => asset !== '');
  
  // Prepare historical data for chart
  const historicalData = returns.slice(-60).map(dayReturn => {
    const chartData: any = { date: dayReturn.date };
    validAssets.forEach(asset => {
      if (dayReturn[asset] !== undefined) {
        chartData[asset] = (dayReturn[asset] * 100).toFixed(2); // Convert to percentage
      }
    });
    return chartData;
  });

  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>Monte Carlo simulation results ({results.copulaType} copula)</CardDescription>
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
          <CardTitle>Historical Returns</CardTitle>
          <CardDescription>Daily returns over the last 60 trading days (%)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
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
                formatter={(value: any) => [`${value}%`, 'Return']}
              />
              {validAssets.map((asset, index) => (
                <Line 
                  key={asset}
                  type="monotone" 
                  dataKey={asset} 
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Asset Correlation Matrix</CardTitle>
          <CardDescription>Pairwise correlations between selected assets</CardDescription>
        </CardHeader>
        <CardContent>
          {validAssets.length > 0 && results.correlationMatrix.length > 0 ? (
            <div className={`grid gap-2 text-center text-sm`} style={{ gridTemplateColumns: `repeat(${validAssets.length + 1}, 1fr)` }}>
              <div></div>
              {validAssets.map(asset => (
                <div key={asset} className="font-medium">{asset}</div>
              ))}
              
              {validAssets.map((asset, rowIdx) => (
                <React.Fragment key={asset}>
                  <div className="font-medium">{asset}</div>
                  {results.correlationMatrix[rowIdx]?.slice(0, validAssets.length).map((corr, colIdx) => (
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
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No correlation data available. Please run the analysis first.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualizationCharts;
