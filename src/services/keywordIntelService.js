/**
 * Keyword Intelligence Data Service
 *
 * This service handles all the complex calculations and data transformations
 * required for the Keyword Intelligence Dashboard as specified in the requirements.
 *
 * Data Sources:
 * - Google Search Console (GSC)
 * - Google Analytics 4 (GA4)
 * - MOZ API
 * - Internal CRM data
 */

// CTR Model - Industry standard curve for ranking positions
const CTR_MODEL = {
  1: 0.32, // Position 1
  2: 0.18, // Position 2
  3: 0.11, // Position 3
  4: 0.08, // Position 4
  5: 0.06, // Position 5
  6: 0.05, // Position 6
  7: 0.04, // Position 7
  8: 0.03, // Position 8
  9: 0.025, // Position 9
  10: 0.02, // Position 10
  default: 0.01, // Below position 10
};

// Intent Classification Rules
const classifyIntent = (keyword) => {
  const kw = keyword.toLowerCase();

  if (/\b(buy|price|deal|discount|purchase|order|shop|sale)\b/.test(kw)) {
    return "Transaction";
  }

  if (/\b(best|vs|review|compare|top|versus|rating)\b/.test(kw)) {
    return "Commercial";
  }

  if (/\b(how|what|why|guide|tips|ideas|learn|tutorial)\b/.test(kw)) {
    return "Inform";
  }

  return "Inform"; // Default fallback
};

// Weight Class Classification
const getWeightClass = (blendedAuthority) => {
  if (blendedAuthority >= 70) return "Heavyweight";
  if (blendedAuthority >= 50) return "Middleweight";
  if (blendedAuthority >= 30) return "Lightweight";
  return "Featherweight";
};

// Content Credit Rating
const getContentCreditRating = (revenueGrowth) => {
  if (revenueGrowth > 1.25) return "A-";
  if (revenueGrowth > 1.1) return "BBB";
  return "BB";
};

/**
 * Calculate Blended Authority Score
 * Formula: BA = 0.6 * DA + 0.4 * avg(PA)
 */
export const calculateBlendedAuthority = (domainAuthority, pageAuthorities) => {
  const avgPageAuthority =
    pageAuthorities.reduce((sum, pa) => sum + pa, 0) / pageAuthorities.length;
  return 0.6 * domainAuthority + 0.4 * avgPageAuthority;
};

/**
 * Calculate KD Guard-rail metrics
 */
export const calculateGuardRail = (blendedAuthority, keywords) => {
  const allowedKdCeiling = blendedAuthority + 10;
  const avgSerpKd =
    keywords.reduce((sum, kw) => sum + kw.kd_moz, 0) / keywords.length;
  const keywordsInClass = keywords.filter(
    (kw) => kw.kd_moz <= allowedKdCeiling
  ).length;
  const successProbability = Math.round(
    (keywordsInClass / keywords.length) * 100
  );

  return {
    allowedKdCeiling: Math.round(allowedKdCeiling),
    avgSerpKd: Math.round(avgSerpKd),
    keywordsInClass,
    successProbability,
  };
};

/**
 * Calculate Portfolio Keyword Cap using DCF method
 * DCF = Σ_{m=1…12} ( rev_m / (1 + r)^m )
 */
export const calculatePortfolioValue = (
  keywords,
  averageOrderValue,
  discountRate = 0.15
) => {
  let totalValue = 0;

  keywords.forEach((keyword) => {
    const intent = classifyIntent(keyword.query_kw);
    const estimatedCtr = getCtrByRank(keyword.average_position);
    const conversionRate = getConversionRateByIntent(intent);

    // Calculate monthly revenue
    const monthlyClicks = keyword.sv_google * estimatedCtr;
    const monthlyConversions = monthlyClicks * conversionRate;
    const monthlyRevenue = monthlyConversions * averageOrderValue;

    // Apply DCF for 12 months
    for (let month = 1; month <= 12; month++) {
      const discountedRevenue =
        monthlyRevenue / Math.pow(1 + discountRate, month / 12);
      totalValue += discountedRevenue;
    }
  });

  return totalValue;
};

