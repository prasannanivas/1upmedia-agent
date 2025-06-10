/**
 * Content Decay Calculation Utilities
 * Handles various decay calculation methods from GSC analysis data
 */

/**
 * Calculate decay percentage from peak performance
 * @param {number} peakValue - Peak performance value
 * @param {number} currentValue - Current performance value
 * @returns {number} Decay percentage (0-100)
 */
export const calculateDecayPercentage = (peakValue, currentValue) => {
  if (!peakValue || peakValue <= 0) return 0;
  const decay = ((peakValue - currentValue) / peakValue) * 100;
  return Math.max(0, Math.min(100, decay)); // Clamp between 0-100
};

/**
 * Calculate average decay from an array of decay items
 * Only counts items where hasDecay = true for fair value calculation
 * @param {Array} decayItems - Array of decay data items
 * @returns {number} Average decay ratio (0-1)
 */
export const calculateAverageDecay = (decayItems) => {
  if (!Array.isArray(decayItems) || decayItems.length === 0) {
    return 0.3; // Default fallback
  }

  // First filter: only items with hasDecay = true
  const itemsWithDecay = decayItems.filter((item) => item.hasDecay === true);

  if (itemsWithDecay.length === 0) {
    return 0; // No decay if no items have decay
  }

  // Second filter: valid items with proper metrics from items that have decay
  const validItems = itemsWithDecay.filter(
    (item) =>
      item.metrics &&
      typeof item.metrics.peakClicks === "number" &&
      typeof item.metrics.currentClicks === "number" &&
      item.metrics.peakClicks > 0
  );

  if (validItems.length === 0) {
    // Fallback to peakDrop if available, but only from items with hasDecay = true
    const itemsWithPeakDrop = itemsWithDecay.filter(
      (item) => item.metrics && typeof item.metrics.peakDrop === "number"
    );

    if (itemsWithPeakDrop.length > 0) {
      const totalDecay = itemsWithPeakDrop.reduce(
        (sum, item) => sum + item.metrics.peakDrop / 100,
        0
      );
      return totalDecay / itemsWithPeakDrop.length;
    }

    return 0; // No valid decay data
  }

  const totalDecay = validItems.reduce((sum, item) => {
    const decay = calculateDecayPercentage(
      item.metrics.peakClicks,
      item.metrics.currentClicks
    );
    return sum + decay / 100;
  }, 0);

  return totalDecay / validItems.length;
};

/**
 * Get decay statistics for debugging
 * @param {Array} decayItems - Array of decay data items
 * @returns {Object} Decay statistics
 */
export const getDecayStatistics = (decayItems) => {
  if (!Array.isArray(decayItems)) {
    return {
      total: 0,
      withDecay: 0,
      withoutDecay: 0,
      validMetrics: 0,
      decayRatio: 0,
    };
  }

  const total = decayItems.length;
  const withDecay = decayItems.filter((item) => item.hasDecay === true).length;
  const withoutDecay = total - withDecay;

  const itemsWithDecay = decayItems.filter((item) => item.hasDecay === true);
  const validMetrics = itemsWithDecay.filter(
    (item) =>
      item.metrics &&
      typeof item.metrics.peakClicks === "number" &&
      typeof item.metrics.currentClicks === "number" &&
      item.metrics.peakClicks > 0
  ).length;

  const decayRatio = calculateAverageDecay(decayItems);

  return {
    total,
    withDecay,
    withoutDecay,
    validMetrics,
    decayRatio,
    fairDecayPercentage: Math.round(decayRatio * 100),
  };
};

/**
 * Get content decay ratio from GSC analysis data
 * @param {Object} gscAnalysisData - GSC analysis data object
 * @param {string} timeframe - 'decay30Days' or 'decay90Days'
 * @returns {number} Decay ratio (0-1)
 */
export const getContentDecayRatio = (
  gscAnalysisData,
  timeframe = "decay90Days"
) => {
  if (!gscAnalysisData?.contentDecay) {
    return 0.3; // Default fallback
  }

  const decayData = gscAnalysisData.contentDecay[timeframe];

  if (!decayData) {
    return 0.3; // Default fallback
  }

  // If it's an array of decay items
  if (Array.isArray(decayData)) {
    return calculateAverageDecay(decayData);
  }

  // If it has a direct dropRatio property
  if (typeof decayData.dropRatio === "number") {
    return decayData.dropRatio;
  }

  // If it's a single decay item with metrics
  if (decayData.metrics) {
    if (typeof decayData.metrics.peakDrop === "number") {
      return decayData.metrics.peakDrop / 100;
    }

    if (
      typeof decayData.metrics.peakClicks === "number" &&
      typeof decayData.metrics.currentClicks === "number"
    ) {
      const decay = calculateDecayPercentage(
        decayData.metrics.peakClicks,
        decayData.metrics.currentClicks
      );
      return decay / 100;
    }
  }

  return 0.3; // Default fallback
};

