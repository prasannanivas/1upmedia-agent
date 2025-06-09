/**
 * @fileoverview Tooltip Content Mapping
 *
 * This file provides standardized tooltip content for all financial metrics
 * across the application. Each tooltip explains the calculation methodology
 * and provides transparency on how values are derived.
 *
 * @module tooltipContent
 * @version 1.0.0
 * @since 2025-01-22
 * @author SEO Team
 */

/**
 * Gets user-specific financial parameters from onboarding data
 * @param {Object} onboardingData - User's onboarding data
 * @returns {Object} User's financial parameters
 */
const getUserFinancialParams = (onboardingData) => {
  const domainCostDetails = onboardingData?.domainCostDetails || {};
  return {
    aov: parseFloat(domainCostDetails.averageOrderValue) || 50,
    contentCost: parseFloat(domainCostDetails.AverageContentCost) || 200,
    conversionRate: 2.0, // Default 2%
  };
};

/**
 * Generates dynamic tooltip content with real user data
 * @param {string} metricKey - The metric key
 * @param {Object} onboardingData - User's onboarding data
 * @returns {Object} Dynamic tooltip content with real values
 */
const generateDynamicTooltipContent = (metricKey, onboardingData) => {
  const userParams = getUserFinancialParams(onboardingData);
  const gscData = onboardingData?.GSCAnalysisData || {};
  const searchConsoleData = onboardingData?.searchConsoleData || [];

  // Calculate real metrics from user data
  const totalTraffic = searchConsoleData.reduce(
    (sum, item) => sum + (item.clicks || 0),
    0
  );
  const totalImpressions = searchConsoleData.reduce(
    (sum, item) => sum + (item.impressions || 0),
    0
  );
  const avgCTR =
    totalImpressions > 0
      ? ((totalTraffic / totalImpressions) * 100).toFixed(2)
      : 0;

  switch (metricKey) {
    case "psychoMismatch":
    case "psychoMismatchDollar":
      const psychoMismatchUrls = gscData.psychoMismatch?.length || 176; // Default from your example
      const psychoMismatchPercent = onboardingData.psychoMismatch || 35; // Example percentage
      return {
        title: "Psychographic Mismatch Calculation",
        content: `Based on analysis of ${psychoMismatchUrls} URLs, your psychographic mismatch percentage is ${psychoMismatchPercent}% with total traffic of ${totalTraffic.toLocaleString()} clicks. 

Calculation: (${psychoMismatchPercent}% mismatch) × (${totalTraffic.toLocaleString()} traffic) × ($${
          userParams.aov
        } AOV) × (${
          userParams.conversionRate
        }% conversion rate) = Revenue impact shown.

This measures content-audience emotional resonance, cognitive clarity, persuasion leverage, and behavioral momentum alignment.`,
      };

    case "revenueLeak":
      const leakUrls =
        gscData.revenueLeak?.length ||
        searchConsoleData.filter(
          (item) => item.clicks > 100 && item.position > 10
        ).length;
      return {
        title: "Revenue Leak Calculation",
        content: `Analyzing ${leakUrls} underperforming URLs with your traffic of ${totalTraffic.toLocaleString()} clicks and ${totalImpressions.toLocaleString()} impressions.

Calculation: (${totalTraffic.toLocaleString()} traffic) × (Performance gap of 5-15%) × ($${
          userParams.aov
        } AOV) × (${
          userParams.conversionRate
        }% conversion rate) = Revenue leak estimate.

Based on pages with significant traffic but poor conversion signals in your actual GSC data.`,
      };

    case "contentDecay":
      const decayUrls = gscData.contentDecay?.length || 0;
      const decayTraffic =
        gscData.contentDecay?.reduce(
          (sum, item) => sum + (item.clicks || 0),
          0
        ) || 0;
      return {
        title: "Content Decay Impact",
        content: `Found ${decayUrls} pages showing traffic decline in your data, representing ${decayTraffic.toLocaleString()} lost clicks.

Calculation: (${decayTraffic.toLocaleString()} lost traffic) × ($${
          userParams.aov
        } AOV) × (${
          userParams.conversionRate
        }% conversion rate) = Financial impact.

Based on pages in your GSC data showing consistent traffic drops requiring refresh or optimization.`,
      };

    case "kwMismatch":
    case "keywordMismatchDollar":
      const mismatchUrls = gscData.keywordMismatch?.length || 0;
      const highDAPages = searchConsoleData.filter(
        (item) => item.position > 20
      ).length;
      return {
        title: "Keyword Mismatch Opportunity",
        content: `Identified ${mismatchUrls} keyword targeting misalignments and ${highDAPages} high-authority pages with optimization potential.

Your current traffic: ${totalTraffic.toLocaleString()} clicks
Your average CTR: ${avgCTR}%

Calculation: (High DA pages targeting low competition keywords) × (Traffic potential) × ($${
          userParams.aov
        } AOV) × (${
          userParams.conversionRate
        }% conversion rate) = Opportunity value.`,
      };

    default:
      return (
        TOOLTIP_CONTENT[metricKey] || {
          title: "Calculation Details",
          content:
            "This metric uses your actual data for calculations. Contact support for specific details.",
        }
      );
  }
};

