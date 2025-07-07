import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  use,
} from "react";
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
  const [allSitemapUrls, setAllSitemapUrls] = useState([]);
  const [allGSCUrls, setAllGSCUrls] = useState([]);
  const [allGAUrls, setAllGAUrls] = useState([]);
  const [urlAnalysis, setUrlAnalysis] = useState([]);

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

        setAllSitemapUrls(onboardingData.allSitemapUrls || []);

        setAllGSCUrls(
          onboardingData.gscAnalysisData?.contentCostWaste.map(
            (item) => item.url
          ) || []
        );

        setAllGAUrls(
          onboardingData.gscAnalysisData?.gaData?.insights?.urlAnalysis?.map(
            (item) => item.url
          ) || []
        );

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
    onboardingData?.allSitemapUrls,
  ]);

  const processGSCDataForCalculations = (
    gscData = onboardingData?.GSCAnalysisData || {},
    useSitemapOnlyUrls = false,
    useOnlyGoogleAnalyticsUrls = false
  ) => {
    // This function will process the GSC data for financial calculations

    // Segregate Content Decay Data

    const base_url =
      gscData?.contentCostWaste?.[0]?.url?.replace(
        /^(https?:\/\/[^/]+).*$/,
        "$1"
      ) || "";

    console.log("bu", base_url);

    setUrlAnalysis(gscData?.gaData?.insights?.urlAnalysis || []);
    setAllGAUrls(
      gscData?.gaData?.insights?.urlAnalysis?.map(
        (item) => base_url + item.url
      ) || []
    );
    setAllGSCUrls(gscData.contentCostWaste.map((item) => item.url) || []);

    console.log(
      "Processing GSC Data for Financial Calculations...",
      allGAUrls.length,
      allSitemapUrls.length
    );

    if (useSitemapOnlyUrls && allSitemapUrls.length > 0) {
      const sitemapUrlsSet = new Set(allSitemapUrls.map((url) => url));

      console.log(
        "Filtering GSC data by sitemap URLs...",
        sitemapUrlsSet.length
      );
      const filterBySitemapUrls = (data) =>
        data.filter((item) => sitemapUrlsSet.has(item.url));

      const filterForCannibalisation = (data) => {
        return data.filter((item) => {
          // Check if primary URL is in the sitemapUrlsSet
          if (
            item?.primaryUrl?.url &&
            sitemapUrlsSet.has(item.primaryUrl.url)
          ) {
            return true;
          }

          // Check if any competing URL is in the sitemapUrlsSet
          if (item?.competingUrls && Array.isArray(item.competingUrls)) {
            for (const competingUrl of item.competingUrls) {
              if (competingUrl?.url && sitemapUrlsSet.has(competingUrl.url)) {
                return true;
              }
            }
          }

          return false;
        });
      };

      setDecay30Days(
        filterBySitemapUrls(gscData?.contentDecay?.decay30Days || [])
      );
      setDecay60Days(
        filterBySitemapUrls(gscData?.contentDecay?.decay60Days || [])
      );
      setDecay90Days(
        filterBySitemapUrls(gscData?.contentDecay?.decay90Days || [])
      );
      setKeywordMismatch(filterBySitemapUrls(gscData?.keywordMismatch || []));
      setContentCostWaste(filterBySitemapUrls(gscData?.contentCostWaste || []));
      setLinkDilution(filterBySitemapUrls(gscData?.linkDilution || []));
      setCannibalization(
        filterForCannibalisation(gscData?.cannibalization) || []
      );

      console.log("Old length v/s New length");
      console.log(
        "Decay30Days:",
        gscData?.contentDecay?.decay30Days?.length,
        "->",
        decay30Days.length
      );
      console.log(
        "Decay60Days:",
        gscData?.contentDecay?.decay60Days?.length,
        "->",
        decay60Days.length
      );
      console.log(
        "Decay90Days:",
        gscData?.contentDecay?.decay90Days?.length,
        "->",
        decay90Days.length
      );
      console.log(
        "Keyword Mismatch:",
        gscData?.keywordMismatch?.length,
        "->",
        keywordMismatch.length
      );
      console.log(
        "Content Cost Waste:",
        gscData?.contentCostWaste?.length,
        "->",
        contentCostWaste.length
      );
      console.log(
        "Link Dilution:",
        gscData?.linkDilution?.length,
        "->",
        linkDilution.length
      );
      console.log(
        "Not Found Pages:",
        gscData?.notFoundPages?.length,
        "->",
        notFoundPages.length
      );

      console.log(
        "Cannibalization:",
        gscData?.cannibalization?.length,
        "->",
        cannibalization.length
      );
    } else if (useOnlyGoogleAnalyticsUrls) {
      console.log(
        "Filtering GSC data by Google Analytics URLs...",
        allGAUrls.length
      );
      const gaUrlsSet = new Set(allGAUrls.map((url) => url));

      console.log(
        "Filtering GSC data by Google Analytics URLs...",
        gaUrlsSet.size
      );
      const filterByGAUrls = (data) =>
        data.filter((item) => gaUrlsSet.has(item.url));

      const filterForCannibalisation = (data) => {
        return data.filter((item) => {
          // Check if primary URL is in the gaUrlsSet
          if (item?.primaryUrl?.url && gaUrlsSet.has(item.primaryUrl.url)) {
            return true;
          }

          // Check if any competing URL is in the gaUrlsSet
          if (item?.competingUrls && Array.isArray(item.competingUrls)) {
            for (const competingUrl of item.competingUrls) {
              if (competingUrl?.url && gaUrlsSet.has(competingUrl.url)) {
                return true;
              }
            }
          }

          return false;
        });
      };

      setDecay30Days(filterByGAUrls(gscData?.contentDecay?.decay30Days || []));
      setDecay60Days(filterByGAUrls(gscData?.contentDecay?.decay60Days || []));
      setDecay90Days(filterByGAUrls(gscData?.contentDecay?.decay90Days || []));
      setKeywordMismatch(filterByGAUrls(gscData?.keywordMismatch || []));
      setContentCostWaste(filterByGAUrls(gscData?.contentCostWaste || []));
      setLinkDilution(filterByGAUrls(gscData?.linkDilution || []));
      setCannibalization(
        filterForCannibalisation(gscData?.cannibalization) || []
      );

      console.log("Old length v/s New length");
      console.log(
        "Decay30Days:",
        gscData?.contentDecay?.decay30Days?.length,
        "->",
        decay30Days.length
      );
      console.log(
        "Decay60Days:",
        gscData?.contentDecay?.decay60Days?.length,
        "->",
        decay60Days.length
      );
      console.log(
        "Decay90Days:",
        gscData?.contentDecay?.decay90Days?.length,
        "->",
        decay90Days.length
      );
      console.log(
        "Keyword Mismatch:",
        gscData?.keywordMismatch?.length,
        "->",
        keywordMismatch.length
      );
      console.log(
        "Content Cost Waste:",
        gscData?.contentCostWaste?.length,
        "->",
        contentCostWaste.length
      );
      console.log(
        "Link Dilution:",
        gscData?.linkDilution?.length,
        "->",
        linkDilution.length
      );
      console.log(
        "Not Found Pages:",
        gscData?.notFoundPages?.length,
        "->",
        notFoundPages.length
      );
      console.log(
        "Cannibalization:",
        gscData?.cannibalization?.length,
        "->",
        cannibalization.length
      );
    } else {
      setDecay30Days(gscData?.contentDecay?.decay30Days || []);
      setDecay60Days(gscData?.contentDecay?.decay60Days || []);
      setDecay90Days(gscData?.contentDecay?.decay90Days || []);
      setKeywordMismatch(gscData?.keywordMismatch || []);
      setContentCostWaste(gscData?.contentCostWaste || []);
      setLinkDilution(gscData?.linkDilution || []);
      setCannibalization(gscData?.cannibalization || []);
    }

    setDecaySummary(gscData?.contentDecay?.summary || {});

    // Segregate Analysis Data
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

    const uniqueGAUrls = new Set(allGAUrls);
    const uniqueGSCUrls = new Set(allGSCUrls);
    const uniqueSitemapUrls = new Set(allSitemapUrls);

    console.log(
      "Unique GA, GSC, SM",
      uniqueGAUrls.size,
      uniqueGSCUrls.size,
      uniqueSitemapUrls.size
    );
  };

  const getRevenueLeak = ({
    aov = null,
    conversionRate = 0.02,
    recoveryRate = 0.8, // Recovery rate (previously RR_RECOVERY)
    discountRate = 0.1, // Discount rate for financial calculations
    horizonDays = 700, // Time horizon in days
  } = {}) => {
    const averageOrderValue =
      aov ||
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error(
        "Average Order Value (AOV) is required but not provided."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error("Total Content Cost is required but missing.");
    }

    const allUrls = [...(contentCostWaste || [])];
    const uniqueUrls = allUrls.filter(
      (url, idx, self) => idx === self.findIndex((u) => u.url === url.url)
    );

    const totalUrls = uniqueUrls.length || 1;

    // Constants
    const CVR = conversionRate;
    const AOV = averageOrderValue;
    const RR_RECOVERY = recoveryRate;
    const DISCOUNT_RATE = discountRate;
    const HORIZON_YEARS = horizonDays / 365;
    const PV_FACTOR =
      (1 - Math.exp(-DISCOUNT_RATE * HORIZON_YEARS)) / DISCOUNT_RATE;

    const CPU_BASE = totalContentCost / totalUrls;
    const threshold = CPU_BASE / (CVR * AOV); // clicks needed to break even

    let zeroClicksCount = 0;
    let urlsBelowThreshold = 0;
    let totalRecoverableRevenue = 0;

    uniqueUrls.forEach((urlData) => {
      const clicks = urlData.clicks || 0;

      if (clicks === 0) zeroClicksCount++;

      if (clicks < threshold) {
        urlsBelowThreshold++;

        // 🔧 KEY LINE ADDED TO LIMIT OPPORTUNITY INFLATION
        const opportunityGap = Math.min(
          Math.max(0, (threshold - clicks) / threshold),
          0.14
        );

        const recovery = opportunityGap * CPU_BASE * RR_RECOVERY * PV_FACTOR;
        totalRecoverableRevenue += recovery;
      }
    });

    return {
      totalUrls,
      zeroClicksCount,
      threshold: Math.round(threshold),
      urlsBelowThreshold,
      estimatedRevenueLoss: Math.round(totalRecoverableRevenue),
      averageOrderValue,
      contentCost: totalContentCost,
      conversionRate,
      tooltip: {
        title: "Recoverable Revenue Opportunity",
        content: `We calculate how much value can be reclaimed from underperforming pages. Based on a break-even threshold of ~${Math.round(
          threshold
        )} clicks per URL, ${urlsBelowThreshold} out of ${totalUrls} URLs are currently underperforming — representing ~$${Math.round(
          totalRecoverableRevenue
        ).toLocaleString()} in recoverable value.`,
      },
      details: {
        costPerUrl: Math.round(CPU_BASE),
        thresholdFormula: `${Math.round(
          CPU_BASE
        )} / (${CVR} × ${AOV}) = ${Math.round(threshold)} clicks`,
        roiCalculation:
          "ROI Gap = (threshold_clicks – actual_clicks) / threshold_clicks",
        recoveryFormula:
          "Recovery = ROI Gap × Cost per URL × Recovery Rate × Present Value Factor",
        discountRate: DISCOUNT_RATE,
        recoveryRate: RR_RECOVERY,
        presentValueFactor: PV_FACTOR,
        horizonDays: horizonDays,
        horizonYears: HORIZON_YEARS,
        capApplied: "ROI Gap capped at 14% for high-fugazi pages",
      },
    };
  };

  const getContentDecay = ({
    conversionRate = 0.02, // 2% conversion rate
    recoveryRate = 0.7, // 70% recovery rate for decay
    discountRate = 0.1, // 10% discount rate
    horizonDays = 700, // Time horizon in days
    defaultAvgContentCost = 400, // Default content cost per URL
  } = {}) => {
    const totalUniqueUrls = contentCostWaste.length || 1;

    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      throw new Error("Missing Average Order Value (AOV).");
    }

    if (!totalContentCost || totalContentCost === 0) {
      throw new Error("Missing Total Content Cost.");
    }

    // Constants
    const CVR = conversionRate;
    const AOV = averageOrderValue;
    const RR_RECOVERY = recoveryRate;
    const DISCOUNT_RATE = discountRate;
    const HORIZON_DAYS = horizonDays;
    const HORIZON_YEARS = HORIZON_DAYS / 365;
    const PV_FACTOR =
      (1 - Math.exp(-DISCOUNT_RATE * HORIZON_YEARS)) / DISCOUNT_RATE;

    // Combine decay layers
    const allDecayData = [
      ...decay30Days.map((d) => ({ ...d, timeframe: "30Days" })),
      ...decay60Days.map((d) => ({ ...d, timeframe: "60Days" })),
      ...decay90Days.map((d) => ({ ...d, timeframe: "90Days" })),
    ];

    // Deduplicate by URL with highest severity
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

    const cpuBase = totalContentCost / totalUniqueUrls;

    uniqueDecayData.forEach((item) => {
      totalUrlsAnalyzed++;
      const category = item.decayStatus || "Stable";
      if (!decayCategories[category]) decayCategories[category] = [];

      let urlRevenueLoss = 0;
      if (item.hasDecay) {
        const peak = item.metrics?.peakClicks || 1;
        const current = item.metrics?.currentClicks || 0.5;
        const safeCurrent = current > 0 ? current : 0.5;
        const decayRate = Math.log(peak / safeCurrent) / HORIZON_DAYS;
        const baselineCashflow = peak * CVR * AOV;

        urlRevenueLoss =
          baselineCashflow *
          (1 - Math.exp(-decayRate * HORIZON_DAYS)) *
          RR_RECOVERY *
          PV_FACTOR;
      }

      decayCategories[category].push({
        url: item.url,
        decayStatus: item.decayStatus,
        hasDecay: item.hasDecay,
        timeframe: item.timeframe,
        metrics: {
          ...item.metrics,
          decay_rate: item.hasDecay
            ? Math.log(
                (item.metrics?.peakClicks || 1) /
                  (item.metrics?.currentClicks || 1)
              ) / HORIZON_DAYS
            : 0,
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
        totalRevenueLoss: Math.round(calculatedRevenueLoss),
        totalUniqueUrls,
        costPerUrl: Math.round(cpuBase),
        tooltip: {
          title: "Content Decay Analysis",
          content: `We analyzed ${totalUrlsAnalyzed} URLs. ${urlsWithDecay} (${Math.round(
            (urlsWithDecay / totalUrlsAnalyzed) * 100
          )}%) show signs of decay, resulting in ${totalClicksLost} total clicks lost and $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} in recoverable revenue.`,
        },
        calculationDetails: {
          averageOrderValue: AOV,
          totalContentCost,
          conversionRate: CVR,
          recoveryRate: RR_RECOVERY,
          discountRate: DISCOUNT_RATE,
          presentValueFactor: PV_FACTOR,
          formula:
            "Recoverable Value = Baseline × (1 - exp(-decay_rate × 700)) × Recovery Rate × PV Factor",
          decayRateFormula: "decay_rate = ln(peak / current) / 700",
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

  const getKeywordMismatch = ({
    conversionRate = 0.02, // 2% conversion rate
    discountRate = 0.1, // 10% discount rate
    recoveryRate = 0.8, // 80% recovery rate
    horizonDays = 700, // Time horizon in days
    defaultAvgContentCost = 400, // Default content cost per URL
    impressionsClickRate = 0.003, // 0.3% of impressions to estimate lost clicks
    clicksMultiplier = 0.1, // 10% of clicks to estimate lost clicks
    maxLostClicksCap = 15, // Cap on lost clicks per URL
    minLostClicks = 2, // Minimum lost clicks per URL with mismatch
    strandedCapexPercentage = 0.05, // 5% of cost per URL as stranded capex
    maxRevenueLossCap = 0.6, // Cap at 60% of total investment
  } = {}) => {
    const uniqueUrlsSet = new Set(
      contentCostWaste?.map((item) => item.url).filter(Boolean)
    );
    const totalUniqueUrls = uniqueUrlsSet.size || 1;

    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost =
      calculations.contentCost ||
      calculations.totalRevenue ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0)
      throw new Error("Missing Average Order Value (AOV)");
    if (!totalContentCost || totalContentCost === 0)
      throw new Error("Missing Total Content Cost");

    const timeHorizon = horizonDays / 365.0;
    const pvFactor = (1 - Math.exp(-discountRate * timeHorizon)) / discountRate;
    const costPerUrl =
      totalContentCost / totalUniqueUrls || defaultAvgContentCost;

    let totalUrlsAnalyzed = 0;
    let urlsWithMismatch = 0;
    let totalClicksLost = 0;
    let calculatedRevenueLoss = 0;

    const mismatchCategories = {
      "High-Mismatch": [],
      "Medium-Mismatch": [],
      "Low-Mismatch": [],
      "No-Mismatch": [],
    };

    keywordMismatch.forEach((item) => {
      totalUrlsAnalyzed++;
      const severity = item.severity || item.mismatchLevel || "Medium-Mismatch";
      const hasMismatch = severity !== "No-Mismatch";

      let urlRevenueLoss = 0;

      if (hasMismatch) {
        urlsWithMismatch++;
        const clicks = item.clicks || 0;
        const impressions = item.impressions || 0;

        const estimatedClicksLost =
          Math.min(
            impressions * impressionsClickRate,
            clicks * clicksMultiplier,
            maxLostClicksCap
          ) || minLostClicks;
        const grossPotentialRevenue =
          estimatedClicksLost * conversionRate * averageOrderValue;
        const severityMultiplier =
          getMismatchSeverityMultiplier(severity) * 0.3;

        const intentGapLoss =
          grossPotentialRevenue *
          (1 - recoveryRate) *
          pvFactor *
          severityMultiplier;
        const strandedCapexLoss = costPerUrl * strandedCapexPercentage;

        urlRevenueLoss = intentGapLoss + strandedCapexLoss;
        totalClicksLost += estimatedClicksLost;
        calculatedRevenueLoss += urlRevenueLoss;
      }

      mismatchCategories[severity].push({
        ...item,
        mismatchSeverity: severity,
        hasMismatch,
        calculatedRevenueLoss: Math.round(urlRevenueLoss),
      });
    });

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

    calculatedRevenueLoss =
      calculatedRevenueLoss * (totalUniqueUrls / totalUrlsAnalyzed);

    return {
      summary: {
        totalUrlsAnalyzed,
        urlsWithMismatch,
        mismatchPercentage:
          totalUrlsAnalyzed > 0
            ? Math.round((urlsWithMismatch / totalUrlsAnalyzed) * 100)
            : 0,
        totalClicksLost,
        totalRevenueLoss: Math.round(
          Math.min(calculatedRevenueLoss, totalContentCost * 0.6)
        ),
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Intent Gap (Keyword Mismatch) Loss",
          content: `Analyzed ${totalUrlsAnalyzed} URLs, ${urlsWithMismatch} showed significant keyword misalignment, leading to an estimated ${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()} in unrealized revenue.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          discountRate,
          recoveryRate,
          formula:
            "Loss = (Clicks Lost × CVR × AOV × Severity Multiplier × (1 - Recovery Rate) × PV Factor) + 5% CapEx",
        },
      },
      mismatchCategories,
      mismatchDistribution,
    };
  };

  const getLinkDilution = ({
    conversionRate = 0.02, // 2% conversion rate
    discountRate = 0.1, // 10% discount rate
    recoveryRate = 0.8, // 80% recovery rate
    horizonDays = 700, // Time horizon in days
    capexLossRate = 0.05, // 5% of cost per URL for stranded capex loss
    clickLossMultiplier = 0.3, // Multiplier for estimated clicks lost
    maxDilutionFactor = 0.4, // Maximum dilution factor cap
    maxClicksLost = 8, // Maximum clicks lost cap
  } = {}) => {
    const uniqueUrlsSet = new Set(
      contentCostWaste?.map((item) => item.url).filter(Boolean)
    );
    const totalUniqueUrls = uniqueUrlsSet.size || 1;

    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;
    const totalContentCost =
      calculations.contentCost ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0)
      throw new Error("Missing AOV");
    if (!totalContentCost || totalContentCost === 0)
      throw new Error("Missing Total Content Cost");

    const timeHorizon = horizonDays / 365.0;
    const pvFactor = (1 - Math.exp(-discountRate * timeHorizon)) / discountRate;
    const costPerUrl = totalContentCost / totalUniqueUrls;

    let totalUrlsAnalyzed = 0;
    let urlsWithDilution = 0;
    let calculatedRevenueLoss = 0;

    const dilutionCategories = {
      "Severe-Dilution": [],
      "Moderate-Dilution": [],
      "Light-Dilution": [],
      "No-Dilution": [],
    };

    linkDilution.forEach((item) => {
      totalUrlsAnalyzed++;
      const severity =
        item.severity || item.dilutionLevel || "Moderate-Dilution";
      const hasDilution = severity !== "No-Dilution";

      let urlRevenueLoss = 0;

      if (hasDilution) {
        urlsWithDilution++;

        const linkValue = item.pageAuthority || 50;
        const dilutionFactor = Math.min(
          item.dilutionFactor || 0.2,
          maxDilutionFactor
        );
        const estimatedClicksLost = Math.min(
          linkValue * dilutionFactor * clickLossMultiplier,
          maxClicksLost
        );
        const severityMultiplier =
          getDilutionSeverityMultiplier(severity) * 0.5;

        const decayLoss =
          estimatedClicksLost *
          averageOrderValue *
          conversionRate *
          severityMultiplier *
          (1 - recoveryRate) *
          pvFactor;

        const strandedCapexLoss = costPerUrl * capexLossRate;

        urlRevenueLoss = decayLoss + strandedCapexLoss;
        calculatedRevenueLoss += urlRevenueLoss;
      }

      dilutionCategories[severity].push({
        ...item,
        dilutionSeverity: severity,
        hasDilution,
        calculatedRevenueLoss: Math.round(urlRevenueLoss),
      });
    });

    const samplingRatio =
      totalUrlsAnalyzed /
      (onboardingData?.domainCostDetails?.totalUrlCount || totalUrlsAnalyzed);
    const extrapolatedLoss = Math.round(calculatedRevenueLoss / samplingRatio);
    const sampleBasedLoss = Math.round(
      Math.min(calculatedRevenueLoss, totalContentCost * 0.5)
    );

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

    return {
      summary: {
        totalUrlsAnalyzed,
        urlsWithDilution,
        dilutionPercentage: Math.round(
          (urlsWithDilution / totalUrlsAnalyzed) * 100
        ),
        totalRevenueLoss: sampleBasedLoss,
        extrapolatedRevenueLoss: extrapolatedLoss,
        samplingRatio: (samplingRatio * 100).toFixed(1) + "%",
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Equity Link Decay Loss",
          content: `Link dilution reduces authority transfer from internal linking. Based on a ${(
            samplingRatio * 100
          ).toFixed(1)}% sample with ${
            conversionRate * 100
          }% conversion rate and ${
            recoveryRate * 100
          }% recovery rate, estimated loss is $${sampleBasedLoss.toLocaleString()}, projecting a total impact of $${extrapolatedLoss.toLocaleString()}.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          discountRate,
          recoveryRate,
          horizonDays,
          capexLossRate,
          clickLossMultiplier,
          maxDilutionFactor,
          maxClicksLost,
          formula: `Loss = (Link Value × Dilution × ${clickLossMultiplier} × CVR × AOV × Severity Multiplier × (1 - RR) × PV Factor) + ${
            capexLossRate * 100
          }% CapEx`,
        },
      },
      dilutionCategories,
      dilutionDistribution,
    };
  };

  const getPsychMismatch = ({
    conversionRate = 0.02, // 2% conversion rate
    revenueLossRatio = 0.15, // 15% loss ratio for revenue impact
    highMismatchThreshold = 30, // Threshold for high mismatch classification
    mediumMismatchThreshold = 15, // Threshold for medium mismatch classification
    lowMismatchThreshold = 5, // Threshold for low mismatch classification
    optimalFunnelDistribution = {
      ToF: 40, // Top of Funnel - Awareness
      MoF: 25, // Middle of Funnel - Consideration
      BoF: 25, // Bottom of Funnel - Decision
      Retention: 8, // Customer retention
      Advocacy: 2, // Customer advocacy
    },
    optimalPsychThresholds = {
      emotionalResonance: 70,
      cognitiveClarity: 75,
      persuasionLeverage: 70,
      behavioralMomentum: 65,
    },
  } = {}) => {
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
    // const optimalFunnelDistribution = {
    //   ToF: 40, // Top of Funnel - Awareness
    //   MoF: 25, // Middle of Funnel - Consideration
    //   BoF: 25, // Bottom of Funnel - Decision
    //   Retention: 8, // Customer retention
    //   Advocacy: 2, // Customer advocacy
    // };

    // const optimalPsychThresholds = {
    //   emotionalResonance: 70,
    //   cognitiveClarity: 75,
    //   persuasionLeverage: 70,
    //   behavioralMomentum: 65,
    // };

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
      (averageFunnelMismatch + averageEmotionalMismatch) / 2; // Simple revenue loss calculation: TotalInvested * MismatchPercentage * revenueLossRatio
    calculatedRevenueLoss =
      totalContentCost * (overallMismatchPercentage / 100) * revenueLossRatio;

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
      if (mismatch > highMismatchThreshold) {
        severity = "High-Mismatch";
      } else if (mismatch > mediumMismatchThreshold) {
        severity = "Medium-Mismatch";
      } else if (mismatch > lowMismatchThreshold) {
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
          ).toLocaleString()} revenue loss (using a ${
            revenueLossRatio * 100
          }% loss ratio).`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          revenueLossRatio,
          highMismatchThreshold,
          mediumMismatchThreshold,
          lowMismatchThreshold,
          formula: `Revenue Loss = Total Invested × Mismatch% × Loss Ratio (${
            revenueLossRatio * 100
          }%)`,
          calculation: `$${totalContentCost.toLocaleString()} × ${Math.round(
            overallMismatchPercentage
          )}% × ${revenueLossRatio * 100}% = $${Math.round(
            calculatedRevenueLoss
          ).toLocaleString()}`,
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
  const getCannibalizationLoss = ({
    conversionRate = 0.02, // 2% conversion rate
    discountRate = 0.1, // 10% discount rate
    recoveryRate = 0.8, // 80% recovery rate
    horizonDays = 700, // Time horizon in days
    defaultAvgContentCost = 400, // Default content cost per URL
    lostClicksPercentage = 0.15, // 15% of clicks potentially lost to cannibalization
    maxLostClicksCap = 10, // Cap on lost clicks per keyword
    investmentCapPercentage = 0.5, // Cap at 50% of total investment
  } = {}) => {
    const totalUniqueUrls = contentCostWaste.length || 1;

    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;
    const totalContentCost =
      calculations.contentCost ||
      onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0)
      throw new Error("Missing AOV");
    if (!totalContentCost || totalContentCost === 0)
      throw new Error("Missing Total Content Cost");

    const timeHorizon = horizonDays / 365.0;
    const pvFactor = (1 - Math.exp(-discountRate * timeHorizon)) / discountRate;
    const costPerUrl =
      totalContentCost / totalUniqueUrls || defaultAvgContentCost;

    let totalKeywordsAnalyzed = 0;
    let affectedKeywords = 0;
    let totalClicksLost = 0;
    let calculatedRevenueLoss = 0;

    const lossMultipliers = {
      Light: 0.08,
      Moderate: 0.15,
      Severe: 0.25,
    };

    const cannibalizationCategories = {
      "Severe-Cannibalization": [],
      "Moderate-Cannibalization": [],
      "Light-Cannibalization": [],
      "No-Cannibalization": [],
    };

    cannibalization.forEach((item) => {
      totalKeywordsAnalyzed++;
      const competingCount = (item.competingUrls || []).length;
      const severity =
        competingCount >= 4
          ? "Severe-Cannibalization"
          : competingCount >= 2
          ? "Moderate-Cannibalization"
          : competingCount >= 1
          ? "Light-Cannibalization"
          : "No-Cannibalization";

      let urlRevenueLoss = 0;

      if (severity !== "No-Cannibalization") {
        affectedKeywords++;

        const totalClicks = [
          ...(item.competingUrls || []),
          item.primaryUrl || {},
        ].reduce((sum, url) => sum + (url.clicks || 0), 0);

        const estimatedLostClicks = Math.min(
          totalClicks * lostClicksPercentage,
          maxLostClicksCap
        ); // Cap per keyword
        const severityLabel = severity.split("-")[0];
        const severityMultiplier = lossMultipliers[severityLabel] || 0.1;

        const rawLoss =
          estimatedLostClicks *
          averageOrderValue *
          conversionRate *
          severityMultiplier;

        const discountedLoss = rawLoss * (1 - recoveryRate) * pvFactor;
        const strandedCapexLoss = costPerUrl * 0.05;

        urlRevenueLoss = discountedLoss + strandedCapexLoss;
        totalClicksLost += estimatedLostClicks;
        calculatedRevenueLoss += urlRevenueLoss;
      }

      cannibalizationCategories[severity].push({
        keyword: item.keyword,
        severity,
        competingCount,
        calculatedRevenueLoss: Math.round(urlRevenueLoss),
        primaryUrl: item.primaryUrl?.url || "N/A",
        competingUrls: item.competingUrls?.map((c) => c.url) || [],
      });
    });

    const samplingRatio = 1;
    const extrapolatedLoss = Math.round(calculatedRevenueLoss / samplingRatio);
    const sampleBasedLoss = Math.round(
      Math.min(
        calculatedRevenueLoss,
        totalContentCost * investmentCapPercentage
      )
    );

    const severityDistribution = {};
    Object.keys(cannibalizationCategories).forEach((cat) => {
      severityDistribution[cat] = {
        count: cannibalizationCategories[cat].length,
        percentage:
          totalKeywordsAnalyzed > 0
            ? Math.round(
                (cannibalizationCategories[cat].length /
                  totalKeywordsAnalyzed) *
                  100
              )
            : 0,
      };
    });

    return {
      summary: {
        totalKeywordsAnalyzed,
        affectedKeywords,
        cannibalizationPercentage: Math.round(
          (affectedKeywords / totalKeywordsAnalyzed) * 100
        ),
        totalClicksLost,
        totalRevenueLoss: sampleBasedLoss,
        extrapolatedRevenueLoss: extrapolatedLoss,
        samplingRatio: (samplingRatio * 100).toFixed(1) + "%",
        totalUniqueUrls,
        costPerUrl: Math.round(costPerUrl),
        tooltip: {
          title: "Internal Cannibalization Loss",
          content: `Analyzed ${totalKeywordsAnalyzed} keywords. ${affectedKeywords} showed signs of cannibalization. Estimated $${sampleBasedLoss.toLocaleString()} in performance loss, projecting $${extrapolatedLoss.toLocaleString()} across your keyword base.`,
        },
        calculationDetails: {
          averageOrderValue,
          totalContentCost,
          conversionRate,
          discountRate,
          recoveryRate,
          formula:
            "Loss = Clicks Lost × AOV × CVR × Severity × (1 - Recovery Rate) × PV Factor + 5% CapEx",
        },
      },
      cannibalizationCategories,
      severityDistribution,
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

  /*───────────────────────────────────────────────────────────────
  Revenue-Recovery Model  ▪  JS version  ▪  2025-07-03
───────────────────────────────────────────────────────────────*/

  /** *****************************************************************
   *  1. GLOBAL CONFIG – tweak per workspace / client as needed
   *******************************************************************/
  const RECOVERY_CONFIG = {
    /* Traffic & revenue */
    sessionsByUrl: {}, // { 'https://site/page': 1380, ... }
    conversionRate: 0.02, // 2 %
    revenuePerConversion: null, // falls back to AOV if null
    margin: 0.7, // 70 % profit margin

    /* Risk caps (as % of total content investment) */
    maxLossPerCategoryPct: 0.02, // 2 %
    maxPortfolioLossPct: 0.05, // 5 %

    /* Multipliers (loss & recovery) */
    multipliers: {
      decay: { loss: 0.8, recovery: 0.55 },
      mismatch: { loss: 0.6, recovery: 0.65 },
      cannibal: { loss: 1.2, recovery: 0.7 },
      dilution: { loss: 0.4, recovery: 0.5 },
      funnel: { loss: 1.0, recovery: 0.6 },
    },

    /* Remediation effort model (exposed for reporting) */
    remediationCostPerHour: 120,
    hoursPerUrl: {
      decayFix: 2,
      mismatchFix: 1.5,
      cannibalFix: 3,
      dilutionFix: 4,
    },
  };

  /** *****************************************************************
   *  2. UTILITY HELPERS
   *******************************************************************/
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  /* Merge user overrides into RECOVERY_CONFIG without mutating either */
  const mergeConfig = (overrides = {}) =>
    Object.assign(deepClone(RECOVERY_CONFIG), deepClone(overrides));

  /* Pick the more conservative of two loss proxies */
  const estimateLoss = ({
    sessions,
    convRate,
    revPerConv,
    margin,
    contentCost,
    lossMultiplier,
  }) => {
    const lostProfit = sessions * convRate * revPerConv * margin;
    const wastedCost = contentCost * lossMultiplier;
    return Math.max(lostProfit, wastedCost);
  };

  /* Clamp a value to an upper cap */
  const capLoss = (value, cap) => (value > cap ? cap : value);

  /* Simple impact scoring */

  /** *****************************************************************
   *  3.  MAIN EXPORT  –  getROIRecoveryPotential
   *******************************************************************
   *  Required globals in scope:
   *    calculations, onboardingData,
   *    decay30Days, decay60Days, decay90Days,
   *    keywordMismatch, cannibalization, linkDilution,
   *    psychMismatchData (optional), contentCostWaste
   *******************************************************************/
  const getROIRecoveryPotential = (userOverrides = {}) => {
    /*───────────────────────────────────────────────────────────────
    0. CONFIG & BASIC CHECKS
  ───────────────────────────────────────────────────────────────*/
    const cfg = mergeConfig(userOverrides);

    console.log("cfg", cfg);

    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;
    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue)
      throw new Error(
        "Average Order Value (AOV) is missing. Ensure onboardingData.domainCostDetails.averageOrderValue is set."
      );
    if (!totalContentCost)
      throw new Error(
        "Total Content Cost is missing. Ensure onboardingData.domainCostDetails.totalInvested is set."
      );

    const totalUniqueUrls = contentCostWaste?.length || 1;
    const defaultCostPerUrl = totalContentCost / totalUniqueUrls;

    /*───────────────────────────────────────────────────────────────
    1. PER-URL LOOK-UPS
  ───────────────────────────────────────────────────────────────*/
    const contentCostByUrl = {};
    contentCostWaste?.forEach((c) => {
      if (c.url) contentCostByUrl[c.url] = c.cost || defaultCostPerUrl;
    });

    const sessionsByUrl = cfg.sessionsByUrl; // may be empty

    /*───────────────────────────────────────────────────────────────
    2. CATEGORY-SPECIFIC URL LISTS
  ───────────────────────────────────────────────────────────────*/
    const severeDecayUrls = [...decay30Days, ...decay60Days, ...decay90Days]
      .filter((i) => i.decayStatus === "Severe-Decay")
      .map((i) => i.url);

    const highMismatchUrls = keywordMismatch
      .filter((i) =>
        ["High-Mismatch", "Medium-Mismatch"].includes(
          i.severity || i.mismatchLevel
        )
      )
      .map((i) => i.url);

    // Extract proper URLs from cannibalization data
    const severeCannibalUrls = cannibalization
      .filter((i) => (i.competingUrls || []).length >= 3)
      .flatMap((item) => {
        // Include the primary URL if it exists
        const urls = [];
        if (item.primaryUrl && item.primaryUrl.url) {
          urls.push(item.primaryUrl.url);
        }
        // Include competing URLs if they exist
        if (item.competingUrls && Array.isArray(item.competingUrls)) {
          item.competingUrls.forEach((competing) => {
            if (competing && competing.url) {
              urls.push(competing.url);
            }
          });
        }
        return urls;
      })
      // Filter out any nulls or undefined values
      .filter((url) => url);

    const severeDilutionUrls = linkDilution
      .filter((i) =>
        ["Severe-Dilution", "Moderate-Dilution"].includes(
          i.severity || i.dilutionLevel
        )
      )
      .map((i) => i.url);

    /*───────────────────────────────────────────────────────────────
    3. LOSS & RECOVERY PER CATEGORY
  ───────────────────────────────────────────────────────────────*/
    const perCategory = {
      decay: {
        urls: severeDecayUrls,
        label: "Content Decay Recovery",
        mult: cfg.multipliers.decay,
      },
      mismatch: {
        urls: highMismatchUrls,
        label: "Keyword Optimization",
        mult: cfg.multipliers.mismatch,
      },
      cannibal: {
        urls: severeCannibalUrls,
        label: "Cannibalization Resolution",
        mult: cfg.multipliers.cannibal,
      },
      dilution: {
        urls: severeDilutionUrls,
        label: "Link Structure Optimization",
        mult: cfg.multipliers.dilution,
      },
      funnel: {
        urls: [], // handled below
        label: "Funnel Alignment",
        mult: cfg.multipliers.funnel,
      },
    };

    // Funnel gaps treated as pseudo-URLs
    // Ensure we always have at least some funnel gaps to work with
    const funnelGaps = psychMismatchData?.funnelDistribution
      ? Math.max(
          Object.values(psychMismatchData.funnelDistribution).reduce(
            (s, v) => s + v,
            0
          ),
          3 // Ensure at least 3 funnel gaps to generate meaningful recovery values
        )
      : 3; // Default to 3 if no data available

    const maxLossPerCat = cfg.maxLossPerCategoryPct * totalContentCost;

    Object.values(perCategory).forEach((cat) => {
      const urlList =
        cat.label === "Funnel Alignment"
          ? Array.from({ length: funnelGaps }).map(
              (_, idx) => `funnel-gap-${idx}`
            )
          : cat.urls;

      // Ensure we have at least some URLs for each category
      if (cat.urls.length === 0 && cat.label !== "Funnel Alignment") {
        // If no URLs, add a synthetic one to ensure some recovery value
        urlList.push(
          `synthetic-${cat.label.toLowerCase().replace(/\s+/g, "-")}`
        );
      }

      // Generate baseline metrics for categories that might not have matching session data
      let baselineSessions = 0;
      let baselineCost = defaultCostPerUrl;

      // Calculate average sessions across all known URLs to use as baseline
      const knownSessions = Object.values(sessionsByUrl).filter(Boolean);
      if (knownSessions.length > 0) {
        baselineSessions =
          knownSessions.reduce((sum, sessions) => sum + sessions, 0) /
          knownSessions.length;
        // Ensure at least 100 sessions as a minimum baseline
        baselineSessions = Math.max(baselineSessions, 100);
      } else {
        // Default to 100 sessions if no data available
        baselineSessions = 100;
      }

      const rawLoss = urlList.reduce((sum, url) => {
        // Skip null/undefined URLs
        if (!url) return sum;

        // Use actual data if available, otherwise use baseline values
        // For synthetic URLs, always use baseline
        const isRealUrl =
          !url.startsWith("synthetic-") && !url.startsWith("funnel-gap-");
        const sessions = isRealUrl
          ? sessionsByUrl[url] || baselineSessions
          : baselineSessions;
        const costPerUrl = isRealUrl
          ? contentCostByUrl[url] || baselineCost
          : baselineCost;

        return (
          sum +
          estimateLoss({
            sessions,
            convRate: cfg.conversionRate,
            revPerConv: cfg.revenuePerConversion || averageOrderValue,
            margin: cfg.margin,
            contentCost: costPerUrl,
            lossMultiplier: cat.mult.loss,
          })
        );
      }, 0);

      cat.currentLoss = capLoss(rawLoss, maxLossPerCat);
      cat.recoveryPotential = cat.currentLoss * cat.mult.recovery;
    });

    /*───────────────────────────────────────────────────────────────
    4. PORTFOLIO-LEVEL CAP
  ───────────────────────────────────────────────────────────────*/
    let portfolioLoss = Object.values(perCategory).reduce(
      (sum, c) => sum + c.currentLoss,
      0
    );

    const portfolioCap = cfg.maxPortfolioLossPct * totalContentCost;
    let scalingFactor = 1;

    if (portfolioLoss > portfolioCap) {
      scalingFactor = portfolioCap / portfolioLoss;
      Object.values(perCategory).forEach((c) => {
        c.currentLoss *= scalingFactor;
        c.recoveryPotential *= scalingFactor;
      });
      portfolioLoss = portfolioCap;
    }

    /*───────────────────────────────────────────────────────────────
    5. TIMEFRAMES (30 / 60 / 90 / 180 / 360)
  ───────────────────────────────────────────────────────────────*/
    // Clean category URLs to remove any null entries
    Object.values(perCategory).forEach((category) => {
      if (Array.isArray(category.urls)) {
        category.urls = category.urls.filter(
          (url) => url !== null && url !== undefined
        );
      }
    });

    const recoveryTimeframes = {
      "30-day": {
        opportunities: {
          "Keyword Optimization": {
            ...perCategory.mismatch,
            recoveryWindow: "1-30 days",
            timeToRecover: "1-3 months",
            effort: "Low",
            priority: "High",
          },
          "Quick Content Fixes": {
            currentLoss: perCategory.decay.currentLoss * 0.4,
            recoveryPotential: perCategory.decay.recoveryPotential * 0.4,
            recoveryWindow: "1-30 days",
            timeToRecover: "7-30 days",
            effort: "Low",
            priority: "High",
          },
        },
      },
      "60-day": {
        opportunities: {
          "Content Decay Recovery": {
            currentLoss: perCategory.decay.currentLoss * 0.6,
            recoveryPotential: perCategory.decay.recoveryPotential * 0.6,
            recoveryWindow: "30-60 days",
            timeToRecover: "30-60 days",
            effort: "Medium",
            priority: "High",
          },
          "Cannibalization Resolution": {
            ...perCategory.cannibal,
            recoveryWindow: "30-60 days",
            timeToRecover: "1-2 months",
            effort: "Medium",
            priority: "Critical",
          },
        },
      },
      "90-day": {
        opportunities: {
          "Link Structure Optimization": {
            ...perCategory.dilution,
            recoveryWindow: "60-90 days",
            timeToRecover: "3-6 months",
            effort: "High",
            priority: "Medium",
          },
          "Funnel Alignment": {
            ...perCategory.funnel,
            recoveryWindow: "60-90 days",
            timeToRecover: "2-5 months",
            effort: "Medium",
            priority: "Medium",
          },
        },
      },
      "180-day": {
        opportunities: {
          "Content Decay Recovery": {
            ...perCategory.decay,
            // Apply 180-day scaling factors (cumulative recovery beyond 90-day plan)
            currentLoss: perCategory.decay.currentLoss * 1.15, // 15% more loss identified over 90-day
            recoveryPotential: perCategory.decay.recoveryPotential * 1.2, // 20% more recovery potential
            recoveryWindow: "0-180 days",
            timeToRecover: "3-6 months",
            effort: "Medium",
            priority: "High",
            // Ensure clean URL array
            urls: perCategory.decay.urls.filter((url) => url),
          },
          "Keyword Optimization": {
            ...perCategory.mismatch,
            // Apply 180-day scaling factors (cumulative recovery beyond 90-day plan)
            currentLoss: perCategory.mismatch.currentLoss * 1.2, // 20% more loss identified over 90-day
            recoveryPotential: perCategory.mismatch.recoveryPotential * 1.25, // 25% more recovery potential
            recoveryWindow: "0-180 days",
            timeToRecover: "3-6 months",
            effort: "Medium",
            priority: "High",
            // Ensure clean URL array
            urls: perCategory.mismatch.urls.filter((url) => url),
          },
          "Cannibalization Resolution": {
            ...perCategory.cannibal,
            // Apply 180-day scaling factors (cumulative recovery beyond 90-day plan)
            currentLoss: perCategory.cannibal.currentLoss * 1.1, // 10% more loss identified over 90-day
            recoveryPotential: perCategory.cannibal.recoveryPotential * 1.15, // 15% more recovery potential
            recoveryWindow: "0-180 days",
            timeToRecover: "3-6 months",
            effort: "Medium",
            priority: "High",
            // Ensure clean URL array
            urls: perCategory.cannibal.urls.filter((url) => url),
          },
          "Link Structure Optimization": {
            ...perCategory.dilution,
            // Apply 180-day scaling factors (cumulative recovery beyond 90-day plan)
            currentLoss: perCategory.dilution.currentLoss * 1.25, // 25% more loss identified over 90-day
            recoveryPotential: perCategory.dilution.recoveryPotential * 1.3, // 30% more recovery potential
            recoveryWindow: "0-180 days",
            timeToRecover: "3-6 months",
            effort: "Medium",
            priority: "Medium",
            // Ensure clean URL array
            urls: perCategory.dilution.urls.filter((url) => url),
          },
          "Funnel Alignment": {
            ...perCategory.funnel,
            // Apply 180-day scaling factors (cumulative recovery beyond 90-day plan)
            currentLoss: perCategory.funnel.currentLoss * 1.18, // 18% more loss identified over 90-day
            recoveryPotential: perCategory.funnel.recoveryPotential * 1.22, // 22% more recovery potential
            recoveryWindow: "0-180 days",
            timeToRecover: "3-6 months",
            effort: "Medium",
            priority: "Medium",
            // Ensure clean URL array
            urls: perCategory.funnel.urls.filter((url) => url),
          },
        },
      },
      "360-day": {
        opportunities: {
          "Content Decay Recovery": {
            ...perCategory.decay,
            // Apply 360-day scaling factors (additional recovery over 180-day)
            currentLoss: perCategory.decay.currentLoss * 1.3, // 30% more loss identified over longer period
            recoveryPotential: perCategory.decay.recoveryPotential * 1.4, // 40% more recovery potential
            recoveryWindow: "0-360 days",
            timeToRecover: "6-12 months",
            effort: "High",
            priority: "High",
            // Ensure clean URL array
            urls: perCategory.decay.urls.filter((url) => url),
          },
          "Keyword Optimization": {
            ...perCategory.mismatch,
            // Apply 360-day scaling factors (additional recovery over 180-day)
            currentLoss: perCategory.mismatch.currentLoss * 1.5, // 50% more loss identified over longer period
            recoveryPotential: perCategory.mismatch.recoveryPotential * 1.7, // 70% more recovery potential
            recoveryWindow: "0-360 days",
            timeToRecover: "6-12 months",
            effort: "Medium",
            priority: "High",
            // Ensure clean URL array
            urls: perCategory.mismatch.urls.filter((url) => url),
          },
          "Cannibalization Resolution": {
            ...perCategory.cannibal,
            // Apply 360-day scaling factors (additional recovery over 180-day)
            currentLoss: perCategory.cannibal.currentLoss * 1.25, // 25% more loss identified over longer period
            recoveryPotential: perCategory.cannibal.recoveryPotential * 1.35, // 35% more recovery potential
            recoveryWindow: "0-360 days",
            timeToRecover: "6-12 months",
            effort: "High",
            priority: "Critical",
            // Ensure clean URL array
            urls: perCategory.cannibal.urls.filter((url) => url),
          },
          "Link Structure Optimization": {
            ...perCategory.dilution,
            // Apply 360-day scaling factors (additional recovery over 180-day)
            currentLoss: perCategory.dilution.currentLoss * 1.6, // 60% more loss identified over longer period
            recoveryPotential: perCategory.dilution.recoveryPotential * 1.8, // 80% more recovery potential
            recoveryWindow: "0-360 days",
            timeToRecover: "6-12 months",
            effort: "High",
            priority: "High",
            // Ensure clean URL array
            urls: perCategory.dilution.urls.filter((url) => url),
          },
          "Funnel Alignment": {
            ...perCategory.funnel,
            // Apply 360-day scaling factors (additional recovery over 180-day)
            currentLoss: perCategory.funnel.currentLoss * 1.45, // 45% more loss identified over longer period
            recoveryPotential: perCategory.funnel.recoveryPotential * 1.6, // 60% more recovery potential
            recoveryWindow: "0-360 days",
            timeToRecover: "6-12 months",
            effort: "High",
            priority: "High",
            // Ensure clean URL array
            urls: perCategory.funnel.urls.filter((url) => url),
          },
        },
      },
    };

    /*───────────────────────────────────────────────────────────────
    6. 30-DAY AGGREGATE & INVESTMENT
  ───────────────────────────────────────────────────────────────*/
    const thirtyDayRecovery = Object.values(
      recoveryTimeframes["30-day"].opportunities
    ).reduce(
      (agg, o) => ({
        currentLoss: agg.currentLoss + o.currentLoss,
        recoveryPotential: agg.recoveryPotential + o.recoveryPotential,
      }),
      { currentLoss: 0, recoveryPotential: 0 }
    );

    const investmentRequired = Math.max(
      thirtyDayRecovery.currentLoss * 0.5,
      totalContentCost * 0.01
    );

    /*───────────────────────────────────────────────────────────────
    7. ROI SCENARIOS
  ───────────────────────────────────────────────────────────────*/
    const scenario = (pct) => ({
      recoveredRevenue: thirtyDayRecovery.recoveryPotential * pct,
      roi:
        ((thirtyDayRecovery.recoveryPotential * pct - investmentRequired) /
          investmentRequired) *
        100,
      timeframe: "30 days",
    });

    const roiScenarios = {
      "Conservative (40% recovery)": scenario(0.4),
      "Realistic (65% recovery)": scenario(0.65),
      "Optimistic (85% recovery)": scenario(0.85),
    };

    /*───────────────────────────────────────────────────────────────
    8. PRIORITY MATRIX  (30-day)
  ───────────────────────────────────────────────────────────────*/
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

    /*───────────────────────────────────────────────────────────────
    9. LONG-RANGE AGGREGATES
  ───────────────────────────────────────────────────────────────*/
    const sumOpps = (frame) =>
      Object.values(recoveryTimeframes[frame].opportunities).reduce(
        (agg, o) => ({
          currentLoss: agg.currentLoss + o.currentLoss,
          recoveryPotential: agg.recoveryPotential + o.recoveryPotential,
        }),
        { currentLoss: 0, recoveryPotential: 0 }
      );

    const oneEightyRecovery = sumOpps("180-day");
    const threeSixtyRecovery = sumOpps("360-day");

    /*───────────────────────────────────────────────────────────────
    10. ALIGNMENT WITH TOTAL LOSS & RETURN
  ───────────────────────────────────────────────────────────────*/

    // Get the total loss calculation to align our recovery potential with it
    let totalSystemLoss = 0;
    try {
      const totalLossData = calculateTotalLoss();
      if (totalLossData && totalLossData.summary) {
        totalSystemLoss = totalLossData.summary.totalRevenueLoss || 0;
      }
    } catch (error) {
      console.error("Error retrieving total system loss:", error);
    }

    // Ensure our recovery calculations are proportional to the total loss
    let alignedThreeSixtyRecovery = { ...threeSixtyRecovery };

    // If the total system loss is significantly higher than our calculated loss,
    // adjust the 360-day recovery potential to be a realistic percentage of total loss
    if (totalSystemLoss > threeSixtyRecovery.currentLoss * 3) {
      // Calculate a weighted recovery factor based on the actual loss composition
      // Get the original category distribution
      const categoryContributions = {};
      let totalCategoryLoss = 0;

      // Calculate loss contribution by category
      Object.values(perCategory).forEach((cat) => {
        categoryContributions[cat.label] = cat.currentLoss;
        totalCategoryLoss += cat.currentLoss;
      });

      // Define category-specific recovery rates based on their nature and complexity
      const categoryRecoveryRates = {
        "Content Decay": 0.8, // Content decay is generally highly recoverable
        "Keyword Mismatch": 0.75, // Keyword optimization has high recovery potential
        "Keyword Cannibalization": 0.65, // Cannibalization resolution is moderately complex
        "Link Dilution": 0.6, // Link structure changes have a moderate recovery rate
        "Funnel Alignment": 0.55, // Funnel issues are more complex to fully recover
      };

      // Calculate the weighted recovery factor based on loss composition
      let weightedRecoveryFactor = 0;
      let weightSum = 0;

      Object.entries(categoryContributions).forEach(([category, loss]) => {
        // Match category label to the recovery rates map
        const categoryKey = Object.keys(categoryRecoveryRates).find(
          (key) => category.includes(key) || key.includes(category)
        );

        if (categoryKey && loss > 0) {
          const weight = loss / totalCategoryLoss;
          weightedRecoveryFactor += categoryRecoveryRates[categoryKey] * weight;
          weightSum += weight;
        }
      });

      // Default to 0.7 if we couldn't calculate a proper weighted factor
      const recoveryFactor = weightSum > 0 ? weightedRecoveryFactor : 0.7;

      // Cap the recovery factor to a reasonable range (0.55 - 0.85)
      const boundedRecoveryFactor = Math.min(
        Math.max(recoveryFactor, 0.55),
        0.85
      );

      alignedThreeSixtyRecovery = {
        currentLoss: totalSystemLoss,
        recoveryPotential: Math.round(totalSystemLoss * boundedRecoveryFactor),
      };

      console.log("Aligned 360-day recovery with total system loss:", {
        originalLoss: threeSixtyRecovery.currentLoss,
        totalSystemLoss,
        originalRecovery: threeSixtyRecovery.recoveryPotential,
        alignedRecovery: alignedThreeSixtyRecovery.recoveryPotential,
        weightedRecoveryFactor: boundedRecoveryFactor,
        categoryContributions,
      });
    }

    return {
      summary: {
        totalCurrentLoss: Math.round(thirtyDayRecovery.currentLoss),
        totalRecoveryPotential: Math.round(thirtyDayRecovery.recoveryPotential),
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
        timeframe: "30 days",
      },
      recoveryOpportunities: Object.fromEntries(
        Object.values(perCategory).map((c) => [
          c.label,
          {
            currentLoss: c.currentLoss,
            recoveryPotential: c.recoveryPotential,
          },
        ])
      ),
      recoveryTimeframes,
      roiScenarios,
      priorityMatrix,
      quickWins: priorityMatrix.filter((i) => i.effort === "Low").slice(0, 3),
      highImpactProjects: priorityMatrix
        .filter(
          (i) => i.recoveryPotential > thirtyDayRecovery.recoveryPotential * 0.3
        )
        .slice(0, 3),
      oneEightyDay: {
        currentLoss: Math.round(oneEightyRecovery.currentLoss),
        recoveryPotential: Math.round(oneEightyRecovery.recoveryPotential),
      },
      threeSixtyDay: {
        currentLoss: Math.round(alignedThreeSixtyRecovery.currentLoss),
        recoveryPotential: Math.round(
          alignedThreeSixtyRecovery.recoveryPotential
        ),
        // Include the actual recovery factor used to calculate the potential
        recoveryFactor:
          totalSystemLoss > 0
            ? (
                alignedThreeSixtyRecovery.recoveryPotential / totalSystemLoss
              ).toFixed(2) * 1
            : 0,
      },
      // Add total system loss for reference
      totalSystemLoss: Math.round(totalSystemLoss),
      assumptions: cfg,
      scalingFactor, // 1 if no portfolio cap applied
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

  const getRiskMetric = () => {
    return riskMetrics;
  };

  const calculateTotalLoss = () => {
    try {
      const getSafePerUrlLoss = (totalLoss, list) =>
        totalLoss / (list.length || 1);

      const revenueLeakData = getRevenueLeak({});
      const contentDecayData = getContentDecay();
      const keywordMismatchData = getKeywordMismatch();
      const linkDilutionData = getLinkDilution({});
      const psychoMismatchData = getPsychMismatch({});
      const cannibalizationData = getCannibalizationLoss();

      const totalInvested =
        onboardingData?.domainCostDetails?.totalInvested || 0;

      const contentCostLoss = revenueLeakData.estimatedRevenueLoss || 0;
      const contentDecayLoss = contentDecayData.summary?.totalRevenueLoss || 0;
      const keywordMismatchLoss =
        keywordMismatchData.summary?.totalRevenueLoss || 0;
      const cannibalizationLoss =
        cannibalizationData.summary?.totalRevenueLoss || 0;
      const linkDilutionLoss = linkDilutionData.summary?.totalRevenueLoss || 0;
      const psychoMismatchLoss =
        psychoMismatchData.summary?.totalRevenueLoss || 0;

      const keywordMismatchUniqueURLs = {};
      keywordMismatch.forEach((item) => {
        if (item.url) {
          keywordMismatchUniqueURLs[item.url] = getSafePerUrlLoss(
            keywordMismatchLoss,
            keywordMismatch
          );
        }
      });

      const contentCostWasteUniqueURLs = {};
      contentCostWaste.forEach((item) => {
        if (item.url) {
          contentCostWasteUniqueURLs[item.url] = getSafePerUrlLoss(
            contentCostLoss,
            contentCostWaste
          );
        }
      });

      const cannibalizationUniqueURLs = {};
      cannibalization.forEach((item) => {
        if (item.primaryUrl?.url) {
          cannibalizationUniqueURLs[item.primaryUrl.url] = getSafePerUrlLoss(
            cannibalizationLoss,
            cannibalization
          );
        }
      });

      const linkDilutionUniqueURLs = {};
      linkDilution.forEach((item) => {
        if (item.url) {
          linkDilutionUniqueURLs[item.url] = getSafePerUrlLoss(
            linkDilutionLoss,
            linkDilution
          );
        }
      });

      const contentDecayUniqueURLs = {};
      const seenDecayUrls = new Set();
      [...decay30Days, ...decay60Days, ...decay90Days].forEach((item) => {
        if (item.url && !seenDecayUrls.has(item.url)) {
          contentDecayUniqueURLs[item.url] = getSafePerUrlLoss(
            contentDecayLoss,
            decay30Days
          );
          seenDecayUrls.add(item.url);
        }
      });

      const allUniqueURLs = {};
      const multipleLossUrls = {};

      const mergeLosses = (sourceMap, label) => {
        Object.entries(sourceMap).forEach(([url, loss]) => {
          if (allUniqueURLs[url]) {
            if (!multipleLossUrls[url]) multipleLossUrls[url] = [];
            multipleLossUrls[url].push({ loss, source: label });
            allUniqueURLs[url] = Math.max(loss, allUniqueURLs[url]);
          } else {
            allUniqueURLs[url] = loss;
          }
        });
      };

      mergeLosses(keywordMismatchUniqueURLs, "Keyword Mismatch");
      mergeLosses(contentCostWasteUniqueURLs, "Content Cost Waste");
      mergeLosses(cannibalizationUniqueURLs, "Cannibalization");
      mergeLosses(linkDilutionUniqueURLs, "Link Dilution");
      mergeLosses(contentDecayUniqueURLs, "Content Decay");

      const totalLoss = Object.values(allUniqueURLs).reduce(
        (sum, val) => sum + val,
        0
      );
      const estimatedLoss = (totalLoss * 5 + psychoMismatchLoss) / 6;

      const averageLoss =
        (contentCostLoss +
          psychoMismatchLoss +
          contentCostLoss +
          contentDecayLoss +
          cannibalizationLoss +
          linkDilutionLoss) /
        6;

      const individualMetricLosses = [
        contentCostLoss,
        contentDecayLoss,
        keywordMismatchLoss,
        cannibalizationLoss,
        linkDilutionLoss,
        psychoMismatchLoss,
      ].map((val) => Math.abs(val || 0));

      const maxIndividualLoss = Math.max(...individualMetricLosses);

      let totalRevenueLoss = Math.max(estimatedLoss || 0, maxIndividualLoss);

      if (totalRevenueLoss > totalInvested && totalInvested > 0) {
        totalRevenueLoss = averageLoss || 0;
      }

      const percentOfContentCost =
        totalInvested > 0 ? (totalRevenueLoss / totalInvested) * 100 : 0;

      // RollingUpTotal with proportionally scaled loss buckets
      const rawLosses = {
        revenueLeak: contentCostLoss,
        contentDecay: contentDecayLoss,
        keywordMismatch: keywordMismatchLoss,
        cannibalization: cannibalizationLoss,
        linkDilution: linkDilutionLoss,
        psychoMismatch: psychoMismatchLoss,
      };

      const rawLossSum =
        Object.values(rawLosses).reduce(
          (sum, val) => sum + Math.abs(val || 0),
          0
        ) || 1;

      const RollingUpTotal = {
        totalLoss: Math.round(totalRevenueLoss),
      };

      Object.entries(rawLosses).forEach(([key, val]) => {
        const proportion = Math.abs(val || 0) / rawLossSum;
        RollingUpTotal[key] = Math.round(totalRevenueLoss * proportion);
      });

      return {
        summary: {
          totalRevenueLoss,
          averageLoss,
          multipleLossUrls: Object.keys(multipleLossUrls).length,
          urls: Object.keys(allUniqueURLs).length,
          percentOfContentCost,
          tooltip: `Your total revenue loss across all 5 metrics is $${totalRevenueLoss.toFixed(
            2
          )} and ${
            Object.keys(multipleLossUrls).length
          } URLs appear in multiple loss sources. This represents ${percentOfContentCost.toFixed(
            1
          )}% of your total investment.`,
        },
        RollingUpTotal,
      };
    } catch (error) {
      console.error("Error calculating total loss:", error);
    }
  };

  /**********************************************************************
   *  Full-feed URL bucketing for Recoverable-Value dashboard
   *  ---------------------------------------------------------------
   *  INPUT ARRAYS (all plain JS data):
   *    - allGSCUrls               : string[]
   *    - gscAnalysisData          : { [url]: { clicks:number } }
   *    - urlAnalysis              : [{ url, sessions, ... }]          // GA4 detail
   *    - allSitemapUrls           : string[]
   *    - decay30Days / 60Days / 90Days : [{ url, decayStatus, metrics }]
   *    - keywordMismatch          : [{ url, expectedCTR, actualClicks, impressions }]
   *    - linkDilution             : [{ url, dilutionScore }]          // 0-1 small
   *    - cannibalization          : [{ primaryUrl:{url}, competingUrls:[{url}] }]
   *    - contentCostWaste         : [{ url }]
   *    - psychMismatchData        : big object with compositeSummary
   *
   *  OUTPUT:
   *    buckets = { REV_OPP, ENGAGE_OPP, CANNIBAL, INTENT_OPP,
   *                AUTH_OPP, RELEV_OPP, STRANDED, HEALTHY }
   *********************************************************************/
  /**********************************************************************
   *  categoriseIntoBuckets() – final, normalised version
   *********************************************************************/
  const categoriseIntoBuckets = ({
    kwMismatchThreshold = 0.4, // ≥40 % CTR gap ⇒ INTENT_OPP
    authGapThreshold = 0.35, // ≥35 % dilution ⇒ AUTH_OPP
    revSessionThreshold = 5, // <5 sessions counts as zero
  } = {}) => {
    /* ───────────────────────── 0. helper: URL normaliser ───────────── */
    const ORIGIN =
      onboardingData?.GSCAnalysisData?.contentCostWaste?.[0]?.url?.replace(
        /^(https?:\/\/[^/]+).*$/,
        "$1"
      ) || "";

    const norm = (url) => {
      if (!url) return "";
      let full = url.startsWith("http")
        ? url
        : ORIGIN + (url.startsWith("/") ? "" : "/") + url;
      // collapse "//", strip trailing "/" except for origin
      full = full.replace(/([^:]\/)\/+/g, "$1");
      return full !== ORIGIN ? full.replace(/\/$/, "") : full;
    };

    /* ─────────────── 1. thresholds (now as parameters) ─────────────────────── */
    const KW_MISMATCH_BAR = kwMismatchThreshold;
    const AUTH_GAP_BAR = authGapThreshold;
    const REV_SESSION_BAR = revSessionThreshold;
    // Threshold for significant psychological gap (≥30 % site-wide gap ⇒ RELEV_OPP)
    // Keeping as documentation, might be used in future calculations
    // const PSYCH_GAP_BAR = 0.3;

    /* ─────────────── 2. bucket skeleton ─────────────────────────────── */
    const buckets = {
      REV_OPP: [],
      ENGAGE_OPP: [],
      CANNIBAL: [],
      INTENT_OPP: [],
      AUTH_OPP: [],
      RELEV_OPP: [],
      STRANDED: [],
      HEALTHY: [],
    };

    /* ─────────────── 3. look-ups (all URLs normalised) ──────────────── */
    // GA sessions
    const gaSessionMap = new Map(
      urlAnalysis.map((x) => [norm(x.url), x.sessions])
    );

    // Decay
    const decayFeed = [...decay30Days, ...decay60Days, ...decay90Days];
    const decayMap = new Map(
      decayFeed.map((x) => [norm(x.url), x.decayStatus])
    );

    // Keyword gap (0-1, 1 = worst)
    const kwGapMap = new Map(
      keywordMismatch.map((x) => {
        const act = x.actualClicks / Math.max(1, x.impressions);
        const exp = x.expectedCTR > 0 ? x.expectedCTR : 0.05;
        return [norm(x.url), 1 - Math.min(act / exp, 1)];
      })
    );

    // Authority gap
    const authMap = new Map(
      linkDilution.map((x) => [norm(x.url), Math.min(x.dilutionScore * 500, 1)])
    );

    // Cannibalisation set
    const canniSet = new Set(
      cannibalization.flatMap((c) => [
        norm(c.primaryUrl?.url),
        ...(c.competingUrls ?? []).map((u) => norm(u.url)),
      ])
    );

    // Wasted set
    const wasteSet = new Set(contentCostWaste.map((x) => norm(x.url)));

    // Site-wide psych gap
    const o = psychMismatchData?.psychCompositeSummary?.overall ?? {};
    const psychGapGlobal =
      (100 -
        ((o.emotionalResonance ?? 50) +
          (o.cognitiveClarity ?? 50) +
          (o.persuasionLeverage ?? 50) +
          (o.behavioralMomentum ?? 50)) /
          4) /
      100;

    // Union of _normalised_ URLs
    const allUrls = new Set([
      ...keywordMismatch.map((x) => norm(x.url)),
      ...linkDilution.map((x) => norm(x.url)),
      ...urlAnalysis.map((x) => norm(x.url)),
      ...allSitemapUrls.map(norm),
      ...decayFeed.map((x) => norm(x.url)),
      ...contentCostWaste.map((x) => norm(x.url)),
    ]);

    // Full GSC clicks map
    const gscClicksMap = new Map(
      allGSCUrls.map((u) => [norm(u), gscAnalysisData[u]?.clicks ?? 0])
    );

    /* ─────────────── 4. bucket decision helper ──────────────────────── */
    const decideBucket = ({
      clicks,
      sessions,
      kwGap,
      authGap,
      cannibalised,
      decayed,
      wasted,
    }) => {
      if (cannibalised) return "CANNIBAL";
      if (authGap >= AUTH_GAP_BAR) return "AUTH_OPP";
      if (kwGap >= KW_MISMATCH_BAR) return "INTENT_OPP";
      if (clicks > 0 && sessions < REV_SESSION_BAR) return "REV_OPP";
      if (decayed) return "ENGAGE_OPP";
      if (wasted) return "STRANDED";
      if (clicks === 0 && sessions === 0) return "STRANDED";
      return "HEALTHY";
    };

    /* ─────────────── 5. iterate & assign ─────────────────────────────── */
    allUrls.forEach((url) => {
      const clicks = gscClicksMap.get(url) ?? 0;
      const sessions = gaSessionMap.get(url) ?? 0;
      const kwGap = kwGapMap.get(url) ?? 0;
      const authGap = authMap.get(url) ?? 0;
      const decayed = decayMap.has(url);
      const cannib = canniSet.has(url);
      const wasted = wasteSet.has(url);

      const bucket = decideBucket({
        clicks,
        sessions,
        kwGap,
        authGap,
        cannibalised: cannib,
        decayed,
        wasted,
      });

      buckets[bucket].push({
        url,
        metrics: {
          gscClicks: clicks,
          gaSessions: sessions,
          kwGap,
          authGap,
          psychGap: psychGapGlobal,
          decayedStatus: decayed ? decayMap.get(url) : null,
          cannibalised: cannib,
          wasted,
        },
      });
    });

    return buckets;
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
  const getHighCTRLeak = ({
    conversionRate = 0.02, // 2% conversion rate
    ctrThreshold = 0.01, // 1% CTR threshold for filtering low CTR URLs
    defaultAvgContentCost = 400, // Default $400 if no URLs
    opportunityFactorCap = 2.0, // Cap at 2x
    targetCTR = 0.02, // 2% reasonable target CTR
    ctrWastePercentage = 0.3, // 30% content cost wasted on low CTR pages
  } = {}) => {
    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      console.error("❌ getHighCTRLeak: AOV not available, returning 0");
      return {
        estimatedRevenueLoss: 0,
        urlsBelowThreshold: 0,
        totalUrls: (contentCostWaste || []).length,
      };
    }

    if (!totalContentCost || totalContentCost === 0) {
      console.error(
        "❌ getHighCTRLeak: Total content cost not available, returning 0"
      );
      return {
        estimatedRevenueLoss: 0,
        urlsBelowThreshold: 0,
        totalUrls: (contentCostWaste || []).length,
      };
    }

    // Calculate average content cost per URL
    const totalUrls = (contentCostWaste || []).length;
    const avgContentCost =
      totalUrls > 0 ? totalContentCost / totalUrls : defaultAvgContentCost;

    // Filter URLs with CTR less than threshold (default 1%)
    const lowCTRUrls = (contentCostWaste || []).filter((item) => {
      const ctr = parseFloat(item.ctr) || 0;
      const impressions = parseInt(item.impressions) || 0;

      // Only include URLs that have impressions but low CTR
      return impressions > 0 && ctr < ctrThreshold;
    });

    // Calculate total revenue loss based on content cost waste methodology
    // Low CTR pages represent wasted content investment since they fail to attract clicks
    // const ctrWastePercentage = 0.3; // 30% of content cost is wasted due to poor CTR performance
    const contentCostBasedLoss =
      lowCTRUrls.length * avgContentCost * ctrWastePercentage;

    // Alternative calculation: Factor in conversion opportunity loss
    const conversionOpportunityFactor =
      conversionRate * (averageOrderValue / avgContentCost);
    const opportunityAdjustedLoss =
      contentCostBasedLoss *
      Math.min(conversionOpportunityFactor, opportunityFactorCap);

    // Use the more conservative of the two calculations
    const totalRevenueLoss = Math.min(
      contentCostBasedLoss,
      opportunityAdjustedLoss
    );

    const urlDetails = [];
    lowCTRUrls.forEach((item) => {
      const impressions = parseInt(item.impressions) || 0;
      const actualClicks = parseInt(item.clicks) || 0;
      const currentCTR = impressions > 0 ? actualClicks / impressions : 0;

      // Calculate potential clicks based on target CTR
      const potentialClicks = impressions * targetCTR;
      const missedClicks = Math.max(0, potentialClicks - actualClicks);

      // Content cost waste for this specific URL
      const urlContentCost = item.contentCost || avgContentCost;
      const urlWastedCost = urlContentCost * ctrWastePercentage;

      urlDetails.push({
        url: item.url,
        impressions,
        actualClicks,
        currentCTR: Math.round(currentCTR * 10000) / 100, // Convert to percentage with 2 decimals
        targetCTR: targetCTR * 100, // 2%
        potentialClicks: Math.round(potentialClicks),
        missedClicks: Math.round(missedClicks),
        estimatedRevenueLoss: Math.round(urlWastedCost),
        contentCost: urlContentCost,
        position: item.position || 0,
      });
    });

    // Sort by revenue loss (highest first)
    urlDetails.sort((a, b) => b.estimatedRevenueLoss - a.estimatedRevenueLoss);

    return {
      estimatedRevenueLoss: Math.round(totalRevenueLoss),
      urlsBelowThreshold: lowCTRUrls.length,
      totalUrls: (contentCostWaste || []).length,
      targetCTR: targetCTR * 100, // Convert to percentage
      summary: {
        totalRevenueLoss: Math.round(totalRevenueLoss),
        urlsWithLowCTR: lowCTRUrls.length,
        averageCTRGap:
          urlDetails.length > 0
            ? Math.round(
                (urlDetails.reduce(
                  (sum, url) => sum + (2.0 - url.currentCTR),
                  0
                ) /
                  urlDetails.length) *
                  100
              ) / 100
            : 0,
        totalMissedClicks: urlDetails.reduce(
          (sum, url) => sum + url.missedClicks,
          0
        ),
        tooltip: {
          title: "Content Investment Waste from Low CTR",
          content: `This measures content investment wasted due to poor click-through performance. We analyzed ${
            (contentCostWaste || []).length
          } URLs with total investment of $${Math.round(
            totalContentCost
          ).toLocaleString()} (avg: $${Math.round(
            avgContentCost
          )} per page). Found ${lowCTRUrls.length} pages with CTR below ${(
            ctrThreshold * 100
          ).toFixed(1)}% - these pages represent $${Math.round(
            totalRevenueLoss
          ).toLocaleString()} in wasted content investment (${
            ctrWastePercentage * 100
          }% waste rate). 

**Calculation Method:**
• Average Content Cost: $${Math.round(
            totalContentCost
          ).toLocaleString()} ÷ ${totalUrls} URLs = $${Math.round(
            avgContentCost
          )}
• Wasted Investment: ${lowCTRUrls.length} low-CTR pages × $${Math.round(
            avgContentCost
          )} × ${ctrWastePercentage * 100}% waste = $${Math.round(
            contentCostBasedLoss
          ).toLocaleString()}
• Opportunity Factor: ${
            conversionRate * 100
          }% conversion × $${averageOrderValue} AOV ÷ $${Math.round(
            avgContentCost
          )} cost = ${Math.round(conversionOpportunityFactor * 100) / 100}x
• Final Loss: Conservative estimate of $${Math.round(
            totalRevenueLoss
          ).toLocaleString()}`,
        },
      },
      urlDetails: urlDetails.slice(0, 10), // Top 10 worst performers
      calculationDetails: {
        targetCTR: `${(targetCTR * 100).toFixed(1)}%`,
        formula:
          "Wasted Investment = Low-CTR URLs × Avg Content Cost × Waste Percentage",
        conversionRate: `${(conversionRate * 100).toFixed(1)}%`,
        averageOrderValue,
        avgContentCost: Math.round(avgContentCost),
        ctrWastePercentage: `${(ctrWastePercentage * 100).toFixed(1)}%`,
      },
    };
  };

  // Individual Risk Metric Functions for KeywordIntelDashboard
  const getMismatchRisk = ({
    defaultAvgContentCost = 400, // Default $400 if no URLs
    mismatchWastePercentage = 0.2, // 20% waste of content investment for mismatch pages
    maxLossCap = 0.03, // Cap at 3% of total investment
    missedClicksThreshold = 5, // Threshold for significant missed clicks
  } = {}) => {
    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      console.error("❌ getMismatchRisk: AOV not available, returning 0");
      return {
        estimatedRevenueLoss: 0,
        urlsWithMismatch: 0,
        totalUrls: (keywordMismatch || []).length,
      };
    }

    if (!totalContentCost || totalContentCost === 0) {
      console.error(
        "❌ getMismatchRisk: Total content cost not available, returning 0"
      );
      return {
        estimatedRevenueLoss: 0,
        urlsWithMismatch: 0,
        totalUrls: (keywordMismatch || []).length,
      };
    }

    const mismatchData = keywordMismatch || [];

    // Calculate average content cost per URL
    const totalUrls = (contentCostWaste || []).length;
    const avgContentCost =
      totalUrls > 0 ? totalContentCost / totalUrls : defaultAvgContentCost;

    // Group by URL to avoid double counting
    const urlMap = new Map();
    mismatchData.forEach((item) => {
      const url = item.url;
      if (!urlMap.has(url)) {
        urlMap.set(url, []);
      }
      urlMap.get(url).push(item);
    });

    // Filter URLs with mismatch issues
    const mismatchUrls = Array.from(urlMap.entries()).filter(([url, items]) => {
      return items.some(
        (item) =>
          item.mismatchType === "Over-optimized" ||
          item.estimatedLoss?.high > 0 ||
          item.missedClicks > missedClicksThreshold
      );
    });

    // Calculate total revenue loss using content cost methodology
    const totalRevenueLoss =
      mismatchUrls.length * avgContentCost * mismatchWastePercentage;

    // Cap at maxLossCap% of total investment
    const maxLoss = totalContentCost * maxLossCap;
    const cappedRevenueLoss = Math.min(totalRevenueLoss, maxLoss);

    const urlDetails = [];
    mismatchUrls.forEach(([url, items]) => {
      const totalMissedClicks = items.reduce(
        (sum, item) => sum + (item.missedClicks || 0),
        0
      );
      const urlContentCost = avgContentCost;
      const urlWastedCost = urlContentCost * mismatchWastePercentage;

      urlDetails.push({
        url,
        mismatchTypes: items.map((i) => i.mismatchType).join(", "),
        totalMissedClicks,
        estimatedRevenueLoss: Math.round(urlWastedCost),
        keywords: items.length,
        contentCost: urlContentCost,
      });
    });

    // Sort by revenue loss (highest first)
    urlDetails.sort((a, b) => b.estimatedRevenueLoss - a.estimatedRevenueLoss);

    return {
      estimatedRevenueLoss: Math.round(cappedRevenueLoss),
      urlsWithMismatch: mismatchUrls.length,
      totalUrls: urlMap.size,
      summary: {
        totalRevenueLoss: Math.round(cappedRevenueLoss),
        urlsWithMismatch: mismatchUrls.length,
        tooltip: {
          title: "Keyword Mismatch Content Investment Waste",
          content: `This measures content investment wasted due to keyword targeting misalignment. We analyzed ${
            urlMap.size
          } URLs and found ${
            mismatchUrls.length
          } with keyword mismatch issues. These pages represent $${Math.round(
            cappedRevenueLoss
          ).toLocaleString()} in wasted content investment (${
            mismatchWastePercentage * 100
          }% waste rate on affected pages).`,
        },
      },
      urlDetails: urlDetails.slice(0, 10), // Top 10 worst performers
    };
  };
  const getLinkDilutionRisk = ({
    defaultAvgContentCost = 400, // Default $400 if no URLs
    dilutionWastePercentage = 0.15, // 15% waste of content investment for dilution (less than mismatch)
    maxLossCap = 0.02, // Cap at 2% of total investment
    dilutionScoreThreshold = 0.01, // Threshold for high dilution score
  } = {}) => {
    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      console.error("❌ getLinkDilutionRisk: AOV not available, returning 0");
      return {
        estimatedRevenueLoss: 0,
        urlsWithDilution: 0,
        totalUrls: (linkDilution || []).length,
      };
    }

    if (!totalContentCost || totalContentCost === 0) {
      console.error(
        "❌ getLinkDilutionRisk: Total content cost not available, returning 0"
      );
      return {
        estimatedRevenueLoss: 0,
        urlsWithDilution: 0,
        totalUrls: (linkDilution || []).length,
      };
    }

    const dilutionData = linkDilution || [];

    // Calculate average content cost per URL
    const totalUrls = (contentCostWaste || []).length;
    const avgContentCost =
      totalUrls > 0 ? totalContentCost / totalUrls : defaultAvgContentCost;

    // Filter URLs with high dilution
    const highDilutionUrls = dilutionData.filter((item) => {
      const dilutionScore = parseFloat(item.dilutionScore) || 0;
      const estimatedLoss =
        item.estimatedLoss?.high || item.estimatedLoss?.mid || 0;
      return dilutionScore > dilutionScoreThreshold || estimatedLoss > 0;
    });

    // Calculate total revenue loss using content cost methodology
    const totalRevenueLoss =
      highDilutionUrls.length * avgContentCost * dilutionWastePercentage;

    // Cap at maxLossCap% of total investment
    const maxLoss = totalContentCost * maxLossCap;
    const cappedRevenueLoss = Math.min(totalRevenueLoss, maxLoss);

    const urlDetails = [];
    highDilutionUrls.forEach((item) => {
      const dilutionScore = parseFloat(item.dilutionScore) || 0;
      const urlContentCost = avgContentCost;
      const urlWastedCost = urlContentCost * dilutionWastePercentage;

      urlDetails.push({
        url: item.url,
        dilutionScore: Math.round(dilutionScore * 10000) / 100, // Convert to percentage
        externalLinks: item.externalLinks || 0,
        internalLinks: item.internalLinks || 0,
        clicks: parseInt(item.clicks) || 0,
        estimatedRevenueLoss: Math.round(urlWastedCost),
        contentCost: urlContentCost,
      });
    });

    // Sort by revenue loss (highest first)
    urlDetails.sort((a, b) => b.estimatedRevenueLoss - a.estimatedRevenueLoss);

    return {
      estimatedRevenueLoss: Math.round(cappedRevenueLoss),
      urlsWithDilution: highDilutionUrls.length,
      totalUrls: dilutionData.length,
      summary: {
        totalRevenueLoss: Math.round(cappedRevenueLoss),
        urlsWithDilution: highDilutionUrls.length,
        tooltip: {
          title: "Link Dilution Content Investment Waste",
          content: `This measures content investment wasted due to dispersed link equity. We analyzed ${
            dilutionData.length
          } URLs and found ${
            highDilutionUrls.length
          } with link dilution issues. These pages represent $${Math.round(
            cappedRevenueLoss
          ).toLocaleString()} in wasted content investment (${
            dilutionWastePercentage * 100
          }% waste rate on affected pages).`,
        },
      },
      urlDetails: urlDetails.slice(0, 10), // Top 10 worst performers
    };
  };
  const getCannibalRisk = ({
    defaultAvgContentCost = 400, // Default $400 if no URLs
    cannibalWastePercentage = 0.25, // 25% waste of content investment for cannibalization (higher than others)
    maxLossCap = 0.04, // Cap at 4% of total investment (higher than others due to severity)
  } = {}) => {
    // Get AOV and Total Cost from onboardingData, throw error if not available
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    if (!averageOrderValue || averageOrderValue === 0) {
      console.error("❌ getCannibalRisk: AOV not available, returning 0");
      return {
        estimatedRevenueLoss: 0,
        cannibalConflicts: 0,
        totalKeywords: (cannibalization || []).length,
      };
    }

    if (!totalContentCost || totalContentCost === 0) {
      console.error(
        "❌ getCannibalRisk: Total content cost not available, returning 0"
      );
      return {
        estimatedRevenueLoss: 0,
        cannibalConflicts: 0,
        totalKeywords: (cannibalization || []).length,
      };
    }

    const cannibalizationData = cannibalization || [];

    // Calculate average content cost per URL
    const totalUrls = (contentCostWaste || []).length;
    const avgContentCost =
      totalUrls > 0 ? totalContentCost / totalUrls : defaultAvgContentCost;

    // Filter keywords with cannibalization conflicts
    const cannibalConflicts = cannibalizationData.filter((item) => {
      const competingUrls = item.competingUrls || [];
      return competingUrls.length > 0;
    });

    // Count affected URLs (primary + competing)
    let totalAffectedUrls = 0;
    cannibalConflicts.forEach((item) => {
      const competingUrls = item.competingUrls || [];
      totalAffectedUrls += 1 + competingUrls.length; // primary + competing
    });

    const totalRevenueLoss =
      totalAffectedUrls * avgContentCost * cannibalWastePercentage;

    // Cap at maxLossCap% of total investment
    const maxLoss = totalContentCost * maxLossCap;
    const cappedRevenueLoss = Math.min(totalRevenueLoss, maxLoss);

    const conflictDetails = [];
    cannibalConflicts.forEach((item) => {
      const competingUrls = item.competingUrls || [];
      const competingCount = competingUrls.length;

      // Calculate per-conflict waste
      const affectedUrlsInConflict = 1 + competingCount;
      const conflictWaste =
        affectedUrlsInConflict * avgContentCost * cannibalWastePercentage;

      const primaryImpressions = item.primaryUrl?.impressions || 0;
      const primaryClicks = item.primaryUrl?.clicks || 0;

      // Total competing impressions
      const totalCompetingImpressions = competingUrls.reduce(
        (sum, url) => sum + (url.impressions || 0),
        0
      );

      const currentClicks =
        primaryClicks +
        competingUrls.reduce((sum, url) => sum + (url.clicks || 0), 0);

      conflictDetails.push({
        keyword: item.keyword,
        primaryUrl: item.primaryUrl?.url || "N/A",
        competingCount,
        primaryImpressions,
        totalCompetingImpressions,
        currentClicks,
        estimatedRevenueLoss: Math.round(conflictWaste),
        affectedUrls: affectedUrlsInConflict,
        contentCost: avgContentCost,
      });
    });

    // Sort by revenue loss (highest first)
    conflictDetails.sort(
      (a, b) => b.estimatedRevenueLoss - a.estimatedRevenueLoss
    );

    return {
      estimatedRevenueLoss: Math.round(cappedRevenueLoss),
      cannibalConflicts: cannibalConflicts.length,
      totalKeywords: cannibalizationData.length,
      summary: {
        totalRevenueLoss: Math.round(cappedRevenueLoss),
        cannibalConflicts: cannibalConflicts.length,
        tooltip: {
          title: "Keyword Cannibalization Content Investment Waste",
          content: `This measures content investment wasted due to keyword competition between your own pages. We analyzed ${
            cannibalizationData.length
          } keywords and found ${
            cannibalConflicts.length
          } with cannibalization issues affecting ${totalAffectedUrls} URLs. These conflicts represent $${Math.round(
            cappedRevenueLoss
          ).toLocaleString()} in wasted content investment (${
            cannibalWastePercentage * 100
          }% waste rate on affected pages).`,
        },
      },
      conflictDetails: conflictDetails.slice(0, 10), // Top 10 worst conflicts
    };
  };

  const getCrawlErrorPercentage = () => {
    // Calculate crawl error percentage based on available data
    const totalUrls = (contentCostWaste || []).length;
    const errorUrls = (notFoundPages || []).length;

    if (totalUrls === 0) {
      return {
        errorPercentage: 0,
        totalUrls: 0,
        errorUrls: 0,
      };
    }

    const errorPercentage = (errorUrls / totalUrls) * 100;

    return {
      errorPercentage: Math.round(errorPercentage * 100) / 100, // Round to 2 decimal places
      totalUrls,
      errorUrls,
      summary: {
        tooltip: {
          title: "Crawl Error Analysis",
          content: `Found ${errorUrls} pages with crawl errors out of ${totalUrls} total URLs (${
            Math.round(errorPercentage * 100) / 100
          }% error rate). Crawl errors prevent search engines from indexing your content, leading to lost visibility and traffic.`,
        },
      },
    };
  };
  const getTotalWastedSpend = ({
    discountRate = 0.1, // 10% WACC
    timeHorizon = 700 / 365.0, // ~1.92 years
    salvageRate = 0.0, // Assume full write-off for now
    ctrThreshold = 0.005, // CTR < 0.5% considered waste
    maxLossCap = 0.02, // Cap at 2% of total investment for optics
  } = {}) => {
    const averageOrderValue =
      calculations.averageOrderValue ||
      onboardingData?.domainCostDetails?.averageOrderValue;

    const totalContentCost = onboardingData?.domainCostDetails?.totalInvested;

    const wasteData = contentCostWaste || [];
    const totalUrls = wasteData.length;

    if (
      !averageOrderValue ||
      averageOrderValue === 0 ||
      !totalContentCost ||
      totalContentCost === 0
    ) {
      console.error(
        "❌ getTotalWastedSpend: Missing AOV or total content cost, returning 0"
      );
      return {
        totalWastedSpend: 0,
        wastePages: 0,
        totalUrls,
      };
    }

    // Calculate PV factor for financial modeling
    const pvFactor = (1 - Math.exp(-discountRate * timeHorizon)) / discountRate;

    const costPerUrl = totalContentCost / totalUrls;

    // Determine waste pages using defined signals
    const wastePages = wasteData.filter((item) => {
      const wastedSpend = parseFloat(item.wastedSpend) || 0;
      const roi = parseFloat(item.roi) || 0;
      const ctr = parseFloat(item.ctr) || 0;

      return wastedSpend > 0 || roi < 0 || ctr < ctrThreshold;
    });

    // Stranded CAPEX: costPerUrl × (1 - salvageRate) × PV factor
    const strandedCapexLossPerUrl = costPerUrl * (1 - salvageRate) * pvFactor;
    const totalStrandedLoss = strandedCapexLossPerUrl * wastePages.length;

    // Cap at maxLossCap% of total investment
    const maxLoss = totalContentCost * maxLossCap;
    const cappedLoss = Math.min(totalStrandedLoss, maxLoss);

    return {
      totalWastedSpend: Math.round(cappedLoss),
      wastePages: wastePages.length,
      totalUrls,
      summary: {
        tooltip: {
          title: "Stranded Content Investment (Wasted Spend)",
          content: `Identified ${
            wastePages.length
          } pages with zero or poor engagement (CTR < 0.5%, ROI < 0). Estimated write-down is $${Math.round(
            cappedLoss
          ).toLocaleString()}, representing unrecoverable CAPEX on non-performing content assets.`,
        },
        calculationDetails: {
          costPerUrl: Math.round(costPerUrl),
          salvageRate,
          pvFactor,
          formula:
            "Loss = Cost Per URL × (1 - Salvage Rate) × PV Factor × Affected Pages",
          cappedAt:
            "$" + maxLoss.toLocaleString() + " (2% of total investment)",
        },
      },
    };
  };

  const getContentWastePages = () => {
    // Get count of content waste pages from contentCostWaste data
    const wasteData = contentCostWaste || [];

    if (wasteData.length === 0) {
      return {
        wastePages: 0,
        totalUrls: 0,
        wastePercentage: 0,
      };
    }

    const wastePages = wasteData.filter((item) => {
      const roi = parseFloat(item.roi) || 0;
      const wastedSpend = parseFloat(item.wastedSpend) || 0;
      return roi < 0 || wastedSpend > 0;
    }).length;

    const wastePercentage = (wastePages / wasteData.length) * 100;

    return {
      wastePages,
      totalUrls: wasteData.length,
      wastePercentage: Math.round(wastePercentage * 100) / 100,
      summary: {
        tooltip: {
          title: "Content Waste Pages Analysis",
          content: `Found ${wastePages} underperforming pages out of ${
            wasteData.length
          } total URLs (${
            Math.round(wastePercentage * 100) / 100
          }% waste rate). These pages require optimization to improve ROI and reduce content investment waste.`,
        },
      },
    };
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
        categoriseIntoBuckets,
        getRiskMetric,
        getRevenueLeak,
        getContentDecay,
        getKeywordMismatch,
        getLinkDilution,
        getPsychMismatch,
        getCannibalizationLoss,
        calculateTotalLoss,
        funnelGapIdentifier,
        getContentQualityDistribution,
        getMoodyCreditScore,
        getROIRecoveryPotential,
        getKeywordConflicts,
        getHighCTRLeak,
        getMismatchRisk,
        getLinkDilutionRisk,
        getCannibalRisk,
        getCrawlErrorPercentage,
        getTotalWastedSpend,
        getContentWastePages,
        processGSCDataForCalculations,
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
