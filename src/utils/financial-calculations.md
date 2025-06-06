# Financial Calculations Documentation

## Overview

This document explains the standardized financial calculation methodology used across all dashboards in the application to ensure consistent dollar value metrics for SEO performance.

## Standard Default Values

The following default values are used across all dashboards when specific values are not provided:

- **Average Order Value**: $50 (previously varied from $10-$50)
- **Content Cost**: $200 (previously varied from $7.3-$200)
- **Default Conversion Rate**: 2% (0.02)

## Calculation Methodologies

### Revenue Leak Calculation

Revenue leak is calculated using potential traffic, conversion rates, and average order value:

```javascript
const calculateRevenueLeak = (data, leakPercent = 0.05) => {
  const { averageOrderValue, conversionRate } = getFinancialDefaults(data);
  const totalAnalyzed = data.funnelAnalysis?.totalAnalyzed || 0;
  const potentialRevenue = totalAnalyzed * averageOrderValue * conversionRate;

  return Math.round(potentialRevenue * leakPercent);
};
```

### Content Decay Impact

Content decay financial impact is calculated based on real metrics when available, with a standard fallback approach:

```javascript
const calculateContentDecay = (data, contentDecayItems = []) => {
  if (Array.isArray(contentDecayItems) && contentDecayItems.length > 0) {
    return contentDecayItems.reduce(
      (sum, item) => sum + (item.estimatedRevenueLoss || 0),
      0
    );
  }

  // Fallback using standard defaults
  const { averageOrderValue, conversionRate } = getFinancialDefaults(data);
  const totalTraffic = data.GSCData?.totalClicks || 0;
  const decayRate = 0.07; // 7% decay rate as default
  return Math.round(
    totalTraffic * averageOrderValue * conversionRate * decayRate
  );
};
```

### Keyword Mismatch Financial Impact

Keyword mismatch financial impact considers real data or estimates based on DA vs KD gap:

```javascript
const calculateKwMismatch = (data, keywordMismatchItems = []) => {
  if (Array.isArray(keywordMismatchItems) && keywordMismatchItems.length > 0) {
    const missedClicks = keywordMismatchItems.reduce(
      (sum, item) => sum + (item.missedClicks || 0),
      0
    );
    const { averageOrderValue, conversionRate } = getFinancialDefaults(data);
    return Math.round(missedClicks * averageOrderValue * conversionRate);
  }

  // Fallback estimation based on DA vs KD gap
  // ... (see implementation in financialCalculations.js)
};
```

### Link Dilution Financial Impact

Link dilution financial impact uses either real metrics or standardized estimates:

```javascript
const calculateLinkDilution = (data, linkDilutionItems = []) => {
  if (Array.isArray(linkDilutionItems) && linkDilutionItems.length > 0) {
    return linkDilutionItems.reduce(
      (sum, item) => sum + (item.estimatedLoss || 0),
      0
    );
  }

  // Otherwise estimate based on total content investment
  const { contentCost } = getFinancialDefaults(data);
  const totalPages = data.contentInventory?.totalPages || 50;
  const totalContentInvestment = contentCost * totalPages;

  return Math.round(totalContentInvestment * 0.12); // 12% dilution rate as default
};
```

### ROI Calculation

ROI is calculated consistently across all components:

```javascript
const calculateROI = (revenue, investment) => {
  if (investment <= 0) return 0;
  return ((revenue - investment) / investment) * 100;
};
```

## Dashboard-Specific Implementations

All dashboards now use the same consistent approach to financial calculations from the centralized `financialCalculations.js` library:

1. **CommandCenterDashboard.js** - Uses the standardized defaults with sensitivity analysis
2. **Dashboard.js** - Uses the standardized calculation functions for all metrics
3. **SEOAnalysisDashboard.js** - Uses the standardized approach for financial metrics
4. **ContentLedgerDashboard.js** - Uses the standardized defaults for ROI calculations
5. **RiskDashboard.js** - Uses the standardized defaults for error page impact calculations
6. **useContentPnL.js** - Uses the standardized functions for all P&L metrics

## Tooltips and User Explanations

Each dashboard includes tooltips or explanations to help users understand the financial metrics:

- Hover over any financial metric to see the calculation methodology
- Question mark icons provide additional context on default values used
- Financial summary cards clearly indicate the source of the data (actual vs. estimated)

## Further Reading

For more details on the implementation, refer to `financialCalculations.js` in the utils folder.