/**
 * Calculate financial impact of content decay
 * @param {number} totalInvestment - Total content investment
 * @param {number} decayRatio - Decay ratio (0-1)
 * @returns {Object} Financial impact breakdown
 */
export const calculateDecayFinancialImpact = (totalInvestment, decayRatio) => {
  const loss = totalInvestment * decayRatio;
  const currentValue = totalInvestment - loss;

  return {
    totalInvestment: Math.round(totalInvestment),
    decayLoss: Math.round(loss),
    currentValue: Math.round(currentValue),
    decayPercentage: Math.round(decayRatio * 100),
  };
};

/**
 * Format decay data for display
 * @param {Object} gscAnalysisData - GSC analysis data
 * @param {number} totalInvestment - Total content investment
 * @returns {Object} Formatted decay metrics for display
 */
export const getDecayMetricsForDisplay = (
  gscAnalysisData,
  totalInvestment = 0
) => {
  const decay30DaysRatio = getContentDecayRatio(gscAnalysisData, "decay30Days");
  const decay90DaysRatio = getContentDecayRatio(gscAnalysisData, "decay90Days");

  const impact30Days = calculateDecayFinancialImpact(
    totalInvestment,
    decay30DaysRatio
  );
  const impact90Days = calculateDecayFinancialImpact(
    totalInvestment,
    decay90DaysRatio
  );

  // Get statistics for both timeframes
  const stats30Days = gscAnalysisData?.contentDecay?.decay30Days
    ? getDecayStatistics(gscAnalysisData.contentDecay.decay30Days)
    : null;
  const stats90Days = gscAnalysisData?.contentDecay?.decay90Days
    ? getDecayStatistics(gscAnalysisData.contentDecay.decay90Days)
    : null;

  return {
    decay30Days: {
      percentage: impact30Days.decayPercentage,
      ratio: decay30DaysRatio,
      financialImpact: impact30Days,
      statistics: stats30Days,
    },
    decay90Days: {
      percentage: impact90Days.decayPercentage,
      ratio: decay90DaysRatio,
      financialImpact: impact90Days,
      statistics: stats90Days,
    },
  };
};

/**
 * Calculate fair value decay ratio
 * This is the main function that implements the fair value calculation:
 * Out of contentCostWaste.length (e.g., 535) only count hasDecay = true and divide by that number
 * @param {Array} contentCostWasteData - Array of content cost waste items
 * @returns {Object} Fair value calculation results
 */
export const calculateFairValueDecay = (contentCostWasteData) => {
  if (!Array.isArray(contentCostWasteData)) {
    return {
      totalItems: 0,
      itemsWithDecay: 0,
      itemsWithoutDecay: 0,
      fairDecayRatio: 0,
      fairDecayPercentage: 0,
      explanation: "No valid data provided",
    };
  }

  const totalItems = contentCostWasteData.length;
  const itemsWithDecay = contentCostWasteData.filter(
    (item) => item.hasDecay === true
  );
  const itemsWithoutDecay = totalItems - itemsWithDecay.length;

  // Calculate decay only from items that actually have decay
  const fairDecayRatio = calculateAverageDecay(contentCostWasteData);
  const fairDecayPercentage = Math.round(fairDecayRatio * 100);

  return {
    totalItems,
    itemsWithDecay: itemsWithDecay.length,
    itemsWithoutDecay,
    fairDecayRatio,
    fairDecayPercentage,
    explanation: `Fair value: ${itemsWithDecay.length} items with decay out of ${totalItems} total items (${fairDecayPercentage}% average decay)`,
  };
};

/**
 * Analyze decay distribution to understand if high percentages are realistic
 * @param {Array} decayItems - Array of decay data items
 * @returns {Object} Detailed decay analysis
 */
