/**
 * Performance budgets configuration
 * Defines thresholds for various performance metrics
 */

export interface PerformanceBudget {
  metric: string;
  budget: number;
  unit: 'ms' | 'kb' | 'count' | 'score';
  severity: 'warning' | 'error';
}

// Core Web Vitals budgets based on Google's recommendations
export const WEB_VITALS_BUDGETS: PerformanceBudget[] = [
  // Largest Contentful Paint (LCP)
  {
    metric: 'LCP',
    budget: 2500,
    unit: 'ms',
    severity: 'warning',
  },
  {
    metric: 'LCP',
    budget: 4000,
    unit: 'ms',
    severity: 'error',
  },
  
  
  // Cumulative Layout Shift (CLS)
  {
    metric: 'CLS',
    budget: 0.1,
    unit: 'score',
    severity: 'warning',
  },
  {
    metric: 'CLS',
    budget: 0.25,
    unit: 'score',
    severity: 'error',
  },
  
  // First Contentful Paint (FCP)
  {
    metric: 'FCP',
    budget: 1800,
    unit: 'ms',
    severity: 'warning',
  },
  {
    metric: 'FCP',
    budget: 3000,
    unit: 'ms',
    severity: 'error',
  },
  
  // Time to First Byte (TTFB)
  {
    metric: 'TTFB',
    budget: 800,
    unit: 'ms',
    severity: 'warning',
  },
  {
    metric: 'TTFB',
    budget: 1800,
    unit: 'ms',
    severity: 'error',
  },
  
  // Interaction to Next Paint (INP)
  {
    metric: 'INP',
    budget: 200,
    unit: 'ms',
    severity: 'warning',
  },
  {
    metric: 'INP',
    budget: 500,
    unit: 'ms',
    severity: 'error',
  },
];

// Resource size budgets
export const RESOURCE_BUDGETS: PerformanceBudget[] = [
  // JavaScript bundle size
  {
    metric: 'javascript',
    budget: 300,
    unit: 'kb',
    severity: 'warning',
  },
  {
    metric: 'javascript',
    budget: 500,
    unit: 'kb',
    severity: 'error',
  },
  
  // CSS bundle size
  {
    metric: 'css',
    budget: 100,
    unit: 'kb',
    severity: 'warning',
  },
  {
    metric: 'css',
    budget: 200,
    unit: 'kb',
    severity: 'error',
  },
  
  // Total page weight
  {
    metric: 'total',
    budget: 1500,
    unit: 'kb',
    severity: 'warning',
  },
  {
    metric: 'total',
    budget: 3000,
    unit: 'kb',
    severity: 'error',
  },
  
  // Number of requests
  {
    metric: 'requests',
    budget: 50,
    unit: 'count',
    severity: 'warning',
  },
  {
    metric: 'requests',
    budget: 100,
    unit: 'count',
    severity: 'error',
  },
];

// Custom metrics budgets
export const CUSTOM_BUDGETS: PerformanceBudget[] = [
  // Time to Interactive
  {
    metric: 'TTI',
    budget: 3800,
    unit: 'ms',
    severity: 'warning',
  },
  {
    metric: 'TTI',
    budget: 7300,
    unit: 'ms',
    severity: 'error',
  },
  
  // Speed Index
  {
    metric: 'SI',
    budget: 3400,
    unit: 'ms',
    severity: 'warning',
  },
  {
    metric: 'SI',
    budget: 5800,
    unit: 'ms',
    severity: 'error',
  },
];

// All budgets combined
export const ALL_BUDGETS = [
  ...WEB_VITALS_BUDGETS,
  ...RESOURCE_BUDGETS,
  ...CUSTOM_BUDGETS,
];

// Budget validation function
export function validateBudget(
  metric: string,
  value: number,
  budgets: PerformanceBudget[] = ALL_BUDGETS
): {
  passed: boolean;
  violations: Array<{ budget: PerformanceBudget; exceeded: number }>;
} {
  const relevantBudgets = budgets.filter(b => b.metric === metric);
  const violations: Array<{ budget: PerformanceBudget; exceeded: number }> = [];

  relevantBudgets.forEach(budget => {
    if (value > budget.budget) {
      violations.push({
        budget,
        exceeded: value - budget.budget,
      });
    }
  });

  return {
    passed: violations.length === 0,
    violations,
  };
}

// Performance score calculation
export function calculatePerformanceScore(metrics: Record<string, number>): number {
  // Weighted scoring based on Core Web Vitals importance
  const weights = {
    LCP: 0.25,
    INP: 0.25,
    CLS: 0.25,
    FCP: 0.15,
    TTFB: 0.10,
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([metric, weight]: [string, number]) => {
    if (metric in metrics) {
      const value = metrics[metric];
      if (value === undefined) return; // Skip if no value
      
      const budgets = WEB_VITALS_BUDGETS.filter(b => b.metric === metric);
      const goodBudget = budgets.find(b => b.severity === 'warning');
      const poorBudget = budgets.find(b => b.severity === 'error');

      if (goodBudget && poorBudget && value !== undefined) {
        let score = 0;
        if (value <= goodBudget.budget) {
          score = 100; // Good
        } else if (value <= poorBudget.budget) {
          // Linear interpolation between good and poor
          score = 100 - ((value - goodBudget.budget) / (poorBudget.budget - goodBudget.budget)) * 50;
        } else {
          // Below poor threshold
          score = 50 - ((value - poorBudget.budget) / poorBudget.budget) * 50;
          score = Math.max(0, score);
        }

        totalScore += score * weight;
        totalWeight += weight;
      }
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}