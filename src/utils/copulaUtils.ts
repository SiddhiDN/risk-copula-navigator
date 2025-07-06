
import { normalRandom, choleskyDecomposition, multiplyMatrixVector } from './mathUtils';

export const gaussianCopula = (u: number[], correlation: number[][]): number[] => {
  const invNormal = (p: number): number => {
    // More accurate inverse normal using Box-Muller transformation
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    
    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    
    if (p < pLow) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
    } else if (p <= pHigh) {
      const q = p - 0.5;
      const r = q * q;
      return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q / (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
    } else {
      const q = Math.sqrt(-2 * Math.log(1-p));
      return -(((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
    }
  };
  
  // Transform uniform variables to standard normal
  const z = u.map(invNormal);
  
  // Apply correlation structure using Cholesky decomposition
  if (correlation.length > 0 && correlation.length === z.length) {
    try {
      const L = choleskyDecomposition(correlation);
      const correlated = multiplyMatrixVector(L, z);
      
      // Transform back to uniform using standard normal CDF
      return correlated.map(val => {
        // Standard normal CDF approximation
        const sign = val >= 0 ? 1 : -1;
        const x = Math.abs(val) / Math.sqrt(2);
        const t = 1 / (1 + 0.3275911 * x);
        const erf = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-x * x);
        return 0.5 * (1 + sign * erf);
      });
    } catch (error) {
      console.warn('Cholesky decomposition failed, using independent variables');
      return z.map(val => 0.5 * (1 + Math.erf(val / Math.sqrt(2))));
    }
  }
  
  return u; // Return original if correlation matrix is invalid
};

export const studentTCopula = (u: number[], correlation: number[][], df: number): number[] => {
  const tInv = (p: number, df: number): number => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    
    // Use normal approximation for high degrees of freedom
    if (df > 100) {
      return gaussianCopula([p], [[1]])[0];
    }
    
    // Cornish-Fisher expansion for t-distribution
    const z = 2 * p - 1;
    const sign = z >= 0 ? 1 : -1;
    const absZ = Math.abs(z);
    
    // Approximate inverse t-distribution
    const a = 4 / (df * Math.PI);
    const b = Math.sqrt(a * a + absZ * absZ);
    const result = sign * Math.sqrt(df * (Math.exp(2 * b / (2 + absZ)) - 1));
    
    return result;
  };
  
  // Transform to t-distributed variables
  const t = u.map(p => tInv(p, df));
  
  // Apply correlation with heavier tails
  if (correlation.length > 0 && correlation.length === t.length) {
    try {
      const L = choleskyDecomposition(correlation);
      const correlated = multiplyMatrixVector(L, t);
      
      // Transform back to uniform using t-distribution CDF
      return correlated.map(val => {
        // Student-t CDF approximation
        const x = val / Math.sqrt(df);
        const gamma = 0.5 * (1 + Math.sign(x) * Math.pow(Math.abs(x), 2/3));
        return Math.max(0.001, Math.min(0.999, gamma));
      });
    } catch (error) {
      console.warn('Student-t copula failed, falling back to Gaussian');
      return gaussianCopula(u, correlation);
    }
  }
  
  return u;
};

export const claytonCopula = (u: number[], theta: number): number[] => {
  if (u.length !== 2 || theta <= 0) return u;
  
  const [u1, u2] = u;
  
  // Clayton copula has strong lower tail dependence
  const t1 = Math.pow(u1, -theta) - 1;
  const t2 = Math.pow(u2, -theta) - 1;
  const sum = Math.max(0.001, t1 + t2); // Prevent numerical issues
  
  const v1 = Math.pow(1 + sum, -1/theta);
  const v2 = Math.pow(1 + sum, -1/theta);
  
  // Add some asymmetry for lower tail dependence
  const lowerTailFactor = 0.8;
  const adjustedV1 = u1 < 0.5 ? v1 * lowerTailFactor : v1;
  const adjustedV2 = u2 < 0.5 ? v2 * lowerTailFactor : v2;
  
  return [
    Math.max(0.001, Math.min(0.999, adjustedV1)),
    Math.max(0.001, Math.min(0.999, adjustedV2))
  ];
};

export const gumbelCopula = (u: number[], theta: number): number[] => {
  if (u.length !== 2 || theta <= 1) return u;
  
  const [u1, u2] = u;
  
  // Gumbel copula has strong upper tail dependence
  const t1 = Math.pow(-Math.log(Math.max(0.001, u1)), theta);
  const t2 = Math.pow(-Math.log(Math.max(0.001, u2)), theta);
  const sum = t1 + t2;
  
  const v1 = Math.exp(-Math.pow(sum, 1/theta));
  const v2 = Math.exp(-Math.pow(sum, 1/theta));
  
  // Add some asymmetry for upper tail dependence
  const upperTailFactor = 1.2;
  const adjustedV1 = u1 > 0.5 ? Math.min(0.999, v1 * upperTailFactor) : v1;
  const adjustedV2 = u2 > 0.5 ? Math.min(0.999, v2 * upperTailFactor) : v2;
  
  return [
    Math.max(0.001, Math.min(0.999, adjustedV1)),
    Math.max(0.001, Math.min(0.999, adjustedV2))
  ];
};
