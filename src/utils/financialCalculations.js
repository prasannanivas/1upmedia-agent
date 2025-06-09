/**
 * @fileoverview Financial Calculations Library
 *
 * This module provides standardized financial calculations for SEO metrics
 * across all dashboards in the application. It ensures consistent calculation
 * methodologies and default values throughout the application.
 *
 * Standard default values:
 * - Average Order Value: $50 (previously varied from $10-$50)
 * - Content Cost: $200 (previously varied from $7.3-$200)
 * - Default Conversion Rate: 0.02 (2%)
 *
 * @module financialCalculations
 * @requires none
 * @version 1.0.0
 * @since 2025-06-06
 * @author SEO Team
 */

/**
 * Gets standardized default values for financial parameters
 *
 * @param {Object} onboardingData - The onboarding data object
 * @returns {Object} Object containing standardized financial parameter values
 */
export const getFinancialDefaults = (onboardingData = {}) => {
  const { domainCostDetails = {} } = onboardingData;

  return {
    averageOrderValue: parseFloat(domainCostDetails?.averageOrderValue) || 50,
    contentCost: parseFloat(domainCostDetails?.AverageContentCost) || 200,
    conversionRate: 0.02, // Default 2% conversion rate
  };
};

/**
 * Calculates estimated revenue leak based on potential traffic and conversion data
 *
 * @param {Object} data - Data object containing analysis metrics
 * @param {number} leakPercent - Optional leak percentage (default: 0.05 or 5%)
 * @returns {number} Estimated revenue leak value
 */
export const calculateRevenueLeak = (data, leakPercent = 0.05) => {
  const financialParams = getFinancialDefaults(data);
  const totalAnalyzed = data.funnelAnalysis?.totalAnalyzed || 0;
  const potentialRevenue =
    totalAnalyzed *
    financialParams.averageOrderValue *
    financialParams.conversionRate;

  return Math.round(potentialRevenue * leakPercent);
};

/**
 * Calculates content decay financial impact
 *
 * @param {Object} data - Data containing content decay metrics
 * @param {Array} contentDecayItems - Array of content decay items
 * @returns {number} Estimated financial impact of content decay
 */
export const calculateContentDecay = (data, contentDecayItems = []) => {
  // If real decay metrics available, use them
  if (Array.isArray(contentDecayItems) && contentDecayItems.length > 0) {
    return contentDecayItems.reduce(
      (sum, item) => sum + (item.estimatedRevenueLoss || 0),
      0
    );
  }

  // Otherwise use estimation based on total traffic and conversion
  const financialParams = getFinancialDefaults(data);
  const totalTraffic = data.GSCData?.totalClicks || 0;
  const decayRate = 0.07; // 7% decay rate as default
  return Math.round(
    totalTraffic *
      financialParams.averageOrderValue *
      financialParams.conversionRate *
      decayRate
  );
};

/**
 * Calculates keyword mismatch financial impact
 *
 * @param {Object} data - Data containing keyword metrics
 * @param {Array} keywordMismatchItems - Array of keyword mismatch items
 * @returns {number} Estimated financial impact of keyword mismatches
 */
export const calculateKwMismatch = (data, keywordMismatchItems = []) => {
  const financialParams = getFinancialDefaults(data);

  // If real keyword mismatch data available, use it
  if (Array.isArray(keywordMismatchItems) && keywordMismatchItems.length > 0) {
    const missedClicks = keywordMismatchItems.reduce(
      (sum, item) => sum + (item.missedClicks || 0),
      0
    );
    return Math.round(
      missedClicks *
        financialParams.averageOrderValue *
        financialParams.conversionRate
    );
  }

  // Otherwise estimate based on DA vs KD gap
  const domainAuthority = data.domainMetrics?.DA || 30;
  const avgKeywordDifficulty = data.keywordResearch?.avgKD || 20;
  const daKdGap = Math.max(0, domainAuthority - avgKeywordDifficulty);
  const potentialTraffic = data.GSCData?.totalClicks || 1000;

  return Math.round(
    potentialTraffic *
      0.3 *
      (daKdGap / 100) *
      financialParams.averageOrderValue *
      financialParams.conversionRate
  );
};

/**
 * Calculates link dilution financial impact
 *
 * @param {Object} data - Data containing link metrics
 * @param {Array} linkDilutionItems - Array of link dilution items
 * @returns {number} Estimated financial impact of link dilution
 */
