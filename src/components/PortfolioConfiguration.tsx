
import React from 'react';
import { Settings, Calculator, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface PortfolioConfigurationProps {
  selectedCopula: string;
  setSelectedCopula: (value: string) => void;
  confidenceLevel: number[];
  setConfidenceLevel: (value: number[]) => void;
  timeHorizon: number[];
  setTimeHorizon: (value: number[]) => void;
  weights: number[];
  setWeights: (weights: number[]) => void;
  isCalculating: boolean;
  performRiskAnalysis: () => void;
  generateSyntheticData: () => void;
}

const PortfolioConfiguration: React.FC<PortfolioConfigurationProps> = ({
  selectedCopula,
  setSelectedCopula,
  confidenceLevel,
  setConfidenceLevel,
  timeHorizon,
  setTimeHorizon,
  weights,
  setWeights,
  isCalculating,
  performRiskAnalysis,
  generateSyntheticData
}) => {
  return (
    <>
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

      {/* Portfolio Weights Configuration */}
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

      {/* Advanced Parameters */}
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
    </>
  );
};

export default PortfolioConfiguration;
