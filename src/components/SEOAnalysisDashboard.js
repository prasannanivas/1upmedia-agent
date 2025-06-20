import React, { useEffect, useState } from "react";
import {
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaMoneyBillWave,
  FaLink,
  FaSearch,
  FaExchangeAlt,
  FaCheck,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./SEOAnalysisDashboard.css";
import { calculateNotFoundImpact } from "../utils/financialCalculations";

const SEOAnalysisDashboard = ({ analysisData, onboardingData = {} }) => {
  const [expandedDilution, setExpandedDilution] = useState(false);
  const [expandedCannibalization, setExpandedCannibalization] = useState(false);
  const [expandedContentDecay, setExpandedContentDecay] = useState(false);
  const [expandedNotFoundPages, setExpandedNotFoundPages] = useState(false);

  // Get total cost spent from onboarding data
  const [totalCostSpent, setTotalCostSpent] = useState(
    parseFloat(onboardingData.domainCostDetails?.totalInvested || 500)
  );

  const [expandedContentCostWaste, setExpandedContentCostWaste] =
    useState(false);

  console.log("Onboarding Data:", onboardingData.domainCostDetails);

  useEffect(() => {
    setTotalCostSpent(
      parseFloat(onboardingData.domainCostDetails?.totalInvested || 500)
    );
  }, [onboardingData]);

  // Sorting and filtering states
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterText, setFilterText] = useState("");
  const [activeSection, setActiveSection] = useState("all");

  if (!analysisData || Object.keys(analysisData).length === 0) {
    return (
      <div className="seo-dashboard-loading">Loading analysis data...</div>
    );
  }
  const {
    gscConnected = false,
    gaConnected = false,
    keywordMismatch = [],
    cannibalization = [],
    linkDilution = [],
    contentCostWaste = [], // <-- NEW
    notFoundPages = [], // (optional, for future use)
    gaData = {}, // Google Analytics data
  } = analysisData;

  const contentDecay = analysisData.contentDecay.decay30Days || []; // Ensure contentCostWaste is defined,

  // Extract GA insights when available
  const gaInsights = gaData?.insights || {};
  const gaSummary = gaInsights?.summary || {};
  const gaTopPerformers = gaInsights?.topPerformers || {};
  const gaProblemAreas = gaInsights?.problemAreas || {};

  console.log("SEO Analysis Data:", analysisData);
  console.log("GA Data:", gaData);
  // Helper function to calculate loss percentage from sample data
  const calculateSampleLossPercentage = (
    sampleData,
    metric = "wastedSpend"
  ) => {
    if (!Array.isArray(sampleData) || sampleData.length === 0) return 0;

    const totalSampleCost = sampleData.reduce(
      (sum, item) => sum + (item.contentCost || 0),
      0
    );
    const totalSampleLoss = sampleData.reduce(
      (sum, item) => sum + (item[metric] || 0),
      0
    );

    return totalSampleCost > 0 ? (totalSampleLoss / totalSampleCost) * 100 : 0;
  };

  // Calculate loss percentages from sample data and apply to total cost
  // This approach is more accurate than using backend dollar amounts which may be estimated
  const wastePercentage = calculateSampleLossPercentage(
    contentCostWaste,
    "wastedSpend"
  );

  // Helper functions for content decay analysis
  const getSeverityScore = (decayStatus) => {
    const scores = {
      "Severe-Decay": 4,
      "Moderate-Decay": 3,
      "Light-Decay": 2,
      Stable: 1,
    };
    return scores[decayStatus] || 1;
  };

  const getSeverityMultiplier = (decayStatus) => {
    const multipliers = {
      "Severe-Decay": 0.8,
      "Moderate-Decay": 0.6,
      "Light-Decay": 0.4,
      Stable: 0.1,
    };
    return multipliers[decayStatus] || 0.1;
  };

  // Content Decay Analysis - Implemented directly in dashboard
  const getContentDecay = () => {
    console.log(onboardingData?.domainCostDetails);
    // Use contentCostWaste.length for total unique URLs
    const totalUniqueUrls = contentCostWaste.length || 1; // Prevent division by zero

    // Get AOV and Total Cost from onboardingData
    const averageOrderValue = parseFloat(
      onboardingData?.businessGoals?.averageOrderValue ||
        onboardingData?.domainCostDetails?.averageOrderValue ||
        100
    );

    const totalContentCost = parseFloat(
      onboardingData?.domainCostDetails?.totalInvested || totalCostSpent || 500
    );

    if (!averageOrderValue || averageOrderValue === 0) {
      console.warn(
        "Average Order Value (AOV) is required but not available. Using default value of $100."
      );
    }

    if (!totalContentCost || totalContentCost === 0) {
      console.warn(
        "Total Content Cost is required but not available. Using default value of $500."
      );
    }

    const conversionRate = 0.02; // 2% conversion rate (more realistic)

    // Get decay data from different timeframes
    const decay30Days = analysisData?.contentDecay?.decay30Days || [];
    const decay60Days = analysisData?.contentDecay?.decay60Days || [];
    const decay90Days = analysisData?.contentDecay?.decay90Days || [];

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
        urlRevenueLoss = potentialRevenue * severityMultiplier; // Add base content cost waste for pages with decay
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

  // Revenue Leak Analysis - Implemented directly in dashboard
  const calculateRevenueLeak = () => {
    // Get business metrics from onboarding data
    const conversionRate = parseFloat(
      onboardingData.businessGoals?.conversionRate || 0.02
    );
    const averageOrderValue = parseFloat(
      onboardingData.businessGoals?.averageOrderValue || 100
    );

    // Validate business metrics
    if (conversionRate <= 0 || averageOrderValue <= 0) {
      return {
        totalUrls: 0,
        zeroClicksCount: 0,
        threshold: 0,
        urlsBelowThreshold: 0,
        estimatedRevenueLoss: 0,
        averageOrderValue,
        contentCost: totalCostSpent,
        conversionRate,
        tooltip: {
          title: "Revenue Leak Analysis",
          content:
            "Unable to calculate revenue leak - missing business metrics (conversion rate or AOV).",
        },
        details: {
          costPerUrl: 0,
          thresholdFormula: "Missing conversion rate or AOV",
          roiCalculation:
            "ROI Factor: (actual_clicks - threshold_clicks) / threshold_clicks",
          revenueLossFormula: "ROI Factor * Cost Per URL",
        },
      };
    }

    const allUrls = [...(contentCostWaste || [])];

    // Remove duplicates based on URL
    const uniqueUrls = allUrls.filter(
      (url, index, self) => index === self.findIndex((u) => u.url === url.url)
    );

    const totalUrls = uniqueUrls.length || 1; // Prevent division by zero

    // Calculate cost per URL (this is the key fix!)
    const costPerUrl = totalCostSpent / totalUrls;

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
      contentCost: totalCostSpent,
      conversionRate,
      tooltip: {
        title: "Revenue Leak Analysis",
        content: `This measures how much revenue you're losing from underperforming content. We calculate the break-even threshold (${Math.round(
          threshold
        )} clicks per URL) based on your content costs and AOV. URLs getting fewer clicks than this threshold are losing money. Out of ${totalUrls} URLs, ${urlsBelowThreshold} are underperforming, representing $${Math.round(
          Math.abs(totalEstimatedRevenueLoss)
        ).toLocaleString()} in potential revenue loss.`,
      },
      details: {
        costPerUrl: Math.round(costPerUrl),
        thresholdFormula: `$${Math.round(
          costPerUrl
        )} / (${conversionRate} * $${averageOrderValue}) = ${Math.round(
          threshold
        )} clicks needed for break-even per URL`,
        roiCalculation:
          "ROI Factor: (actual_clicks - threshold_clicks) / threshold_clicks",
        revenueLossFormula: "ROI Factor * Cost Per URL",
      },
    };
  };

  const totalContentCost =
    onboardingData.domainCostDetails?.totalInvested || 500; // Calculate revenue leak data
  const revenueLeak = calculateRevenueLeak();

  console.log("Revenue Leak Data:", revenueLeak);

  // Calculate content decay data using the new function
  const contentDecayData = getContentDecay();
  console.log("Content Decay Data:", contentDecayData);

  const totalWastedSpend = revenueLeak.estimatedRevenueLoss;
  const totalRevenueLoss = contentDecayData.summary.totalRevenueLoss; // Calculate Overall ROI using simplified formula
  // Overall ROI = Content Cost Waste / Total Content Investment * 100
  const totalROI = (() => {
    // Calculate ROI as waste percentage of total investment
    const roiPercentage = (totalWastedSpend / totalContentCost) * 100;

    return roiPercentage.toFixed(2);
  })();
  const estimatedLossFromNotFound =
    Array.isArray(notFoundPages) && notFoundPages.length > 0
      ? calculateNotFoundImpact(
          { ...onboardingData, GSCAnalysisData: analysisData },
          notFoundPages
        )?.toFixed(2)
      : "0.00";

  console.log("Estimated Loss from Not Found Pages:", keywordMismatch);

  const totalMissedClicks = Array.isArray(keywordMismatch)
    ? keywordMismatch.reduce((sum, item) => sum + (item.missedClicks || 0), 0)
    : 0;

  const cannibalizedKeywords = Array.isArray(cannibalization)
    ? cannibalization.length
    : 0;

  console.log("ld", linkDilution, analysisData.linkDilutionSummary);

  console.log(
    "ldld",
    linkDilution.filter((item) => item.dilutionScore > 0.001)
  );
  const dilutedPages =
    (linkDilution.filter((item) => item.dilutionScore > 0.001).length * 100) /
    linkDilution.length;

  /**
   * Handles sorting configuration for table columns
   * @param {string} key - The property key to sort by
   */
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /**
   * Sorts array data by specified key and direction
   * @param {Array} data - Array of objects to sort
   * @param {string} key - Property key to sort by (supports nested keys with dot notation)
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted array
   */
  const sortData = (data, key, direction) => {
    if (!key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle nested properties (e.g., 'estimatedLoss.mid')
      if (key.includes(".")) {
        const keys = key.split(".");
        aValue = keys.reduce((obj, k) => obj?.[k], a);
        bValue = keys.reduce((obj, k) => obj?.[k], b);
      }

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  /**
   * Filters array data based on search text
   * @param {Array} data - Array of objects to filter
   * @param {string} searchText - Text to search for in object values
   * @returns {Array} Filtered array
   */
  const filterData = (data, searchText) => {
    if (!searchText) return data;

    return data.filter((item) => {
      const searchLower = searchText.toLowerCase();
      return Object.values(item).some(
        (value) => value && value.toString().toLowerCase().includes(searchLower)
      );
    });
  };

  /**
   * Formats a number as currency (USD)
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --- NEW: Animated Progress for Summary Cards ---
  // Calculate max for progress bars
  const maxWastedSpend = Math.max(
    ...contentCostWaste.map((i) => i.wastedSpend || 0),
    1
  );
  const maxMissedClicks = 100; // Placeholder, since keywordMismatch is empty in your data
  const maxCannibalized = 10; // Arbitrary, can be set dynamically
  const maxDiluted = linkDilution.length || 1;
  // --- NEW: Helper for animated progress bar ---
  /**
   * Renders an animated progress bar component
   * @param {Object} props - Component props
   * @param {number} props.value - Current progress value
   * @param {number} props.max - Maximum progress value
   * @param {string} props.color - Progress bar color
   * @param {string} props.label - Optional label for the progress bar
   * @returns {JSX.Element} Progress bar component
   */
  const ProgressBar = ({ value, max, color, label }) => (
    <div className="seo-dashboard-summary-progress">
      <div
        className="seo-dashboard-summary-progress-bar"
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          background: color,
        }}
      ></div>
      {label && (
        <span className="seo-dashboard-summary-progress-label">{label}</span>
      )}
    </div>
  );

  return (
    <div className="seo-dashboard-analysis-dashboard">
      <div className="seo-dashboard-header">
        <h2>SEO Analysis Results</h2>
        <div className="seo-dashboard-connection-status">
          <div
            className={`seo-dashboard-status-indicator ${
              gscConnected
                ? "seo-dashboard-connected"
                : "seo-dashboard-disconnected"
            }`}
          >
            <span className="seo-dashboard-status-dot"></span>
            Google Search Console: {gscConnected ? "Connected" : "Disconnected"}
          </div>
          <div
            className={`seo-dashboard-status-indicator ${
              gaConnected
                ? "seo-dashboard-connected"
                : "seo-dashboard-disconnected"
            }`}
          >
            <span className="seo-dashboard-status-dot"></span>
            Google Analytics: {gaConnected ? "Connected" : "Disconnected"}
          </div>{" "}
        </div>
      </div>
      {/* Methodology Information Banner */}
      {(contentCostWaste.length > 0 || contentDecay.length > 0) &&
        totalCostSpent > 0 && (
          <div
            className="seo-dashboard-methodology-banner"
            style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              padding: "12px 16px",
              margin: "16px 0",
              fontSize: "14px",
              color: "#6c757d",
            }}
          >
            <FaExclamationTriangle
              style={{ color: "#ffc107", marginRight: "8px" }}
            />
            <strong>Sample-Based Analysis:</strong> Loss calculations are
            derived from {contentCostWaste.length} analyzed pages and
            extrapolated to your total investment of $
            {formatCurrency(totalCostSpent)} for more accurate estimates.
          </div>
        )}
      <div className="seo-dashboard-summary">
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-money-waste">
            <FaMoneyBillWave />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Content Cost Waste</h3>
            <p className="seo-dashboard-summary-value">
              ${totalWastedSpend}
              <span className="seo-dashboard-summary-unit">USD</span>
            </p>
            <ProgressBar
              value={parseFloat(totalWastedSpend)}
              max={maxWastedSpend}
              color="#ff6b6b"
              label={`Max: $${maxWastedSpend}`}
            />{" "}
            <p className="seo-dashboard-summary-description">
              <FaExclamationTriangle
                style={{ color: "#ff6b6b", marginRight: 4 }}
              />
              {wastePercentage > 0
                ? `${wastePercentage.toFixed(1)}% waste rate from ${
                    contentCostWaste.length
                  } sample pages. Extrapolated to total investment.`
                : "Total wasted content spend. Review underperforming pages to optimize ROI."}
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-missed-clicks">
            <FaSearch />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Missed Clicks</h3>
            <p className="seo-dashboard-summary-value">
              {totalMissedClicks}
              <span className="seo-dashboard-summary-unit">Clicks</span>
            </p>
            <ProgressBar
              value={totalMissedClicks}
              max={maxMissedClicks}
              color="#4facfe"
              label={`Goal: ${maxMissedClicks}`}
            />
            <p className="seo-dashboard-summary-description">
              <FaArrowDown style={{ color: "#4facfe", marginRight: 4 }} />
              Potential traffic missed. Target these keywords for quick wins.
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-cannibalization">
            <FaExchangeAlt />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Cannibalization</h3>
            <p className="seo-dashboard-summary-value">
              {cannibalizedKeywords}
              <span className="seo-dashboard-summary-unit">Keywords</span>
            </p>
            <ProgressBar
              value={cannibalizedKeywords}
              max={maxCannibalized}
              color="#f093fb"
              label={`Max: ${maxCannibalized}`}
            />
            <p className="seo-dashboard-summary-description">
              <FaExchangeAlt style={{ color: "#f093fb", marginRight: 4 }} />
              Keywords with competing pages. Consolidate content to improve
              rankings.
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-dilution">
            <FaLink />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Link Dilution</h3>
            <p className="seo-dashboard-summary-value">
              {Math.round(dilutedPages, 2)}
              <span className="seo-dashboard-summary-unit">%</span>
            </p>
            <ProgressBar
              value={dilutedPages}
              max={maxDiluted}
              color="#43e97b"
              label={`Total: ${maxDiluted}`}
            />
            <p className="seo-dashboard-summary-description">
              <FaLink style={{ color: "#43e97b", marginRight: 4 }} />
              Pages with diluted link equity. Improve internal linking
              structure.
            </p>
          </div>{" "}
        </div>
        {/* Additional Financial Summary Cards */}
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-revenue-loss">
            <FaChartLine />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Content Decay Loss</h3>
            <p className="seo-dashboard-summary-value">
              {formatCurrency(totalRevenueLoss)}
              <span className="seo-dashboard-summary-unit">USD</span>
            </p>
            <ProgressBar
              value={parseFloat(totalRevenueLoss)}
              max={1000}
              color="#f87171"
              label="Revenue Impact"
            />{" "}
            <p className="seo-dashboard-summary-description">
              <FaArrowDown style={{ color: "#f87171", marginRight: 4 }} />
              {contentDecayData.summary.urlsWithDecay > 0
                ? `${contentDecayData.summary.decayPercentage}% decay rate from ${contentDecayData.summary.totalUrlsAnalyzed} analyzed URLs. ${contentDecayData.summary.totalClicksLost} clicks lost.`
                : "Revenue lost due to content performance decay."}
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-total-cost">
            <FaMoneyBillWave />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Total Content Investment</h3>
            <p className="seo-dashboard-summary-value">
              {formatCurrency(totalContentCost)}
              <span className="seo-dashboard-summary-unit">USD</span>
            </p>
            <ProgressBar
              value={parseFloat(totalContentCost)}
              max={Math.max(parseFloat(totalContentCost), 1000)}
              color="#fbbf24"
              label="Total Investment"
            />
            <p className="seo-dashboard-summary-description">
              <FaMoneyBillWave style={{ color: "#fbbf24", marginRight: 4 }} />
              Total content creation and optimization investment.
            </p>
          </div>
        </div>{" "}
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-roi">
            <FaArrowUp />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Overall ROI</h3>
            <p className="seo-dashboard-summary-value">
              {totalROI}%
              <span className="seo-dashboard-summary-unit">Return</span>
            </p>
            <ProgressBar
              value={Math.abs(parseFloat(totalROI))}
              max={100}
              color={parseFloat(totalROI) >= 0 ? "#22c55e" : "#f87171"}
              label={
                parseFloat(totalROI) >= 0 ? "Positive ROI" : "Negative ROI"
              }
            />{" "}
            <p className="seo-dashboard-summary-description">
              {parseFloat(totalROI) >= 0 ? (
                <FaArrowUp style={{ color: "#22c55e", marginRight: 4 }} />
              ) : (
                <FaArrowDown style={{ color: "#f87171", marginRight: 4 }} />
              )}
              Overall return on content investment.
            </p>
          </div>{" "}
        </div>
      </div>
      {/* Google Analytics Insights Section */}
      {gaConnected && gaInsights && Object.keys(gaInsights).length > 0 && (
        <div className="seo-dashboard-section">
          <h3 className="seo-dashboard-section-title">
            <FaChartLine style={{ color: "#4285f4", marginRight: 8 }} />
            Google Analytics Insights
            <span
              style={{
                marginLeft: 12,
                fontSize: "1rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              ({gaSummary.totalUrls || 0} URLs • {gaSummary.totalSessions || 0}{" "}
              Sessions)
            </span>
          </h3>

          {/* GA Summary Cards */}
          <div className="seo-dashboard-summary">
            <div className="seo-dashboard-summary-card">
              <div
                className="seo-dashboard-summary-icon"
                style={{ backgroundColor: "#4285f4" }}
              >
                <FaSearch />
              </div>
              <div className="seo-dashboard-summary-content">
                <h3>Total Sessions</h3>
                <p className="seo-dashboard-summary-value">
                  {(gaSummary.totalSessions || 0).toLocaleString()}
                  <span className="seo-dashboard-summary-unit">Sessions</span>
                </p>
                <ProgressBar
                  value={gaSummary.totalSessions || 0}
                  max={(gaSummary.totalSessions || 0) * 1.2}
                  color="#4285f4"
                  label="Traffic"
                />
                <p className="seo-dashboard-summary-description">
                  <FaArrowUp style={{ color: "#4285f4", marginRight: 4 }} />
                  Total user sessions across all pages
                </p>
              </div>
            </div>{" "}
            <div className="seo-dashboard-summary-card">
              <div
                className="seo-dashboard-summary-icon"
                style={{ backgroundColor: "#34a853" }}
              >
                <FaEye />
              </div>
              <div className="seo-dashboard-summary-content">
                <h3>Total Page Views</h3>
                <p className="seo-dashboard-summary-value">
                  {(gaSummary.totalPageViews || 0).toLocaleString()}
                  <span className="seo-dashboard-summary-unit">Views</span>
                </p>
                <ProgressBar
                  value={gaSummary.totalPageViews || 0}
                  max={(gaSummary.totalPageViews || 0) * 1.2}
                  color="#34a853"
                  label="Page Views"
                />
                <p className="seo-dashboard-summary-description">
                  <FaEye style={{ color: "#34a853", marginRight: 4 }} />
                  Total page views across all pages
                </p>
              </div>
            </div>
            <div className="seo-dashboard-summary-card">
              <div
                className="seo-dashboard-summary-icon"
                style={{ backgroundColor: "#fbbc04" }}
              >
                <FaExchangeAlt />
              </div>
              <div className="seo-dashboard-summary-content">
                <h3>Engagement Rate</h3>
                <p className="seo-dashboard-summary-value">
                  {((gaSummary.overallEngagementRate || 0) * 100).toFixed(1)}%
                  <span className="seo-dashboard-summary-unit">Rate</span>
                </p>
                <ProgressBar
                  value={(gaSummary.overallEngagementRate || 0) * 100}
                  max={100}
                  color="#fbbc04"
                  label="Engagement"
                />
                <p className="seo-dashboard-summary-description">
                  <FaExchangeAlt style={{ color: "#fbbc04", marginRight: 4 }} />
                  Average user engagement across all pages
                </p>
              </div>
            </div>
            <div className="seo-dashboard-summary-card">
              <div
                className="seo-dashboard-summary-icon"
                style={{ backgroundColor: "#ea4335" }}
              >
                <FaArrowDown />
              </div>
              <div className="seo-dashboard-summary-content">
                <h3>Avg Session Duration</h3>
                <p className="seo-dashboard-summary-value">
                  {gaSummary.avgSessionDuration || 0}s
                  <span className="seo-dashboard-summary-unit">Seconds</span>
                </p>
                <ProgressBar
                  value={gaSummary.avgSessionDuration || 0}
                  max={Math.max((gaSummary.avgSessionDuration || 0) * 2, 60)}
                  color="#ea4335"
                  label="Duration"
                />
                <p className="seo-dashboard-summary-description">
                  <FaArrowDown style={{ color: "#ea4335", marginRight: 4 }} />
                  Average time users spend on site
                </p>
              </div>
            </div>
          </div>

          {/* Top Performers Section */}
          {gaTopPerformers.byTraffic &&
            gaTopPerformers.byTraffic.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h4
                  style={{
                    color: "#374151",
                    marginBottom: "16px",
                    fontSize: "1.2rem",
                  }}
                >
                  🏆 Top Performing Pages
                </h4>
                <div className="seo-dashboard-table-container">
                  <table className="seo-dashboard-data-table">
                    <thead>
                      <tr>
                        <th>Page URL</th>
                        <th>Sessions</th>
                        <th>Page Views</th>
                        <th>Engagement Rate</th>
                        <th>Bounce Rate</th>
                        <th>Est. ROI</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gaTopPerformers.byTraffic.slice(0, 5).map((page, i) => (
                        <tr key={i}>
                          <td className="seo-dashboard-url-cell">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#4285f4", fontWeight: "bold" }}
                            >
                              {page.url}
                            </a>
                          </td>
                          <td style={{ fontWeight: 600, color: "#4285f4" }}>
                            {(page.sessions || 0).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {(page.pageViews || 0).toLocaleString()}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                backgroundColor:
                                  (page.engagementRate || 0) > 0.6
                                    ? "#dcfce7"
                                    : (page.engagementRate || 0) > 0.3
                                    ? "#fef3c7"
                                    : "#fef2f2",
                                color:
                                  (page.engagementRate || 0) > 0.6
                                    ? "#16a34a"
                                    : (page.engagementRate || 0) > 0.3
                                    ? "#ca8a04"
                                    : "#dc2626",
                              }}
                            >
                              {((page.engagementRate || 0) * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ color: "#64748b" }}>
                            {((page.bounceRate || 0) * 100).toFixed(1)}%
                          </td>
                          <td style={{ fontWeight: 600, color: "#34a853" }}>
                            $
                            {(
                              page.estimatedRevenue * 0.03 || 0
                            ).toLocaleString()}
                          </td>
                          <td>
                            <span
                              className={`seo-dashboard-performance-badge`}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                backgroundColor:
                                  page.performanceCategory === "Excellent"
                                    ? "#dcfce7"
                                    : page.performanceCategory === "Good"
                                    ? "#e0f2fe"
                                    : page.performanceCategory === "Average"
                                    ? "#fef3c7"
                                    : "#fef2f2",
                                color:
                                  page.performanceCategory === "Excellent"
                                    ? "#16a34a"
                                    : page.performanceCategory === "Good"
                                    ? "#0284c7"
                                    : page.performanceCategory === "Average"
                                    ? "#ca8a04"
                                    : "#dc2626",
                              }}
                            >
                              {page.performanceCategory || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Problem Areas Section */}
          {gaProblemAreas.lowEngagement &&
            gaProblemAreas.lowEngagement.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h4
                  style={{
                    color: "#374151",
                    marginBottom: "16px",
                    fontSize: "1.2rem",
                  }}
                >
                  ⚠️ Pages Needing Attention
                </h4>
                <div className="seo-dashboard-table-container">
                  <table className="seo-dashboard-data-table">
                    <thead>
                      <tr>
                        <th>Page URL</th>
                        <th>Sessions</th>
                        <th>Engagement Rate</th>
                        <th>Bounce Rate</th>
                        <th>Session Duration</th>
                        <th>Issues</th>
                        <th>Opportunities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gaProblemAreas.lowEngagement
                        .slice(0, 5)
                        .map((page, i) => (
                          <tr key={i}>
                            <td className="seo-dashboard-url-cell">
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#ea4335", fontWeight: "bold" }}
                              >
                                {page.url}
                              </a>
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {(page.sessions || 0).toLocaleString()}
                            </td>
                            <td>
                              <span
                                style={{
                                  color: "#ea4335",
                                  fontWeight: 600,
                                }}
                              >
                                {((page.engagementRate || 0) * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td style={{ color: "#dc2626", fontWeight: 600 }}>
                              {((page.bounceRate || 0) * 100).toFixed(1)}%
                            </td>
                            <td style={{ color: "#64748b" }}>
                              {(page.avgSessionDuration || 0).toFixed(1)}s
                            </td>
                            <td
                              style={{ fontSize: "0.85rem", color: "#dc2626" }}
                            >
                              {(page.issues || []).slice(0, 2).join(", ") ||
                                "None"}
                            </td>
                            <td
                              style={{ fontSize: "0.85rem", color: "#059669" }}
                            >
                              {(page.opportunities || [])
                                .slice(0, 1)
                                .join(", ") || "Review needed"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}
      {/* Revenue Leak Analysis Section */}
      <div className="seo-dashboard-section">
        <h3 className="seo-dashboard-section-title">
          <FaMoneyBillWave style={{ color: "#f87171", marginRight: 8 }} />
          Revenue Leak Analysis
          <span
            style={{
              marginLeft: 12,
              fontSize: "1rem",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            ({revenueLeak.totalUrls} URLs • $
            {Math.abs(revenueLeak.estimatedRevenueLoss).toLocaleString()} Loss)
          </span>
        </h3>

        <div className="seo-dashboard-revenue-leak-container">
          {/* Revenue Leak Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div className="seo-dashboard-summary-card">
              <div className="seo-dashboard-summary-icon seo-dashboard-threshold">
                <FaExclamationTriangle style={{ color: "#fbbf24" }} />
              </div>
              <div className="seo-dashboard-summary-content">
                <h4>Threshold Clicks</h4>
                <p className="seo-dashboard-summary-value">
                  {revenueLeak.threshold}
                  <span className="seo-dashboard-summary-unit">Clicks/URL</span>
                </p>
                <p className="seo-dashboard-summary-description">
                  Break-even clicks needed per URL to cover content costs
                </p>
              </div>
            </div>

            <div className="seo-dashboard-summary-card">
              <div className="seo-dashboard-summary-icon seo-dashboard-underperforming">
                <FaArrowDown style={{ color: "#f87171" }} />
              </div>
              <div className="seo-dashboard-summary-content">
                <h4>Underperforming URLs</h4>
                <p className="seo-dashboard-summary-value">
                  {revenueLeak.urlsBelowThreshold}
                  <span className="seo-dashboard-summary-unit">
                    of {revenueLeak.totalUrls}
                  </span>
                </p>
                <p className="seo-dashboard-summary-description">
                  URLs getting fewer clicks than the break-even threshold
                </p>
              </div>
            </div>

            <div className="seo-dashboard-summary-card">
              <div className="seo-dashboard-summary-icon seo-dashboard-zero-clicks">
                <FaTimes style={{ color: "#ef4444" }} />
              </div>
              <div className="seo-dashboard-summary-content">
                <h4>Zero Clicks</h4>
                <p className="seo-dashboard-summary-value">
                  {revenueLeak.zeroClicksCount}
                  <span className="seo-dashboard-summary-unit">URLs</span>
                </p>
                <p className="seo-dashboard-summary-description">
                  URLs generating no traffic despite content investment
                </p>
              </div>
            </div>

            <div className="seo-dashboard-summary-card">
              <div className="seo-dashboard-summary-icon seo-dashboard-cost-per-url">
                <FaMoneyBillWave style={{ color: "#6366f1" }} />
              </div>
              <div className="seo-dashboard-summary-content">
                <h4>Cost Per URL</h4>
                <p className="seo-dashboard-summary-value">
                  ${revenueLeak.details.costPerUrl}
                  <span className="seo-dashboard-summary-unit">USD</span>
                </p>
                <p className="seo-dashboard-summary-description">
                  Average content investment per URL
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Leak Explanation */}
          <div
            className="seo-dashboard-methodology-banner"
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <FaExclamationTriangle
                style={{ color: "#f59e0b", marginTop: "2px", flexShrink: 0 }}
              />
              <div>
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    color: "#92400e",
                    fontSize: "1.1rem",
                  }}
                >
                  {revenueLeak.tooltip.title}
                </h4>
                <p style={{ margin: 0, color: "#92400e", lineHeight: "1.5" }}>
                  {revenueLeak.tooltip.content}
                </p>
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "0.9rem",
                    color: "#78716c",
                  }}
                >
                  <strong>Calculation:</strong>{" "}
                  {revenueLeak.details.thresholdFormula}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Leak Detailed Analysis */}
          {revenueLeak.urlsBelowThreshold > 0 && (
            <div className="seo-dashboard-table-container">
              <h4 style={{ marginBottom: "16px", color: "#374151" }}>
                Underperforming URLs Analysis
              </h4>
              <table className="seo-dashboard-data-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Actual Clicks</th>
                    <th>Threshold Clicks</th>
                    <th>Gap</th>
                    <th>ROI Factor</th>
                    <th>Revenue Loss</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contentCostWaste
                    .filter((urlData) => {
                      const clicks = urlData.clicks || urlData.impressions || 0;
                      return clicks < revenueLeak.threshold;
                    })
                    .slice(0, 10)
                    .map((urlData, i) => {
                      const clicks = urlData.clicks || urlData.impressions || 0;
                      const gap = clicks - revenueLeak.threshold;
                      const roiFactor = Math.max(
                        -1,
                        gap / revenueLeak.threshold
                      );
                      const urlRevenueLoss =
                        roiFactor * revenueLeak.details.costPerUrl;

                      return (
                        <tr key={i}>
                          <td className="seo-dashboard-url-cell">
                            <a
                              href={urlData.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {new URL(urlData.url).pathname || "/"}
                            </a>
                          </td>
                          <td style={{ fontWeight: 600 }}>{clicks}</td>
                          <td style={{ color: "#64748b" }}>
                            {revenueLeak.threshold}
                          </td>
                          <td
                            style={{
                              color: gap >= 0 ? "#22c55e" : "#f87171",
                              fontWeight: 600,
                            }}
                          >
                            {gap >= 0 ? "+" : ""}
                            {gap}
                          </td>
                          <td
                            style={{
                              color: roiFactor >= 0 ? "#22c55e" : "#f87171",
                              fontWeight: 600,
                            }}
                          >
                            {(roiFactor * 100).toFixed(1)}%
                          </td>
                          <td style={{ color: "#f87171", fontWeight: 600 }}>
                            ${Math.abs(urlRevenueLoss).toFixed(0)}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                backgroundColor:
                                  clicks === 0 ? "#fef2f2" : "#fef3c7",
                                color: clicks === 0 ? "#ef4444" : "#f59e0b",
                              }}
                            >
                              {clicks === 0 ? "No Traffic" : "Underperforming"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Global Filter and Sort Controls */}
      <div className="seo-dashboard-controls">
        <div className="seo-dashboard-filter-controls">
          <input
            type="text"
            placeholder="Filter all tables..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="seo-dashboard-filter-input"
          />
          <div className="seo-dashboard-section-toggles">
            <button
              className={`seo-dashboard-toggle-btn ${
                activeSection === "all" ? "active" : ""
              }`}
              onClick={() => setActiveSection("all")}
            >
              Show All
            </button>
            <button
              className={`seo-dashboard-toggle-btn ${
                activeSection === "financial" ? "active" : ""
              }`}
              onClick={() => setActiveSection("financial")}
            >
              Financial Impact
            </button>
            <button
              className={`seo-dashboard-toggle-btn ${
                activeSection === "technical" ? "active" : ""
              }`}
              onClick={() => setActiveSection("technical")}
            >
              Technical Issues
            </button>
          </div>
        </div>
      </div>
      {/* Only render sections if data exists */}
      {keywordMismatch && keywordMismatch.length > 0 && (
        <div className="seo-dashboard-section">
          <h3 className="seo-dashboard-section-title">
            <FaSearch /> Keyword Opportunities
          </h3>
          <div className="seo-dashboard-table-container">
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Keyword</th>
                  <th>Difficulty</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>Missed</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {keywordMismatch.slice(0, 5).map((item, i) => (
                  <tr key={i}>
                    <td className="seo-dashboard-url-cell">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {new URL(item.url).pathname || "/"}
                      </a>
                    </td>
                    <td>{item.keyword}</td>
                    <td>
                      <div className="seo-dashboard-difficulty-meter">
                        <div
                          className="seo-dashboard-difficulty-fill"
                          style={{
                            width: `${item.keywordDifficulty}%`,
                            backgroundColor:
                              item.keywordDifficulty > 70
                                ? "#ff4d4d"
                                : item.keywordDifficulty > 40
                                ? "#ffaa4d"
                                : "#4daf7c",
                          }}
                        ></div>
                        <span>{item.keywordDifficulty}</span>
                      </div>
                    </td>
                    <td>{item.impressions}</td>
                    <td>{item.actualClicks}</td>
                    <td>{item.missedClicks}</td>
                    <td>
                      <span
                        className={`seo-dashboard-mismatch-type ${
                          item.mismatchType?.toLowerCase().replace("-", "") ||
                          ""
                        }`}
                      >
                        {item.mismatchType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {cannibalization && cannibalization.length > 0 && (
        <div className="seo-dashboard-section">
          <h3
            className="seo-dashboard-section-title"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              <FaExchangeAlt /> Content Cannibalization
              <span
                style={{
                  marginLeft: 12,
                  fontSize: "1rem",
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                ({cannibalization.length} Keywords)
              </span>
            </span>
            <button
              className="seo-dashboard-expand-btn"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                color: "#f093fb",
                marginLeft: 8,
                transition: "transform 0.2s",
                transform: expandedCannibalization
                  ? "rotate(90deg)"
                  : "rotate(0deg)",
              }}
              aria-label={expandedCannibalization ? "Collapse" : "Expand"}
              onClick={() => setExpandedCannibalization((prev) => !prev)}
            >
              {expandedCannibalization ? <FaArrowDown /> : <FaArrowUp />}
            </button>
          </h3>
          {expandedCannibalization ? (
            <div className="seo-dashboard-cannibalization-grid">
              {cannibalization.map((item, i) => (
                <div className="seo-dashboard-cannibalization-card" key={i}>
                  <div className="seo-dashboard-cannibalization-header">
                    <h4>
                      Keyword:{" "}
                      <span style={{ color: "#f093fb" }}>{item.keyword}</span>
                    </h4>
                    <span className="seo-dashboard-cannibalization-badge">
                      {item.competingUrls?.length || 0} competing pages
                    </span>
                  </div>

                  <div className="seo-dashboard-cannibalization-primary">
                    <div className="seo-dashboard-cannibalization-url">
                      <strong>Primary URL:</strong>
                      {item.primaryUrl && (
                        <a
                          href={item.primaryUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: "bold", color: "#3b82f6" }}
                        >
                          {new URL(item.primaryUrl.url).pathname || "/"}
                        </a>
                      )}
                    </div>
                    {item.primaryUrl && (
                      <div className="seo-dashboard-cannibalization-metrics">
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Position
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.position?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Clicks
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.clicks || 0}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Impressions
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.impressions || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="seo-dashboard-competing-urls">
                    {item.competingUrls &&
                      item.competingUrls.map((competing, j) => (
                        <div className="seo-dashboard-competing-url" key={j}>
                          <div className="seo-dashboard-competing-url-path">
                            <a
                              href={competing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#64748b", fontWeight: "bold" }}
                            >
                              {new URL(competing.url).pathname || "/"}
                            </a>
                          </div>
                          <div className="seo-dashboard-competing-metrics">
                            <div className="seo-dashboard-competing-metric">
                              <small>
                                Pos: {competing.position?.toFixed(1) || "N/A"}
                              </small>
                              {item.primaryUrl && (
                                <span
                                  className={
                                    competing.position <
                                    item.primaryUrl.position
                                      ? "seo-dashboard-metric-better"
                                      : "seo-dashboard-metric-worse"
                                  }
                                >
                                  {competing.position <
                                  item.primaryUrl.position ? (
                                    <FaArrowUp />
                                  ) : (
                                    <FaArrowDown />
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="seo-dashboard-competing-metric">
                              <small>Clicks: {competing.clicks || 0}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="seo-dashboard-cannibalization-grid">
              {cannibalization.slice(0, 4).map((item, i) => (
                <div className="seo-dashboard-cannibalization-card" key={i}>
                  <div className="seo-dashboard-cannibalization-header">
                    <h4>
                      Keyword:{" "}
                      <span style={{ color: "#f093fb" }}>{item.keyword}</span>
                    </h4>
                    <span className="seo-dashboard-cannibalization-badge">
                      {item.competingUrls?.length || 0} competing pages
                    </span>
                  </div>

                  <div className="seo-dashboard-cannibalization-primary">
                    <div className="seo-dashboard-cannibalization-url">
                      <strong>Primary URL:</strong>
                      {item.primaryUrl && (
                        <a
                          href={item.primaryUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: "bold", color: "#3b82f6" }}
                        >
                          {new URL(item.primaryUrl.url).pathname || "/"}
                        </a>
                      )}
                    </div>
                    {item.primaryUrl && (
                      <div className="seo-dashboard-cannibalization-metrics">
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Position
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.position?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Clicks
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.clicks || 0}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Impressions
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.impressions || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="seo-dashboard-competing-urls">
                    {item.competingUrls &&
                      item.competingUrls.map((competing, j) => (
                        <div className="seo-dashboard-competing-url" key={j}>
                          <div className="seo-dashboard-competing-url-path">
                            <a
                              href={competing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#64748b", fontWeight: "bold" }}
                            >
                              {new URL(competing.url).pathname || "/"}
                            </a>
                          </div>
                          <div className="seo-dashboard-competing-metrics">
                            <div className="seo-dashboard-competing-metric">
                              <small>
                                Pos: {competing.position?.toFixed(1) || "N/A"}
                              </small>
                              {item.primaryUrl && (
                                <span
                                  className={
                                    competing.position <
                                    item.primaryUrl.position
                                      ? "seo-dashboard-metric-better"
                                      : "seo-dashboard-metric-worse"
                                  }
                                >
                                  {competing.position <
                                  item.primaryUrl.position ? (
                                    <FaArrowUp />
                                  ) : (
                                    <FaArrowDown />
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="seo-dashboard-competing-metric">
                              <small>Clicks: {competing.clicks || 0}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Content ROI Analysis - Diff Visual */}
      {contentCostWaste && contentCostWaste.length > 0 && (
        <div className="seo-dashboard-section">
          <h3 className="seo-dashboard-section-title">
            <FaMoneyBillWave /> Content ROI Analysis
          </h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={contentCostWaste.slice(0, 12).map((item) => ({
                url: item.url ? new URL(item.url).pathname || "/" : "/",
                ROI:
                  (item.estimatedMonthlyRevenue || 0) - (item.contentCost || 0),
                Revenue: item.estimatedMonthlyRevenue || 0,
                Cost: item.contentCost || 0,
                Wasted: item.wastedSpend || 0,
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="url" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "ROI")
                    return [`$${value?.toFixed(2)}`, "ROI (Revenue - Cost)"];
                  if (name === "Revenue")
                    return [`$${value?.toFixed(2)}`, "Revenue"];
                  if (name === "Cost")
                    return [`$${value?.toFixed(2)}`, "Content Cost"];
                  if (name === "Wasted")
                    return [`$${value?.toFixed(2)}`, "Wasted Spend"];
                  return value;
                }}
              />
              <Legend />
              <Bar
                dataKey="ROI"
                name="ROI (Revenue - Cost)"
                fill="#22c55e"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Revenue"
                name="Revenue"
                fill="#60a5fa"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Cost"
                name="Content Cost"
                fill="#fbbf24"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Wasted"
                name="Wasted Spend"
                fill="#f87171"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div
            style={{
              marginTop: 18,
              textAlign: "center",
              color: "#64748b",
              fontSize: "1.05rem",
            }}
          >
            <FaChartLine style={{ color: "#22c55e", marginRight: 6 }} />
            <span>
              ROI = Revenue - Content Cost. Green bars show net gain/loss for
              each page. Hover for details.
            </span>
          </div>{" "}
        </div>
      )}
      {/* Link Dilution Section - Always Show with Expand/Collapse and Summary */}
      <div className="seo-dashboard-section">
        <h3
          className="seo-dashboard-section-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <FaLink /> Link Dilution
            <span
              style={{
                marginLeft: 12,
                fontSize: "1rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              ({linkDilution.length} Pages)
            </span>
          </span>
          <button
            className="seo-dashboard-expand-btn"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#43e97b",
              marginLeft: 8,
              transition: "transform 0.2s",
              transform: expandedDilution ? "rotate(90deg)" : "rotate(0deg)",
            }}
            aria-label={expandedDilution ? "Collapse" : "Expand"}
            onClick={() => setExpandedDilution((prev) => !prev)}
          >
            {expandedDilution ? <FaArrowDown /> : <FaArrowUp />}
          </button>
        </h3>
        {/* Summary Row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            margin: "12px 0 8px 0",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaExclamationTriangle
              style={{ color: "#f87171", marginRight: 4 }}
            />
            High Dilution:{" "}
            {linkDilution.filter((i) => i.dilutionScore > 0.02).length}
          </span>
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaCheck style={{ color: "#22c55e", marginRight: 4 }} />
            Low Dilution:{" "}
            {linkDilution.filter((i) => i.dilutionScore <= 0.02).length}
          </span>
        </div>
        {expandedDilution && linkDilution && linkDilution.length > 0 ? (
          <div className="seo-dashboard-table-container">
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Page Authority</th>
                  <th>External Links</th>
                  <th>Internal Links</th>
                  <th>Dilution Score</th>
                  <th>Improvement</th>
                  <th>Est. Loss</th>
                </tr>
              </thead>
              <tbody>
                {linkDilution.map((item, i) => (
                  <tr key={i}>
                    <td className="seo-dashboard-url-cell">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {new URL(item.url).pathname || "/"}
                      </a>
                    </td>
                    <td>{item.pageAuthority}</td>
                    <td>{item.externalLinks}</td>
                    <td>{item.internalLinks}</td>
                    <td
                      style={{
                        color:
                          item.dilutionScore > 0.02 ? "#f87171" : "#64748b",
                        fontWeight: item.dilutionScore > 0.02 ? 700 : 500,
                      }}
                    >
                      {item.dilutionScore?.toFixed(4)}
                    </td>
                    <td
                      style={{
                        color:
                          item.improvementPotential === "High"
                            ? "#f87171"
                            : item.improvementPotential === "Mid"
                            ? "#fbbf24"
                            : "#22c55e",
                        fontWeight: 600,
                      }}
                    >
                      {item.improvementPotential || "-"}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {item.estimatedLoss
                        ? `L:${item.estimatedLoss.low} M:${item.estimatedLoss.mid} H:${item.estimatedLoss.high}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{ color: "#64748b", padding: "16px 0", textAlign: "center" }}
          >
            No link dilution issues detected.
          </div>
        )}
      </div>{" "}
      {/* Content Cost Waste Table - Always Show, Awesome UI */}
      <div className="seo-dashboard-section">
        <h3
          className="seo-dashboard-section-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <FaMoneyBillWave /> Content Cost Waste
            <span
              style={{
                marginLeft: 12,
                fontSize: "1rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              ({contentCostWaste.length} Pages)
            </span>
          </span>
          <button
            className="seo-dashboard-expand-btn"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#fbbf24",
              marginLeft: 8,
              transition: "transform 0.2s",
              transform: expandedContentCostWaste
                ? "rotate(90deg)"
                : "rotate(0deg)",
            }}
            aria-label={expandedContentCostWaste ? "Collapse" : "Expand"}
            onClick={() => setExpandedContentCostWaste((prev) => !prev)}
          >
            {expandedContentCostWaste ? <FaArrowDown /> : <FaArrowUp />}
          </button>
        </h3>
        <div
          style={{
            display: "flex",
            gap: 24,
            margin: "12px 0 8px 0",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaExclamationTriangle
              style={{ color: "#f87171", marginRight: 4 }}
            />
            High Waste:{" "}
            {contentCostWaste.filter((i) => i.wastedSpend > 0).length}
          </span>
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaCheck style={{ color: "#22c55e", marginRight: 4 }} />
            Positive ROI:{" "}
            {
              contentCostWaste.filter(
                (i) =>
                  (i.estimatedMonthlyRevenue || 0) - (i.contentCost || 0) > 0
              ).length
            }
          </span>
        </div>{" "}
        {expandedContentCostWaste ? (
          <div className="seo-dashboard-table-container">
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Content Cost</th>
                  <th>Estimated Revenue</th>
                  <th>Actual Revenue</th>
                  <th>Estimated ROI</th> <th>Revenue Loss</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Position</th>
                </tr>
              </thead>{" "}
              <tbody>
                {contentCostWaste.map((item, i) => {
                  const roi =
                    (item.estimatedMonthlyRevenue || 0) -
                    (item.contentCost || 0);

                  // Calculate Revenue Leak loss for this URL using the same logic
                  const clicks = item.clicks || item.impressions || 0;
                  const costPerUrl = revenueLeak.details.costPerUrl;
                  const threshold = revenueLeak.threshold;

                  let urlRevenueLoss = 0;
                  if (clicks < threshold) {
                    const roiFactor = Math.max(
                      -1,
                      (clicks - threshold) / threshold
                    );
                    urlRevenueLoss = roiFactor * costPerUrl;
                  }

                  return (
                    <tr key={i}>
                      <td className="seo-dashboard-url-cell">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {new URL(item.url).pathname || "/"}
                        </a>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        $
                        {item.contentCost?.toFixed?.(2) ??
                          item.contentCost ??
                          0}
                      </td>
                      <td style={{ fontWeight: 600, color: "#22c55e" }}>
                        $
                        {item.estimatedMonthlyRevenue?.toFixed?.(2) ??
                          item.estimatedMonthlyRevenue ??
                          0}
                      </td>
                      <td className="seo-dashboard-actual-revenue-cell">
                        <button
                          className="seo-dashboard-crm-connect-btn"
                          onClick={() => {
                            // Placeholder for CRM connection logic
                            alert(
                              "Connect to CRM functionality will be implemented here"
                            );
                          }}
                        >
                          <FaLink size={12} />
                          Connect CRM
                        </button>
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: roi > 0 ? "#22c55e" : "#f87171",
                        }}
                      >
                        {roi > 0 ? (
                          <FaArrowUp style={{ marginRight: 3 }} />
                        ) : (
                          <FaArrowDown style={{ marginRight: 3 }} />
                        )}
                        ${roi?.toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: urlRevenueLoss < 0 ? "#f87171" : "#64748b",
                        }}
                      >
                        {urlRevenueLoss < 0 ? (
                          <FaExclamationTriangle style={{ marginRight: 3 }} />
                        ) : null}
                        ${Math.abs(urlRevenueLoss)?.toFixed(0) ?? 0}
                        {clicks < threshold && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#64748b",
                              marginLeft: 4,
                            }}
                          >
                            ({clicks}/{threshold})
                          </span>
                        )}
                      </td>
                      <td>{item.impressions}</td>
                      <td>{item.clicks}</td>
                      <td>
                        {typeof item.ctr === "number"
                          ? (item.ctr * 100)?.toFixed(2) + "%"
                          : "-"}
                      </td>
                      <td>
                        {item.position?.toFixed?.(2) ?? item.position ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="seo-dashboard-table-container">
            {" "}
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Content Cost</th>
                  <th>Revenue</th>
                  <th>Actual Revenue</th> <th>ROI</th>
                  <th>Revenue Loss</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {contentCostWaste.slice(0, 5).map((item, i) => {
                  const roi =
                    (item.estimatedMonthlyRevenue || 0) -
                    (item.contentCost || 0);

                  // Calculate Revenue Leak loss for this URL using the same logic
                  const clicks = item.clicks || item.impressions || 0;
                  const costPerUrl = revenueLeak.details.costPerUrl;
                  const threshold = revenueLeak.threshold;

                  let urlRevenueLoss = 0;
                  if (clicks < threshold) {
                    const roiFactor = Math.max(
                      -1,
                      (clicks - threshold) / threshold
                    );
                    urlRevenueLoss = roiFactor * costPerUrl;
                  }

                  return (
                    <tr key={i}>
                      <td className="seo-dashboard-url-cell">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {new URL(item.url).pathname || "/"}
                        </a>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        $
                        {item.contentCost?.toFixed?.(2) ??
                          item.contentCost ??
                          0}
                      </td>{" "}
                      <td style={{ fontWeight: 600, color: "#22c55e" }}>
                        $
                        {item.estimatedMonthlyRevenue?.toFixed?.(2) ??
                          item.estimatedMonthlyRevenue ??
                          0}
                      </td>{" "}
                      <td className="seo-dashboard-actual-revenue-cell">
                        <button
                          className="seo-dashboard-crm-connect-btn"
                          onClick={() => {
                            // Placeholder for CRM connection logic
                            alert(
                              "Connect to CRM functionality will be implemented here"
                            );
                          }}
                        >
                          <FaLink size={12} />
                          Connect CRM
                        </button>
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: roi > 0 ? "#22c55e" : "#f87171",
                        }}
                      >
                        {roi > 0 ? (
                          <FaArrowUp style={{ marginRight: 3 }} />
                        ) : (
                          <FaArrowDown style={{ marginRight: 3 }} />
                        )}
                        ${roi?.toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: urlRevenueLoss < 0 ? "#f87171" : "#64748b",
                        }}
                      >
                        {urlRevenueLoss < 0 ? (
                          <FaExclamationTriangle style={{ marginRight: 3 }} />
                        ) : null}
                        ${Math.abs(urlRevenueLoss)?.toFixed(0) ?? 0}
                        {clicks < threshold && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#64748b",
                              marginLeft: 4,
                            }}
                          >
                            ({clicks}/{threshold})
                          </span>
                        )}
                      </td>
                      <td>{item.impressions}</td>
                      <td>{item.clicks}</td>
                      <td>
                        {typeof item.ctr === "number"
                          ? (item.ctr * 100)?.toFixed(2) + "%"
                          : "-"}
                      </td>
                      <td>
                        {item.position?.toFixed?.(2) ?? item.position ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {contentCostWaste.length > 5 && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  className="seo-dashboard-show-more-btn"
                  onClick={() => setExpandedContentCostWaste(true)}
                  style={{
                    padding: "12px 24px",
                    background:
                      "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Show All {contentCostWaste.length} Pages
                </button>
              </div>
            )}
          </div>
        )}
      </div>{" "}
      {/* Enhanced Content Decay & Trends Section */}
      {contentDecayData.summary.totalUrlsAnalyzed > 0 &&
        (activeSection === "all" || activeSection === "financial") && (
          <div className="seo-dashboard-section">
            <h3
              className="seo-dashboard-section-title"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                <FaChartLine style={{ color: "#f87171", marginRight: 8 }} />
                Content Decay & Trends
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: "1rem",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  ({contentDecayData.summary.totalUrlsAnalyzed} Pages •{" "}
                  {formatCurrency(totalRevenueLoss)} Total Loss)
                </span>
              </span>
              <button
                className="seo-dashboard-expand-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: "#f87171",
                  marginLeft: 8,
                  transition: "transform 0.2s",
                  transform: expandedContentDecay
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                }}
                aria-label={expandedContentDecay ? "Collapse" : "Expand"}
                onClick={() => setExpandedContentDecay((prev) => !prev)}
              >
                {expandedContentDecay ? <FaArrowDown /> : <FaArrowUp />}
              </button>
            </h3>
            {/* Summary Stats */}{" "}
            <div
              style={{
                display: "flex",
                gap: 24,
                margin: "12px 0 8px 0",
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaArrowDown style={{ color: "#f87171", marginRight: 4 }} />
                Decaying Pages: {contentDecayData.summary.urlsWithDecay}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaArrowUp style={{ color: "#22c55e", marginRight: 4 }} />
                Stable Pages:{" "}
                {contentDecayData.decayDistribution.Stable?.count || 0}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaMoneyBillWave style={{ color: "#f87171", marginRight: 4 }} />
                Total Revenue Impact: {formatCurrency(totalRevenueLoss)}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaExclamationTriangle
                  style={{ color: "#f87171", marginRight: 4 }}
                />
                Clicks Lost: {contentDecayData.summary.totalClicksLost}
              </span>
            </div>
            {expandedContentDecay ? (
              <div className="seo-dashboard-table-container">
                <div className="seo-dashboard-table-controls">
                  <input
                    type="text"
                    placeholder="Search content decay data..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="seo-dashboard-filter-input"
                    style={{ marginBottom: "10px" }}
                  />
                </div>
                <table className="seo-dashboard-data-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("url")}
                        style={{ cursor: "pointer" }}
                      >
                        URL{" "}
                        {sortConfig.key === "url" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("currentClicks")}
                        style={{ cursor: "pointer" }}
                      >
                        Current Clicks{" "}
                        {sortConfig.key === "currentClicks" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("previousClicks")}
                        style={{ cursor: "pointer" }}
                      >
                        Previous Clicks{" "}
                        {sortConfig.key === "previousClicks" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("clickDiff")}
                        style={{ cursor: "pointer" }}
                      >
                        Change{" "}
                        {sortConfig.key === "clickDiff" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("clickChangePercent")}
                        style={{ cursor: "pointer" }}
                      >
                        % Change{" "}
                        {sortConfig.key === "clickChangePercent" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("estimatedRevenueLoss")}
                        style={{ cursor: "pointer" }}
                      >
                        Revenue Loss{" "}
                        {sortConfig.key === "estimatedRevenueLoss" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th>Status</th>
                      <th>Keywords</th>
                    </tr>
                  </thead>{" "}
                  <tbody>
                    {(() => {
                      // Flatten all decay categories into a single array for table display
                      const allDecayData = Object.values(
                        contentDecayData.decayCategories
                      )
                        .flat()
                        .map((item) => ({
                          url: item.url,
                          currentClicks: item.metrics.currentClicks,
                          previousClicks: item.metrics.peakClicks,
                          clickDiff:
                            item.metrics.currentClicks -
                            item.metrics.peakClicks,
                          clickChangePercent:
                            item.metrics.peakClicks > 0
                              ? ((item.metrics.currentClicks -
                                  item.metrics.peakClicks) /
                                  item.metrics.peakClicks) *
                                100
                              : 0,
                          estimatedRevenueLoss: item.calculatedRevenueLoss,
                          decayMetrics: { status: item.decayStatus },
                          topKeywords: item.topKeywords,
                        }));

                      return sortData(
                        filterData(allDecayData, filterText),
                        sortConfig.key,
                        sortConfig.direction
                      ).map((item, i) => (
                        <tr key={i}>
                          <td className="seo-dashboard-url-cell">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {new URL(item.url).pathname || "/"}
                            </a>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {item.currentClicks}
                          </td>
                          <td style={{ color: "#64748b" }}>
                            {item.previousClicks}
                          </td>
                          <td
                            style={{
                              color:
                                item.clickDiff >= 0 ? "#22c55e" : "#f87171",
                              fontWeight: 600,
                            }}
                          >
                            {item.clickDiff >= 0 ? "+" : ""}
                            {item.clickDiff}
                          </td>
                          <td
                            style={{
                              color:
                                item.clickChangePercent >= 0
                                  ? "#22c55e"
                                  : "#f87171",
                              fontWeight: 600,
                            }}
                          >
                            {item.clickChangePercent > 0 ? "+" : ""}
                            {item.clickChangePercent?.toFixed(1)}%
                          </td>
                          <td
                            style={{
                              color: "#f87171",
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(item.estimatedRevenueLoss || 0)}
                          </td>
                          <td>
                            <span
                              className={`seo-dashboard-status-badge ${
                                item.decayMetrics?.status?.toLowerCase() ||
                                "unknown"
                              }`}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color:
                                  item.decayMetrics?.status === "Stable"
                                    ? "#22c55e"
                                    : item.decayMetrics?.status ===
                                      "Light-Decay"
                                    ? "#fbbf24"
                                    : item.decayMetrics?.status ===
                                      "Moderate-Decay"
                                    ? "#f59e0b"
                                    : item.decayMetrics?.status ===
                                      "Severe-Decay"
                                    ? "#f87171"
                                    : "#64748b",
                                backgroundColor:
                                  item.decayMetrics?.status === "Stable"
                                    ? "#dcfce7"
                                    : item.decayMetrics?.status ===
                                      "Light-Decay"
                                    ? "#fefbeb"
                                    : item.decayMetrics?.status ===
                                      "Moderate-Decay"
                                    ? "#fef3c7"
                                    : item.decayMetrics?.status ===
                                      "Severe-Decay"
                                    ? "#fef2f2"
                                    : "#f1f5f9",
                              }}
                            >
                              {item.decayMetrics?.status || "N/A"}
                            </span>{" "}
                          </td>
                          <td style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {item.topKeywords?.length || 0} keywords
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="seo-dashboard-content-decay-list">
                {(() => {
                  // Flatten all decay categories into a single array for collapsed view
                  const allDecayData = Object.values(
                    contentDecayData.decayCategories
                  )
                    .flat()
                    .slice(0, 3)
                    .map((item) => ({
                      url: item.url,
                      currentClicks: item.metrics.currentClicks,
                      previousClicks: item.metrics.peakClicks,
                      clickDiff:
                        item.metrics.currentClicks - item.metrics.peakClicks,
                      clickChangePercent:
                        item.metrics.peakClicks > 0
                          ? ((item.metrics.currentClicks -
                              item.metrics.peakClicks) /
                              item.metrics.peakClicks) *
                            100
                          : 0,
                      estimatedRevenueLoss: item.calculatedRevenueLoss,
                      decayMetrics: { status: item.decayStatus },
                      topKeywords: item.topKeywords,
                    }));
                  return filterData(allDecayData, filterText).map((item, i) => (
                    <div className="seo-dashboard-content-decay-card" key={i}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontWeight: 600,
                            color: "#3b82f6",
                            fontSize: "1.1rem",
                          }}
                        >
                          {new URL(item.url).pathname || "/"}
                        </a>
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Current Clicks: <b>{item.currentClicks}</b>
                        </span>
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Previous: <b>{item.previousClicks}</b>
                        </span>
                        <span
                          style={{
                            color: item.clickDiff >= 0 ? "#22c55e" : "#f87171",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {item.clickDiff >= 0 ? (
                            <FaArrowUp style={{ marginRight: 2 }} />
                          ) : (
                            <FaArrowDown style={{ marginRight: 2 }} />
                          )}
                          {item.clickDiff > 0 ? "+" : ""}
                          {item.clickDiff} (
                          {item.clickChangePercent > 0 ? "+" : ""}
                          {item.clickChangePercent?.toFixed(1)}%)
                        </span>
                        {typeof item.estimatedRevenueLoss === "number" && (
                          <span style={{ color: "#f87171", fontWeight: 600 }}>
                            Est. Revenue Loss:{" "}
                            {formatCurrency(item.estimatedRevenueLoss)}
                          </span>
                        )}
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Status: <b>{item.decayMetrics?.status || "N/A"}</b>
                        </span>
                      </div>
                    </div>
                  ));
                })()}
                {Object.values(contentDecayData.decayCategories).flat().length >
                  3 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "#64748b",
                    }}
                  >
                    <button
                      onClick={() => setExpandedContentDecay(true)}
                      className="seo-dashboard-show-more-btn"
                    >
                      Show All{" "}
                      {
                        Object.values(contentDecayData.decayCategories).flat()
                          .length
                      }{" "}
                      Pages
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      {/* Enhanced Not Found Pages Section */}
      {notFoundPages &&
        notFoundPages.length > 0 &&
        (activeSection === "all" || activeSection === "technical") && (
          <div className="seo-dashboard-section">
            <h3
              className="seo-dashboard-section-title"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                <FaTimes style={{ color: "#f87171", marginRight: 8 }} />
                404 & Error Pages
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: "1rem",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  ({notFoundPages.length} Pages •{" "}
                  {formatCurrency(estimatedLossFromNotFound)} Est. Loss)
                </span>
              </span>
              <button
                className="seo-dashboard-expand-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: "#f87171",
                  marginLeft: 8,
                  transition: "transform 0.2s",
                  transform: expandedNotFoundPages
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                }}
                onClick={() => setExpandedNotFoundPages(!expandedNotFoundPages)}
              >
                ❯
              </button>
            </h3>
            {expandedNotFoundPages && (
              <div className="seo-dashboard-content">
                {filterData(notFoundPages, filterText)
                  .slice(0, 3)
                  .map((item, i) => (
                    <div className="seo-dashboard-content-decay-card" key={i}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontWeight: 600,
                            color: "#3b82f6",
                            fontSize: "1.1rem",
                          }}
                        >
                          {new URL(item.url).pathname || "/"}
                        </a>
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Current Clicks: <b>{item.currentClicks}</b>
                        </span>
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Previous: <b>{item.previousClicks}</b>
                        </span>
                        <span
                          style={{
                            color: item.clickDiff >= 0 ? "#22c55e" : "#f87171",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {item.clickDiff >= 0 ? (
                            <FaArrowUp style={{ marginRight: 2 }} />
                          ) : (
                            <FaArrowDown style={{ marginRight: 2 }} />
                          )}
                          {item.clickDiff > 0 ? "+" : ""}
                          {item.clickDiff} (
                          {item.clickChangePercent > 0 ? "+" : ""}
                          {item.clickChangePercent?.toFixed(1)}%)
                        </span>
                        {typeof item.estimatedRevenueLoss === "number" && (
                          <span style={{ color: "#f87171", fontWeight: 600 }}>
                            Est. Revenue Loss:{" "}
                            {formatCurrency(item.estimatedRevenueLoss)}
                          </span>
                        )}
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Status: <b>{item.decayMetrics?.status || "N/A"}</b>
                        </span>
                      </div>
                    </div>
                  ))}
                {contentDecay.length > 3 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "#64748b",
                    }}
                  >
                    <button
                      onClick={() => setExpandedContentDecay(true)}
                      className="seo-dashboard-show-more-btn"
                    >
                      Show All {contentDecay.length} Pages
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      {/* Enhanced Not Found Pages Section */}
      {notFoundPages &&
        notFoundPages.length > 0 &&
        (activeSection === "all" || activeSection === "technical") && (
          <div className="seo-dashboard-section">
            <h3
              className="seo-dashboard-section-title"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                <FaTimes style={{ color: "#f87171", marginRight: 8 }} />
                404 & Error Pages
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: "1rem",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  ({notFoundPages.length} Pages •{" "}
                  {formatCurrency(estimatedLossFromNotFound)} Est. Loss)
                </span>
              </span>
              <button
                className="seo-dashboard-expand-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: "#f87171",
                  marginLeft: 8,
                  transition: "transform 0.2s",
                  transform: expandedNotFoundPages
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                }}
                aria-label={expandedNotFoundPages ? "Collapse" : "Expand"}
                onClick={() => setExpandedNotFoundPages((prev) => !prev)}
              >
                {expandedNotFoundPages ? <FaArrowDown /> : <FaArrowUp />}
              </button>
            </h3>

            {/* Summary Stats */}
            <div
              style={{
                display: "flex",
                gap: 24,
                margin: "12px 0 8px 0",
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaTimes style={{ color: "#f87171", marginRight: 4 }} />
                404 Errors:{" "}
                {notFoundPages.filter((i) => i.errorType === "404").length}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaExclamationTriangle
                  style={{ color: "#fbbf24", marginRight: 4 }}
                />
                Timeouts:{" "}
                {notFoundPages.filter((i) => i.errorType === "timeout").length}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaMoneyBillWave style={{ color: "#f87171", marginRight: 4 }} />
                Est. Revenue Loss: {formatCurrency(estimatedLossFromNotFound)}
              </span>
            </div>

            {expandedNotFoundPages ? (
              <div className="seo-dashboard-table-container">
                <div className="seo-dashboard-table-controls">
                  <input
                    type="text"
                    placeholder="Search error pages..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="seo-dashboard-filter-input"
                    style={{ marginBottom: "10px" }}
                  />
                </div>
                <table className="seo-dashboard-data-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("url")}
                        style={{ cursor: "pointer" }}
                      >
                        URL{" "}
                        {sortConfig.key === "url" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("errorType")}
                        style={{ cursor: "pointer" }}
                      >
                        Error Type{" "}
                        {sortConfig.key === "errorType" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("clicks")}
                        style={{ cursor: "pointer" }}
                      >
                        Clicks{" "}
                        {sortConfig.key === "clicks" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("impressions")}
                        style={{ cursor: "pointer" }}
                      >
                        Impressions{" "}
                        {sortConfig.key === "impressions" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("position")}
                        style={{ cursor: "pointer" }}
                      >
                        Position{" "}
                        {sortConfig.key === "position" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("estimatedLoss.mid")}
                        style={{ cursor: "pointer" }}
                      >
                        Est. Loss{" "}
                        {sortConfig.key === "estimatedLoss.mid" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(
                      filterData(notFoundPages, filterText),
                      sortConfig.key,
                      sortConfig.direction
                    ).map((item, i) => (
                      <tr key={i}>
                        <td className="seo-dashboard-url-cell">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#f87171" }}
                          >
                            {new URL(item.url).pathname || "/"}
                          </a>
                        </td>{" "}
                        <td>
                          <span
                            className={`seo-dashboard-error-badge`}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color:
                                item.errorType === "404"
                                  ? "#f87171"
                                  : "#fbbf24",
                              backgroundColor:
                                item.errorType === "404"
                                  ? "#fef2f2"
                                  : "#fefbeb",
                            }}
                          >
                            {item.errorType === "404"
                              ? "404 Not Found"
                              : "Timeout"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.clicks}</td>
                        <td style={{ color: "#64748b" }}>{item.impressions}</td>
                        <td style={{ color: "#64748b" }}>
                          {item.position?.toFixed(1) || "N/A"}
                        </td>
                        <td style={{ color: "#f87171", fontWeight: 600 }}>
                          {formatCurrency((item.estimatedLoss?.mid || 0) * 4.5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  color: "#64748b",
                  padding: "16px 0",
                  textAlign: "center",
                }}
              >
                Showing {Math.min(notFoundPages.length, 5)} of{" "}
                {notFoundPages.length} error pages.
                {notFoundPages.length > 5 && (
                  <button
                    onClick={() => setExpandedNotFoundPages(true)}
                    className="seo-dashboard-show-more-btn"
                    style={{ marginLeft: "10px" }}
                  >
                    Show All
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      <div className="seo-dashboard-actions">
        <button className="seo-dashboard-action-button seo-dashboard-primary">
          Generate Improvement Plan
        </button>
        <button className="seo-dashboard-action-button seo-dashboard-secondary">
          Export Report
        </button>
      </div>
    </div>
  );
};

export default SEOAnalysisDashboard;
