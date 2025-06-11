import React, { createContext, useContext, useState, useEffect } from "react";
import { useOnboarding } from "./OnboardingContext";

const FinancialCalculationsContext = createContext();

export const FinancialCalculationsProvider = ({ children }) => {
  const { loading, onboardingData } = useOnboarding();
  const [gscAnalysisData, setGscAnalysisData] = useState({});

  // Content Decay States
  const [decay30Days, setDecay30Days] = useState([]);
  const [decay60Days, setDecay60Days] = useState([]);
  const [decay90Days, setDecay90Days] = useState([]);
  const [decaySummary, setDecaySummary] = useState({});
  const [psychMismatchData, setPsychMismatchdata] = useState([]);

  // Analysis States
  const [keywordMismatch, setKeywordMismatch] = useState([]);
  const [cannibalization, setCannibalization] = useState([]);
  const [contentCostWaste, setContentCostWaste] = useState([]);
  const [linkDilution, setLinkDilution] = useState([]);
  const [notFoundPages, setNotFoundPages] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState([]);

  // GA Data States
  const [gaDataInsightsSummary, setGaDataInsightsSummary] = useState({
    summary: "",
    insights: [],
    recommendations: [],
  });
  const [gaDataTopPerformers, setGaDataTopPerformers] = useState({
    byTraffic: [],
    byEngagement: [],
  });
  const [gaDataProblemAreas, setGaDataProblemAreas] = useState({
    highBounceRate: [],
    lowEngagement: [],
  });

  // Financial Calculations
  const [calculations, setCalculations] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    contentCost: 0,
  });
  useEffect(() => {
    if (onboardingData?.GSCAnalysisData) {
      try {
        setCalculations({
          totalRevenue: onboardingData.domainCostDetails?.totalInvested || 0,
          averageOrderValue:
            onboardingData.domainCostDetails?.averageOrderValue || 0,
          contentCost: onboardingData.domainCostDetails?.contentCost || 0,
        });

        // Set the GSC analysis data
        setGscAnalysisData(onboardingData.GSCAnalysisData);

        setPsychMismatchdata(onboardingData.funnelAnalysis);
        // Process the GSC data for financial calculations
        processGSCDataForCalculations(onboardingData.GSCAnalysisData);
      } catch (error) {
        console.error("Error processing GSC Analysis data:", error);
      }
    }
  }, [
    onboardingData?.GSCAnalysisData,
    onboardingData?.domainCostDetails?.totalInvested,
    onboardingData?.domainCostDetails?.averageOrderValue,
    onboardingData?.domainCostDetails?.contentCost,
    onboardingData?.funnelAnalysis,
  ]);

  console.log(
    "Financial Calculations Context Initialized",
    onboardingData.domainCostDetails
  );

  const processGSCDataForCalculations = (gscData) => {
    // This function will process the GSC data for financial calculations
    console.log("Processing GSC Analysis Data:", gscData);

    // Segregate Content Decay Data
    setDecay30Days(gscData?.contentDecay?.decay30Days || []);
    setDecay60Days(gscData?.contentDecay?.decay60Days || []);
    setDecay90Days(gscData?.contentDecay?.decay90Days || []);
    setDecaySummary(gscData?.contentDecay?.summary || {});

    // Segregate Analysis Data
    setKeywordMismatch(gscData?.keywordMismatch || []);
    setCannibalization(gscData?.cannibalization || []);
    setContentCostWaste(gscData?.contentCostWaste || []);
    setLinkDilution(gscData?.linkDilution || []);
    setNotFoundPages(gscData?.notFoundPages || []);

    setRiskMetrics(gscData?.riskMetric || []);

    // Segregate GA Data
    setGaDataInsightsSummary({
      summary: gscData?.gaData?.insights?.summary || "",
      insights: gscData?.gaData?.insights?.insights || [],
      recommendations: gscData?.gaData?.insights?.recommendations || [],
    });
    setGaDataTopPerformers({
      byTraffic: gscData?.gaData?.insights?.topPerformers?.byTraffic || [],
      byEngagement:
        gscData?.gaData?.insights?.topPerformers?.byEngagement || [],
    });
    setGaDataProblemAreas({
      highBounceRate:
        gscData?.gaData?.insights?.problemAreas?.highBounceRate || [],
      lowEngagement:
        gscData?.gaData?.insights?.problemAreas?.lowEngagement || [],
    }); // Placeholder financial calculations - can be expanded based on the segregated data
    setCalculations({
      totalRevenue: 0,
      potentialRevenue: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      costPerAcquisition: 0,
    });
  };

  const getRevenueLeak = (
    aov = null,
    contentCost = null,
    conversionRate = 0.02
  ) => {
    // Use provided values or fall back to onboardingData, throw error if not available
    const averageOrderValue =
      aov ||
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      contentCost ||
      calculations.contentCost ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not provided. Please provide AOV parameter or ensure onboardingData.domainCostDetails.averageOrderValue is available."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not provided. Please provide contentCost parameter or ensure onboardingData.domainCostDetails.totalInvested is available."
      );
    }

    // Combine all URL data sources for analysis
    const allUrls = [...(contentCostWaste || [])];

    // Remove duplicates based on URL
    const uniqueUrls = allUrls.filter(
      (url, index, self) => index === self.findIndex((u) => u.url === url.url)
    );

    const totalUrls = uniqueUrls.length || 1; // Prevent division by zero

    // Calculate cost per URL (this is the key fix!)
    const costPerUrl = totalContentCost / totalUrls;

    // Calculate threshold clicks needed for break-even PER URL
    // clicks * conversionRate * aov = costPerUrl
    // clicks = costPerUrl / (conversionRate * aov)
    const threshold = costPerUrl / (conversionRate * averageOrderValue);

    let zeroClicksCount = 0;
    let urlsBelowThreshold = 0;
    let totalEstimatedRevenueLoss = 0;

    uniqueUrls.forEach((urlData) => {
      const clicks = urlData.clicks || urlData.impressions || 0;

      if (clicks === 0) {
        zeroClicksCount++;
      }

      if (clicks < threshold) {
        urlsBelowThreshold++;

        // Calculate ROI factor
        let roiFactor;
        if (clicks < threshold) {
          // Negative ROI calculation
          roiFactor = Math.max(-1, (clicks - threshold) / threshold);
        } else {
          // Positive ROI calculation (no limit)
          roiFactor = (clicks - threshold) / threshold;
        }

        // Calculate revenue loss for this URL
        const urlRevenueLoss = roiFactor * costPerUrl;
        totalEstimatedRevenueLoss += urlRevenueLoss;
      }
    });
    return {
      totalUrls,
      zeroClicksCount,
      threshold: Math.round(threshold),
      urlsBelowThreshold,
      estimatedRevenueLoss: Math.round(totalEstimatedRevenueLoss),
      averageOrderValue,
      contentCost: totalContentCost,
      conversionRate,
      tooltip: {
        title: "Revenue Leak Analysis",
        content: `This measures how much revenue you're losing from underperforming content. We calculate the break-even threshold (${Math.round(
          threshold
        )} clicks per URL) based on your content costs and AOV. URLs getting fewer clicks than this threshold are losing money. Out of ${totalUrls} URLs, ${urlsBelowThreshold} are underperforming, representing ${Math.round(
          totalEstimatedRevenueLoss
        ).toLocaleString()} in potential revenue loss.`,
      },
      details: {
        costPerUrl: Math.round(costPerUrl),
        thresholdFormula: `${Math.round(
          costPerUrl
        )} / (${conversionRate} * ${averageOrderValue}) = ${Math.round(
          threshold
        )} clicks needed for break-even per URL`,
        roiCalculation:
          "ROI Factor: (actual_clicks - threshold_clicks) / threshold_clicks",
        revenueLossFormula: "ROI Factor * Cost Per URL",
      },
    };
  };
  const getContentDecay = () => {
    console.log(onboardingData?.domainCostDetails);
    // Use contentCostWaste.length for total unique URLs
    const totalUniqueUrls = contentCostWaste.length || 1; // Prevent division by zero

    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate (more realistic)

    // Combine all decay timeframes
    const allDecayData = [
      ...decay30Days.map((item) => ({ ...item, timeframe: "30Days" })),
      ...decay60Days.map((item) => ({ ...item, timeframe: "60Days" })),
      ...decay90Days.map((item) => ({ ...item, timeframe: "90Days" })),
    ];

    // Remove duplicates based on URL, keeping the most severe decay
    const uniqueUrls = {};
    allDecayData.forEach((item) => {
      const url = item.url;
      if (
        !uniqueUrls[url] ||
        (item.hasDecay &&
          getSeverityScore(item.decayStatus) >
            getSeverityScore(uniqueUrls[url].decayStatus))
      ) {
        uniqueUrls[url] = item;
      }
    });

    const uniqueDecayData = Object.values(uniqueUrls);

    // Categorize by decay status
    const decayCategories = {
      "Severe-Decay": [],
      "Moderate-Decay": [],
      "Light-Decay": [],
      Stable: [],
    };

    let totalUrlsAnalyzed = 0;
    let urlsWithDecay = 0;
    let totalClicksLost = 0;
    let totalImpressionsLost = 0;
    let calculatedRevenueLoss = 0;

    // Calculate cost per URL
    const costPerUrl = totalContentCost / totalUniqueUrls;

    uniqueDecayData.forEach((item) => {
      totalUrlsAnalyzed++;

      const category = item.decayStatus || "Stable";
      if (!decayCategories[category]) {
        decayCategories[category] = [];
      }

      // Calculate revenue loss for this URL based on decay severity
      let urlRevenueLoss = 0;
      if (item.hasDecay) {
        const clicksLost =
          (item.metrics?.peakClicks || 0) - (item.metrics?.currentClicks || 0);
        const potentialRevenue =
          clicksLost * conversionRate * averageOrderValue;

        // Apply severity multiplier
        const severityMultiplier = getSeverityMultiplier(item.decayStatus);
        urlRevenueLoss = potentialRevenue * severityMultiplier; // Add base cost waste for pages with decay
        urlRevenueLoss += costPerUrl * 0.1; // 10% of content cost is wasted for decaying pages
      }

      decayCategories[category].push({
        url: item.url,
        decayStatus: item.decayStatus,
        hasDecay: item.hasDecay,
        timeframe: item.timeframe,
        metrics: {
          slopeClicks: item.metrics?.slopeClicks || 0,
          slopeImpressions: item.metrics?.slopeImpressions || 0,
          performanceDrop: item.metrics?.performanceDrop || 0,
          peakDrop: item.metrics?.peakDrop || 0,
          avgDailyClicks: item.metrics?.avgDailyClicks || 0,
          avgDailyImpressions: item.metrics?.avgDailyImpressions || 0,
          currentClicks: item.metrics?.currentClicks || 0,
          peakClicks: item.metrics?.peakClicks || 0,
          totalClicks: item.metrics?.totalClicks || 0,
          totalImpressions: item.metrics?.totalImpressions || 0,
          timeframeDays: item.metrics?.timeframeDays || 0,
        },
        calculatedRevenueLoss: Math.round(urlRevenueLoss),
        topKeywords: item.topKeywords || [],
      });

      if (item.hasDecay) {
        urlsWithDecay++;
        totalClicksLost +=
          (item.metrics?.peakClicks || 0) - (item.metrics?.currentClicks || 0);
        totalImpressionsLost += Math.max(
          0,
          (item.metrics?.peakClicks || 0) * 10 -
            (item.metrics?.totalImpressions || 0)
        );
        calculatedRevenueLoss += urlRevenueLoss;
      }
    });

    // Calculate decay distribution percentages
    const decayDistribution = {};
    Object.keys(decayCategories).forEach((category) => {
      decayDistribution[category] = {
        count: decayCategories[category].length,
        percentage:
          totalUrlsAnalyzed > 0
            ? Math.round(
                (decayCategories[category].length / totalUrlsAnalyzed) * 100
              )
            : 0,
      };
    });

    // Get top performing and worst performing URLs
    const sortedByPerformance = uniqueDecayData.sort((a, b) => {
      const aClicks = a.metrics?.currentClicks || 0;
      const bClicks = b.metrics?.currentClicks || 0;
      return bClicks - aClicks;
    });

    const topPerformers = sortedByPerformance.slice(0, 5).map((item) => ({
      url: item.url,
      currentClicks: item.metrics?.currentClicks || 0,
      totalImpressions: item.metrics?.totalImpressions || 0,
      decayStatus: item.decayStatus,
    }));

    const worstPerformers = sortedByPerformance
      .slice(-5)
      .reverse()
      .map((item) => ({
        url: item.url,
        currentClicks: item.metrics?.currentClicks || 0,
        totalImpressions: item.metrics?.totalImpressions || 0,
        decayStatus: item.decayStatus,
        peakDrop: item.metrics?.peakDrop || 0,
      }));
    return {
      summary: {
        totalUrlsAnalyzed,
        urlsWithDecay,
        decayPercentage:
          totalUrlsAnalyzed > 0
            ? Math.round((urlsWithDecay / totalUrlsAnalyzed) * 100)
            : 0,
        totalClicksLost,
        totalImpressionsLost,
        totalRevenueLoss: Math.round(
          Math.min(calculatedRevenueLoss, totalContentCost * 0.8)
        ), // Cap at 80% of total investment
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Content Decay Analysis",
          content: `Content decay occurs when your pages lose organic traffic over time due to reduced relevance, outdated information, or declining search rankings. We analyze ${totalUrlsAnalyzed} URLs across 30, 60, and 90-day periods. ${urlsWithDecay} URLs (${Math.round(
            (urlsWithDecay / totalUrlsAnalyzed) * 100
          )}%) show signs of decay, resulting in ${totalClicksLost} total clicks lost and $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} in estimated revenue loss.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula:
            "Revenue Loss = (Clicks Lost * Conversion Rate * AOV * Severity Multiplier) + (Cost Per URL * 0.1 for decaying pages)",
        },
      },
      decayCategories,
      decayDistribution,
      topPerformers,
      worstPerformers,
      timeframes: {
        "30Days": decay30Days.length,
        "60Days": decay60Days.length,
        "90Days": decay90Days.length,
      },
    };
  };

  const getKeywordMismatch = () => {
    // Use contentCostWaste.length for total unique URLs
    const totalUniqueUrls = contentCostWaste.length || 1; // Prevent division by zero

    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate
    const costPerUrl = totalContentCost / totalUniqueUrls;

    let totalUrlsAnalyzed = 0;
    let urlsWithMismatch = 0;
    let totalClicksLost = 0;
    let totalImpressionsLost = 0;
    let calculatedRevenueLoss = 0;

    // Categorize by mismatch severity
    const mismatchCategories = {
      "High-Mismatch": [],
      "Medium-Mismatch": [],
      "Low-Mismatch": [],
      "No-Mismatch": [],
    };

    keywordMismatch.forEach((item) => {
      totalUrlsAnalyzed++;

      // Determine mismatch severity based on data structure
      const mismatchSeverity =
        item.severity || item.mismatchLevel || "Medium-Mismatch";
      const category = mismatchSeverity;

      if (!mismatchCategories[category]) {
        mismatchCategories[category] = [];
      }

      // Calculate revenue loss for this URL based on mismatch severity
      let urlRevenueLoss = 0;
      const hasMismatch = category !== "No-Mismatch";

      if (hasMismatch) {
        urlsWithMismatch++; // Estimate clicks lost due to poor keyword targeting (very conservative)
        const currentClicks = item.clicks || 0;
        const currentImpressions = item.impressions || 0;
        const estimatedClicksLost =
          Math.min(
            currentImpressions * 0.003, // 0.3% of impressions (very conservative)
            currentClicks * 0.1, // or 10% of current clicks
            15 // maximum 15 clicks lost per URL
          ) || 2; // minimum 2 clicks lost
        const potentialRevenue =
          estimatedClicksLost * conversionRate * averageOrderValue; // Apply mismatch severity multiplier (much more conservative)
        const severityMultiplier =
          getMismatchSeverityMultiplier(category) * 0.3; // Reduce impact by 70%
        urlRevenueLoss = potentialRevenue * severityMultiplier;

        // Add base content cost waste for pages with keyword mismatch (reduced)
        urlRevenueLoss += costPerUrl * 0.05; // 5% of content cost (reduced from 10%)

        totalClicksLost += estimatedClicksLost;
        totalImpressionsLost += item.impressions || 0;
        calculatedRevenueLoss += urlRevenueLoss;
      }

      mismatchCategories[category].push({
        url: item.url,
        mismatchSeverity: category,
        hasMismatch,
        targetKeywords: item.targetKeywords || [],
        actualKeywords: item.actualKeywords || [],
        mismatchScore: item.mismatchScore || 0,
        impressions: item.impressions || 0,
        clicks: item.clicks || 0,
        calculatedRevenueLoss: Math.round(urlRevenueLoss),
        recommendations: item.recommendations || [],
      });
    });

    // Calculate mismatch distribution percentages
    const mismatchDistribution = {};
    Object.keys(mismatchCategories).forEach((category) => {
      mismatchDistribution[category] = {
        count: mismatchCategories[category].length,
        percentage:
          totalUrlsAnalyzed > 0
            ? Math.round(
                (mismatchCategories[category].length / totalUrlsAnalyzed) * 100
              )
            : 0,
      };
    });

    // Get top and worst performing URLs
    const sortedByMismatch = keywordMismatch.sort((a, b) => {
      const aScore = a.mismatchScore || 0;
      const bScore = b.mismatchScore || 0;
      return bScore - aScore; // Higher mismatch score = worse
    });

    const worstMismatches = sortedByMismatch.slice(0, 5).map((item) => ({
      url: item.url,
      mismatchScore: item.mismatchScore || 0,
      targetKeywords: item.targetKeywords || [],
      actualKeywords: item.actualKeywords || [],
    }));
    return {
      summary: {
        totalUrlsAnalyzed,
        urlsWithMismatch,
        mismatchPercentage:
          totalUrlsAnalyzed > 0
            ? Math.round((urlsWithMismatch / totalUrlsAnalyzed) * 100)
            : 0,
        totalClicksLost,
        totalImpressionsLost,
        totalRevenueLoss: Math.round(
          Math.min(calculatedRevenueLoss, totalContentCost * 0.6) // Cap at 60% of total investment
        ),
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Keyword Mismatch Analysis",
          content: `Keyword mismatch occurs when your content doesn't align with the search terms you're ranking for, leading to poor user experience and lost conversions. We analyzed ${totalUrlsAnalyzed} URLs and found ${urlsWithMismatch} (${Math.round(
            (urlsWithMismatch / totalUrlsAnalyzed) * 100
          )}%) with keyword alignment issues. This results in ${Math.round(
            totalClicksLost
          )} clicks lost and $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} in revenue loss due to reduced relevance and conversion rates.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula:
            "Revenue Loss = (Estimated Clicks Lost * Conversion Rate * AOV * Severity Multiplier) + (Cost Per URL * 0.05 for mismatch pages)",
        },
      },
      mismatchCategories,
      mismatchDistribution,
      worstMismatches,
    };
  };

  const getLinkDilution = () => {
    // Use contentCostWaste.length for total unique URLs
    const totalUniqueUrls = contentCostWaste.length || 1; // Prevent division by zero

    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate
    const costPerUrl = totalContentCost / totalUniqueUrls;

    let totalUrlsAnalyzed = 0;
    let urlsWithDilution = 0;
    let totalLinkValueLost = 0;
    let calculatedRevenueLoss = 0;

    // Categorize by dilution severity
    const dilutionCategories = {
      "Severe-Dilution": [],
      "Moderate-Dilution": [],
      "Light-Dilution": [],
      "No-Dilution": [],
    };

    linkDilution.forEach((item) => {
      totalUrlsAnalyzed++;

      // Determine dilution severity based on data structure
      const dilutionSeverity =
        item.severity || item.dilutionLevel || "Moderate-Dilution";
      const category = dilutionSeverity;

      if (!dilutionCategories[category]) {
        dilutionCategories[category] = [];
      }

      // Calculate revenue loss for this URL based on link dilution
      let urlRevenueLoss = 0;
      const hasDilution = category !== "No-Dilution";

      if (hasDilution) {
        urlsWithDilution++; // Estimate SEO value lost due to link dilution (more conservative)
        const linkValue = item.linkValue || item.pageAuthority || 50; // Default link value
        const dilutionFactor = Math.min(item.dilutionFactor || 0.2, 0.4); // Cap at 40% dilution, default 20%
        const linkValueLost = linkValue * dilutionFactor; // Convert link value loss to traffic loss (much more conservative)
        const estimatedTrafficLoss = Math.min(linkValueLost * 0.3, 8); // 0.3 clicks per point, max 8 clicks lost
        const potentialRevenue =
          estimatedTrafficLoss * conversionRate * averageOrderValue; // Apply dilution severity multiplier (much more conservative)
        const severityMultiplier =
          getDilutionSeverityMultiplier(category) * 0.5; // Reduce by 50%
        urlRevenueLoss = potentialRevenue * severityMultiplier; // Add base content cost waste for pages with link dilution (reduced)
        urlRevenueLoss += costPerUrl * 0.05; // 5% of content cost (reduced from 15%)

        totalLinkValueLost += linkValueLost;
        calculatedRevenueLoss += urlRevenueLoss;
      }

      dilutionCategories[category].push({
        url: item.url,
        dilutionSeverity: category,
        hasDilution,
        internalLinks: item.internalLinks || 0,
        externalLinks: item.externalLinks || 0,
        linkValue: item.linkValue || 0,
        dilutionFactor: item.dilutionFactor || 0,
        pageAuthority: item.pageAuthority || 0,
        calculatedRevenueLoss: Math.round(urlRevenueLoss),
        recommendations: item.recommendations || [],
      });
    });

    // Calculate dilution distribution percentages
    const dilutionDistribution = {};
    Object.keys(dilutionCategories).forEach((category) => {
      dilutionDistribution[category] = {
        count: dilutionCategories[category].length,
        percentage:
          totalUrlsAnalyzed > 0
            ? Math.round(
                (dilutionCategories[category].length / totalUrlsAnalyzed) * 100
              )
            : 0,
      };
    });

    // Get worst diluted URLs
    const sortedByDilution = linkDilution.sort((a, b) => {
      const aDilution = a.dilutionFactor || 0;
      const bDilution = b.dilutionFactor || 0;
      return bDilution - aDilution; // Higher dilution = worse
    });

    const worstDiluted = sortedByDilution.slice(0, 5).map((item) => ({
      url: item.url,
      dilutionFactor: item.dilutionFactor || 0,
      internalLinks: item.internalLinks || 0,
      externalLinks: item.externalLinks || 0,
      linkValue: item.linkValue || 0,
    }));
    return {
      summary: {
        totalUrlsAnalyzed,
        urlsWithDilution,
        dilutionPercentage:
          totalUrlsAnalyzed > 0
            ? Math.round((urlsWithDilution / totalUrlsAnalyzed) * 100)
            : 0,
        totalLinkValueLost,
        totalRevenueLoss: Math.round(
          Math.min(calculatedRevenueLoss, totalContentCost * 0.5) // Cap at 50% of total investment
        ),
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Link Dilution Analysis",
          content: `Link dilution happens when your pages have too many internal/external links, weakening the SEO value passed to important pages. We analyzed ${totalUrlsAnalyzed} URLs and found ${urlsWithDilution} (${Math.round(
            (urlsWithDilution / totalUrlsAnalyzed) * 100
          )}%) with link dilution issues. This results in ${Math.round(
            totalLinkValueLost
          )} total link value points lost and $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} in revenue loss due to reduced search rankings and organic traffic.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula:
            "Revenue Loss = (Link Value Lost * 0.3 clicks/point * Conversion Rate * AOV * Severity Multiplier) + (Cost Per URL * 0.05 for diluted pages)",
        },
      },
      dilutionCategories,
      dilutionDistribution,
      worstDiluted,
    };
  };

  const getPsychMismatch = () => {
    // Use contentCostWaste.length for total unique URLs
    const totalUniqueUrls = contentCostWaste.length || 1; // Prevent division by zero

    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    // Check if psychMismatchData is available
    if (!psychMismatchData || Object.keys(psychMismatchData).length === 0) {
      throw new Error(
        "Funnel Analysis data is required but not available. Please ensure onboardingData.funnelAnalysis is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate
    const costPerUrl = totalContentCost / totalUniqueUrls; // Extract funnel analysis data
    const {
      totalAnalyzed = 0,
      funnelDistribution = {},
      psychCompositeSummary = {},
    } = psychMismatchData;

    let calculatedRevenueLoss = 0;
    let totalMismatchedContent = 0;

    // Analyze psychological composite scores and framework gaps
    const stageAnalysis = {};
    const overallScores = psychCompositeSummary.overall || {};

    // Define optimal funnel distribution and psychological thresholds
    const optimalFunnelDistribution = {
      ToF: 40, // Top of Funnel - Awareness
      MoF: 25, // Middle of Funnel - Consideration
      BoF: 25, // Bottom of Funnel - Decision
      Retention: 8, // Customer retention
      Advocacy: 2, // Customer advocacy
    };

    const optimalPsychThresholds = {
      emotionalResonance: 70,
      cognitiveClarity: 75,
      persuasionLeverage: 70,
      behavioralMomentum: 65,
    };

    // Calculate funnel distribution mismatches
    const funnelMismatches = {};
    let totalFunnelMismatch = 0;
    let funnelStageCount = 0;

    Object.keys(optimalFunnelDistribution).forEach((stage) => {
      const currentCount = funnelDistribution[stage] || 0;
      const currentPercentage =
        totalAnalyzed > 0 ? (currentCount / totalAnalyzed) * 100 : 0;
      const optimalPercentage = optimalFunnelDistribution[stage];
      const mismatchPercentage = Math.abs(
        currentPercentage - optimalPercentage
      );

      funnelMismatches[stage] = {
        optimal: optimalPercentage,
        current: Math.round(currentPercentage),
        mismatch: Math.round(mismatchPercentage),
        contentCount: currentCount,
      };

      totalFunnelMismatch += mismatchPercentage;
      funnelStageCount++;
    });

    const averageFunnelMismatch =
      funnelStageCount > 0 ? totalFunnelMismatch / funnelStageCount : 0;

    // Calculate emotional/psychological mismatches
    const emotionalMismatches = {};
    let totalEmotionalMismatch = 0;
    let emotionalMetricCount = 0;

    Object.keys(optimalPsychThresholds).forEach((metric) => {
      const currentScore = overallScores[metric] || 0;
      const optimalScore = optimalPsychThresholds[metric];
      const gap = Math.max(0, optimalScore - currentScore);
      const mismatchPercentage =
        optimalScore > 0 ? (gap / optimalScore) * 100 : 0;

      emotionalMismatches[metric] = {
        optimal: optimalScore,
        current: currentScore,
        gap: gap,
        mismatch: Math.round(mismatchPercentage),
      };

      totalEmotionalMismatch += mismatchPercentage;
      emotionalMetricCount++;
    });

    const averageEmotionalMismatch =
      emotionalMetricCount > 0
        ? totalEmotionalMismatch / emotionalMetricCount
        : 0;

    // Calculate overall mismatch percentage (average of funnel + emotional)
    const overallMismatchPercentage =
      (averageFunnelMismatch + averageEmotionalMismatch) / 2; // Simple revenue loss calculation: TotalInvested * MismatchPercentage * LossRatio
    const lossRatio = 0.15; // 15% loss ratio (optimal choice - not too aggressive, not too conservative)
    calculatedRevenueLoss =
      totalContentCost * (overallMismatchPercentage / 100) * lossRatio;

    // Set total mismatched content based on overall mismatch
    totalMismatchedContent = Math.round(
      totalAnalyzed * (overallMismatchPercentage / 100)
    );

    // Create simplified stage analysis for backward compatibility
    Object.keys(funnelDistribution).forEach((stage) => {
      if (stage === "Unknown") return;

      const stageContentCount = funnelDistribution[stage] || 0;
      const stageFunnelMismatch = funnelMismatches[stage]?.mismatch || 0;
      const stageRevenueLoss =
        (stageFunnelMismatch / 100) *
        (stageContentCount / totalAnalyzed) *
        calculatedRevenueLoss;

      stageAnalysis[stage] = {
        contentCount: stageContentCount,
        funnelMismatch: stageFunnelMismatch,
        emotionalMismatch: Math.round(averageEmotionalMismatch),
        overallMismatch: Math.round(
          (stageFunnelMismatch + averageEmotionalMismatch) / 2
        ),
        calculatedRevenueLoss: Math.round(stageRevenueLoss),
      };
    }); // Calculate overall psychological health using the new emotional mismatches
    const overallGaps = emotionalMismatches; // Use the new structure

    // Distribution by mismatch severity (simplified)
    const severityDistribution = {
      "High-Mismatch": { count: 0, contentCount: 0 },
      "Medium-Mismatch": { count: 0, contentCount: 0 },
      "Low-Mismatch": { count: 0, contentCount: 0 },
      Optimal: { count: 0, contentCount: 0 },
    };

    // Categorize stages based on their overall mismatch
    Object.keys(stageAnalysis).forEach((stage) => {
      const mismatch = stageAnalysis[stage].overallMismatch;
      let severity;
      if (mismatch > 30) {
        severity = "High-Mismatch";
      } else if (mismatch > 15) {
        severity = "Medium-Mismatch";
      } else if (mismatch > 5) {
        severity = "Low-Mismatch";
      } else {
        severity = "Optimal";
      }

      severityDistribution[severity].count++;
      severityDistribution[severity].contentCount +=
        stageAnalysis[stage].contentCount;
    });

    // Get worst performing stages
    const worstStages = Object.entries(stageAnalysis)
      .sort((a, b) => b[1].overallMismatch - a[1].overallMismatch)
      .slice(0, 3)
      .map(([stage, data]) => ({
        stage,
        funnelMismatch: data.funnelMismatch,
        emotionalMismatch: data.emotionalMismatch,
        overallMismatch: data.overallMismatch,
        revenueLoss: data.calculatedRevenueLoss,
        contentCount: data.contentCount,
      }));
    return {
      summary: {
        totalAnalyzed,
        totalMismatchedContent,
        mismatchPercentage: Math.round(overallMismatchPercentage),
        funnelMismatchPercentage: Math.round(averageFunnelMismatch),
        emotionalMismatchPercentage: Math.round(averageEmotionalMismatch),
        totalRevenueLoss: Math.round(calculatedRevenueLoss),
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        overallPsychHealth: Math.round(100 - averageEmotionalMismatch), // Based on emotional health
        tooltip: {
          title: "Psychological Mismatch Analysis",
          content: `Psychological mismatch occurs when your content doesn't align with your audience's emotional state and funnel stage, reducing conversion effectiveness. We analyzed ${totalAnalyzed} pieces of content across funnel stages (ToF/MoF/BoF) and psychological metrics (emotional resonance, cognitive clarity, persuasion leverage, behavioral momentum). Your content shows ${Math.round(
            averageFunnelMismatch
          )}% funnel distribution mismatch and ${Math.round(
            averageEmotionalMismatch
          )}% emotional alignment gap, resulting in $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} revenue loss.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula:
            "Revenue Loss = Total Invested × Mismatch% × Loss Ratio (15%)",
          calculation: `$${totalContentCost.toLocaleString()} × ${Math.round(
            overallMismatchPercentage
          )}% × 15% = $${Math.round(calculatedRevenueLoss).toLocaleString()}`,
        },
      },
      funnelMismatches,
      emotionalMismatches,
      stageAnalysis,
      overallGaps,
      severityDistribution,
      worstStages,
      funnelDistribution,
    };
  };
  const getCannibalizationLoss = () => {
    // Use contentCostWaste.length for total unique URLs
    const totalUniqueUrls = contentCostWaste.length || 1; // Prevent division by zero

    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate
    const costPerUrl = totalContentCost / totalUniqueUrls;

    let totalKeywordsAnalyzed = 0;
    let keywordsWithCannibalization = 0; // Only count moderate and severe
    let totalCompetingUrls = 0;
    let totalClicksLost = 0;
    let totalImpressionsAffected = 0; // Categorize by cannibalization severity (ignore light cannibalization)
    const cannibalizationCategories = {
      "Severe-Cannibalization": [],
      "Moderate-Cannibalization": [],
      "Light-Cannibalization": [], // Will populate but ignore in calculations
      "No-Cannibalization": [],
    };

    cannibalization.forEach((item) => {
      totalKeywordsAnalyzed++;

      const keyword = item.keyword;
      const primaryUrl = item.primaryUrl || {};
      const competingUrls = item.competingUrls || [];

      // Calculate cannibalization severity based on number of competing URLs
      const competingUrlCount = competingUrls.length;
      let severity;

      if (competingUrlCount >= 4) {
        severity = "Severe-Cannibalization";
      } else if (competingUrlCount >= 2) {
        severity = "Moderate-Cannibalization";
      } else if (competingUrlCount >= 1) {
        severity = "Light-Cannibalization"; // Will be ignored in loss calculation
      } else {
        severity = "No-Cannibalization";
      }

      if (!cannibalizationCategories[severity]) {
        cannibalizationCategories[severity] = [];
      }

      // Only count moderate and severe cannibalization for loss calculation
      const hasCannibalization =
        severity === "Severe-Cannibalization" ||
        severity === "Moderate-Cannibalization";

      if (hasCannibalization) {
        keywordsWithCannibalization++;
        totalCompetingUrls += competingUrlCount;

        // Calculate total impressions and clicks affected (simplified)
        const primaryImpressions = primaryUrl.impressions || 0;
        const primaryClicks = primaryUrl.clicks || 0;

        let totalCompetingImpressions = 0;
        let totalCompetingClicks = 0;

        competingUrls.forEach((url) => {
          totalCompetingImpressions += url.impressions || 0;
          totalCompetingClicks += url.clicks || 0;
        });

        const totalImpressions = primaryImpressions + totalCompetingImpressions;
        const totalClicks = primaryClicks + totalCompetingClicks;

        // Conservative estimate of clicks lost (much reduced)
        const cannibalImpact = getCannibalImpactFactor(severity);
        const potentialClicks = totalClicks * (1 + cannibalImpact * 0.3); // Reduce impact by 70%
        const clicksLost = Math.min(
          potentialClicks - totalClicks,
          totalClicks * 0.2
        ); // Max 20% of current clicks

        totalClicksLost += clicksLost;
        totalImpressionsAffected += totalImpressions;
      }

      cannibalizationCategories[severity].push({
        keyword,
        severity,
        hasCannibalization,
        primaryUrl: {
          url: primaryUrl.url || "N/A",
          position: primaryUrl.position || 0,
          clicks: primaryUrl.clicks || 0,
          impressions: primaryUrl.impressions || 0,
        },
        competingUrls: competingUrls.map((url) => ({
          url: url.url || "N/A",
          position: url.position || 0,
          clicks: url.clicks || 0,
          impressions: url.impressions || 0,
        })),
        competingUrlCount,
        potentialImprovement: hasCannibalization
          ? `${Math.round(
              getCannibalImpactFactor(severity) * 100
            )}% performance gain`
          : "N/A",
      });
    }); // Calculate weighted cannibalization loss based on severity levels
    const severityDistributionCalc = {};
    let weightedLossPercentage = 0;

    // Define loss factors for each severity level
    const lossFactor = {
      "Light-Cannibalization": 0.08, // 8% loss factor for light cannibalization
      "Moderate-Cannibalization": 0.15, // 15% loss factor for moderate cannibalization
      "Severe-Cannibalization": 0.25, // 25% loss factor for severe cannibalization
    };

    // Calculate percentage of keywords in each severity category
    Object.keys(lossFactor).forEach((severity) => {
      const keywordsInCategory =
        cannibalizationCategories[severity]?.length || 0;
      const percentageInCategory =
        totalKeywordsAnalyzed > 0
          ? (keywordsInCategory / totalKeywordsAnalyzed) * 100
          : 0;

      severityDistributionCalc[severity] = {
        percentage: percentageInCategory,
        lossFactor: lossFactor[severity],
        weightedLoss: percentageInCategory * lossFactor[severity],
      };

      // Add to weighted loss percentage
      weightedLossPercentage += percentageInCategory * lossFactor[severity];
    });

    // Average the weighted loss to get final loss percentage
    const finalLossPercentage = weightedLossPercentage / 100; // Convert to decimal

    // Calculate revenue loss: TotalInvested * FinalLossPercentage
    const calculatedRevenueLoss = totalContentCost * finalLossPercentage;

    // Calculate overall cannibalization percentage (for display)
    const overallCannibalizationPercentage =
      (cannibalizationCategories["Light-Cannibalization"]?.length || 0) +
      (cannibalizationCategories["Moderate-Cannibalization"]?.length || 0) +
      (cannibalizationCategories["Severe-Cannibalization"]?.length || 0);

    const cannibalizationPercentage =
      totalKeywordsAnalyzed > 0
        ? (overallCannibalizationPercentage / totalKeywordsAnalyzed) * 100
        : 0; // Calculate cannibalization distribution percentages
    const cannibalizationDistribution = {};
    Object.keys(cannibalizationCategories).forEach((category) => {
      cannibalizationDistribution[category] = {
        count: cannibalizationCategories[category].length,
        percentage:
          totalKeywordsAnalyzed > 0
            ? Math.round(
                (cannibalizationCategories[category].length /
                  totalKeywordsAnalyzed) *
                  100
              )
            : 0,
      };
    });

    // Get worst cannibalized keywords (only moderate and severe)
    const significantCannibalization = cannibalization.filter((item) => {
      const competingUrlCount = (item.competingUrls || []).length;
      return competingUrlCount >= 2; // Moderate or severe only
    });

    const sortedByCannibalization = significantCannibalization.sort((a, b) => {
      const aCount = (a.competingUrls || []).length;
      const bCount = (b.competingUrls || []).length;
      return bCount - aCount; // Higher competing URL count = worse
    });

    const worstCannibalized = sortedByCannibalization
      .slice(0, 5)
      .map((item) => ({
        keyword: item.keyword,
        competingUrlCount: (item.competingUrls || []).length,
        primaryUrl: item.primaryUrl?.url || "N/A",
        totalImpressions:
          (item.primaryUrl?.impressions || 0) +
          (item.competingUrls || []).reduce(
            (sum, url) => sum + (url.impressions || 0),
            0
          ),
      }));

    // Calculate average cannibalization impact (excluding light cannibalization)
    const avgCompetingUrls =
      keywordsWithCannibalization > 0
        ? Math.round(totalCompetingUrls / keywordsWithCannibalization)
        : 0;
    return {
      summary: {
        totalKeywordsAnalyzed,
        keywordsWithCannibalization: overallCannibalizationPercentage, // Total with any cannibalization
        cannibalizationPercentage: Math.round(cannibalizationPercentage),
        totalCompetingUrls,
        avgCompetingUrls,
        totalClicksLost,
        totalImpressionsAffected,
        totalRevenueLoss: Math.round(calculatedRevenueLoss),
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        weightedLossPercentage: Math.round(weightedLossPercentage * 100) / 100, // Round to 2 decimal places
        severityBreakdown: severityDistributionCalc,
        tooltip: {
          title: "Keyword Cannibalization Analysis",
          content: `Keyword cannibalization occurs when multiple pages on your site compete for the same keywords, diluting their individual ranking power and confusing search engines. We analyzed ${totalKeywordsAnalyzed} keywords and found ${Math.round(
            cannibalizationPercentage
          )}% with cannibalization issues across different severity levels. Using our weighted loss model (Light: 8%, Moderate: 15%, Severe: 25%), this results in $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} in revenue loss from reduced rankings and split traffic.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula: "Revenue Loss = Total Invested × Weighted Loss Percentage",
          calculation: `Light: ${Math.round(
            severityDistributionCalc["Light-Cannibalization"]?.percentage || 0
          )}% × 8% + Moderate: ${Math.round(
            severityDistributionCalc["Moderate-Cannibalization"]?.percentage ||
              0
          )}% × 15% + Severe: ${Math.round(
            severityDistributionCalc["Severe-Cannibalization"]?.percentage || 0
          )}% × 25% = ${Math.round(finalLossPercentage * 100)}% loss`,
          breakdown: {
            light: {
              percentage: Math.round(
                severityDistributionCalc["Light-Cannibalization"]?.percentage ||
                  0
              ),
              lossFactor: "8%",
              impact:
                Math.round(
                  (severityDistributionCalc["Light-Cannibalization"]
                    ?.weightedLoss || 0) * 100
                ) / 100,
            },
            moderate: {
              percentage: Math.round(
                severityDistributionCalc["Moderate-Cannibalization"]
                  ?.percentage || 0
              ),
              lossFactor: "15%",
              impact:
                Math.round(
                  (severityDistributionCalc["Moderate-Cannibalization"]
                    ?.weightedLoss || 0) * 100
                ) / 100,
            },
            severe: {
              percentage: Math.round(
                severityDistributionCalc["Severe-Cannibalization"]
                  ?.percentage || 0
              ),
              lossFactor: "25%",
              impact:
                Math.round(
                  (severityDistributionCalc["Severe-Cannibalization"]
                    ?.weightedLoss || 0) * 100
                ) / 100,
            },
          },
        },
      },
      cannibalizationCategories,
      cannibalizationDistribution,
      worstCannibalized,
    };
  };
  // Helper function to get cannibalization impact factor
  const getCannibalImpactFactor = (severity) => {
    const impactMap = {
      "Severe-Cannibalization": 0.6, // 60% potential improvement
      "Moderate-Cannibalization": 0.4, // 40% potential improvement
      "Light-Cannibalization": 0.2, // 20% potential improvement
      "No-Cannibalization": 0,
    };
    return impactMap[severity] || 0;
  };
  // Helper function to get mismatch severity multiplier
  const getMismatchSeverityMultiplier = (severity) => {
    const multiplierMap = {
      "High-Mismatch": 1.5,
      "Medium-Mismatch": 1.2,
      "Low-Mismatch": 1.0,
      "No-Mismatch": 0,
    };
    return multiplierMap[severity] || 1.0;
  };

  // Helper function to get dilution severity multiplier
  const getDilutionSeverityMultiplier = (severity) => {
    const multiplierMap = {
      "Severe-Dilution": 1.5,
      "Moderate-Dilution": 1.2,
      "Light-Dilution": 1.0,
      "No-Dilution": 0,
    };
    return multiplierMap[severity] || 1.0;
  };

  // Helper function to determine severity score for comparison
  const getSeverityScore = (decayStatus) => {
    const severityMap = {
      "Severe-Decay": 4,
      "Moderate-Decay": 3,
      "Light-Decay": 2,
      Stable: 1,
    };
    return severityMap[decayStatus] || 1;
  };

  // Helper function to get severity multiplier for revenue loss calculation
  const getSeverityMultiplier = (decayStatus) => {
    const multiplierMap = {
      "Severe-Decay": 1.5,
      "Moderate-Decay": 1.2,
      "Light-Decay": 1.0,
      Stable: 0,
    };
    return multiplierMap[decayStatus] || 0;
  };
  const funnelGapIdentifier = () => {
    // FIXED: Use consistent data source for both calculations
    // Use the actual analyzed content count for both cost per URL and total analyzed
    const totalAnalyzed =
      psychMismatchData?.totalAnalyzed || contentCostWaste.length || 1;
    const totalUniqueUrls = totalAnalyzed; // Use same value for consistency

    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    if (!psychMismatchData || !psychMismatchData.funnelDistribution) {
      throw new Error(
        "Funnel analysis data is required but not available. Please ensure onboardingData.funnelAnalysis is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate
    // FIXED: Calculate cost per URL based on analyzed content only
    const costPerUrl = totalContentCost / totalAnalyzed;

    // Extract data from psychMismatchData (which contains funnelAnalysis)
    const funnelDistribution = psychMismatchData.funnelDistribution || {};
    const frameworkCoverage = psychMismatchData.frameworkCoverage || [];
    const psychCompositeSummary = psychMismatchData.psychCompositeSummary || {};

    // Define optimal funnel distribution percentages (industry benchmarks)
    const optimalDistribution = {
      ToF: 40, // Top of Funnel - Awareness
      MoF: 25, // Middle of Funnel - Consideration
      BoF: 25, // Bottom of Funnel - Decision
      Retention: 8, // Customer retention
      Advocacy: 2, // Customer advocacy
    };

    // Define minimum framework coverage requirements per stage
    const minFrameworkCoverage = {
      ToF: 80, // Need strong awareness frameworks
      MoF: 85, // Critical consideration stage
      BoF: 90, // Most critical conversion stage
      Retention: 75, // Important for LTV
      Advocacy: 60, // Lower priority but still important
    };

    let totalGapImpact = 0;
    let calculatedRevenueLoss = 0;
    const stageAnalysis = {};
    const gapCategories = {
      "Critical-Gap": [],
      "Major-Gap": [],
      "Minor-Gap": [],
      Optimal: [],
    };

    // Analyze each funnel stage
    Object.keys(optimalDistribution).forEach((stage) => {
      const currentCount = funnelDistribution[stage] || 0;
      const currentPercentage =
        totalAnalyzed > 0 ? (currentCount / totalAnalyzed) * 100 : 0;
      const optimalPercentage = optimalDistribution[stage];
      const distributionGap = Math.abs(currentPercentage - optimalPercentage);

      // Find framework coverage for this stage
      const frameworkData =
        frameworkCoverage.find((f) => f.stage === stage) || {};
      const frameworkPercent = frameworkData.percent || 0;
      const minRequired = minFrameworkCoverage[stage];
      const frameworkGap = Math.max(0, minRequired - frameworkPercent);

      // Get psychological scores for this stage
      const psychScores = psychCompositeSummary.byStage?.[stage] || {};
      const avgPsychScore =
        Object.values(psychScores).reduce(
          (sum, score) => sum + (score || 0),
          0
        ) / 4;
      const psychGap = Math.max(0, 70 - avgPsychScore); // 70 is optimal psychological score

      // Determine gap severity
      let gapSeverity = "Optimal";
      let severityScore = 0;

      // Calculate composite gap score
      const compositeGap =
        distributionGap * 0.4 + frameworkGap * 0.3 + psychGap * 0.3;

      if (compositeGap > 25 || frameworkGap > 20 || distributionGap > 20) {
        gapSeverity = "Critical-Gap";
        severityScore = 3;
      } else if (
        compositeGap > 15 ||
        frameworkGap > 10 ||
        distributionGap > 15
      ) {
        gapSeverity = "Major-Gap";
        severityScore = 2;
      } else if (compositeGap > 8 || frameworkGap > 5 || distributionGap > 10) {
        gapSeverity = "Minor-Gap";
        severityScore = 1;
      } // Calculate revenue loss for this stage gap
      let stageRevenueLoss = 0;
      if (gapSeverity !== "Optimal") {
        // FIXED: Much more conservative revenue loss calculation
        const stageImportanceMultiplier = {
          ToF: 0.5, // Awareness drives volume but lower immediate impact
          MoF: 0.8, // Consideration is important but not critical
          BoF: 1.0, // Decision stage has highest impact but capped
          Retention: 0.6, // Important for LTV but lower immediate impact
          Advocacy: 0.3, // Lower immediate impact
        };

        const importance = stageImportanceMultiplier[stage] || 0.5;
        const gapImpact = Math.min(compositeGap / 100, 0.15); // Cap gap impact at 15%

        // FIXED: More realistic revenue loss calculation
        const stageContentValue =
          (currentCount / totalAnalyzed) * totalContentCost;

        // Use conservative multipliers for different loss types
        const conversionImpactLoss =
          currentCount *
          conversionRate *
          averageOrderValue *
          gapImpact *
          importance *
          0.1; // 10% of potential conversions
        const contentEffectivenessLoss =
          stageContentValue * gapImpact * importance * 0.05; // 5% of content value

        stageRevenueLoss = conversionImpactLoss + contentEffectivenessLoss;

        // FIXED: Cap individual stage loss at maximum 1% of total investment
        stageRevenueLoss = Math.min(stageRevenueLoss, totalContentCost * 0.01);

        totalGapImpact += compositeGap;
      }

      calculatedRevenueLoss += stageRevenueLoss;

      // Categorize by gap severity
      gapCategories[gapSeverity].push({
        stage,
        currentCount,
        currentPercentage: Math.round(currentPercentage * 100) / 100,
        optimalPercentage,
        distributionGap: Math.round(distributionGap * 100) / 100,
        frameworkCoverage: frameworkPercent,
        frameworkGap: Math.round(frameworkGap * 100) / 100,
        psychScores,
        avgPsychScore: Math.round(avgPsychScore * 100) / 100,
        psychGap: Math.round(psychGap * 100) / 100,
        compositeGap: Math.round(compositeGap * 100) / 100,
        calculatedRevenueLoss: Math.round(stageRevenueLoss),
        severityScore,
      });

      stageAnalysis[stage] = {
        currentCount,
        currentPercentage: Math.round(currentPercentage * 100) / 100,
        optimalPercentage,
        gapSeverity,
        distributionGap: Math.round(distributionGap * 100) / 100,
        frameworkCoverage: frameworkPercent,
        frameworkGap: Math.round(frameworkGap * 100) / 100,
        psychScores,
        avgPsychScore: Math.round(avgPsychScore * 100) / 100,
        psychGap: Math.round(psychGap * 100) / 100,
        compositeGap: Math.round(compositeGap * 100) / 100,
        calculatedRevenueLoss: Math.round(stageRevenueLoss),
        recommendations: getFunnelStageRecommendations(
          stage,
          gapSeverity,
          distributionGap,
          frameworkGap,
          psychGap
        ),
      };
    });

    // Calculate gap distribution
    const gapDistribution = {};
    Object.keys(gapCategories).forEach((severity) => {
      gapDistribution[severity] = {
        count: gapCategories[severity].length,
        percentage: Math.round(
          (gapCategories[severity].length /
            Object.keys(optimalDistribution).length) *
            100
        ),
      };
    });

    // Find most critical gaps (highest revenue impact)
    const criticalGaps = Object.entries(stageAnalysis)
      .sort((a, b) => b[1].calculatedRevenueLoss - a[1].calculatedRevenueLoss)
      .slice(0, 3)
      .map(([stage, data]) => ({
        stage,
        gapSeverity: data.gapSeverity,
        compositeGap: data.compositeGap,
        revenueLoss: data.calculatedRevenueLoss,
        primaryIssue: getPrimaryGapIssue(data),
      })); // Calculate overall funnel health score
    const overallHealthScore = Math.max(
      0,
      100 - totalGapImpact / Object.keys(optimalDistribution).length
    );

    // FIXED: Cap total funnel gap revenue loss at maximum 3% of total investment
    calculatedRevenueLoss = Math.min(
      calculatedRevenueLoss,
      totalContentCost * 0.03
    );

    return {
      summary: {
        totalAnalyzed,
        overallHealthScore: Math.round(overallHealthScore),
        totalRevenueLoss: Math.round(calculatedRevenueLoss),
        criticalGapsCount: gapCategories["Critical-Gap"].length,
        majorGapsCount: gapCategories["Major-Gap"].length,
        minorGapsCount: gapCategories["Minor-Gap"].length,
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Funnel Gap Analysis",
          content: `Funnel gaps occur when your content distribution doesn't match optimal customer journey patterns. We analyzed ${totalAnalyzed} pieces of content across funnel stages (ToF/MoF/BoF) and found ${
            gapCategories["Critical-Gap"].length
          } critical gaps, ${
            gapCategories["Major-Gap"].length
          } major gaps, and ${
            gapCategories["Minor-Gap"].length
          } minor gaps. Your overall funnel health score is ${Math.round(
            overallHealthScore
          )}/100, with $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} in revenue loss from misaligned content strategy (capped at 3% of total investment for realistic projections).`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula:
            "Revenue Loss = (Lost Conversions * AOV * Conservative Multiplier) + (Content Effectiveness Loss * 5%) - Capped at 3% of total investment",
        },
      },
      stageAnalysis,
      gapCategories,
      gapDistribution,
      criticalGaps,
      funnelDistribution: {
        current: funnelDistribution,
        optimal: optimalDistribution,
      },
      frameworkAnalysis: frameworkCoverage.map((f) => ({
        ...f,
        gap: Math.max(0, minFrameworkCoverage[f.stage] - f.percent),
        minRequired: minFrameworkCoverage[f.stage],
      })),
    };
  };

  // Helper function to get recommendations for funnel stage gaps
  const getFunnelStageRecommendations = (
    stage,
    severity,
    distributionGap,
    frameworkGap,
    psychGap
  ) => {
    const recommendations = [];

    if (distributionGap > 15) {
      const needsMore = distributionGap > 0;
      recommendations.push(
        needsMore
          ? `Increase ${stage} content production by ${Math.round(
              distributionGap
            )}%`
          : `Optimize existing ${stage} content quality over quantity`
      );
    }

    if (frameworkGap > 10) {
      recommendations.push(
        `Implement missing psychological frameworks for ${stage} stage`
      );
    }

    if (psychGap > 15) {
      recommendations.push(
        `Improve psychological resonance scores for ${stage} content`
      );
    }

    if (severity === "Critical-Gap") {
      recommendations.push(
        `URGENT: ${stage} stage requires immediate attention - highest revenue impact`
      );
    }

    return recommendations;
  };

  // Helper function to identify primary gap issue
  const getPrimaryGapIssue = (stageData) => {
    const { distributionGap, frameworkGap, psychGap } = stageData;

    if (distributionGap >= frameworkGap && distributionGap >= psychGap) {
      return "Content Distribution Gap";
    } else if (frameworkGap >= psychGap) {
      return "Framework Coverage Gap";
    } else {
      return "Psychological Resonance Gap";
    }
  };

  const getContentQualityDistribution = () => {
    // Use contentCostWaste.length for total unique URLs
    const totalUniqueUrls = contentCostWaste.length || 1;

    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate
    const costPerUrl = totalContentCost / totalUniqueUrls;

    // Define quality score ranges
    const qualityCategories = {
      Excellent: { min: 90, max: 100, urls: [], color: "#22c55e" },
      Good: { min: 75, max: 89, urls: [], color: "#84cc16" },
      Average: { min: 60, max: 74, urls: [], color: "#eab308" },
      Poor: { min: 40, max: 59, urls: [], color: "#f97316" },
      Critical: { min: 0, max: 39, urls: [], color: "#ef4444" },
    };

    let totalQualityScore = 0;
    let totalRevenueLoss = 0;

    // Analyze all available data sources for quality indicators
    const allUrls = new Set();

    // Collect URLs from various data sources
    [...decay30Days, ...decay60Days, ...decay90Days].forEach((item) => {
      if (item.url) allUrls.add(item.url);
    });

    keywordMismatch.forEach((item) => {
      if (item.url) allUrls.add(item.url);
    });

    cannibalization.forEach((item) => {
      if (item.primaryUrl?.url) allUrls.add(item.primaryUrl.url);
      (item.competingUrls || []).forEach((url) => {
        if (url.url) allUrls.add(url.url);
      });
    });

    linkDilution.forEach((item) => {
      if (item.url) allUrls.add(item.url);
    });

    contentCostWaste.forEach((item) => {
      if (item.url) allUrls.add(item.url);
    });

    const urlsArray = Array.from(allUrls); // Calculate quality score for each URL
    urlsArray.forEach((url, index) => {
      let qualityScore = 100; // Start with perfect score
      let issueCount = 0;
      let revenueLoss = 0;

      // Debug logging for first few URLs
      if (index < 3) {
        console.log(`\n--- Analyzing URL ${index + 1}: ${url} ---`);
        console.log("Starting quality score:", qualityScore);
      }

      // Check for decay issues
      const decayIssue = [...decay30Days, ...decay60Days, ...decay90Days].find(
        (item) => item.url === url
      );
      if (decayIssue?.hasDecay) {
        const decayPenalty =
          {
            "Severe-Decay": 40,
            "Moderate-Decay": 25,
            "Light-Decay": 15,
          }[decayIssue.decayStatus] || 0;
        qualityScore -= decayPenalty;
        issueCount++;
        revenueLoss += costPerUrl * 0.5; // Content value loss
        if (index < 3) {
          console.log(
            `Decay penalty: -${decayPenalty}, new score: ${qualityScore}`
          );
        }
      }

      // Check for keyword mismatch
      const mismatchIssue = keywordMismatch.find((item) => item.url === url);
      if (mismatchIssue) {
        const mismatchPenalty =
          {
            "High-Mismatch": 30,
            "Medium-Mismatch": 20,
            "Low-Mismatch": 10,
          }[mismatchIssue.severity || mismatchIssue.mismatchLevel] || 0;
        qualityScore -= mismatchPenalty;
        issueCount++;
        revenueLoss += costPerUrl * 0.3;
        if (index < 3) {
          console.log(
            `Mismatch penalty: -${mismatchPenalty}, new score: ${qualityScore}`
          );
        }
      }

      // Check for cannibalization
      const cannibalIssue = cannibalization.find(
        (item) =>
          item.primaryUrl?.url === url ||
          (item.competingUrls || []).some((comp) => comp.url === url)
      );
      if (cannibalIssue) {
        const competingCount = (cannibalIssue.competingUrls || []).length;
        const cannibalPenalty = Math.min(competingCount * 8, 35); // Max 35 point penalty
        qualityScore -= cannibalPenalty;
        issueCount++;
        revenueLoss += costPerUrl * 0.4;
        if (index < 3) {
          console.log(
            `Cannibalization penalty: -${cannibalPenalty}, new score: ${qualityScore}`
          );
        }
      }

      // Check for link dilution
      const dilutionIssue = linkDilution.find((item) => item.url === url);
      if (dilutionIssue) {
        const dilutionPenalty =
          {
            "Severe-Dilution": 25,
            "Moderate-Dilution": 18,
            "Light-Dilution": 10,
          }[dilutionIssue.severity || dilutionIssue.dilutionLevel] || 0;
        qualityScore -= dilutionPenalty;
        issueCount++;
        revenueLoss += costPerUrl * 0.25;
        if (index < 3) {
          console.log(
            `Dilution penalty: -${dilutionPenalty}, new score: ${qualityScore}`
          );
        }
      }

      // Ensure minimum score of 0
      qualityScore = Math.max(0, qualityScore);
      totalQualityScore += qualityScore;
      totalRevenueLoss += revenueLoss;

      if (index < 3) {
        console.log(
          `Final quality score: ${qualityScore}, total issues: ${issueCount}`
        );
      }

      // Categorize by quality score
      const category =
        Object.keys(qualityCategories).find(
          (cat) =>
            qualityScore >= qualityCategories[cat].min &&
            qualityScore <= qualityCategories[cat].max
        ) || "Critical";

      if (index < 3) {
        console.log(
          `Assigned to category: ${category} (${qualityCategories[category].min}-${qualityCategories[category].max})`
        );
      }

      qualityCategories[category].urls.push({
        url,
        qualityScore: Math.round(qualityScore),
        issueCount,
        revenueLoss: Math.round(revenueLoss),
        issues: {
          hasDecay: !!decayIssue?.hasDecay,
          hasMismatch: !!mismatchIssue,
          hasCannibalization: !!cannibalIssue,
          hasDilution: !!dilutionIssue,
        },
      });
    }); // Calculate distribution percentages for both category types
    const distribution = {};
    Object.keys(qualityCategories).forEach((category) => {
      const count = qualityCategories[category].urls.length;
      distribution[category] = {
        count,
        percentage:
          urlsArray.length > 0
            ? Math.round((count / urlsArray.length) * 100)
            : 0,
        color: qualityCategories[category].color,
      };
    });

    // Map quality categories to A-D grading system for dashboard compatibility
    const gradeMapping = {
      A: qualityCategories.Excellent.urls.length, // 90-100 -> A
      B: qualityCategories.Good.urls.length, // 75-89  -> B
      C: qualityCategories.Average.urls.length, // 60-74  -> C
      D:
        qualityCategories.Poor.urls.length +
        qualityCategories.Critical.urls.length, // 0-59 -> D
    };

    // Calculate A-D percentages
    const total = urlsArray.length;
    const gradeDistribution = {
      A: gradeMapping.A,
      B: gradeMapping.B,
      C: gradeMapping.C,
      D: gradeMapping.D,
      total: total,
      percentA: total > 0 ? Math.round((gradeMapping.A / total) * 100) : 0,
      percentB: total > 0 ? Math.round((gradeMapping.B / total) * 100) : 0,
      percentC: total > 0 ? Math.round((gradeMapping.C / total) * 100) : 0,
      percentD: total > 0 ? Math.round((gradeMapping.D / total) * 100) : 0,
    };

    // Get worst performing URLs
    const allUrlsWithScores = Object.values(qualityCategories)
      .flatMap((cat) => cat.urls)
      .sort((a, b) => a.qualityScore - b.qualityScore);

    const worstPerformers = allUrlsWithScores.slice(0, 10);
    const bestPerformers = allUrlsWithScores.slice(-5).reverse();
    const averageQualityScore =
      urlsArray.length > 0
        ? Math.round(totalQualityScore / urlsArray.length)
        : 0; // Console logging for debugging
    console.log("=== Content Quality Distribution Debug ===");
    console.log("URLs Array Length:", urlsArray.length);
    console.log("Sample URLs:", urlsArray.slice(0, 5));
    console.log("Total Quality Score:", totalQualityScore);
    console.log("Average Quality Score:", averageQualityScore);
    console.log(
      "Quality Categories with URLs:",
      Object.keys(qualityCategories).map((cat) => ({
        category: cat,
        count: qualityCategories[cat].urls.length,
        range: `${qualityCategories[cat].min}-${qualityCategories[cat].max}`,
        sampleUrls: qualityCategories[cat].urls.slice(0, 2).map((url) => ({
          url: url.url,
          score: url.qualityScore,
        })),
      }))
    );
    console.log("Distribution:", distribution);
    console.log("Grade Distribution (A-D):", gradeDistribution);
    console.log("=== End Debug ===");

    return {
      summary: {
        totalUrlsAnalyzed: urlsArray.length,
        averageQualityScore,
        totalRevenueLoss: Math.round(totalRevenueLoss),
        qualityGrade: getQualityGrade(averageQualityScore),
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Content Quality Analysis",
          content: `Content quality is measured by analyzing multiple performance factors including decay, keyword alignment, cannibalization, and link dilution. We evaluated ${
            urlsArray.length
          } URLs and found an average quality score of ${averageQualityScore}/100 (Grade: ${getQualityGrade(
            averageQualityScore
          )}). Poor quality content results in $${Math.round(
            totalRevenueLoss
          ).toLocaleString()} in revenue loss from reduced search performance and user engagement.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula:
            "Quality Score = 100 - (Decay Penalty + Mismatch Penalty + Cannibalization Penalty + Dilution Penalty)",
        },
      },
      distribution,
      gradeDistribution, // Return A-D grade distribution for dashboard
      qualityCategories,
      worstPerformers,
      bestPerformers,
      qualityTrends: {
        excellentContent: distribution.Excellent.percentage,
        problematicContent:
          distribution.Poor.percentage + distribution.Critical.percentage,
        improvementPotential: 100 - averageQualityScore,
      },
    };
  };
  const getMoodyCreditScore = () => {
    // Use centralized calculations from other context functions
    const contentQualityData = getContentQualityDistribution();
    const roiRecoveryData = getROIRecoveryPotential();

    // Get financial basics
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    } // Use the actual content quality score from getContentQualityDistribution
    const contentHealthScore =
      contentQualityData.summary?.averageQualityScore || 0;

    // Get distribution for display purposes
    const qualityDistribution = contentQualityData.distribution;
    const poorContent = qualityDistribution.Poor?.percentage || 0;
    const criticalContent = qualityDistribution.Critical?.percentage || 0;

    // Technical Health Score (25% weight) - Based on 404 errors and dilution
    let technicalHealthScore = 100;
    const notFoundPenalty = Math.min(notFoundPages.length * 2, 25);
    technicalHealthScore -= notFoundPenalty;

    const dilutionUrls = linkDilution.filter((item) =>
      ["Severe-Dilution", "Moderate-Dilution"].includes(
        item.severity || item.dilutionLevel
      )
    ).length;
    if (dilutionUrls > 0 && linkDilution.length > 0) {
      const dilutionPenalty = Math.min(
        (dilutionUrls / linkDilution.length) * 35,
        30
      );
      technicalHealthScore -= dilutionPenalty;
    }
    technicalHealthScore = Math.max(0, technicalHealthScore);

    // Performance Health Score (20% weight) - Based on ROI recovery potential
    const recoveryPercentage = roiRecoveryData.summary?.recoveryPercentage || 0;
    const performanceHealthScore = Math.max(
      0,
      Math.min(100, recoveryPercentage)
    );

    // Strategic Alignment Score (15% weight) - Based on psychological data
    let strategicAlignmentScore = 100;
    if (psychMismatchData && psychMismatchData.psychCompositeSummary) {
      const overallScores =
        psychMismatchData.psychCompositeSummary.overall || {};
      const avgPsychScore =
        Object.values(overallScores).reduce(
          (sum, score) => sum + (score || 0),
          0
        ) / 4;
      const psychPenalty = Math.max(0, 70 - avgPsychScore);
      strategicAlignmentScore -= psychPenalty;
    }
    strategicAlignmentScore = Math.max(0, strategicAlignmentScore); // Calculate weighted overall score
    const overallScore = Math.round(
      contentHealthScore * 0.4 +
        technicalHealthScore * 0.25 +
        performanceHealthScore * 0.2 +
        strategicAlignmentScore * 0.15
    );

    // Console logging for comparison
    console.log("=== Credit Score vs Content Quality Comparison ===");
    console.log(
      "Content Quality Distribution Score:",
      contentHealthScore,
      "→ Grade:",
      getQualityGrade(contentHealthScore)
    );
    console.log(
      "Moody Credit Score (Overall):",
      overallScore,
      "→ Grade:",
      getCreditRating(overallScore)
    );
    console.log("Component Scores:");
    console.log(
      "  - Content Health:",
      Math.round(contentHealthScore),
      "(40% weight)"
    );
    console.log(
      "  - Technical Health:",
      Math.round(technicalHealthScore),
      "(25% weight)"
    );
    console.log(
      "  - Performance Health:",
      Math.round(performanceHealthScore),
      "(20% weight)"
    );
    console.log(
      "  - Strategic Alignment:",
      Math.round(strategicAlignmentScore),
      "(15% weight)"
    );
    console.log("=== End Comparison ===");

    // Determine credit rating and risk level
    const creditRating = getCreditRating(overallScore);
    const riskLevel = getRiskLevel(overallScore); // Use total revenue loss from quality analysis
    const totalRevenueLoss = contentQualityData.summary?.totalRevenueLoss || 0;

    // Count issues for factors display
    const dilutionIssuesCount = linkDilution.filter((item) =>
      ["Severe-Dilution", "Moderate-Dilution"].includes(
        item.severity || item.dilutionLevel
      )
    ).length;
    const cannibalKeywords = cannibalization.filter(
      (item) => (item.competingUrls || []).length >= 2
    ).length;

    return {
      summary: {
        overallScore,
        creditRating,
        riskLevel,
        totalRevenueLoss: Math.round(totalRevenueLoss),
        scoreChange: "+0", // Would need historical data
        tooltip: {
          title: "SEO Credit Score Analysis",
          content: `Similar to financial credit scores, this SEO credit score (${overallScore}/100, Rating: ${creditRating}) evaluates your content's overall health across four key areas: Content Health (40%), Technical Health (25%), Performance (20%), and Strategic Alignment (15%). Your current risk level is ${riskLevel}, with $${Math.round(
            totalRevenueLoss
          ).toLocaleString()} in revenue impact from score-related issues.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          formula:
            "Score = (Content Health × 40%) + (Technical Health × 25%) + (Performance × 20%) + (Strategic Alignment × 15%)",
        },
      },
      componentScores: {
        contentHealth: {
          score: Math.round(contentHealthScore),
          weight: "40%",
          factors: [
            `Content Quality Score: ${Math.round(contentHealthScore)}/100`,
            `${poorContent + criticalContent}% problematic content`,
          ],
        },
        technicalHealth: {
          score: Math.round(technicalHealthScore),
          weight: "25%",
          factors: [
            `${dilutionIssuesCount} link dilution issues`,
            `${notFoundPages.length} 404 errors`,
          ],
        },
        performanceHealth: {
          score: Math.round(performanceHealthScore),
          weight: "20%",
          factors: [
            `${recoveryPercentage}% recovery potential`,
            `${cannibalKeywords} keyword conflicts`,
          ],
        },
        strategicAlignment: {
          score: Math.round(strategicAlignmentScore),
          weight: "15%",
          factors: [
            "Psychological framework coverage",
            "Funnel stage alignment",
          ],
        },
      },
      riskFactors: [
        ...(contentHealthScore < 70
          ? ["High content quality issues detected"]
          : []),
        ...(technicalHealthScore < 70 ? ["Technical SEO issues present"] : []),
        ...(performanceHealthScore < 70
          ? ["Performance optimization needed"]
          : []),
        ...(strategicAlignmentScore < 70
          ? ["Strategic misalignment detected"]
          : []),
      ],
      recommendations: getMoodyCreditRecommendations(overallScore, {
        contentHealthScore,
        technicalHealthScore,
        performanceHealthScore,
        strategicAlignmentScore,
      }),
    };
  };

  const getROIRecoveryPotential = () => {
    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate

    // Calculate potential recovery from each issue type
    const recoveryOpportunities = {
      "Content Decay Recovery": {
        currentLoss: 0,
        recoveryPotential: 0,
        timeToRecover: "2-4 months",
        effort: "Medium",
        priority: "High",
      },
      "Keyword Optimization": {
        currentLoss: 0,
        recoveryPotential: 0,
        timeToRecover: "1-3 months",
        effort: "Low",
        priority: "High",
      },
      "Cannibalization Resolution": {
        currentLoss: 0,
        recoveryPotential: 0,
        timeToRecover: "1-2 months",
        effort: "Medium",
        priority: "Critical",
      },
      "Link Structure Optimization": {
        currentLoss: 0,
        recoveryPotential: 0,
        timeToRecover: "3-6 months",
        effort: "High",
        priority: "Medium",
      },
      "Funnel Alignment": {
        currentLoss: 0,
        recoveryPotential: 0,
        timeToRecover: "2-5 months",
        effort: "Medium",
        priority: "Medium",
      },
    }; // Calculate Content Decay Recovery
    const decayUrls = [...decay30Days, ...decay60Days, ...decay90Days];
    const severeDecayUrls = decayUrls.filter(
      (item) => item.decayStatus === "Severe-Decay"
    );

    console.log("=== ROI Recovery Debug ===");
    console.log("Severe Decay URLs:", severeDecayUrls.length);
    console.log("Average Order Value:", averageOrderValue);
    console.log("Total Content Cost:", totalContentCost); // Calculate dynamic cost per page from total investment
    const totalUniqueUrls = contentCostWaste.length || 1;
    const costPerPage = totalContentCost / totalUniqueUrls;

    console.log("Cost per page:", costPerPage);
    console.log("Total unique URLs:", totalUniqueUrls);

    // Use much more realistic calculations - SEO issues shouldn't exceed 5% of total investment    // FIXED: Set realistic caps for recovery calculations
    const maxLossPerCategory = totalContentCost * 0.02; // Maximum 2% loss per category

    // Dynamic per-URL loss calculations using actual cost per page
    recoveryOpportunities["Content Decay Recovery"].currentLoss = Math.min(
      severeDecayUrls.length *
        Math.min(costPerPage * 0.8, averageOrderValue * 0.1), // 80% of page cost or 10% of AOV
      maxLossPerCategory
    );
    recoveryOpportunities["Content Decay Recovery"].recoveryPotential =
      recoveryOpportunities["Content Decay Recovery"].currentLoss * 0.75;

    // Calculate Keyword Optimization Recovery
    const highMismatchUrls = keywordMismatch.filter((item) =>
      ["High-Mismatch", "Medium-Mismatch"].includes(
        item.severity || item.mismatchLevel
      )
    );
    console.log("High Mismatch URLs:", highMismatchUrls.length);

    recoveryOpportunities["Keyword Optimization"].currentLoss = Math.min(
      highMismatchUrls.length *
        Math.min(costPerPage * 0.6, averageOrderValue * 0.08), // 60% of page cost or 8% of AOV
      maxLossPerCategory
    );
    recoveryOpportunities["Keyword Optimization"].recoveryPotential =
      recoveryOpportunities["Keyword Optimization"].currentLoss * 0.85;

    // Calculate Cannibalization Recovery - much more conservative
    const severeCannibal = cannibalization.filter(
      (item) => (item.competingUrls || []).length >= 3
    );
    console.log("Severe Cannibalization:", severeCannibal.length);

    recoveryOpportunities["Cannibalization Resolution"].currentLoss = Math.min(
      severeCannibal.length *
        Math.min(costPerPage * 1.2, averageOrderValue * 0.15), // 120% of page cost or 15% of AOV
      maxLossPerCategory
    );
    recoveryOpportunities["Cannibalization Resolution"].recoveryPotential =
      recoveryOpportunities["Cannibalization Resolution"].currentLoss * 0.9;

    // Calculate Link Structure Recovery
    const severeDilution = linkDilution.filter((item) =>
      ["Severe-Dilution", "Moderate-Dilution"].includes(
        item.severity || item.dilutionLevel
      )
    );
    console.log("Severe Dilution URLs:", severeDilution.length);

    recoveryOpportunities["Link Structure Optimization"].currentLoss = Math.min(
      severeDilution.length *
        Math.min(costPerPage * 0.4, averageOrderValue * 0.05), // 40% of page cost or 5% of AOV
      maxLossPerCategory
    );
    recoveryOpportunities["Link Structure Optimization"].recoveryPotential =
      recoveryOpportunities["Link Structure Optimization"].currentLoss * 0.6; // Calculate Funnel Alignment Recovery - more conservative
    if (psychMismatchData && psychMismatchData.funnelDistribution) {
      const funnelGaps = Object.values(
        psychMismatchData.funnelDistribution
      ).reduce((sum, count) => sum + count, 0);
      console.log("Funnel Gaps:", funnelGaps);

      recoveryOpportunities["Funnel Alignment"].currentLoss = Math.min(
        Math.min(Math.max(funnelGaps - 100, 0) * 5, 1000), // Only gaps above baseline, $5 per gap, max $1000
        maxLossPerCategory
      );
      recoveryOpportunities["Funnel Alignment"].recoveryPotential =
        recoveryOpportunities["Funnel Alignment"].currentLoss * 0.7;
    } // Separate recovery opportunities into timeframes
    const recoveryTimeframes = {
      "30-day": {
        opportunities: {
          "Keyword Optimization": {
            ...recoveryOpportunities["Keyword Optimization"],
            recoveryWindow: "1-30 days",
          },
          "Quick Content Fixes": {
            currentLoss:
              recoveryOpportunities["Content Decay Recovery"].currentLoss * 0.4, // 40% can be fixed quickly
            recoveryPotential:
              recoveryOpportunities["Content Decay Recovery"]
                .recoveryPotential * 0.4,
            timeToRecover: "7-30 days",
            effort: "Low",
            priority: "High",
            recoveryWindow: "1-30 days",
          },
        },
      },
      "60-day": {
        opportunities: {
          "Content Decay Recovery": {
            currentLoss:
              recoveryOpportunities["Content Decay Recovery"].currentLoss * 0.6, // Remaining 60%
            recoveryPotential:
              recoveryOpportunities["Content Decay Recovery"]
                .recoveryPotential * 0.6,
            timeToRecover: "30-60 days",
            effort: "Medium",
            priority: "High",
            recoveryWindow: "30-60 days",
          },
          "Cannibalization Resolution": {
            ...recoveryOpportunities["Cannibalization Resolution"],
            recoveryWindow: "30-60 days",
          },
        },
      },
      "90-day": {
        opportunities: {
          "Link Structure Optimization": {
            ...recoveryOpportunities["Link Structure Optimization"],
            recoveryWindow: "60-90 days",
          },
          "Funnel Alignment": {
            ...recoveryOpportunities["Funnel Alignment"],
            recoveryWindow: "60-90 days",
          },
        },
      },
    };

    // Calculate 30-day specific totals for main display
    const thirtyDayRecovery = Object.values(
      recoveryTimeframes["30-day"].opportunities
    ).reduce(
      (sum, opp) => ({
        currentLoss: sum.currentLoss + opp.currentLoss,
        recoveryPotential: sum.recoveryPotential + opp.recoveryPotential,
      }),
      { currentLoss: 0, recoveryPotential: 0 }
    );

    console.log("30-Day Recovery Summary:", thirtyDayRecovery);

    // Calculate total across all timeframes
    let totalCurrentLoss = Object.values(recoveryOpportunities).reduce(
      (sum, opp) => sum + opp.currentLoss,
      0
    );

    // Apply overall cap - total loss cannot exceed 5% of total investment
    const overallLossCap = totalContentCost * 0.05; // 5% cap
    if (totalCurrentLoss > overallLossCap) {
      const scalingFactor = overallLossCap / totalCurrentLoss;
      console.log(
        `Applying scaling factor: ${scalingFactor.toFixed(
          3
        )} to keep total loss under ${(
          (overallLossCap / totalContentCost) *
          100
        ).toFixed(1)}%`
      );

      // Scale down all loss amounts proportionally
      Object.keys(recoveryOpportunities).forEach((key) => {
        recoveryOpportunities[key].currentLoss *= scalingFactor;
        recoveryOpportunities[key].recoveryPotential *= scalingFactor;
      });

      // Also scale timeframe-specific data
      Object.keys(recoveryTimeframes).forEach((timeframe) => {
        Object.keys(recoveryTimeframes[timeframe].opportunities).forEach(
          (oppKey) => {
            recoveryTimeframes[timeframe].opportunities[oppKey].currentLoss *=
              scalingFactor;
            recoveryTimeframes[timeframe].opportunities[
              oppKey
            ].recoveryPotential *= scalingFactor;
          }
        );
      });

      // Recalculate 30-day totals after scaling
      thirtyDayRecovery.currentLoss *= scalingFactor;
      thirtyDayRecovery.recoveryPotential *= scalingFactor;

      totalCurrentLoss = overallLossCap;
    }

    const totalRecoveryPotential = Object.values(recoveryOpportunities).reduce(
      (sum, opp) => sum + opp.recoveryPotential,
      0
    );

    console.log("Recovery Opportunities Breakdown:");
    Object.entries(recoveryOpportunities).forEach(([name, data]) => {
      console.log(
        `  ${name}: Loss $${data.currentLoss}, Recovery $${data.recoveryPotential}`
      );
    });
    console.log("Total Current Loss:", totalCurrentLoss);
    console.log("Total Recovery Potential:", totalRecoveryPotential);
    console.log(
      "Investment Required (5% of content cost):",
      totalContentCost * 0.05
    );
    console.log("=== End ROI Debug ==="); // Calculate ROI scenarios with more realistic investment using 30-day recovery data
    const investmentRequired = Math.max(
      thirtyDayRecovery.currentLoss * 0.5,
      totalContentCost * 0.01 // Reduced from 2% to 1% for 30-day focus
    ); // Either 50% of 30-day loss or 1% of content cost, whichever is higher

    const roiScenarios = {
      "Conservative (40% recovery)": {
        recoveredRevenue: thirtyDayRecovery.recoveryPotential * 0.4,
        roi:
          ((thirtyDayRecovery.recoveryPotential * 0.4 - investmentRequired) /
            investmentRequired) *
          100,
        timeframe: "30 days",
      },
      "Realistic (65% recovery)": {
        recoveredRevenue: thirtyDayRecovery.recoveryPotential * 0.65,
        roi:
          ((thirtyDayRecovery.recoveryPotential * 0.65 - investmentRequired) /
            investmentRequired) *
          100,
        timeframe: "30 days",
      },
      "Optimistic (85% recovery)": {
        recoveredRevenue: thirtyDayRecovery.recoveryPotential * 0.85,
        roi:
          ((thirtyDayRecovery.recoveryPotential * 0.85 - investmentRequired) /
            investmentRequired) *
          100,
        timeframe: "30 days",
      },
    };

    // Priority matrix for 30-day opportunities only
    const priorityMatrix = Object.entries(
      recoveryTimeframes["30-day"].opportunities
    )
      .map(([name, data]) => ({
        name,
        recoveryPotential: data.recoveryPotential,
        effort: data.effort,
        priority: data.priority,
        impactScore: getImpactScore(
          data.recoveryPotential,
          data.effort,
          data.priority
        ),
      }))
      .sort((a, b) => b.impactScore - a.impactScore);

    return {
      summary: {
        totalCurrentLoss: Math.round(thirtyDayRecovery.currentLoss), // 30-day only
        totalRecoveryPotential: Math.round(thirtyDayRecovery.recoveryPotential), // 30-day only
        recoveryPercentage:
          thirtyDayRecovery.currentLoss > 0
            ? Math.round(
                (thirtyDayRecovery.recoveryPotential /
                  thirtyDayRecovery.currentLoss) *
                  100
              )
            : 0,
        investmentRequired: Math.round(investmentRequired),
        bestCaseROI: Math.round(roiScenarios["Optimistic (85% recovery)"].roi),
        timeframe: "30 days", // Make it clear this is 30-day focused
        tooltip: {
          title: "30-Day Revenue Recovery Action Plan",
          content: `🎯 **IMMEDIATE 30-DAY RECOVERY PLAN** 

📊 **Current Situation:**
• 30-Day Revenue Loss: $${Math.round(
            thirtyDayRecovery.currentLoss
          ).toLocaleString()}
• 30-Day Recovery Potential: $${Math.round(
            thirtyDayRecovery.recoveryPotential
          ).toLocaleString()} (${Math.round(
            (thirtyDayRecovery.recoveryPotential /
              thirtyDayRecovery.currentLoss) *
              100
          )}%)
• Investment Required: $${Math.round(investmentRequired).toLocaleString()}
• Cost Per Page: $${Math.round(costPerPage).toLocaleString()}

📅 **30-DAY QUICK WINS ROADMAP:**

**Week 1-2 (Days 1-14): Keyword Optimization - Target $${Math.round(
            recoveryTimeframes["30-day"].opportunities["Keyword Optimization"]
              .recoveryPotential
          ).toLocaleString()}**
• Fix ${highMismatchUrls.length} high-mismatch keyword issues
• Optimize meta titles and descriptions for underperforming pages
• Implement schema markup on top-performing content
• Expected ROI: 85% (${
            recoveryTimeframes["30-day"].opportunities["Keyword Optimization"]
              .effort
          } effort)

**Week 2-4 (Days 8-30): Quick Content Fixes - Target $${Math.round(
            recoveryTimeframes["30-day"].opportunities["Quick Content Fixes"]
              .recoveryPotential
          ).toLocaleString()}**
• Refresh ${Math.round(
            severeDecayUrls.length * 0.4
          )} highest-priority decaying pages
• Update outdated statistics and information
• Add new internal links to boost authority
• Expected ROI: 75% (${
            recoveryTimeframes["30-day"].opportunities["Quick Content Fixes"]
              .effort
          } effort)

**📈 PROJECTED 30-DAY RESULTS:**
• Conservative Recovery: $${Math.round(
            thirtyDayRecovery.recoveryPotential * 0.4
          ).toLocaleString()} (${Math.round(
            ((thirtyDayRecovery.recoveryPotential * 0.4 - investmentRequired) /
              investmentRequired) *
              100
          )}% ROI)
• Realistic Recovery: $${Math.round(
            thirtyDayRecovery.recoveryPotential * 0.65
          ).toLocaleString()} (${Math.round(
            ((thirtyDayRecovery.recoveryPotential * 0.65 - investmentRequired) /
              investmentRequired) *
              100
          )}% ROI)

**🎯 SUCCESS METRICS TO TRACK:**
• Organic traffic increase: 8-15%
• Keyword ranking improvements: 2-4 positions
• Page 1 rankings: +${Math.round(
            thirtyDayRecovery.recoveryPotential / 1000
          )} keywords
• Revenue per visitor: +6-12%

**💡 Daily Actions Required:**
• Monitor ranking changes (10 min/day)
• Update 1-2 pieces of content (30 min/day)
• Check technical issues (15 min/day)
• Review competitor movements (10 min/day)

Focus on 30-day quick wins first - these typically show results within 7-14 days!`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          costPerPage: Math.round(costPerPage),
          conversionRate,
          formula:
            "ROI = ((30-Day Recovered Revenue - Investment Required) / Investment Required) × 100",
        },
      },
      recoveryOpportunities, // All opportunities for reference
      recoveryTimeframes, // Separated by 30/60/90 days
      roiScenarios,
      priorityMatrix,
      quickWins: priorityMatrix
        .filter((item) => item.effort === "Low")
        .slice(0, 3),
      highImpactProjects: priorityMatrix
        .filter(
          (item) =>
            item.recoveryPotential > thirtyDayRecovery.recoveryPotential * 0.3
        )
        .slice(0, 3),
    };
  };

  const getKeywordConflicts = () => {
    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not available. Please ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error(
        "Total Content Cost is required but not available. Please ensure onboardingData.domainCostDetails.totalInvested is set."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate
    const totalUniqueUrls = contentCostWaste.length || 1;
    const costPerUrl = totalContentCost / totalUniqueUrls;

    // Detect conflicts from cannibalization and keyword mismatch data
    const conflicts = [];
    let totalConflicts = 0;
    let totalRevenueLoss = 0;

    // Process cannibalization data for conflicts
    cannibalization.forEach((item, index) => {
      if ((item.competingUrls || []).length >= 1) {
        const competingCount = item.competingUrls.length;
        const conflictSeverity = getConflictSeverity(competingCount);

        // Calculate revenue loss from conflict
        const primaryClicks = item.primaryUrl?.clicks || 0;
        const totalCompetingClicks = (item.competingUrls || []).reduce(
          (sum, url) => sum + (url.clicks || 0),
          0
        );
        const totalClicks = primaryClicks + totalCompetingClicks;

        // Estimate potential performance without conflict
        const conflictImpact = getConflictImpactFactor(conflictSeverity);
        const potentialClicks = totalClicks * (1 + conflictImpact);
        const clicksLost = potentialClicks - totalClicks;
        const revenueLoss = clicksLost * conversionRate * averageOrderValue;

        conflicts.push({
          id: `conflict-${index + 1}`,
          type: "Keyword Cannibalization",
          keyword: item.keyword,
          severity: conflictSeverity,
          conflictingUrls: [
            item.primaryUrl?.url || "N/A",
            ...(item.competingUrls || []).map((url) => url.url),
          ],
          affectedUrls: competingCount + 1,
          currentPerformance: {
            totalClicks,
            totalImpressions:
              (item.primaryUrl?.impressions || 0) +
              (item.competingUrls || []).reduce(
                (sum, url) => sum + (url.impressions || 0),
                0
              ),
            averagePosition: calculateAveragePosition(
              item.primaryUrl,
              item.competingUrls
            ),
          },
          potentialImprovement: {
            clicksGain: Math.round(clicksLost),
            revenueGain: Math.round(revenueLoss),
            positionImprovement: Math.round(conflictImpact * 10), // Estimate position improvement
          },
          recommendedAction: getConflictRecommendation(
            conflictSeverity,
            competingCount
          ),
          priority: getConflictPriority(conflictSeverity, revenueLoss),
        });

        totalRevenueLoss += revenueLoss;
        totalConflicts++;
      }
    });

    // Process keyword mismatch data for additional conflicts
    const mismatchConflicts = keywordMismatch
      .filter(
        (item) => (item.severity || item.mismatchLevel) === "High-Mismatch"
      )
      .slice(0, 5 - conflicts.length); // Limit to total of 5 conflicts

    mismatchConflicts.forEach((item, index) => {
      const revenueLoss = costPerUrl * 0.4; // Estimate revenue loss from mismatch

      conflicts.push({
        id: `mismatch-${index + 1}`,
        type: "Keyword Mismatch",
        keyword: (item.targetKeywords || [])[0] || "Unknown",
        severity: "High",
        conflictingUrls: [item.url],
        affectedUrls: 1,
        currentPerformance: {
          totalClicks: item.clicks || 0,
          totalImpressions: item.impressions || 0,
          mismatchScore: item.mismatchScore || 0,
        },
        potentialImprovement: {
          clicksGain: Math.round((item.clicks || 0) * 0.3), // 30% improvement potential
          revenueGain: Math.round(revenueLoss),
          mismatchReduction: "75%", // Expected mismatch reduction
        },
        recommendedAction: "Optimize content for target keywords",
        priority: "Medium",
      });

      totalRevenueLoss += revenueLoss;
      totalConflicts++;
    });

    // Sort conflicts by revenue impact
    conflicts.sort(
      (a, b) =>
        (b.potentialImprovement.revenueGain || 0) -
        (a.potentialImprovement.revenueGain || 0)
    );

    // Calculate conflict distribution
    const conflictDistribution = {
      Critical: conflicts.filter((c) => c.severity === "Critical").length,
      High: conflicts.filter((c) => c.severity === "High").length,
      Medium: conflicts.filter((c) => c.severity === "Medium").length,
      Low: conflicts.filter((c) => c.severity === "Low").length,
    };

    // Top opportunities for quick resolution
    const quickResolutions = conflicts
      .filter((c) => ["Low", "Medium"].includes(c.severity))
      .slice(0, 3);
    return {
      summary: {
        totalConflicts,
        conflictsDetected: Math.min(totalConflicts, 5), // Display up to 5
        totalRevenueLoss: Math.round(totalRevenueLoss),
        averageRevenuePerConflict:
          totalConflicts > 0
            ? Math.round(totalRevenueLoss / totalConflicts)
            : 0,
        resolutionPotential: Math.round(totalRevenueLoss * 0.8), // 80% of loss is recoverable
        tooltip: {
          title: "Keyword Conflicts Analysis",
          content: `Keyword conflicts occur when multiple pages compete for the same search terms or when content doesn't align with target keywords. We identified ${totalConflicts} conflicts across your content, resulting in $${Math.round(
            totalRevenueLoss
          ).toLocaleString()} in revenue loss. With targeted optimization, up to $${Math.round(
            totalRevenueLoss * 0.8
          ).toLocaleString()} (80%) of this loss is recoverable through conflict resolution strategies.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          formula:
            "Revenue Loss = (Clicks Lost from Conflicts × Conversion Rate × AOV) + Content Waste",
        },
      },
      conflicts: conflicts.slice(0, 5), // Return top 5 conflicts
      conflictDistribution,
      quickResolutions,
      resolutionRoadmap: {
        "Phase 1 (0-30 days)": quickResolutions.map((c) => c.keyword),
        "Phase 2 (30-60 days)": conflicts
          .filter((c) => c.severity === "High")
          .slice(0, 2)
          .map((c) => c.keyword),
        "Phase 3 (60-90 days)": conflicts
          .filter((c) => c.severity === "Critical")
          .slice(0, 1)
          .map((c) => c.keyword),
      },
    };
  };
  // Helper functions for the new analysis functions - Using unified A-D grading system
  const getQualityGrade = (score) => {
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 60) return "C";
    if (score >= 40) return "D";
    return "F";
  };
  const getCreditRating = (score) => {
    // Traditional bond-style credit rating system
    if (score >= 95) return "AAA";
    if (score >= 90) return "AA+";
    if (score >= 85) return "AA";
    if (score >= 80) return "AA-";
    if (score >= 75) return "A+";
    if (score >= 70) return "A";
    if (score >= 65) return "A-";
    if (score >= 60) return "BBB+";
    if (score >= 55) return "BBB";
    if (score >= 50) return "BBB-";
    if (score >= 45) return "BB+";
    if (score >= 40) return "BB";
    if (score >= 35) return "BB-";
    if (score >= 30) return "B+";
    if (score >= 25) return "B";
    if (score >= 20) return "B-";
    if (score >= 15) return "CCC+";
    if (score >= 10) return "CCC";
    if (score >= 5) return "CCC-";
    return "D";
  };
  const getRiskLevel = (score) => {
    if (score >= 90) return "⚡ Excellent"; // AAA/AA+ ratings
    if (score >= 80) return "🟢 Very Strong"; // AA/AA- ratings
    if (score >= 70) return "🟢 Strong"; // A+/A/A- ratings
    if (score >= 60) return "🟡 Stable"; // BBB+/BBB/BBB- ratings
    if (score >= 40) return "⚠️ At Risk"; // BB/B ratings
    return "🔴 High Risk"; // CCC and below
  };

  const getMoodyCreditRecommendations = (overallScore, componentScores) => {
    const recommendations = [];

    if (componentScores.contentHealthScore < 70) {
      recommendations.push("Address content decay issues immediately");
      recommendations.push("Implement content refresh strategy");
    }

    if (componentScores.technicalHealthScore < 70) {
      recommendations.push("Fix technical SEO issues");
      recommendations.push("Optimize link structure");
    }

    if (componentScores.performanceHealthScore < 70) {
      recommendations.push("Resolve keyword cannibalization");
      recommendations.push("Improve page performance metrics");
    }

    if (componentScores.strategicAlignmentScore < 70) {
      recommendations.push("Align content with funnel strategy");
      recommendations.push("Implement psychological frameworks");
    }

    if (overallScore < 60) {
      recommendations.push("URGENT: Comprehensive SEO audit required");
    }

    return recommendations;
  };

  const getImpactScore = (recoveryPotential, effort, priority) => {
    const effortScore = { Low: 3, Medium: 2, High: 1 }[effort] || 1;
    const priorityScore =
      { Critical: 4, High: 3, Medium: 2, Low: 1 }[priority] || 1;
    const revenueScore = Math.min(recoveryPotential / 1000, 10); // Normalize revenue to 0-10 scale

    return revenueScore * 0.5 + effortScore * 0.3 + priorityScore * 0.2;
  };

  const getConflictSeverity = (competingCount) => {
    if (competingCount >= 4) return "Critical";
    if (competingCount >= 3) return "High";
    if (competingCount >= 2) return "Medium";
    return "Low";
  };

  const getConflictImpactFactor = (severity) => {
    const impactMap = {
      Critical: 0.6,
      High: 0.4,
      Medium: 0.25,
      Low: 0.15,
    };
    return impactMap[severity] || 0.15;
  };

  const calculateAveragePosition = (primaryUrl, competingUrls) => {
    const positions = [primaryUrl?.position || 0];
    (competingUrls || []).forEach((url) => positions.push(url.position || 0));
    const validPositions = positions.filter((pos) => pos > 0);
    return validPositions.length > 0
      ? Math.round(
          validPositions.reduce((sum, pos) => sum + pos, 0) /
            validPositions.length
        )
      : 0;
  };

  const getConflictRecommendation = (severity, competingCount) => {
    if (severity === "Critical")
      return "Immediate consolidation required - merge competing pages";
    if (severity === "High")
      return "Consolidate or differentiate competing content";
    if (severity === "Medium") return "Review and optimize keyword targeting";
    return "Monitor and optimize content alignment";
  };

  const getConflictPriority = (severity, revenueLoss) => {
    if (severity === "Critical" || revenueLoss > 1000) return "Critical";
    if (severity === "High" || revenueLoss > 500) return "High";
    if (revenueLoss > 200) return "Medium";
    return "Low";
  };
  return (
    <FinancialCalculationsContext.Provider
      value={{
        gscAnalysisData,
        calculations,
        loading,
        decay30Days,
        decay60Days,
        decay90Days,
        riskMetrics,
        decaySummary,
        keywordMismatch,
        cannibalization,
        contentCostWaste,
        linkDilution,
        notFoundPages,
        psychMismatchData,
        gaDataInsightsSummary,
        gaDataTopPerformers,
        gaDataProblemAreas,
        getRevenueLeak,
        getContentDecay,
        getKeywordMismatch,
        getLinkDilution,
        getPsychMismatch,
        getCannibalizationLoss,
        funnelGapIdentifier,
        getContentQualityDistribution,
        getMoodyCreditScore,
        getROIRecoveryPotential,
        getKeywordConflicts,
      }}
    >
      {children}
    </FinancialCalculationsContext.Provider>
  );
};

export const useFinancialCalculations = () => {
  const context = useContext(FinancialCalculationsContext);
  if (!context) {
    throw new Error(
      "useFinancialCalculations must be used within a FinancialCalculationsProvider"
    );
  }
  return context;
};
