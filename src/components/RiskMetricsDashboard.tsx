
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface RiskMetricsDashboardProps {
  results: RiskResults | null;
  confidenceLevel: number;
}

const RiskMetricsDashboard: React.FC<RiskMetricsDashboardProps> = ({
  results,
  confidenceLevel
}) => {
  return (
    <>
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
                  {confidenceLevel}% confidence
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
    </>
  );
};

export default RiskMetricsDashboard;
