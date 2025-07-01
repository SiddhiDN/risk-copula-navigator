
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StockData, fetchTopNSEStocks } from '@/utils/yahooFinanceUtils';

interface AssetSelectorProps {
  selectedAssets: StockData[];
  onAssetsChange: (assets: StockData[]) => void;
  weights: number[];
  onWeightsChange: (weights: number[]) => void;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAssets,
  onAssetsChange,
  weights,
  onWeightsChange
}) => {
  const [availableStocks, setAvailableStocks] = useState<StockData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopStocks();
  }, []);

  const loadTopStocks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stocks = await fetchTopNSEStocks(50);
      setAvailableStocks(stocks);
      
      // Initialize with top 4 performers if no assets selected
      if (selectedAssets.length === 0 && stocks.length >= 4) {
        const topFour = stocks.slice(0, 4);
        onAssetsChange(topFour);
        onWeightsChange([0.25, 0.25, 0.25, 0.25]);
      }
    } catch (err) {
      setError('Failed to load stock data. Please try again.');
      console.error('Error loading stocks:', err);
    }
    setIsLoading(false);
  };

  const filteredStocks = availableStocks.filter(stock =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addAsset = (stock: StockData) => {
    if (selectedAssets.find(asset => asset.symbol === stock.symbol)) {
      return; // Already selected
    }
    
    const newAssets = [...selectedAssets, stock];
    const newWeights = [...weights];
    
    // Adjust weights to accommodate new asset
    const currentTotal = weights.reduce((sum, w) => sum + w, 0);
    const remainingWeight = Math.max(0, 1 - currentTotal);
    const equalWeight = remainingWeight / newAssets.length || 1 / newAssets.length;
    
    // Redistribute weights equally
    const redistributedWeights = newAssets.map(() => 1 / newAssets.length);
    
    onAssetsChange(newAssets);
    onWeightsChange(redistributedWeights);
  };

  const removeAsset = (symbolToRemove: string) => {
    const newAssets = selectedAssets.filter(asset => asset.symbol !== symbolToRemove);
    const newWeights = weights.filter((_, idx) => selectedAssets[idx]?.symbol !== symbolToRemove);
    
    // Redistribute remaining weights
    if (newAssets.length > 0) {
      const totalWeight = newWeights.reduce((sum, w) => sum + w, 0);
      const redistributedWeights = newWeights.map(w => w / totalWeight);
      onWeightsChange(redistributedWeights);
    } else {
      onWeightsChange([]);
    }
    
    onAssetsChange(newAssets);
  };

  return (
    <div className="space-y-4">
      {/* Selected Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Selected Assets ({selectedAssets.length})
          </CardTitle>
          <CardDescription>
            Your portfolio composition with current market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedAssets.length > 0 ? (
            <div className="space-y-3">
              {selectedAssets.map((asset, idx) => (
                <div key={asset.symbol} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{asset.symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {(weights[idx] * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{asset.name}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>₹{asset.price.toFixed(2)}</span>
                      <span className={`flex items-center gap-1 ${asset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {asset.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAsset(asset.symbol)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No assets selected</p>
              <p className="text-sm">Add stocks from the list below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Search and Selection */}
      <Card>
        <CardHeader>
          <CardTitle>NSE Top Performers</CardTitle>
          <CardDescription>
            Select from top 50 performing stocks on National Stock Exchange
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={loadTopStocks} disabled={isLoading} variant="outline">
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredStocks.map((stock) => {
                const isSelected = selectedAssets.some(asset => asset.symbol === stock.symbol);
                
                return (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stock.symbol}</span>
                        <Badge variant={stock.changePercent >= 0 ? 'default' : 'destructive'} className="text-xs">
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>₹{stock.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          Vol: {(stock.volume / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addAsset(stock)}
                      disabled={isSelected}
                      variant={isSelected ? "secondary" : "default"}
                    >
                      {isSelected ? (
                        'Selected'
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetSelector;
