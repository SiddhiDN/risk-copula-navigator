
import { normalRandom, choleskyDecomposition, multiplyMatrixVector } from './mathUtils';

export const gaussianCopula = (u: number[], correlation: number[][]): number[] => {
  const invNormal = (p: number): number => {
    // Beasley-Springer-Moro approximation
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
  
  const z = u.map(invNormal);
  const L = choleskyDecomposition(correlation);
  return multiplyMatrixVector(L, z);
};

export const studentTCopula = (u: number[], correlation: number[][], df: number): number[] => {
  const tInv = (p: number, df: number): number => {
    // Approximation for t-distribution inverse CDF
    const z = normalInverse(p);
    const c1 = z;
    const c2 = (z * z * z + z) / 4;
    const c3 = (5 * Math.pow(z, 5) + 16 * Math.pow(z, 3) + 3 * z) / 96;
    return z + c2 / df + c3 / (df * df);
  };
  
  const normalInverse = (p: number): number => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02];
    
    if (p < 0.5) {
      const q = Math.sqrt(-2 * Math.log(p));
      return -(a[1] + a[2] * q) / (1 + b[1] * q + b[2] * q * q);
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      return (a[1] + a[2] * q) / (1 + b[1] * q + b[2] * q * q);
    }
  };
  
  const t = u.map(p => tInv(p, df));
  const L = choleskyDecomposition(correlation);
  return multiplyMatrixVector(L, t);
};

export const claytonCopula = (u: number[], theta: number): number[] => {
  if (u.length !== 2) return u; // Simplified for bivariate case
  const [u1, u2] = u;
  if (theta <= 0) return [u1, u2];
  
  const t1 = Math.pow(u1, -theta) - 1;
  const t2 = Math.pow(u2, -theta) - 1;
  const sum = t1 + t2;
  
  return [
    Math.pow(1 + sum, -1/theta),
    Math.pow(1 + sum, -1/theta)
  ];
};

export const gumbelCopula = (u: number[], theta: number): number[] => {
  if (u.length !== 2) return u; // Simplified for bivariate case
  const [u1, u2] = u;
  if (theta <= 1) return [u1, u2];
  
  const t1 = Math.pow(-Math.log(u1), theta);
  const t2 = Math.pow(-Math.log(u2), theta);
  const sum = t1 + t2;
  
  return [
    Math.exp(-Math.pow(sum, 1/theta)),
    Math.exp(-Math.pow(sum, 1/theta))
  ];
};
