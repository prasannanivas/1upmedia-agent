/**
 * Content Decay Calculation Options
 *
 * Based on your 67% decay result, here are different approaches you can use:
 */

// OPTION 1: Current "Fair Value" Method (What you have now)
// Only counts items with hasDecay = true
// Result: 67% (high but potentially accurate)
// Use case: When you want to know the true decay rate of actually decaying content

// OPTION 2: Weighted by Total Items (More Conservative)
// Spreads decay across all items, including non-decaying ones
// Formula: (Sum of all decay) / (Total items including hasDecay = false)
// Result: Much lower percentage (maybe 15-25%)
// Use case: When you want overall portfolio impact

// OPTION 3: Capped Severe Decay (Conservative Cap)
// Same as current but caps individual items at 50% max decay
// Result: Lower than 67% (maybe 45-50%)
// Use case: When you think some decay values are unrealistic

// OPTION 4: Median-Based (Outlier Resistant)
// Uses median instead of average to reduce impact of extreme values
// Result: Varies based on distribution
// Use case: When you suspect outliers are skewing the average

// OPTION 5: Tiered Approach (Business Logic)
// Different weights for different decay levels
// Severe decay (70%+): Count as 50% max
// High decay (50-69%): Count as actual value
// Moderate decay (30-49%): Count as actual value
// Low decay (<30%): Count as actual value

export const calculateTieredDecay = (decayItems) => {
  const itemsWithDecay = decayItems.filter((item) => item.hasDecay === true);

  if (itemsWithDecay.length === 0) return 0;

  const tieredDecaySum = itemsWithDecay.reduce((sum, item) => {
    if (!item.metrics?.peakDrop) return sum;

    const decay = item.metrics.peakDrop;
    let adjustedDecay;

    if (decay >= 70) {
      adjustedDecay = 50; // Cap severe decay at 50%
    } else if (decay >= 50) {
      adjustedDecay = decay * 0.8; // Reduce high decay by 20%
    } else {
      adjustedDecay = decay; // Keep moderate/low decay as-is
    }

    return sum + adjustedDecay / 100;
  }, 0);

  return tieredDecaySum / itemsWithDecay.length;
};

// RECOMMENDATION:
// 1. Check console output to understand your data distribution
// 2. If most items with hasDecay=true have 60-80% decay, then 67% is accurate
// 3. If you want a more conservative approach, use Option 2 or 3
// 4. If you have business rules about maximum acceptable decay, use Option 5
