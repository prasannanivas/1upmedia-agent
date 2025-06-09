/**
 * @fileoverview Calculation Mapping Guide
 *
 * This file provides a centralized mapping of which standardized calculations
 * should be used by each dashboard component. This ensures consistency across
 * all dashboards and provides a single source of truth for calculation logic.
 *
 * @module calculationMapping
 * @version 1.0.0
 * @since 2025-06-07
 * @author SEO Team
 */

import {
  getFinancialDefaults,
  calculateRevenueLeak,
  calculateContentDecay,
  calculateKwMismatch,
  calculateLinkDilution,
  calculatePsychoMismatch,
  calculateCannibalization,
  calculateContentWaste,
  calculateROI,
  calculateNotFoundImpact,
  calculateFunnelGaps,
  calculateDeepDecayDollar,
  calculateHighDilutionDollar,
  calculateKeywordMismatchDollar,
  calculatePsychoMismatchDollar,
  calculateBlendedAuthority,
  calculateEfficiencyRatio,
  calculateDeltaAboveClass,
  calculateContentGrade,
  getAffectedUrlsCount,
  calculateDeepDecayPagesCount,
  calculateHighDilutionPagesCount,
  calculateFunnelStage,
} from "./financialCalculations";

/**
 * Dashboard calculation mapping - defines which calculations each dashboard should use
 */
