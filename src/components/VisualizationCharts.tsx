
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
}

const VisualizationCharts: React.FC<VisualizationChartsProps> = ({
  results,
  returns,
  riskDistributionData
}) => {
  if (!results) return null;

  return (
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
  );
};

export default VisualizationCharts;
