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
    return linkDilutionItems.reduce(
      (sum, item) => sum + (item.estimatedLoss || 0),
      0
    );
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
