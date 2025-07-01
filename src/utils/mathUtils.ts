
export const normalRandom = (): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

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

export const multiplyMatrixVector = (matrix: number[][], vector: number[]): number[] => {
  return matrix.map(row => 
    row.reduce((sum, val, idx) => sum + val * vector[idx], 0)
  );
};

export const calculateCorrelation = (x: number[], y: number[]): number => {
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

export const calculateVaR = (returns: number[], confidence: number): number => {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence / 100) * sortedReturns.length);
  return -sortedReturns[index];
};

export const calculateCVaR = (returns: number[], confidence: number): number => {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence / 100) * sortedReturns.length);
  const tailReturns = sortedReturns.slice(0, index + 1);
  return -tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
};

export const calculateMaxDrawdown = (returns: number[]): number => {
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
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 252); // Annualized
  const excessReturn = mean * 252 - riskFreeRate; // Annualized
  
  return excessReturn / volatility;
};