/**
 * Get CTR estimate based on ranking position
 */
const getCtrByRank = (position) => {
  if (position <= 10) {
    return CTR_MODEL[Math.round(position)] || CTR_MODEL.default;
  }
  return CTR_MODEL.default;
};

/**
 * Get conversion rate by intent type
 */
const getConversionRateByIntent = (intent) => {
  switch (intent) {
    case "Transaction":
      return 0.03;
    case "Commercial":
      return 0.015;
    case "Inform":
      return 0.005;
    default:
      return 0.005;
  }
};

/**
 * Calculate Risk Metrics
 */
export const calculateRiskMetrics = (
  searchConsoleData,
  keywords,
  blendedAuthority,
  averageOrderValue
) => {
  // High-CTR Leak Risk
  const highCtrLeakPages = searchConsoleData.filter(
    (page) => parseInt(page.impressions) >= 10000 && parseFloat(page.ctr) < 1
  );

  const highCtrLeakRisk = highCtrLeakPages.reduce((total, page) => {
    const potentialClicks = parseInt(page.impressions) * 0.02; // Target 2% CTR
    const actualClicks = parseInt(page.clicks);
    const lostClicks = potentialClicks - actualClicks;
    const lostRevenue = lostClicks * 0.02 * averageOrderValue; // 2% conversion rate
    return total + lostRevenue;
  }, 0);

  // Cannibal Clashes - simplified calculation
  const cannibalRisk = 12000; // Static for now, would require URL grouping analysis

  // DA/KD Mismatch Exposure
  const mismatchKeywords = keywords.filter(
    (kw) => kw.kd_moz > blendedAuthority + 15
  );
  const mismatchRisk = mismatchKeywords.reduce((total, kw) => {
    const estimatedValue = kw.sv_google * 0.02 * 0.02 * averageOrderValue * 12;
    return total + estimatedValue;
  }, 0);

  return {
    highCtrLeakRisk: Math.round(highCtrLeakRisk),
    highCtrLeakPages: highCtrLeakPages.length,
    cannibalRisk,
    mismatchRisk: Math.round(mismatchRisk),
    mismatchKeywords: mismatchKeywords.length,
  };
};

/**
 * Calculate Intent Distribution
 */
export const calculateIntentDistribution = (keywords) => {
  const distribution = keywords.reduce((acc, kw) => {
    const intent = classifyIntent(kw.query_kw);
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});

  const total = keywords.length;

  return {
    Inform: Math.round(((distribution.Inform || 0) / total) * 100),
    Commercial: Math.round(((distribution.Commercial || 0) / total) * 100),
    Transaction: Math.round(((distribution.Transaction || 0) / total) * 100),
  };
};

/**
 * Calculate Opportunity Stack with BAA (Blended Authority Advantage)
 */
export const calculateOpportunityStack = (
  keywords,
  blendedAuthority,
  contentCost,
  averageOrderValue
) => {
  return keywords
    .map((kw) => {
      const baaScore = blendedAuthority - kw.kd_moz;
      const intent = classifyIntent(kw.query_kw);
      const estimatedCtr = getCtrByRank(10); // Assume top 10 placement
      const conversionRate = getConversionRateByIntent(intent);

      // Calculate annual revenue potential
      const annualClicks = kw.sv_google * 12 * estimatedCtr;
      const annualConversions = annualClicks * conversionRate;
      const annualRevenue = annualConversions * averageOrderValue;

      // Calculate IRR
      const irr =
        annualRevenue > contentCost
          ? Math.round(((annualRevenue - contentCost) / contentCost) * 100)
          : -50;

      // Monthly clicks estimate
      const monthlyClicks = Math.round(kw.sv_google * estimatedCtr);

      return {
        keyword: kw.query_kw,
        kd: kw.kd_moz,
        baa: Math.round(baaScore),
        irr,
        estimatedClicks: monthlyClicks,
        intent,
        searchVolume: kw.sv_google,
      };
    })
    .sort((a, b) => b.baa - a.baa || b.irr - a.irr);
};

