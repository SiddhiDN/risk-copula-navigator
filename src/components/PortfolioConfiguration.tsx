
import React, { useState, useEffect } from 'react';
import { Settings, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { fetchAssets, Asset } from '@/services/supabaseDataService';

interface PortfolioConfigurationProps {
  selectedCopula: string;
  setSelectedCopula: (value: string) => void;
  confidenceLevel: number[];
  setConfidenceLevel: (value: number[]) => void;
  timeHorizon: number[];
  setTimeHorizon: (value: number[]) => void;
  weights: number[];
  setWeights: (weights: number[]) => void;
  selectedAssets: string[];
  setSelectedAssets: (assets: string[]) => void;
  isCalculating: boolean;
  performRiskAnalysis: () => void;
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
  selectedAssets,
  setSelectedAssets,
  isCalculating,
  performRiskAnalysis
}) => {
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  useEffect(() => {
    loadAvailableAssets();
  }, []);

  const loadAvailableAssets = async () => {
    try {
      setIsLoadingAssets(true);
      const assets = await fetchAssets();
      setAvailableAssets(assets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleAssetSelection = (index: number, symbol: string) => {
    const newSelectedAssets = [...selectedAssets];
    newSelectedAssets[index] = symbol;
    setSelectedAssets(newSelectedAssets);
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    const newWeights = [...weights];
    newWeights[index] = newWeight / 100;
    
    // Check if total exceeds 100%
    const total = newWeights.reduce((sum, w) => sum + w, 0);
    if (total <= 1.01) { // Allow slight rounding errors
      setWeights(newWeights);
    }
  };

  const getAssetDisplayName = (symbol: string) => {
    const asset = availableAssets.find(a => a.symbol === symbol);
    return asset ? `${asset.symbol} - ${asset.name || 'Unknown'}` : symbol;
  };

  const getAvailableAssetsForSlot = (currentIndex: number) => {
    return availableAssets.filter(asset => 
      !selectedAssets.includes(asset.symbol) || selectedAssets[currentIndex] === asset.symbol
    );
  };

  const totalAllocation = weights.reduce((sum, w) => sum + w, 0);
  const isAllocationValid = Math.abs(totalAllocation - 1) < 0.01;

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
          <CardTitle>Portfolio Assets & Weights</CardTitle>
          <CardDescription>
            Select assets from your database and adjust their allocation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAssets ? (
            <div className="text-center text-muted-foreground">
              Loading available assets...
            </div>
          ) : (
            weights.map((weight, idx) => (
              <div key={idx} className="space-y-3 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Asset {idx + 1}</Label>
                  <Select 
                    value={selectedAssets[idx] || ''} 
                    onValueChange={(value) => handleAssetSelection(idx, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an asset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableAssetsForSlot(idx).map((asset) => (
                        <SelectItem key={asset.symbol} value={asset.symbol}>
                          <div className="flex flex-col">
                            <span className="font-medium">{asset.symbol}</span>
                            {asset.name && (
                              <span className="text-xs text-muted-foreground">{asset.name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedAssets[idx] && (
                  <>
                    <div className="flex justify-between text-sm">
                      <Label>Weight</Label>
                      <span className="font-mono">{(weight * 100).toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[weight * 100]}
                      onValueChange={(value) => handleWeightChange(idx, value[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <Progress value={weight * 100} className="h-2" />
                  </>
                )}
              </div>
            ))
          )}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Allocation:</span>
              <span className={`font-mono ${isAllocationValid ? 'text-green-600' : 'text-red-600'}`}>
                {(totalAllocation * 100).toFixed(1)}%
              </span>
            </div>
            {!isAllocationValid && (
              <div className="text-xs text-red-600 mt-1">
                Total allocation must equal 100%
              </div>
            )}
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

          <Separator />
          
          <div className="space-y-4">
            <Button
              onClick={performRiskAnalysis}
              disabled={isCalculating || !isAllocationValid}
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
            
            {!isAllocationValid && (
              <div className="text-xs text-red-600 text-center">
                Please ensure total allocation equals 100% before running analysis
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default PortfolioConfiguration;