export const calculateLinkDilution = (data, linkDilutionItems = []) => {
  // If real link dilution data available, use it
  if (Array.isArray(linkDilutionItems) && linkDilutionItems.length > 0) {
    const total = linkDilutionItems.reduce((sum, item) => {
      // Ensure we're working with numbers
      const loss =
        typeof item.estimatedLoss === "number"
          ? item.estimatedLoss
          : typeof item.dilutionScore === "number"
          ? item.dilutionScore
          : typeof item.loss === "number"
          ? item.loss
          : 0;
      return sum + loss;
    }, 0);
    return Math.round(total);
  }

  // Otherwise estimate based on total content investment
  const financialParams = getFinancialDefaults(data);
  const totalPages = data.contentInventory?.totalPages || 50;
  const totalContentInvestment = financialParams.contentCost * totalPages;

  return Math.round(totalContentInvestment * 0.12); // 12% dilution rate as default
};

/**
 * Calculates psychographic mismatch financial impact
 *
 * @param {Object} data - Data containing psychographic metrics
 * @returns {number} Estimated financial impact of psychographic mismatches
 */
export const calculatePsychoMismatch = (data) => {
  const financialParams = getFinancialDefaults(data);

  // If real psychographic data available, use it
  const psychData = data.funnelAnalysis?.psychCompositeSummary?.overall;
  if (psychData?.emotionalResonance) {
    const mismatchPercent =
      Math.max(0, 100 - psychData.emotionalResonance) / 100;
    const totalTraffic = data.GSCData?.totalClicks || 1000;

    return Math.round(
      totalTraffic *
        financialParams.averageOrderValue *
        financialParams.conversionRate *
        mismatchPercent
    );
  }

  // Otherwise use default estimation
  const totalTraffic = data.GSCData?.totalClicks || 1000;
  return Math.round(
    totalTraffic *
      financialParams.averageOrderValue *
      financialParams.conversionRate *
      0.15
  ); // 15% default mismatch impact
};

/**
 * Calculates keyword cannibalization financial impact
 *
 * @param {Object} data - Data containing cannibalization metrics
 * @param {Array} cannibalizationItems - Array of keyword cannibalization items
 * @returns {number} Estimated financial impact of keyword cannibalization
 */
export const calculateCannibalization = (data, cannibalizationItems = []) => {
  // If real cannibalization data available, use it
  if (Array.isArray(cannibalizationItems) && cannibalizationItems.length > 0) {
    return cannibalizationItems.reduce(
      (sum, item) => sum + (item.estimatedLoss || 0),
      0
    );
  }

  // Otherwise estimate based on content investment
  const financialParams = getFinancialDefaults(data);
  const totalPages = data.contentInventory?.totalPages || 50;
  const totalContentInvestment = financialParams.contentCost * totalPages;

  return Math.round(totalContentInvestment * 0.45); // 45% efficiency gap as default
};

/**
 * Calculates content waste financial impact
 *
 * @param {Object} data - Data containing content waste metrics
 * @param {Array} contentCostWasteItems - Array of content cost waste items
 * @returns {number} Estimated financial impact of content waste
 */
export const calculateContentWaste = (data, contentCostWasteItems = []) => {
  const { contentCost } = getFinancialDefaults(data);

  // If real content waste data available, use it
  if (
    Array.isArray(contentCostWasteItems) &&
    contentCostWasteItems.length > 0
  ) {
    return contentCostWasteItems.reduce(
      (sum, item) => sum + (item.wastedSpend || 0),
      0
    );
  }

  // Otherwise estimate based on content investment
  const totalPages = data.contentInventory?.totalPages || 50;
  const totalContentInvestment = contentCost * totalPages;

  return Math.round(totalContentInvestment * 0.53); // 53% waste rate as default
};

/**
 * Calculates estimated ROI from content investment
 *
 * @param {number} revenue - Estimated revenue from content
 * @param {number} investment - Total content investment
 * @returns {number} ROI percentage
 */
export const calculateROI = (revenue, investment) => {
  if (investment <= 0) return 0;
  return ((revenue - investment) / investment) * 100;
};

/**
 * Calculates financial impact of 404/error pages
 *
 * @param {Object} data - Data containing error page metrics
 * @param {Array} notFoundPages - Array of 404/error page items
 * @returns {number} Estimated financial impact of 404/error pages
 */