export const analyzeDecayDistribution = (decayItems) => {
  if (!Array.isArray(decayItems) || decayItems.length === 0) {
    return {
      totalItems: 0,
      analysis: "No data available",
    };
  }

  const total = decayItems.length;
  const withDecay = decayItems.filter((item) => item.hasDecay === true);
  const withoutDecay = decayItems.filter((item) => item.hasDecay === false);

  // Analyze items with decay
  const decayAnalysis = withDecay.map((item) => ({
    hasDecay: item.hasDecay,
    peakClicks: item.metrics?.peakClicks || 0,
    currentClicks: item.metrics?.currentClicks || 0,
    peakDrop: item.metrics?.peakDrop || 0,
    decayStatus: item.decayStatus || "Unknown",
  }));

  // Calculate decay ranges
  const decayValues = withDecay
    .filter((item) => item.metrics?.peakDrop)
    .map((item) => item.metrics.peakDrop);

  const decayRanges = {
    severe: decayValues.filter((val) => val >= 70).length, // 70%+
    high: decayValues.filter((val) => val >= 50 && val < 70).length, // 50-69%
    moderate: decayValues.filter((val) => val >= 30 && val < 50).length, // 30-49%
    low: decayValues.filter((val) => val < 30).length, // <30%
  };

  const avgDecay =
    decayValues.length > 0
      ? decayValues.reduce((sum, val) => sum + val, 0) / decayValues.length
      : 0;

  return {
    totalItems: total,
    itemsWithDecay: withDecay.length,
    itemsWithoutDecay: withoutDecay.length,
    decayPercentageOfTotal: Math.round((withDecay.length / total) * 100),
    averageDecayOfDecayingItems: Math.round(avgDecay),
    decayRanges,
    sampleDecayingItems: decayAnalysis.slice(0, 5),
    recommendation: getDecayRecommendation(avgDecay, withDecay.length, total),
    explanation: `${withDecay.length} out of ${total} items (${Math.round(
      (withDecay.length / total) * 100
    )}%) are decaying. Of those decaying items, the average decay is ${Math.round(
      avgDecay
    )}%.`,
  };
};

/**
 * Get recommendation based on decay analysis
 * @param {number} avgDecay - Average decay percentage
 * @param {number} decayingItems - Number of items with decay
 * @param {number} totalItems - Total number of items
 * @returns {string} Recommendation text
 */
const getDecayRecommendation = (avgDecay, decayingItems, totalItems) => {
  const decayPercentage = (decayingItems / totalItems) * 100;

  if (avgDecay > 60 && decayPercentage > 20) {
    return "🚨 CRITICAL: High decay rate among many items. Immediate content refresh needed.";
  } else if (avgDecay > 60 && decayPercentage <= 20) {
    return "⚠️ HIGH: Severe decay in limited items. Focus on high-impact content first.";
  } else if (avgDecay > 40) {
    return "🔍 MODERATE: Noticeable decay pattern. Plan content updates strategically.";
  } else if (avgDecay > 20) {
    return "📊 NORMAL: Expected decay levels. Monitor and maintain content freshness.";
  } else {
    return "✅ LOW: Minimal decay detected. Content performing well.";
  }
};

/**
 * Alternative decay calculation methods for comparison
 * @param {Array} decayItems - Array of decay data items
 * @returns {Object} Different calculation approaches
 */
export const getAlternativeDecayCalculations = (decayItems) => {
  if (!Array.isArray(decayItems) || decayItems.length === 0) {
    return {
      currentMethod: 0,
      weightedByTotal: 0,
      cappedSevere: 0,
      medianBased: 0,
    };
  }

  const itemsWithDecay = decayItems.filter((item) => item.hasDecay === true);
  const total = decayItems.length;

  // Current method: Average of only items with hasDecay = true
  const currentMethod = calculateAverageDecay(decayItems);

  // Method 2: Weighted by total items (diluted by items without decay)
  const totalDecaySum = itemsWithDecay.reduce((sum, item) => {
    if (item.metrics?.peakDrop) {
      return sum + item.metrics.peakDrop / 100;
    }
    return sum;
  }, 0);
  const weightedByTotal = totalDecaySum / total;

  // Method 3: Cap severe decay at 50% max to be more conservative
  const cappedDecaySum = itemsWithDecay.reduce((sum, item) => {
    if (item.metrics?.peakDrop) {
      const cappedDecay = Math.min(item.metrics.peakDrop, 50); // Cap at 50%
      return sum + cappedDecay / 100;
    }
    return sum;
  }, 0);
  const cappedSevere =
    itemsWithDecay.length > 0 ? cappedDecaySum / itemsWithDecay.length : 0;

  // Method 4: Use median instead of average to reduce impact of outliers
  const decayValues = itemsWithDecay
    .filter((item) => item.metrics?.peakDrop)
    .map((item) => item.metrics.peakDrop)
    .sort((a, b) => a - b);

  let medianBased = 0;
  if (decayValues.length > 0) {
    const mid = Math.floor(decayValues.length / 2);
    const median =
      decayValues.length % 2 === 0
        ? (decayValues[mid - 1] + decayValues[mid]) / 2
        : decayValues[mid];
    medianBased = median / 100;
  }

  return {
    currentMethod: Math.round(currentMethod * 100),
    weightedByTotal: Math.round(weightedByTotal * 100),
    cappedSevere: Math.round(cappedSevere * 100),
    medianBased: Math.round(medianBased * 100),
    itemsWithDecay: itemsWithDecay.length,
    totalItems: total,
    explanation: {
      currentMethod: "Average decay of only items with hasDecay=true",
      weightedByTotal:
        "Total decay spread across all items (including non-decaying)",
      cappedSevere: "Average decay but caps individual items at 50% max",
      medianBased: "Median decay to reduce impact of extreme outliers",
    },
  };
};