export const DASHBOARD_CALCULATIONS = {
  /**
   * Main Dashboard (/dashboard)
   * Purpose: Overview of revenue leaks and key metrics
   */
  dashboard: {
    revenueLeak: {
      calculate: calculateRevenueLeak,
      params: (data) => [data, 0.05], // 5% leak rate
      urlCount: (data) => getAffectedUrlsCount(data, "revenueLeak"),
    },
    contentDecay: {
      calculate: calculateContentDecay,
      params: (data) => [data, data.GSCAnalysisData?.contentDecay || []],
      urlCount: (data) => getAffectedUrlsCount(data, "contentDecay"),
    },
    kwMismatch: {
      calculate: calculateKwMismatch,
      params: (data) => [data, data.GSCAnalysisData?.keywordMismatch || []],
      urlCount: (data) => getAffectedUrlsCount(data, "kwMismatch"),
    },
    linkDilution: {
      calculate: calculateLinkDilution,
      params: (data) => [data, data.GSCAnalysisData?.linkDilution || []],
      urlCount: (data) => getAffectedUrlsCount(data, "linkDilution"),
    },
    psychoMismatch: {
      calculate: calculatePsychoMismatchDollar,
      params: (data, conversionRate) => {
        // First calculate the percentage using standardized method
        const psychData = data.funnelAnalysis?.psychCompositeSummary?.overall;
        let psychoMismatchPercent = 0;

        if (psychData?.emotionalResonance) {
          // Calculate overall psychographic score
          const totalScore =
            ((psychData.emotionalResonance || 0) +
              (psychData.cognitiveClarity || 0) +
              (psychData.persuasionLeverage || 0) +
              (psychData.behavioralMomentum || 0)) /
            4;

          // Convert to mismatch percentage (higher score = lower mismatch)
          psychoMismatchPercent = Math.max(0, 100 - totalScore);
        } else {
          // Default estimation if no real data
          psychoMismatchPercent = 25; // 25% default mismatch
        }

        return [data, psychoMismatchPercent, conversionRate];
      },
      urlCount: (data) => getAffectedUrlsCount(data, "psychoMismatch"),
    },
    contentCreationCost: {
      calculate: calculateContentWaste,
      params: (data) => [data, data.GSCAnalysisData?.contentCostWaste || []],
      urlCount: (data) => data.GSCAnalysisData?.contentCostWaste?.length || 0,
    },
  },
  /**
   * Risk Dashboard (/dashboard/risk)
   * Purpose: Risk assessment and impact analysis
   */ riskDashboard: {
    contentRisk: {
      calculate: calculateContentDecay,
      params: (data) => [data, data.GSCAnalysisData?.contentDecay || []],
    },
    cannibalizationRisk: {
      calculate: calculateCannibalization,
      params: (data) => [data, data.GSCAnalysisData?.cannibalization || []],
    },
    linkDilution: {
      calculate: calculateLinkDilution,
      params: (data) => [data, data.GSCAnalysisData?.linkDilution || []],
    },
    psychoMismatch: {
      calculate: calculatePsychoMismatch,
      params: (data) => [data],
    },
    contentWaste: {
      calculate: calculateContentWaste,
      params: (data) => [data, data.GSCAnalysisData?.contentCostWaste || []],
    },
    keywordEfficiency: {
      blendedAuthority: calculateBlendedAuthority,
      efficiencyRatio: calculateEfficiencyRatio,
      deltaAboveClass: calculateDeltaAboveClass,
    },
  },
  /**
   * Command Center Dashboard (/dashboard/command-center)
   * Purpose: Real-time operational metrics with conversion rate sensitivity
   */ commandCenter: {
    deepDecayPagesCount: {
      calculate: calculateDeepDecayPagesCount,
      params: (data) => [data],
    },
    highDilutionPagesCount: {
      calculate: calculateHighDilutionPagesCount,
      params: (data) => [data],
    },
    deepDecayDollar: {
      calculate: calculateDeepDecayDollar,
      params: (data, conversionRate) => {
        // Calculate deep decay pages count for consistency
        const deepDecayPages = calculateDeepDecayPagesCount(data);
        return [data, deepDecayPages, conversionRate];
      },
    },
    highDilutionDollar: {
      calculate: calculateHighDilutionDollar,
      params: (data, conversionRate) => {
        // Calculate high dilution pages count for consistency
        const highDilutionPages = calculateHighDilutionPagesCount(data);
        return [data, highDilutionPages, conversionRate];
      },
    },
    keywordMismatchDollar: {
      calculate: calculateKeywordMismatchDollar,
      params: (data, conversionRate) => [
        data,
        data.lowKDHighDAUrls || 0,
        conversionRate,
      ],
    },
    psychoMismatchDollar: {
      calculate: calculatePsychoMismatchDollar,
      params: (data, conversionRate) => [
        data,
        data.psychoMismatch || 0,
        conversionRate,
      ],
    },
    funnelGaps: {
      calculate: calculateFunnelGaps,
      params: (data) => [data],
    },
  },
  /**
   * Content Ledger Dashboard (/dashboard/content-ledger)
   * Purpose: Individual content performance analysis
   */ contentLedger: {
    deepDecayPagesCount: {
      calculate: calculateDeepDecayPagesCount,
      params: (data) => [data],
    },
    highDilutionPagesCount: {
      calculate: calculateHighDilutionPagesCount,
      params: (data) => [data],
    },
    roi: {
      calculate: calculateROI,
      params: (revenue, investment) => [revenue, investment],
    },
    contentGrade: {
      calculate: calculateContentGrade,
      params: (metrics) => [metrics],
    },
    decayImpact: {
      calculate: calculateContentDecay,
      params: (data) => [data, data.GSCAnalysisData?.contentDecay || []],
    },
  },

  /**
   * Keyword Intel Dashboard (/dashboard/keyword-intel)
   * Purpose: Keyword performance and authority analysis
   */
  keywordIntel: {
    blendedAuthority: {
      calculate: calculateBlendedAuthority,
      params: (da, pa) => [da, pa],
    },
    efficiencyRatio: {
      calculate: calculateEfficiencyRatio,
      params: (da, avgKD) => [da, avgKD],
    },
    wastedSpend: {
      calculate: calculateContentWaste,
      params: (data) => [data, data.GSCAnalysisData?.contentCostWaste || []],
    },
  },

  /**
   * Strategy Analysis (/strategy-analysis)
   * Purpose: Strategic planning and optimization recommendations
   */
  strategyAnalysis: {
    siteStrength: {
      efficiencyRatio: calculateEfficiencyRatio,
      deltaAboveClass: calculateDeltaAboveClass,
    },
    equityLeaks: {
      cannibalization: calculateCannibalization,
      linkDilution: calculateLinkDilution,
    },
    funnelMix: {
      gapAnalysis: calculateFunnelGaps,
    },
  },

  /**
   * SEO Analysis Dashboard (component)
   * Purpose: Comprehensive SEO metrics overview
   */
  seoAnalysis: {
    contentWaste: {
      calculate: calculateContentWaste,
      params: (data) => [data, data.GSCAnalysisData?.contentCostWaste || []],
    },
    contentDecay: {
      calculate: calculateContentDecay,
      params: (data) => [data, data.GSCAnalysisData?.contentDecay || []],
    },
    cannibalization: {
      calculate: calculateCannibalization,
      params: (data) => [data, data.GSCAnalysisData?.cannibalization || []],
    },
    linkDilution: {
      calculate: calculateLinkDilution,
      params: (data) => [data, data.GSCAnalysisData?.linkDilution || []],
    },
    notFoundImpact: {
      calculate: calculateNotFoundImpact,
      params: (data) => [data, data.GSCAnalysisData?.notFoundPages || []],
    },
    roi: {
      calculate: calculateROI,
      params: (revenue, investment) => [revenue, investment],
    },
  },
};