/**
 * Calculate Content Yield Metrics
 */
export const calculateContentYield = (searchConsoleData, contentCosts) => {
  const totalClicks = searchConsoleData.reduce(
    (sum, page) => sum + parseInt(page.clicks),
    0
  );
  const totalImpressions = searchConsoleData.reduce(
    (sum, page) => sum + parseInt(page.impressions),
    0
  );
  const avgCtr =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPosition =
    searchConsoleData.reduce(
      (sum, page) => sum + parseFloat(page.position),
      0
    ) / searchConsoleData.length;

  return {
    totalClicks,
    totalImpressions,
    avgCtr: Math.round(avgCtr * 100) / 100,
    avgPosition: Math.round(avgPosition * 10) / 10,
  };
};

/**
 * Generate Momentum Data (30-day changes)
 */
export const calculateMomentumMetrics = (currentData, previousData) => {
  // This would require historical data comparison
  // For now, returning mock momentum data
  return [
    {
      keyword: "canada ebike",
      changeType: "clicks",
      change: "+12k",
      trend: "up",
    },
    {
      keyword: "ebike range",
      changeType: "revenue",
      change: "+9k",
      trend: "up",
    },
    {
      keyword: "trek bikes CA",
      changeType: "impressions",
      change: "-1k",
      trend: "down",
    },
  ];
};

/**
 * Calculate CAC Payback Period
 */
export const calculateCacPayback = (contentCost, monthlyRevenue) => {
  if (monthlyRevenue <= 0) return null;
  return Math.round((contentCost / monthlyRevenue) * 10) / 10;
};

/**
 * Main function to process all keyword intelligence data
 */
export const processKeywordIntelligence = (rawData) => {
  const {
    searchConsoleData = [],
    mozDomainData = {},
    mozKeywordData = [],
    averageOrderValue = 75,
    contentCost = 200,
  } = rawData;

  // Calculate core metrics
  const pageAuthorities = searchConsoleData.map((page) => page.pa_moz || 30);
  const blendedAuthority = calculateBlendedAuthority(
    mozDomainData.da || 24,
    pageAuthorities
  );
  const weightClass = getWeightClass(blendedAuthority);

  // Guard-rail metrics
  const guardRail = calculateGuardRail(blendedAuthority, mozKeywordData);

  // Portfolio value
  const portfolioValue = calculatePortfolioValue(
    mozKeywordData,
    averageOrderValue
  );
  const portfolioYield =
    portfolioValue > 0
      ? Math.round(((portfolioValue * 0.15) / portfolioValue) * 100)
      : 0;

  // Risk metrics
  const riskMetrics = calculateRiskMetrics(
    searchConsoleData,
    mozKeywordData,
    blendedAuthority,
    averageOrderValue
  );

  // Intent distribution
  const intentDistribution = calculateIntentDistribution(mozKeywordData);

  // Opportunity stack
  const opportunityStack = calculateOpportunityStack(
    mozKeywordData,
    blendedAuthority,
    contentCost,
    averageOrderValue
  );

  // Content performance
  const contentMetrics = calculateContentYield(searchConsoleData, contentCost);

  // Momentum data
  const momentumData = calculateMomentumMetrics(searchConsoleData, []);

  return {
    blendedAuthority: Math.round(blendedAuthority * 10) / 10,
    weightClass,
    guardRail,
    portfolioValue: Math.round(portfolioValue),
    portfolioYield,
    riskMetrics,
    intentDistribution,
    opportunityStack,
    contentMetrics,
    momentumData,
    creditRating: getContentCreditRating(1.15), // Mock growth rate
  };
};