/**
 * Configurable decay calculation with different methods
 * @param {Array} decayItems - Array of decay data items
 * @param {string} method - Calculation method ('fair', 'weighted', 'capped', 'median')
 * @returns {number} Decay ratio (0-1)
 */
export const getConfigurableDecayRatio = (decayItems, method = "fair") => {
  if (!Array.isArray(decayItems) || decayItems.length === 0) {
    return 0.3; // Default fallback
  }

  const itemsWithDecay = decayItems.filter((item) => item.hasDecay === true);
  const total = decayItems.length;

  switch (method) {
    case "fair":
      // Current method - only items with hasDecay = true
      return calculateAverageDecay(decayItems);

    case "weighted":
      // Weighted by total items (more conservative)
      if (itemsWithDecay.length === 0) return 0;
      const totalDecaySum = itemsWithDecay.reduce((sum, item) => {
        if (item.metrics?.peakDrop) {
          return sum + item.metrics.peakDrop / 100;
        }
        return sum;
      }, 0);
      return totalDecaySum / total;

    case "capped":
      // Cap individual decay at 50% max
      if (itemsWithDecay.length === 0) return 0;
      const cappedDecaySum = itemsWithDecay.reduce((sum, item) => {
        if (item.metrics?.peakDrop) {
          const cappedDecay = Math.min(item.metrics.peakDrop, 50);
          return sum + cappedDecay / 100;
        }
        return sum;
      }, 0);
      return cappedDecaySum / itemsWithDecay.length;

    case "median":
      // Use median to reduce outlier impact
      const decayValues = itemsWithDecay
        .filter((item) => item.metrics?.peakDrop)
        .map((item) => item.metrics.peakDrop)
        .sort((a, b) => a - b);

      if (decayValues.length === 0) return 0;

      const mid = Math.floor(decayValues.length / 2);
      const median =
        decayValues.length % 2 === 0
          ? (decayValues[mid - 1] + decayValues[mid]) / 2
          : decayValues[mid];
      return median / 100;

    default:
      return calculateAverageDecay(decayItems);
  }
};

/**
 * Calculate comprehensive loss metrics combining all loss types
 * @param {Object} gscAnalysisData - GSC analysis data object
 * @param {number} totalInvestment - Total content investment
 * @returns {Object} Combined loss calculations
 */
