
export const normalRandom = (): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// Add erf function to Math object if it doesn't exist
if (!Math.erf) {
  Math.erf = (x: number): number => {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  };
}

export const choleskyDecomposition = (matrix: number[][]): number[][] => {
  const n = matrix.length;
  const L = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      if (i === j) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[j][k] * L[j][k];
        }
        L[j][j] = Math.sqrt(Math.max(0, matrix[j][j] - sum));
      } else {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }
        L[i][j] = L[j][j] !== 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
      }
    }
  }
  return L;
};

export const multiplyMatrixVector = (matrix: number[][], vector: number[]): number[] => {
  return matrix.map(row => 
    row.reduce((sum, val, idx) => sum + val * (vector[idx] || 0), 0)
  );
};

export const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  
  const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  
  const denominator = Math.sqrt(denX * denY);
  return denominator === 0 ? 0 : num / denominator;
};

export const calculateVaR = (returns: number[], confidence: number): number => {
  if (returns.length === 0) return 0;
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence / 100) * sortedReturns.length);
  return -sortedReturns[Math.max(0, index)];
};

export const calculateCVaR = (returns: number[], confidence: number): number => {
  if (returns.length === 0) return 0;
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence / 100) * sortedReturns.length);
  const tailReturns = sortedReturns.slice(0, Math.max(1, index + 1));
  return -tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
};

export const calculateMaxDrawdown = (returns: number[]): number => {
  if (returns.length === 0) return 0;
  
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

export const calculateSharpeRatio = (returns: number[], riskFreeRate: number = 0.02): number => {
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 252); // Annualized
  const excessReturn = mean * 252 - riskFreeRate; // Annualized
  
  return volatility === 0 ? 0 : excessReturn / volatility;
};

// Extend Math interface to include erf
declare global {
  interface Math {
    erf(x: number): number;
  }
}
