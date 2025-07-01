
import React from 'react';
import { TrendingDown, Calculator, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DiagnosticsPanel: React.FC = () => {
  return (
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
  );
};

export default DiagnosticsPanel;