/**
 * Helper function to execute calculations for a specific dashboard
 *
 * @param {string} dashboardName - Name of the dashboard
 * @param {Object} data - Onboarding data
 * @param {Object} additionalParams - Additional parameters (like conversion rate)
 * @returns {Object} Calculated metrics for the dashboard
 */
export const executeCalculationsForDashboard = (
  dashboardName,
  data,
  additionalParams = {}
) => {
  const calculations = DASHBOARD_CALCULATIONS[dashboardName];
  if (!calculations) {
    console.warn(`No calculations defined for dashboard: ${dashboardName}`);
    return {};
  }

  const results = {};

  Object.entries(calculations).forEach(([metricName, config]) => {
    try {
      if (typeof config.calculate === "function") {
        const params =
          typeof config.params === "function"
            ? config.params(data, additionalParams.conversionRate)
            : [];
        results[metricName] = config.calculate(...params);

        // Add URL count if available
        if (config.urlCount) {
          results[`${metricName}Urls`] = config.urlCount(data);
        }
      } else if (typeof config === "object") {
        // Handle nested calculations (like keywordEfficiency in riskDashboard)
        results[metricName] = {};
        Object.entries(config).forEach(([subMetricName, subCalculate]) => {
          if (typeof subCalculate === "function") {
            // For specific calculations like blendedAuthority and efficiencyRatio
            const domainAuthority =
              parseInt(data?.initialAnalysisState?.domainAuthority) || 0;
            const pageAuthority =
              parseInt(data?.initialAnalysisState?.pageAuthority) || 0;
            const searchConsoleData = Array.isArray(data?.searchConsoleData)
              ? data.searchConsoleData
              : [];
            const avgKD =
              searchConsoleData.length > 0
                ? Math.min(
                    80,
                    Math.max(
                      10,
                      (searchConsoleData.reduce(
                        (sum, item) => sum + (item.position || 0),
                        0
                      ) /
                        searchConsoleData.length) *
                        2
                    )
                  )
                : 30;

            if (subMetricName === "blendedAuthority") {
              results[metricName][subMetricName] = subCalculate(
                domainAuthority,
                pageAuthority
              );
            } else if (subMetricName === "efficiencyRatio") {
              results[metricName][subMetricName] = subCalculate(
                domainAuthority,
                avgKD
              );
            } else if (subMetricName === "deltaAboveClass") {
              results[metricName][subMetricName] = subCalculate(
                domainAuthority,
                35
              ); // Default industry average
            } else {
              results[metricName][subMetricName] = subCalculate;
            }
          }
        });
      }
    } catch (error) {
      console.error(
        `Error calculating ${metricName} for ${dashboardName}:`,
        error
      );
      results[metricName] = 0; // Default to 0 on error
    }
  });

  return results;
};

/**
 * Validation function to ensure data consistency across dashboards
 *
 * @param {Object} data - Onboarding data
 * @returns {Object} Validation results
 */
export const validateDataConsistency = (data) => {
  const issues = [];
  const warnings = [];

  // Check for required data structures
  if (!data.domainCostDetails) {
    issues.push("Missing domainCostDetails - using defaults");
  }

  if (!data.GSCAnalysisData) {
    warnings.push("Missing GSCAnalysisData - calculations will use estimates");
  }

  if (!data.searchConsoleData || !Array.isArray(data.searchConsoleData)) {
    issues.push(
      "Missing or invalid searchConsoleData - some metrics may be inaccurate"
    );
  }

  // Check for data completeness
  const defaults = getFinancialDefaults(data);
  if (defaults.averageOrderValue === 50) {
    warnings.push("Using default AOV - consider updating with actual data");
  }

  if (defaults.contentCost === 200) {
    warnings.push(
      "Using default content cost - consider updating with actual data"
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    dataCompleteness: {
      hasRealAOV: data.domainCostDetails?.averageOrderValue != null,
      hasRealContentCost: data.domainCostDetails?.AverageContentCost != null,
      hasGSCData: data.searchConsoleData?.length > 0,
      hasAnalysisData: Object.keys(data.GSCAnalysisData || {}).length > 0,
    },
  };
};

export default DASHBOARD_CALCULATIONS;