export const calculateNotFoundImpact = (data, notFoundPages = []) => {
  // If real 404 data available, use it
  if (Array.isArray(notFoundPages) && notFoundPages.length > 0) {
    return notFoundPages.reduce(
      (sum, item) => sum + (item.estimatedLoss?.mid || 0) * 4.5,
      0
    );
  }

  // Otherwise estimate based on total traffic
  const financialParams = getFinancialDefaults(data);
  const totalTraffic = data.GSCData?.totalClicks || 1000;
  return Math.round(
    totalTraffic *
      0.04 *
      financialParams.averageOrderValue *
      financialParams.conversionRate
  ); // 4% error rate as default
};

/**
 * Calculates funnel gap impact based on stage distribution
 *
 * @param {Object} data - Data containing funnel analysis
 * @returns {Object} Object containing gap type and impact calculations
 */
export const calculateFunnelGaps = (data) => {
  const financialParams = getFinancialDefaults(data);
  const funnelData = data.funnelAnalysis?.funnelDistribution || {};

  const totalFunnelPages =
    (funnelData.ToF || 0) +
    (funnelData.MoF || 0) +
    (funnelData.BoF || 0) +
    (funnelData.Unknown || 0);

  if (totalFunnelPages === 0) {
    return { gapType: "Insufficient Data", impact: 0 };
  }

  const tofPercentage = ((funnelData.ToF || 0) / totalFunnelPages) * 100;
  const mofPercentage = ((funnelData.MoF || 0) / totalFunnelPages) * 100;
  const bofPercentage = ((funnelData.BoF || 0) / totalFunnelPages) * 100;

  // Determine gap type based on percentages
  let gapType = "Balanced";
  let impact = 0;

  if (mofPercentage < 10) {
    gapType = "MoF Crisis";
    const mofDeficit = Math.max(15 - mofPercentage, 0);
    impact = Math.round(
      mofDeficit * financialParams.contentCost * 0.8 +
        mofDeficit *
          ((financialParams.averageOrderValue *
            (2.5 / financialParams.conversionRate)) /
            1000) *
          100
    );
  } else if (tofPercentage < 20) {
    gapType = "ToF Deficit";
    const tofDeficit = Math.max(25 - tofPercentage, 0);
    impact = Math.round(
      tofDeficit * financialParams.contentCost * 0.6 +
        tofDeficit *
          ((financialParams.averageOrderValue *
            (2.0 / financialParams.conversionRate)) /
            1000) *
          80
    );
  } else if (bofPercentage > 60) {
    gapType = "BoF Heavy";
    const bofExcess = Math.max(bofPercentage - 50, 0);
    impact = Math.round(
      bofExcess * financialParams.contentCost * 0.4 +
        bofExcess *
          ((financialParams.averageOrderValue *
            (1.8 / financialParams.conversionRate)) /
            1000) *
          60
    );
  } else if (bofPercentage < 15) {
    gapType = "BoF Deficit";
    const bofDeficit = Math.max(20 - bofPercentage, 0);
    impact = Math.round(
      bofDeficit * financialParams.contentCost * 0.7 +
        bofDeficit *
          ((financialParams.averageOrderValue *
            (2.2 / financialParams.conversionRate)) /
            1000) *
          90
    );
  }

  return { gapType, impact };
};

/**
 * Calculates deep decay dollar impact for command center
 *
 * @param {Object} data - Data containing search console metrics
 * @param {number} deepDecayPages - Number of pages in deep decay
 * @param {number} conversionRate - Current conversion rate (decimal)
 * @returns {number} Deep decay dollar impact
 */
export const calculateDeepDecayDollar = (
  data,
  deepDecayPages,
  conversionRate = 0.02
) => {
  const financialParams = getFinancialDefaults(data);
  const totalClicks =
    data.searchConsoleData?.reduce(
      (sum, item) => sum + (item.clicks || 0),
      0
    ) || 0;

  return Math.round(
    deepDecayPages * financialParams.contentCost * 3 +
      deepDecayPages *
        ((financialParams.averageOrderValue * (3.0 / conversionRate)) / 100) *
        totalClicks *
        0.2
  );
};

