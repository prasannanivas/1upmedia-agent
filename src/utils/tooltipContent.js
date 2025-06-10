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
  const gscData = onboardingData?.GSCAnalysisData || {};

  switch (metricKey) {
    case "psychoMismatch":
    case "psychoMismatchDollar":
      const cannibalizationData = gscData.cannibalization || [];
      const cannibalizationCount = cannibalizationData.filter(
        (item) => (item.competingUrls || []).length > 1
      ).length;
      const cannibalizationPercentage =
        cannibalizationData.length > 0
          ? (
              (cannibalizationCount / cannibalizationData.length) *
              0.2 *
              100
            ).toFixed(1)
          : 0;
      const totalInvestmentPsycho =
        onboardingData?.domainCostDetails?.totalInvested || 10000;

      return {
        title: "Content Cannibalization Impact",
        content: `Found ${
          cannibalizationData.length
        } keyword cannibalization issues: ${cannibalizationCount} with multiple competing URLs.

Cannibalization Impact: ${cannibalizationPercentage}% of total investment
Total Website Investment: $${totalInvestmentPsycho.toLocaleString()}

Calculation: (${cannibalizationCount} competing ÷ ${
          cannibalizationData.length
        } total) × 20% impact × $${totalInvestmentPsycho.toLocaleString()} = Cannibalization impact estimate.

This occurs when multiple pages compete for the same keywords, diluting their individual ranking power.`,
      };
    case "revenueLeak":
      const contentCostWasteData = gscData.contentCostWaste || [];
      const underperformingUrls = contentCostWasteData.filter(
        (item) => (item.roi || 0) < 0
      ).length;
      const totalUrls = contentCostWasteData.length;
      const underperformingPercentage =
        totalUrls > 0
          ? ((underperformingUrls / totalUrls) * 100).toFixed(1)
          : 0;
      const totalInvestment =
        onboardingData?.domainCostDetails?.totalInvested || 10000;

      return {
        title: "Revenue Leak Detection",
        content: `Analyzing ${underperformingUrls} underperforming URLs out of ${totalUrls} total content pieces (${underperformingPercentage}% of content).

Total Website Investment: $${totalInvestment.toLocaleString()}
Impact Percentage: 15% loss rate for underperforming content

Calculation: (${underperformingUrls} underperforming URLs ÷ ${totalUrls} total URLs) × 15% impact × $${totalInvestment.toLocaleString()} total investment = Revenue leak estimate.

This represents content with negative ROI that's draining your investment without generating meaningful traffic or conversions.`,
      };
    case "contentDecay":
      const decay30 = gscData.contentDecay?.decay30Days || [];
      const decay60 = gscData.contentDecay?.decay60Days || [];
      const decay90 = gscData.contentDecay?.decay90Days || [];
      const allDecayPages = [...decay30, ...decay60, ...decay90];

      const severeDecayCount = allDecayPages.filter(
        (item) => item.decayStatus === "Severe-Decay"
      ).length;
      const moderateDecayCount = allDecayPages.filter(
        (item) => item.decayStatus === "Moderate-Decay"
      ).length;
      const decayPercentage =
        allDecayPages.length > 0
          ? (
              ((severeDecayCount * 0.25 + moderateDecayCount * 0.1) /
                allDecayPages.length) *
              100
            ).toFixed(1)
          : 0;
      const totalInvestmentDecay =
        onboardingData?.domainCostDetails?.totalInvested || 10000;

      return {
        title: "Content Decay Impact",
        content: `Found ${
          allDecayPages.length
        } pages with traffic decline: ${severeDecayCount} severe decay, ${moderateDecayCount} moderate decay.

Decay Impact: ${decayPercentage}% of total investment
Total Website Investment: $${totalInvestmentDecay.toLocaleString()}

Calculation: ((${severeDecayCount} severe × 25%) + (${moderateDecayCount} moderate × 10%)) ÷ ${
          allDecayPages.length
        } total × $${totalInvestmentDecay.toLocaleString()} = Decay impact estimate.

These pages previously performed well but are losing traffic due to content freshness, relevance, or competitive factors.`,
      };
    case "kwMismatch":
    case "keywordMismatchDollar":
      const keywordMismatchData = gscData.keywordMismatch || [];
      const underOptimizedCount = keywordMismatchData.filter(
        (item) => item.mismatchType === "Under-optimized"
      ).length;
      const overOptimizedCount = keywordMismatchData.filter(
        (item) => item.mismatchType === "Over-optimized"
      ).length;
      const kwMismatchPercentage =
        keywordMismatchData.length > 0
          ? (
              ((underOptimizedCount * 0.08 + overOptimizedCount * 0.05) /
                keywordMismatchData.length) *
              100
            ).toFixed(1)
          : 0;
      const totalInvestmentKw =
        onboardingData?.domainCostDetails?.totalInvested || 10000;

      return {
        title: "Keyword Mismatch Opportunity",
        content: `Identified ${
          keywordMismatchData.length
        } keyword targeting misalignments: ${underOptimizedCount} under-optimized, ${overOptimizedCount} over-optimized.

Mismatch Impact: ${kwMismatchPercentage}% of total investment
Total Website Investment: $${totalInvestmentKw.toLocaleString()}

Calculation: ((${underOptimizedCount} under-opt × 8%) + (${overOptimizedCount} over-opt × 5%)) ÷ ${
          keywordMismatchData.length
        } total × $${totalInvestmentKw.toLocaleString()} = Mismatch opportunity.

These are pages where your domain authority vs keyword difficulty creates quick-win optimization opportunities.`,
      };
    case "linkDilution":
      const linkDilutionData = gscData.linkDilution || [];
      const highDilutionCount = linkDilutionData.filter(
        (item) => (item.dilutionScore || 0) > 0.01
      ).length;
      const linkDilutionPercentage =
        linkDilutionData.length > 0
          ? (
              (highDilutionCount / linkDilutionData.length) *
              0.12 *
              100
            ).toFixed(1)
          : 0;
      const totalInvestmentLink =
        onboardingData?.domainCostDetails?.totalInvested || 10000;

      return {
        title: "Link Authority Dilution",
        content: `Found ${
          linkDilutionData.length
        } pages analyzed for link dilution: ${highDilutionCount} with high dilution scores (>0.01).

Dilution Impact: ${linkDilutionPercentage}% of total investment
Total Website Investment: $${totalInvestmentLink.toLocaleString()}

Calculation: (${highDilutionCount} high dilution ÷ ${
          linkDilutionData.length
        } total) × 12% impact × $${totalInvestmentLink.toLocaleString()} = Dilution impact estimate.

This occurs when pages have excessive external links, diluting page authority and reducing ranking potential.`,
      };
    case "contentCreationCost":
      const contentCostData = gscData.contentCostWaste || [];
      const underperformingUrlsCount = contentCostData.filter(
        (item) => (item.roi || 0) < 0
      ).length;
      const wastedPercentage =
        contentCostData.length > 0
          ? ((underperformingUrlsCount / contentCostData.length) * 100).toFixed(
              1
            )
          : 0;
      const totalInvestmentCC =
        onboardingData?.domainCostDetails?.totalInvested || 10000;
      const wastedContentInvestment =
        totalInvestmentCC *
        (underperformingUrlsCount / contentCostData.length) *
        0.25;

      return {
        title: "Wasted Content Investment",
        content: `Investment waste from ${underperformingUrlsCount} underperforming content pieces out of ${
          contentCostData.length
        } total (${wastedPercentage}% underperforming).

Total Website Investment: $${totalInvestmentCC.toLocaleString()}
Estimated Waste: $${wastedContentInvestment.toLocaleString()}
Waste Impact: 25% of investment for underperforming content

Calculation: (${underperformingUrlsCount} underperforming ÷ ${
          contentCostData.length
        } total) × 25% impact × $${totalInvestmentCC.toLocaleString()} = $${wastedContentInvestment.toLocaleString()} wasted investment.

This represents the portion of your content investment that's not generating returns and may need optimization or replacement.`,
      };

    case "funnelGaps":
      const totalInvestmentFunnel =
        onboardingData?.domainCostDetails?.totalInvested || 10000;

      return {
        title: "Funnel Gap Analysis",
        content: `Analysis of your content distribution across the marketing funnel to identify imbalanced targeting that affects conversion performance.

Total Website Investment: $${totalInvestmentFunnel.toLocaleString()}

Funnel Gap Types:
• MoF Crisis: <10% middle-funnel content (nurturing gap)
• ToF Deficit: <20% top-funnel content (awareness gap)  
• BoF Heavy: >60% bottom-funnel content (over-focused)
• BoF Deficit: <15% bottom-funnel content (conversion gap)

Impact Calculation: Gap percentage × impact multiplier × total investment
- MoF gaps: 10% impact per percentage point deficit
- ToF gaps: 12% impact per percentage point deficit
- BoF gaps: 8-15% impact depending on type

Balanced funnels convert better and reduce overall marketing costs by properly nurturing prospects through each stage.`,
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
      "linkDilution",
      "contentCreationCost",
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