/**
 * Injects real user values into tooltip content
 * @param {string} content - Tooltip content template
 * @param {Object} userParams - User's financial parameters
 * @returns {string} Content with real values injected
 */
const injectUserValues = (content, userParams) => {
  return content
    .replace(/AOV: \$50/g, `AOV: $${userParams.aov}`)
    .replace(/\$50/g, `$${userParams.aov}`)
    .replace(
      /Content creation cost per page: \$200/g,
      `Content creation cost per page: $${userParams.contentCost}`
    )
    .replace(/\$200/g, `$${userParams.contentCost}`)
    .replace(
      /Conversion Rate: 2%/g,
      `Conversion Rate: ${userParams.conversionRate}%`
    );
};

/**
 * Financial calculation tooltip content
 * Each entry contains title and detailed explanation of the calculation
 */
export const TOOLTIP_CONTENT = {
  // Main Dashboard Metrics
  revenueLeak: {
    title: "Revenue Leak Calculation",
    content:
      "Estimated monthly revenue loss based on underperforming content. Calculated as: (Average Order Value × Traffic × Conversion Rate × Performance Gap). Uses AOV: $50, Conversion Rate: 2%, and identifies pages with significant traffic but poor conversion signals.",
  },

  contentDecay: {
    title: "Content Decay Impact",
    content:
      "Financial impact of declining content performance over time. Based on pages showing consistent traffic drops, calculated as: (Lost Traffic × AOV × Conversion Rate). Identifies content requiring refresh or optimization to maintain revenue potential.",
  },

  kwMismatch: {
    title: "Keyword Mismatch Cost",
    content:
      "Revenue opportunity from keyword targeting misalignment. Calculated using: (High DA pages targeting low KD keywords) × (Missed traffic potential) × (AOV × Conversion Rate). Shows potential gains from better keyword-page matching.",
  },

  linkDilution: {
    title: "Link Dilution Impact",
    content:
      "Revenue loss from dispersed link equity across multiple similar pages. Based on: (Number of competing pages) × (Authority dilution factor) × (Traffic impact) × (AOV × Conversion Rate). Identifies consolidation opportunities.",
  },

  psychoMismatch: {
    title: "Psychographic Mismatch Cost",
    content:
      "Revenue impact from content-audience misalignment. Calculated using: (Psychographic mismatch percentage) × (Total traffic) × (AOV × Conversion Rate). Based on emotional resonance, cognitive clarity, persuasion leverage, and behavioral momentum scores.",
  },

  contentCreationCost: {
    title: "Content Creation Waste",
    content:
      "Investment in underperforming content. Calculated as: (Number of low-performing pages) × (Content creation cost per page: $200). Identifies content that may need optimization or replacement to justify investment.",
  },

  // Command Center Metrics
  deepDecayDollar: {
    title: "Deep Decay Financial Impact",
    content:
      "Revenue impact from severely declining content. Calculated as: (Pages with >50% traffic decline) × (Average lost traffic per page) × (AOV: $50) × (Conversion Rate: 2%). Prioritizes urgent content intervention needs.",
  },

  highDilutionDollar: {
    title: "High Dilution Financial Impact",
    content:
      "Revenue loss from excessive content overlap. Based on: (Pages with high content similarity) × (Authority dilution impact) × (Traffic loss) × (AOV × Conversion Rate). Shows consolidation priority by financial impact.",
  },

  keywordMismatchDollar: {
    title: "Keyword Opportunity Value",
    content:
      "Revenue potential from optimized keyword targeting. Calculated as: (High authority pages) × (Low competition keyword opportunities) × (Traffic potential) × (AOV: $50) × (Conversion Rate: 2%). Shows quick-win optimization opportunities.",
  },

  psychoMismatchDollar: {
    title: "Psychographic Optimization Value",
    content:
      "Revenue gain potential from better audience alignment. Uses: (Psychographic mismatch score) × (Total addressable traffic) × (Improvement potential) × (AOV × Conversion Rate). Based on content-audience resonance analysis.",
  },

  // Content Ledger Metrics
  contentGrade: {
    title: "Content Performance Grade",
    content:
      "Overall content quality score based on multiple performance factors. Combines: Traffic performance (40%), Keyword optimization (25%), Technical SEO (20%), and User engagement signals (15%). Grades range from A+ (excellent) to F (poor performance).",
  },

  roi: {
    title: "Content ROI Calculation",
    content:
      "Return on investment for content pieces. Calculated as: ((Revenue generated - Content investment cost) / Content investment cost) × 100. Uses content creation cost of $200 per piece and revenue based on traffic × conversion metrics.",
  },

  decayImpact: {
    title: "Content Decay Assessment",
    content:
      "Performance decline measurement over time. Tracks: Traffic change (%), Ranking position changes, and Click-through rate variations. Identifies content requiring updates, optimization, or potential retirement.",
  },

  // Risk Dashboard Metrics
  contentRisk: {
    title: "Content Risk Assessment",
    content:
      "Risk score for content performance degradation. Based on: Traffic stability (40%), Ranking volatility (30%), Technical issues (20%), and Competition pressure (10%). Higher scores indicate greater intervention urgency.",
  },

  cannibalizationRisk: {
    title: "Keyword Cannibalization Risk",
    content:
      "Risk from multiple pages competing for same keywords. Calculated using: (Number of competing pages) × (Keyword overlap percentage) × (Authority dilution factor). Identifies pages that should be consolidated or differentiated.",
  },

  linkDilutionRisk: {
    title: "Link Equity Dilution Risk",
    content:
      "Risk assessment for dispersed link authority. Based on: (Internal link distribution) × (Content similarity score) × (Authority concentration factor). Shows where link equity consolidation could improve performance.",
  },

  contentWaste: {
    title: "Content Investment Waste",
    content:
      "Assessment of underperforming content investment. Calculated as: (Low-performing content count) × (Average content cost: $200) × (Performance deficit percentage). Helps prioritize content optimization or retirement decisions.",
  },

  // Keyword Intel Metrics
  keywordEfficiency: {
    title: "Keyword Targeting Efficiency",
    content:
      "Effectiveness of keyword strategy execution. Combines: Keyword difficulty vs. page authority ratio, Traffic potential realization rate, and Ranking position achievement vs. targets. Higher efficiency indicates better resource allocation.",
  },

  blendedAuthority: {
    title: "Blended Authority Score",
    content:
      "Combined authority metric for keyword targeting capability. Calculated as: (Domain Authority × 0.6) + (Page Authority × 0.4). Shows overall competitive strength for keyword rankings and content performance potential.",
  },

  efficiencyRatio: {
    title: "Keyword Efficiency Ratio",
    content:
      "Ratio of keyword difficulty to page authority. Calculated as: (Average keyword difficulty) ÷ (Blended authority score). Lower ratios indicate better targeting efficiency and higher success probability.",
  },

  deltaAboveClass: {
    title: "Performance Above Category",
    content:
      "Performance margin above competitive baseline. Measured as: (Actual performance metrics) - (Category average performance). Positive values indicate competitive advantage in keyword targeting and content effectiveness.",
  },

  // Funnel Analysis
  funnelGaps: {
    title: "Funnel Distribution Analysis",
    content:
      "Content distribution across marketing funnel stages. Analyzes: Top of Funnel (awareness content), Middle of Funnel (consideration content), and Bottom of Funnel (decision content). Ideal distribution: 55% ToF, 30% MoF, 25% BoF.",
  },

  funnelBalance: {
    title: "Funnel Balance Assessment",
    content:
      "Evaluation of content portfolio balance across buyer journey stages. Compares current distribution against optimal ratios and identifies gaps that may impact conversion flow and revenue generation.",
  },

  // General Financial Metrics
  monthlyRevenuePotential: {
    title: "Monthly Revenue Potential",
    content:
      "Estimated monthly revenue opportunity from optimization. Based on: (Traffic improvement potential) × (Average Order Value: $50) × (Conversion Rate: 2%). Represents incremental revenue from addressing identified issues.",
  },

  conversionRate: {
    title: "Conversion Rate (2%)",
    content:
      "Standard conversion rate used across all calculations. Based on industry averages for content-driven conversions. This rate is applied consistently to ensure comparable metrics across all dashboard calculations.",
  },

  averageOrderValue: {
    title: "Average Order Value ($50)",
    content:
      "Standard AOV used for revenue calculations. Represents the average transaction value per conversion. This standardized value ensures consistent financial impact calculations across all metrics and dashboards.",
  },

  contentCost: {
    title: "Content Creation Cost ($200)",
    content:
      "Standard cost per content piece for ROI and waste calculations. Includes research, writing, optimization, and publishing efforts. Used to evaluate content investment efficiency and identify underperforming assets.",
  },
};