/**
 * Calculates high dilution dollar impact for command center
 *
 * @param {Object} data - Data containing search console metrics
 * @param {number} highDilutionPages - Number of pages with high dilution
 * @param {number} conversionRate - Current conversion rate (decimal)
 * @returns {number} High dilution dollar impact
 */
export const calculateHighDilutionDollar = (
  data,
  highDilutionPages,
  conversionRate = 0.02
) => {
  const financialParams = getFinancialDefaults(data);
  const totalClicks =
    data.searchConsoleData?.reduce(
      (sum, item) => sum + (item.clicks || 0),
      0
    ) || 0;

  return Math.round(
    highDilutionPages * financialParams.contentCost * 2 +
      highDilutionPages *
        ((financialParams.averageOrderValue * (2.0 / conversionRate)) / 100) *
        totalClicks *
        0.25
  );
};

/**
 * Calculates keyword mismatch dollar impact for command center
 *
 * @param {Object} data - Data containing search console metrics
 * @param {number} lowKDHighDAUrls - Number of URLs with keyword mismatch
 * @param {number} conversionRate - Current conversion rate (decimal)
 * @returns {number} Keyword mismatch dollar impact
 */
export const calculateKeywordMismatchDollar = (
  data,
  lowKDHighDAUrls,
  conversionRate = 0.02
) => {
  const financialParams = getFinancialDefaults(data);

  return Math.round(
    lowKDHighDAUrls *
      ((financialParams.averageOrderValue * (3.0 / conversionRate)) / 100) *
      25 +
      lowKDHighDAUrls * financialParams.contentCost * 2
  );
};

/**
 * Calculates psychographic mismatch dollar impact for command center
 *
 * @param {Object} data - Data containing search console metrics
 * @param {number} psychoMismatch - Psychographic mismatch percentage
 * @param {number} conversionRate - Current conversion rate (decimal)
 * @returns {number} Psychographic mismatch dollar impact
 */
export const calculatePsychoMismatchDollar = (
  data,
  psychoMismatch,
  conversionRate = 2.0 // Default 2% as percentage to match dashboard conventions
) => {
  const financialParams = getFinancialDefaults(data);
  const totalClicks =
    data.searchConsoleData?.reduce(
      (sum, item) => sum + (item.clicks || 0),
      0
    ) || 0;

  return Math.round(
    (psychoMismatch / 100) *
      totalClicks *
      ((financialParams.averageOrderValue * (2.5 / conversionRate)) / 100) *
      6 +
      psychoMismatch * financialParams.contentCost * 1.5
  );
};

/**
 * Calculates blended authority for keyword intelligence
 *
 * @param {number} domainAuthority - Domain authority score
 * @param {number} avgPageAuthority - Average page authority score
 * @returns {number} Blended authority score
 */
export const calculateBlendedAuthority = (
  domainAuthority,
  avgPageAuthority
) => {
  return 0.6 * domainAuthority + 0.4 * avgPageAuthority;
};

/**
 * Calculates efficiency ratio for strategy analysis
 *
 * @param {number} domainAuthority - Domain authority score
 * @param {number} avgKeywordDifficulty - Average keyword difficulty
 * @returns {number} Efficiency ratio
 */
export const calculateEfficiencyRatio = (
  domainAuthority,
  avgKeywordDifficulty
) => {
  return avgKeywordDifficulty > 0
    ? domainAuthority / avgKeywordDifficulty
    : 1.0;
};

/**
 * Calculates delta above class for strategy analysis
 *
 * @param {number} avgKeywordDifficulty - Average keyword difficulty
 * @param {number} domainAuthority - Domain authority score
 * @returns {number} Delta above class value
 */
export const calculateDeltaAboveClass = (
  avgKeywordDifficulty,
  domainAuthority
) => {
  return Math.max(0, avgKeywordDifficulty - domainAuthority);
};

/**
 * Calculates content grade based on performance metrics
 *
 * @param {Object} metrics - Object containing roi, trafficTrend, conversionRate, engagementScore
 * @returns {string} Content grade (A, B, C, D)
 */
