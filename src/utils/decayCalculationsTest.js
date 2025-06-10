/**
 * Test file to demonstrate the fair value decay calculation
 * Run this to see how the improved calculation works with hasDecay filtering
 */

import {
  calculateFairValueDecay,
  getDecayStatistics,
  calculateAverageDecay,
} from "./decayCalculations.js";

// Example data structure similar to what you have
const exampleContentCostWasteData = [
  // Items with decay
  {
    hasDecay: true,
    metrics: {
      peakClicks: 10,
      currentClicks: 3,
      peakDrop: 70,
    },
  },
  {
    hasDecay: true,
    metrics: {
      peakClicks: 5,
      currentClicks: 2,
      peakDrop: 60,
    },
  },
  {
    hasDecay: true,
    metrics: {
      peakClicks: 8,
      currentClicks: 1,
      peakDrop: 87.5,
    },
  },
  // Items without decay
  {
    hasDecay: false,
    metrics: {
      peakClicks: 4,
      currentClicks: 4,
      peakDrop: 0,
    },
  },
  {
    hasDecay: false,
    metrics: {
      peakClicks: 6,
      currentClicks: 7,
      peakDrop: 0,
    },
  },
];

// Test the fair value calculation
console.log("=== Fair Value Decay Calculation Test ===");
const fairValueResult = calculateFairValueDecay(exampleContentCostWasteData);
console.log("Fair Value Result:", fairValueResult);

console.log("\n=== Detailed Statistics ===");
const stats = getDecayStatistics(exampleContentCostWasteData);
console.log("Decay Statistics:", stats);

console.log("\n=== Old vs New Calculation Comparison ===");

// Old way: Calculate average from all items (including hasDecay = false)
const oldCalculation =
  exampleContentCostWasteData.reduce((sum, item) => {
    if (item.metrics && item.metrics.peakDrop) {
      return sum + item.metrics.peakDrop / 100;
    }
    return sum;
  }, 0) / exampleContentCostWasteData.length;

// New way: Only count items with hasDecay = true
const newCalculation = calculateAverageDecay(exampleContentCostWasteData);

console.log(
  `Old calculation (all ${
    exampleContentCostWasteData.length
  } items): ${Math.round(oldCalculation * 100)}%`
);
console.log(
  `New calculation (only ${stats.withDecay} items with decay): ${Math.round(
    newCalculation * 100
  )}%`
);
console.log(
  `Difference: ${Math.round(
    (newCalculation - oldCalculation) * 100
  )} percentage points`
);

export { exampleContentCostWasteData };
