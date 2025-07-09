# ROI Recovery Potential - Technical Documentation

_Last updated: July 9, 2025_

## Overview

The `getROIRecoveryPotential` function calculates the potential revenue recovery from fixing various SEO and content issues. It analyzes multiple data sources to quantify current revenue losses and determine realistic recovery opportunities across different timeframes.

## Table of Contents

1. [Function Purpose](#function-purpose)
2. [Input Requirements](#input-requirements)
3. [Configuration Parameters](#configuration-parameters)
4. [Mathematical Logic](#mathematical-logic)
5. [Loss Calculation Process](#loss-calculation-process)
6. [Recovery Calculation Process](#recovery-calculation-process)
7. [Timeframe Analysis](#timeframe-analysis)
8. [ROI Scenarios](#roi-scenarios)
9. [Priority Matrix](#priority-matrix)
10. [Technical Implementation](#technical-implementation)
11. [Return Structure](#return-structure)

## Function Purpose

The `getROIRecoveryPotential` function serves as a financial modeling tool for content strategy optimization. It:

- Identifies current revenue losses from content issues
- Calculates realistic recovery potential within specific timeframes
- Provides ROI projections for optimization investments
- Prioritizes opportunities based on effort and impact
- Estimates both short-term (30-day) and long-term (360-day) recovery potential

## Input Requirements

### Required Global Variables

The function requires the following data to be available in the global scope:

- `calculations`: Object containing financial metrics
- `onboardingData`: Object containing domain/website financial details
- `decay30Days`, `decay60Days`, `decay90Days`: Arrays of URLs experiencing traffic decay
- `keywordMismatch`: Array of URLs with keyword targeting issues
- `cannibalization`: Array of keyword cannibalization data
- `linkDilution`: Array of URLs with link structure issues
- `psychMismatchData`: Object with funnel distribution data (optional)
- `contentCostWaste`: Array of URLs with content investment data

### Parameter

- `userOverrides`: Optional object to override default configuration parameters

## Configuration Parameters

The function uses a comprehensive configuration model (`RECOVERY_CONFIG`) with the following parameters:

```javascript
{
  /* Traffic & revenue */
  sessionsByUrl: {}, // Per-URL traffic data (optional)
  conversionRate: 0.02, // 2% default conversion rate
  revenuePerConversion: null, // Falls back to AOV if not provided
  margin: 0.7, // 70% profit margin

  /* Risk caps (as % of total content investment) */
  maxLossPerCategoryPct: 0.02, // 2% cap per category
  maxPortfolioLossPct: 0.05, // 5% total portfolio cap

  /* Multipliers (loss & recovery) */
  multipliers: {
    decay: { loss: 0.8, recovery: 0.55 },
    mismatch: { loss: 0.6, recovery: 0.65 },
    cannibal: { loss: 1.2, recovery: 0.7 },
    dilution: { loss: 0.4, recovery: 0.5 },
    funnel: { loss: 1.0, recovery: 0.6 },
  },

  /* Remediation effort model */
  remediationCostPerHour: 120,
  hoursPerUrl: {
    decayFix: 2,
    mismatchFix: 1.5,
    cannibalFix: 3,
    dilutionFix: 4,
  },
}
```

## Mathematical Logic

### Core Loss Estimation Formula

For each URL in each issue category, the function calculates:

```
Loss = MAX(LostProfit, WastedCost)
```

Where:

- `LostProfit = Sessions × ConversionRate × RevenuePerConversion × Margin`
- `WastedCost = ContentCost × LossMultiplier`

This approach ensures we account for both the opportunity cost of lost conversions and the inefficient investment in content.

### Loss Multipliers by Category

Each category has a specific loss multiplier based on its typical business impact:

| Category         | Loss Multiplier | Rationale                                                         |
| ---------------- | --------------- | ----------------------------------------------------------------- |
| Content Decay    | 0.8             | Severe decay indicates substantial loss in traffic and engagement |
| Keyword Mismatch | 0.6             | Targeting issues lead to moderate traffic/conversion losses       |
| Cannibalization  | 1.2             | Self-competition creates significant ranking dilution             |
| Link Dilution    | 0.4             | Internal link issues have lower but measurable impact             |
| Funnel Alignment | 1.0             | Funnel misalignment directly impacts conversion potential         |

### Recovery Rate Modeling

Recovery potential is calculated based on category-specific recovery rates:

| Category         | Recovery Rate | Rationale                                                    |
| ---------------- | ------------- | ------------------------------------------------------------ |
| Content Decay    | 55%           | Content decay can be substantially recovered through updates |
| Keyword Mismatch | 65%           | Keyword optimization has high success rate                   |
| Cannibalization  | 70%           | Resolving cannibalization yields strong recovery             |
| Link Dilution    | 50%           | Link structure changes have moderate recovery potential      |
| Funnel Alignment | 60%           | Funnel optimization yields substantial improvements          |

## Loss Calculation Process

1. **URL Collection**: The function gathers URLs with issues from each data source:

   - Severe decay URLs from decay30Days, decay60Days, decay90Days
   - High/medium mismatch URLs from keywordMismatch
   - URLs involved in severe cannibalization cases (3+ competing URLs)
   - URLs with severe/moderate link dilution

2. **Per-URL Loss Estimation**:

   - Retrieves traffic (sessions) for each URL if available, or uses baseline
   - Retrieves content cost for each URL if available, or uses average cost
   - Calculates both lost profit and wasted cost models
   - Selects the higher of the two as the estimated loss
   - Applies category-specific loss multipliers

3. **Category Loss Aggregation**:

   - Sums individual URL losses within each category
   - Caps category loss at 2% of total content investment for realism
   - Calculates recovery potential based on category-specific recovery rates

4. **Portfolio-Level Loss Management**:
   - Calculates total portfolio loss across all categories
   - Applies portfolio-level cap (5% of total content investment)
   - If exceeded, scales down all category losses proportionally

## Recovery Calculation Process

The recovery potential is calculated using a weighted approach:

1. For each issue category:

   ```
   CategoryRecoveryPotential = CategoryLoss × CategoryRecoveryRate
   ```

2. For the 30-day recovery:

   ```
   ThirtyDayRecoveryPotential = Sum of recoveryPotential for 30-day opportunities
   ```

3. For 360-day recovery, when total system loss is significantly higher:

   ```
   WeightedRecoveryFactor = Sum(CategoryWeight × CategoryRecoveryRate) for all categories
   AlignedRecoveryPotential = TotalSystemLoss × WeightedRecoveryFactor
   ```

   Where:

   - CategoryWeight = CategoryLoss / TotalCategoryLoss
   - WeightedRecoveryFactor is bounded between 55% and 85%

## Timeframe Analysis

The function organizes recovery opportunities into timeframes:

### 30-Day Opportunities

- **Keyword Optimization**: Full mismatch recovery potential
- **Quick Content Fixes**: 40% of decay recovery potential

### 60-Day Opportunities

- **Content Decay Recovery**: Remaining 60% of decay recovery
- **Cannibalization Resolution**: Full cannibalization recovery

### 90-Day Opportunities

- **Link Structure Optimization**: Full link dilution recovery
- **Funnel Alignment**: Full funnel alignment recovery

### 180-Day Opportunities

- All previous categories with scaling factors to account for additional discoveries:
  - Content Decay: 15% more loss, 20% more recovery potential
  - Keyword Mismatch: 20% more loss, 25% more recovery potential
  - Cannibalization: 10% more loss, 15% more recovery potential
  - Link Dilution: 25% more loss, 30% more recovery potential
  - Funnel Alignment: 18% more loss, 22% more recovery potential

### 360-Day Opportunities

- Further scaled opportunities for comprehensive recovery:
  - Content Decay: 30% more loss, 40% more recovery potential
  - Keyword Mismatch: 50% more loss, 70% more recovery potential
  - Cannibalization: 25% more loss, 35% more recovery potential
  - Link Dilution: 60% more loss, 80% more recovery potential
  - Funnel Alignment: 45% more loss, 60% more recovery potential

## ROI Scenarios

The function calculates ROI scenarios for 30-day recovery:

```
InvestmentRequired = MAX(ThirtyDayLoss × 0.5, TotalContentCost × 0.01)

ROI = ((RecoveryPotential × RecoveryPercentage - InvestmentRequired) / InvestmentRequired) × 100
```

Three scenarios are provided:

- Conservative: 40% recovery
- Realistic: 65% recovery
- Optimistic: 85% recovery

## Priority Matrix

The function creates a priority matrix for 30-day opportunities by scoring each based on:

- Recovery potential (financial impact)
- Effort required (Low/Medium/High)
- Priority level (High/Medium/Critical)

Opportunities are ranked by their impact score to identify:

- Quick wins (low effort, high impact)
- High-impact projects (recovery potential > 30% of total)

## Technical Implementation

The function follows a structured process:

1. **Configuration and Basic Checks**:

   - Merges user overrides with defaults
   - Validates essential financial data
   - Calculates baseline metrics

2. **URL Collection and Categorization**:

   - Gathers URLs with issues from each data source
   - Organizes URLs by issue category
   - Handles missing or synthetic data

3. **Loss and Recovery Calculation**:

   - Calculates per-URL losses
   - Aggregates by category
   - Applies recovery rates
   - Enforces portfolio-level caps

4. **Timeframe Modeling**:

   - Structures opportunities by timeframe
   - Applies scaling factors for extended timeframes
   - Calculates aggregates for each timeframe

5. **ROI and Priority Analysis**:

   - Calculates investment requirements
   - Models ROI scenarios
   - Scores and ranks opportunities

6. **Total System Loss Alignment**:
   - Aligns 360-day recovery with total system loss
   - Calculates weighted recovery factor

## Return Structure

The function returns a comprehensive object with:

```javascript
{
  summary: {
    totalCurrentLoss: Number,         // Total 30-day loss in dollars
    totalRecoveryPotential: Number,   // Total 30-day recovery in dollars
    recoveryPercentage: Number,       // Recovery percentage for 30-day
    investmentRequired: Number,       // Investment needed for 30-day recovery
    bestCaseROI: Number,              // Best-case ROI percentage
    timeframe: String                 // "30 days"
  },
  recoveryOpportunities: {            // Breakdown by category
    "Content Decay Recovery": { currentLoss, recoveryPotential },
    "Keyword Optimization": { currentLoss, recoveryPotential },
    // etc.
  },
  recoveryTimeframes: {               // Detailed plans by timeframe
    "30-day": { opportunities: {...} },
    "60-day": { opportunities: {...} },
    // etc.
  },
  roiScenarios: {                    // ROI projection scenarios
    "Conservative (40% recovery)": { recoveredRevenue, roi, timeframe },
    // etc.
  },
  priorityMatrix: [{                 // Scored and ranked opportunities
    name, recoveryPotential, effort, priority, impactScore
  }],
  quickWins: [...],                  // Low-effort high-impact opportunities
  highImpactProjects: [...],         // Highest impact projects
  oneEightyDay: {                    // 180-day aggregates
    currentLoss, recoveryPotential
  },
  threeSixtyDay: {                   // 360-day aggregates
    currentLoss, recoveryPotential, recoveryFactor
  },
  totalSystemLoss: Number,           // Total system-wide loss
  assumptions: Object,               // Configuration used for calculations
  scalingFactor: Number              // Portfolio scaling factor (if applied)
}
```

---

## Implementation Notes

- The function applies conservative caps to avoid overestimating losses or recovery potential
- Baseline values are used for URLs without traffic or cost data
- Synthetic data ensures meaningful outputs even with limited input data
- The weighted recovery factor ensures realistic recovery projections at scale
- The priority matrix helps focus efforts on highest ROI opportunities first

---

_This document was generated to provide technical documentation for the ROI Recovery Potential calculation methodology._