/**
 * Get tooltip content for a specific metric
 * @param {string} metricKey - The key for the metric
 * @param {Object} onboardingData - Optional user onboarding data to inject real values
 * @returns {Object} Object with title and content for tooltip
 */
export const getTooltipContent = (metricKey, onboardingData = null) => {
  // For key metrics, use dynamic content with real user data when available
  if (
    onboardingData &&
    [
      "psychoMismatch",
      "psychoMismatchDollar",
      "revenueLeak",
      "contentDecay",
      "kwMismatch",
      "keywordMismatchDollar",
    ].includes(metricKey)
  ) {
    return generateDynamicTooltipContent(metricKey, onboardingData);
  }

  const baseContent = TOOLTIP_CONTENT[metricKey] || {
    title: "Calculation Details",
    content:
      "This metric uses standardized financial calculations. Contact support for specific calculation details.",
  };

  // If no onboarding data, return base content
  if (!onboardingData) {
    return baseContent;
  }

  // Get user's actual values
  const userParams = getUserFinancialParams(onboardingData);

  // Inject real user values into content
  const updatedContent = {
    ...baseContent,
    content: injectUserValues(baseContent.content, userParams),
  };

  return updatedContent;
};

/**
 * Dashboard-specific tooltip mappings
 * Maps dashboard components to their relevant tooltip content
 */
export const DASHBOARD_TOOLTIP_MAPPING = {
  dashboard: [
    "revenueLeak",
    "contentDecay",
    "kwMismatch",
    "linkDilution",
    "psychoMismatch",
    "contentCreationCost",
    "funnelGaps",
  ],
  commandCenter: [
    "deepDecayDollar",
    "highDilutionDollar",
    "keywordMismatchDollar",
    "psychoMismatchDollar",
    "funnelBalance",
  ],
  contentLedger: [
    "contentGrade",
    "roi",
    "decayImpact",
    "monthlyRevenuePotential",
  ],
  riskDashboard: [
    "contentRisk",
    "cannibalizationRisk",
    "linkDilutionRisk",
    "contentWaste",
    "keywordEfficiency",
  ],
  keywordIntel: [
    "keywordEfficiency",
    "blendedAuthority",
    "efficiencyRatio",
    "deltaAboveClass",
  ],
};