export const calculateContentGrade = (metrics) => {
  const {
    roi = 0,
    trafficTrend = 0,
    conversionRate = 2,
    engagementScore = 50,
  } = metrics;

  let score = 0;

  // ROI contribution (40%)
  if (roi > 50) score += 40;
  else if (roi > 0) score += 20;
  else if (roi > -25) score += 10;

  // Traffic trend contribution (30%)
  if (trafficTrend > 5) score += 30;
  else if (trafficTrend > 0) score += 20;
  else if (trafficTrend > -10) score += 10;

  // Conversion rate contribution (20%)
  if (conversionRate > 3) score += 20;
  else if (conversionRate > 2) score += 15;
  else if (conversionRate > 1) score += 10;

  // Engagement score contribution (10%)
  if (engagementScore > 70) score += 10;
  else if (engagementScore > 50) score += 7;
  else if (engagementScore > 30) score += 5;

  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
};

/**
 * Helper function to get URL count for specific leak types
 *
 * @param {Object} data - Onboarding data
 * @param {string} leakType - Type of leak (contentDecay, kwMismatch, linkDilution, psychoMismatch)
 * @returns {number} Number of affected URLs
 */
export const getAffectedUrlsCount = (data, leakType) => {
  const totalAnalyzed = data.funnelAnalysis?.totalAnalyzed || 50;

  switch (leakType) {
    case "contentDecay":
      return (
        data.funnelAnalysis?.decayPages || Math.round(totalAnalyzed * 0.25)
      );
    case "kwMismatch":
      return Math.round(totalAnalyzed * 0.15);
    case "linkDilution":
      return (
        data.funnelAnalysis?.dilutionPages || Math.round(totalAnalyzed * 0.15)
      );
    case "psychoMismatch":
      return Math.round(totalAnalyzed * 0.3);
    default:
      return 0;
  }
};

/**
 * Calculate standardized deep decay pages count
 *
 * @param {Object} data - Data containing search console and analysis data
 * @returns {number} Number of pages in deep decay
 */
export const calculateDeepDecayPagesCount = (data) => {
  const gscAnalysisData = data?.GSCAnalysisData || {};
  const contentDecayData = gscAnalysisData?.contentDecay || [];
  const searchConsoleData = Array.isArray(data?.searchConsoleData)
    ? data.searchConsoleData
    : [];

  // First priority: Use processed decay data if available
  if (contentDecayData.length > 0) {
    return contentDecayData.filter((item) => item.status === "Deep Decay")
      .length;
  }

  // Fallback: Use search console data with position > 50 criteria
  if (searchConsoleData.length > 0) {
    return searchConsoleData.filter((item) => parseFloat(item.position) > 50)
      .length;
  }

  return 0;
};

/**
 * Calculates the count of pages with high dilution using standardized criteria
 * Prioritizes real link dilution data over fallback calculations
 *
 * @param {Object} data - Data containing search console and analysis data
 * @returns {number} Number of pages with high dilution
 */
export const calculateHighDilutionPagesCount = (data) => {
  const gscAnalysisData = data?.GSCAnalysisData || {};
  const linkDilutionData = gscAnalysisData?.linkDilution || [];
  const searchConsoleData = Array.isArray(data?.searchConsoleData)
    ? data.searchConsoleData
    : [];

  // First priority: Use processed link dilution data if available
  if (linkDilutionData.length > 0) {
    return linkDilutionData.filter((item) => item.dilutionScore > 0.05).length;
  }

  // Fallback: Use search console data with position and performance criteria
  if (searchConsoleData.length > 0) {
    return searchConsoleData.filter(
      (item) => parseFloat(item.position) > 20 && parseInt(item.clicks) < 5
    ).length;
  }

  return 0;
};

/**
 * Determines funnel stage for a given position using standardized criteria
 * Uses consistent position thresholds across all dashboards
 *
 * @param {number} position - The search position of the page
 * @param {Object} realFunnelData - Optional real funnel stage data
 * @returns {string} Funnel stage: "ToF", "MoF", or "BoF"
 */
export const calculateFunnelStage = (position, realFunnelData = null) => {
  // First priority: Use real funnel data if available
  if (realFunnelData && realFunnelData.stage) {
    return realFunnelData.stage;
  }

  // Standardized position-based assignment
  // ToF: positions 1-10 (high visibility, awareness content)
  // MoF: positions 11-20 (consideration content)
  // BoF: positions 21+ (decision/conversion content that's not performing well)
  const pos = parseFloat(position) || 0;
  if (pos <= 10) return "ToF";
  if (pos <= 20) return "MoF";
  return "BoF";
};
