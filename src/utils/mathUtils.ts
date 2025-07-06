
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
  
  let peak = 1;
let maxDD = 0;
let cumReturn = 1;

for (const ret of returns) {
  cumReturn *= (1 + ret);
  peak = Math.max(peak, cumReturn);
  const drawdown = 1 - cumReturn / peak;
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

export function computeGoF(
  hist: number[],
  sim: number[]
): number {
  const all = Array.from(new Set([...hist, ...sim])).sort((a,b) => a - b);
  const n1 = hist.length, n2 = sim.length;
  let maxDiff = 0;

  for (const x of all) {
    const F1 = hist.filter(v => v <= x).length / n1;
    const F2 = sim.filter(v => v <= x).length / n2;
    maxDiff = Math.max(maxDiff, Math.abs(F1 - F2));
  }
  return +maxDiff.toFixed(4);
}

/**
 * Empirical upper tail dependence λ_U ≈ P(X>u & Y>u) / [1-u]
 */
export function computeUpperTailDep(
  x: number[],
  y: number[],
  u: number = 0.95
): number {
  const n = Math.min(x.length, y.length);
  const cnt = x.reduce((sum, xi, i) =>
    sum + (xi > u && y[i] > u ? 1 : 0), 0);
  return +( cnt / n / (1 - u) ).toFixed(4);
}

/**
 * Empirical lower tail dependence λ_L ≈ P(X<u & Y<u) / u
 */
export function computeLowerTailDep(
  x: number[],
  y: number[],
  u: number = 0.05
): number {
  const n = Math.min(x.length, y.length);
  const cnt = x.reduce((sum, xi, i) =>
    sum + (xi < u && y[i] < u ? 1 : 0), 0);
  return +( cnt / n / u ).toFixed(4);
}

/**
 * Kendall's Tau rank correlation
 */
export function calculateKendallsTau(
  x: number[],
  y: number[]
): number {
  const n = Math.min(x.length, y.length);
  let concordant = 0, discordant = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const signX = Math.sign(x[i] - x[j]);
      const signY = Math.sign(y[i] - y[j]);
      if (signX * signY > 0) concordant++;
      else if (signX * signY < 0) discordant++;
    }
  }
  const denom = n * (n - 1) / 2;
  return +((concordant - discordant) / denom).toFixed(4);
}

/**
 * Akaike Information Criterion: 2k - 2 ln(L)
 * @param logLikelihood  sum of log pdf values for your fitted model
 * @param k              number of free parameters in the copula
 */
export function calculateAIC(
  logLikelihood: number,
  k: number
): number {
  return +(2 * k - 2 * logLikelihood).toFixed(2);
}

/**
 * Bayesian Information Criterion: ln(n)*k - 2 ln(L)
 * @param logLikelihood  sum of log pdf values
 * @param k              number of parameters
 * @param n              number of observations used in fitting
 */
export function calculateBIC(
  logLikelihood: number,
  k: number,
  n: number
): number {
  return +((Math.log(n) * k - 2 * logLikelihood)).toFixed(2);
}

// Extend Math interface to include erf
declare global {
  interface Math {
    erf(x: number): number;
  }
}