export const calculateComprehensiveLoss = (
  gscAnalysisData,
  totalInvestment = 0
) => {
  if (!gscAnalysisData || totalInvestment === 0) {
    return {
      totalLossValue: 0,
      averageLossPercentage: 0,
      currentContentValue: totalInvestment,
      individualLosses: {},
    };
  }

  // Extract data from GSC analysis
  const contentCostWasteData = gscAnalysisData.contentCostWaste || [];
  const contentDecayData30 = gscAnalysisData.contentDecay?.decay30Days || [];
  const contentDecayData60 = gscAnalysisData.contentDecay?.decay60Days || [];
  const contentDecayData90 = gscAnalysisData.contentDecay?.decay90Days || [];
  const keywordMismatchData = gscAnalysisData.keywordMismatch || [];
  const linkDilutionData = gscAnalysisData.linkDilution || [];
  const cannibalizationData = gscAnalysisData.cannibalization || [];

  // Calculate individual loss percentages (same logic as Dashboard.js)
  const totalUrls = contentCostWasteData.length;

  // 1. Revenue Leak (Content Cost Waste)
  const underperformingUrls = contentCostWasteData.filter(
    (item) => (item.roi || 0) < 0
  ).length;
  const revenueLeakPercentage =
    totalUrls > 0 ? (underperformingUrls / totalUrls) * 0.15 : 0;

  // 2. Content Decay Loss
  const allDecayData = [
    ...contentDecayData30,
    ...contentDecayData60,
    ...contentDecayData90,
  ];
  const severeDecayCount = allDecayData.filter(
    (item) => item.decayStatus === "Severe-Decay"
  ).length;
  const moderateDecayCount = allDecayData.filter(
    (item) => item.decayStatus === "Moderate-Decay"
  ).length;
  const contentDecayPercentage =
    allDecayData.length > 0
      ? (severeDecayCount * 0.25 + moderateDecayCount * 0.1) /
        allDecayData.length
      : 0;

  // 3. Keyword Mismatch Loss
  const underOptimizedCount = keywordMismatchData.filter(
    (item) => item.mismatchType === "Under-optimized"
  ).length;
  const overOptimizedCount = keywordMismatchData.filter(
    (item) => item.mismatchType === "Over-optimized"
  ).length;
  const kwMismatchPercentage =
    keywordMismatchData.length > 0
      ? (underOptimizedCount * 0.08 + overOptimizedCount * 0.05) /
        keywordMismatchData.length
      : 0;

  // 4. Link Dilution Loss
  const highDilutionCount = linkDilutionData.filter(
    (item) => (item.dilutionScore || 0) > 0.01
  ).length;
  const linkDilutionPercentage =
    linkDilutionData.length > 0
      ? (highDilutionCount / linkDilutionData.length) * 0.12
      : 0;

  // 5. Cannibalization Loss (Psychographic Mismatch)
  const cannibalizationCount = cannibalizationData.filter(
    (item) => (item.competingUrls || []).length > 1
  ).length;
  const cannibalizationPercentage =
    cannibalizationData.length > 0
      ? (cannibalizationCount / cannibalizationData.length) * 0.2
      : 0;

  // 6. Content Creation Cost Waste
  const wastedContentPercentage =
    totalUrls > 0 ? (underperformingUrls / totalUrls) * 0.25 : 0;

  // Calculate individual loss values
  const individualLosses = {
    revenueLeak: {
      percentage: revenueLeakPercentage,
      value: totalInvestment * revenueLeakPercentage,
    },
    contentDecay: {
      percentage: contentDecayPercentage,
      value: totalInvestment * contentDecayPercentage,
    },
    kwMismatch: {
      percentage: kwMismatchPercentage,
      value: totalInvestment * kwMismatchPercentage,
    },
    linkDilution: {
      percentage: linkDilutionPercentage,
      value: totalInvestment * linkDilutionPercentage,
    },
    cannibalization: {
      percentage: cannibalizationPercentage,
      value: totalInvestment * cannibalizationPercentage,
    },
    wastedContent: {
      percentage: wastedContentPercentage,
      value: totalInvestment * wastedContentPercentage,
    },
  };

  // Calculate average loss percentage across all loss types
  const allLossPercentages = [
    revenueLeakPercentage,
    contentDecayPercentage,
    kwMismatchPercentage,
    linkDilutionPercentage,
    cannibalizationPercentage,
    wastedContentPercentage,
  ];

  const validLossPercentages = allLossPercentages.filter(
    (percentage) => percentage > 0
  );
  const averageLossPercentage =
    validLossPercentages.length > 0
      ? validLossPercentages.reduce((sum, percentage) => sum + percentage, 0) /
        validLossPercentages.length
      : 0;

  // Calculate total loss value and current content value
  const totalLossValue = totalInvestment * averageLossPercentage;
  const currentContentValue = totalInvestment - totalLossValue;

  return {
    totalLossValue: Math.round(totalLossValue),
    averageLossPercentage: Math.round(averageLossPercentage * 100),
    currentContentValue: Math.round(currentContentValue),
    individualLosses,
    activeLossTypes: validLossPercentages.length,
    explanation: `Average of ${
      validLossPercentages.length
    } active loss types: ${Math.round(averageLossPercentage * 100)}%`,
  };
};
