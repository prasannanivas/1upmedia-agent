/**
 * Command Center Dashboard - Main Control Hub
 *
 * Data Structure Alignment:
 * - Uses onboardingData.searchConsoleData[] with fields: impressions, clicks, position, ctr
 * - Uses onboardingData.domainCostDetails for averageOrderValue and AverageContentCost
 * - Uses onboardingData.funnelAnalysis.funnelDistribution for ToF/MoF/BoF data
 * - Uses onboardingData.initialAnalysisState for domain authority metrics
 * - Implements same data validation pattern as ContentLedgerDashboard
 * - Shows "Finish Onboarding" button when insufficient data (no automatic redirect)
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { useFinancialCalculations } from "../../context/FinancialCalculations";
import {
  Home,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Settings,
  Play,
  Search,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import FinancialTooltip from "../../components/FinancialTooltip";
import { getTooltipContent } from "../../utils/tooltipContent";
import "./CommandCenterDashboard.css";

const CommandCenterDashboard = () => {
  const { onboardingData, loading } = useOnboarding();
  const {
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
  } = useFinancialCalculations();
  const navigate = useNavigate();
  // Conversion rate state (1% to 4.5% range)
  const [conversionRate, setConversionRate] = useState(2.0); // Default 2%

  // Recovery breakdown collapse state
  const [isRecoveryBreakdownExpanded, setIsRecoveryBreakdownExpanded] =
    useState(true);

  // Individual plan expansion state for 30/60/90 day plans
  const [expandedPlans, setExpandedPlans] = useState({
    "30-day": false,
    "60-day": false,
    "90-day": false,
  });

  // Toggle function for individual plans
  const togglePlan = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };
  // Calculate command center metrics from onboarding data using FinancialCalculations context
  const commandCenterData = useMemo(() => {
    if (!onboardingData || loading) return { isBlind: true };

    // Check for insufficient data (consistent with other dashboards)
    const hasMinimalData = () => {
      const hasSearchConsole =
        Array.isArray(onboardingData.searchConsoleData) &&
        onboardingData.searchConsoleData.length > 0;
      const hasDomain =
        onboardingData.domain && onboardingData.domain.trim() !== "";

      return hasSearchConsole && hasDomain;
    };

    // Check if we have sufficient data using the hasMinimalData function
    if (!hasMinimalData()) {
      return { isBlind: true };
    }

    try {
      // Use FinancialCalculations context functions for all metrics
      const revenueLeakData = getRevenueLeak();
      const contentDecayData = getContentDecay();
      const keywordMismatchData = getKeywordMismatch();
      const linkDilutionData = getLinkDilution();
      const psychMismatchData = getPsychMismatch();
      const funnelGapData = funnelGapIdentifier();
      const contentQualityData = getContentQualityDistribution();
      const creditScoreData = getMoodyCreditScore();
      const cannibalizationLossData = getCannibalizationLoss();
      const roiRecoveryData = getROIRecoveryPotential(); // Use searchConsoleData for basic metrics calculations

      console.log(
        "Command Center - Credit Score Data:",
        "revenueLeakData",
        revenueLeakData,
        "contentDecayData",
        contentDecayData,
        "keywordMismatchData",
        keywordMismatchData,
        "linkDilutionData",
        linkDilutionData,
        "psychMismatchData",
        psychMismatchData,
        "funnelGapData",
        funnelGapData,
        "contentQualityData",
        contentQualityData,
        "creditScoreData",
        creditScoreData,
        "roiRecoveryData",
        roiRecoveryData
      );

      const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
        ? onboardingData.searchConsoleData
        : [];
      if (searchConsoleData.length === 0) {
        return { isBlind: true };
      }

      // Basic search console metrics for display
      const totalImpressions = searchConsoleData.reduce(
        (sum, item) => sum + (parseInt(item.impressions) || 0),
        0
      );
      const totalClicks = searchConsoleData.reduce(
        (sum, item) => sum + (parseInt(item.clicks) || 0),
        0
      );
      const avgCTR =
        totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Calculate conversion metrics
      const conversionRateDecimal = conversionRate / 100;
      const averageOrderValue =
        parseFloat(onboardingData.domainCostDetails?.averageOrderValue) || 50;
      const totalConversions = totalClicks * conversionRateDecimal;
      const totalRevenue = totalConversions * averageOrderValue;
      const contentCost =
        parseFloat(onboardingData.domainCostDetails?.AverageContentCost) || 200;
      const totalCost = searchConsoleData.length * contentCost;
      const totalROI =
        totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : -100;

      // Get funnel analysis data for display
      const funnelAnalysis = onboardingData.funnelAnalysis || {};
      const actualFunnelDistribution = funnelAnalysis.funnelDistribution;

      let tofuPercentage, mofuPercentage, bofuPercentage;

      if (
        actualFunnelDistribution &&
        actualFunnelDistribution.ToF !== undefined
      ) {
        // Use actual funnel data from onboarding context
        const total =
          actualFunnelDistribution.ToF +
          actualFunnelDistribution.MoF +
          actualFunnelDistribution.BoF;
        tofuPercentage =
          total > 0
            ? Math.round((actualFunnelDistribution.ToF / total) * 100)
            : 0;
        mofuPercentage =
          total > 0
            ? Math.round((actualFunnelDistribution.MoF / total) * 100)
            : 0;
        bofuPercentage =
          total > 0
            ? Math.round((actualFunnelDistribution.BoF / total) * 100)
            : 0;
      } else {
        // Fallback to derived funnel analysis using standardized position thresholds
        tofuPercentage = Math.round(
          (searchConsoleData.filter((item) => parseFloat(item.position) <= 10)
            .length /
            searchConsoleData.length) *
            100
        );
        mofuPercentage = Math.round(
          (searchConsoleData.filter(
            (item) =>
              parseFloat(item.position) > 10 && parseFloat(item.position) <= 20
          ).length /
            searchConsoleData.length) *
            100
        );
        bofuPercentage = 100 - tofuPercentage - mofuPercentage;
      }

      // Traffic sparks - Generate 90-day trend visualization based on actual data
      const generateSparkData = (baseValue, volatility = 0.3) => {
        const data = [];
        for (let i = 0; i < 10; i++) {
          const variation = (Math.random() - 0.5) * volatility;
          data.push(Math.max(0, baseValue * (1 + variation)));
        }
        return data;
      };

      const impressionsSparkData = generateSparkData(totalImpressions / 10);
      const clicksSparkData = generateSparkData(totalClicks / 10);
      const roiSparkData = generateSparkData(Math.abs(totalROI) / 10);
      const wasteSparkData = generateSparkData(
        revenueLeakData?.estimatedRevenueLoss / 10 || 0
      );

      const recoveryTimeframe =
        creditScoreData?.summary?.overallScore > 70
          ? 30
          : creditScoreData?.summary?.overallScore > 50
          ? 60
          : 90;
      const recoveryTrend = totalROI > 0 ? "positive" : "negative";

      // Psychographic alignment - use actual analysis data when available
      const psychMatch = psychMismatchData?.summary?.overallPsychHealth || 70;

      return {
        isBlind: false,
        domain: onboardingData.domain || "your-domain.com",
        lastRefresh: new Date().toLocaleString(),

        // Credit Score from context
        creditScore: creditScoreData?.summary?.overallScore || 50,
        creditGrade: creditScoreData?.summary?.creditRating || "BBB",
        creditHealth: creditScoreData?.summary?.riskLevel || "⚠️ At Risk", // ROI Recovery from context
        roiRecoveryPotential:
          roiRecoveryData?.summary?.totalRecoveryPotential || 0,
        recoveryTimeframe,
        recoveryTrend,
        // Full recovery breakdown for 30/60/90 day display
        recoveryTimeframes: roiRecoveryData?.recoveryTimeframes || {},
        roiRecoveryTooltip: roiRecoveryData?.summary?.tooltip || {},

        // KPI Grid using context data

        kpiMetrics: {
          wastedSpend: Math.round(revenueLeakData?.estimatedRevenueLoss || 0),
          deepDecayPages: contentDecayData?.summary?.urlsWithDecay || 0,
          highDilutionPages: linkDilutionData?.summary?.urlsWithDilution || 0,
          lowKDHighDAUrls: searchConsoleData.filter(
            (item) => parseFloat(item.position) <= 20
          ).length,
          psychoMismatch: psychMismatchData?.summary?.mismatchPercentage || 0,
          funnelGap:
            funnelGapData?.summary?.criticalGapsCount > 0
              ? "Critical Gap"
              : "Balanced",
          // Dollar amounts for each KPI metric from context
          cannibalizationLossvalue:
            cannibalizationLossData?.summary?.totalRevenueLoss || 0,
          deepDecayDollarValue:
            contentDecayData?.summary?.totalRevenueLoss || 0,
          dilutionDollarValue: linkDilutionData?.summary?.totalRevenueLoss || 0,
          keywordMismatchDollarValue:
            keywordMismatchData?.summary?.totalRevenueLoss || 0,
          psychoMismatchDollarValue:
            psychMismatchData?.summary?.totalRevenueLoss || 0,
          funnelGapDollarValue: funnelGapData?.summary?.totalRevenueLoss || 0,
        },

        // Traffic & ROI Sparks
        sparkData: {
          impressions: impressionsSparkData,
          clicks: clicksSparkData,
          roi: roiSparkData,
          waste: wasteSparkData,
        },

        // Funnel Coverage
        funnelCoverage: {
          tofu: tofuPercentage,
          mofu: mofuPercentage,
          bofu: bofuPercentage,
        },

        // Psychographic alignment
        psychMatch, // Overall metrics
        totalPages: searchConsoleData.length,
        totalImpressions,
        totalClicks,
        avgCTR,
        totalROI,

        // Content grading distribution - use data from FinancialCalculations context
        contentGrades: contentQualityData?.gradeDistribution || {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          total: 0,
          percentA: 0,
          percentB: 0,
          percentC: 0,
          percentD: 0,
        },
      };
    } catch (error) {
      console.error("Error calculating command center metrics:", error);
      return { isBlind: true };
    }
  }, [
    onboardingData,
    loading,
    conversionRate,
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
    expandedPlans,
    isRecoveryBreakdownExpanded,
    togglePlan,
  ]);

  if (loading) {
    return (
      <div className="command-center-loading">
        <RefreshCw className="loading-spinner" />
        <p>Loading Command Center Dashboard...</p>{" "}
      </div>
    );
  }

  console.log("Command Center Data:", commandCenterData);

  // Show blind system warning if no data - with Finish Onboarding button
  if (commandCenterData.isBlind) {
    return (
      <div className="command-center-blind">
        <div className="blind-banner">
          <AlertTriangle className="blind-icon" size={48} />
          <h1>🚨 COMMAND CENTER INACTIVE – SETUP REQUIRED</h1>
          <p>
            The system requires search console data and domain configuration to
            operate. Please complete the onboarding process to unlock your
            command center dashboard.
          </p>
          <div className="setup-requirements">
            <p>
              <strong>Required for activation:</strong>
            </p>
            <ul>
              <li
                className={
                  onboardingData?.domain
                    ? "requirement-met"
                    : "requirement-missing"
                }
              >
                Domain configuration
              </li>
              <li
                className={
                  onboardingData?.keywords?.length > 0
                    ? "requirement-met"
                    : "requirement-missing"
                }
              >
                Target keywords
              </li>
              <li
                className={
                  onboardingData?.searchConsoleData?.length > 0
                    ? "requirement-met"
                    : "requirement-missing"
                }
              >
                Google Search Console data
              </li>
            </ul>
          </div>
          <button
            className="activate-btn"
            onClick={() => navigate("/onboarding/step-keywords")}
          >
            <Play className="activate-icon" />
            Finish Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="command-center-dashboard">
      {/* Header */}
      <div className="command-header">
        <div className="header-left">
          <Home className="header-icon" />
          <div className="header-info">
            <h1>COMMAND CENTER</h1>
            <span className="domain-info">• {commandCenterData.domain}</span>
          </div>
        </div>
        <div className="header-right">
          <span className="data-refresh">
            Data Refresh: {new Date().toLocaleDateString("en-US")}
          </span>
          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Credit Score and ROI Recovery */}
      <div className="command-metrics-row">
        <div className="moody-credit-section">
          <h3>Moody Credit Score</h3>
          <div className="credit-score-display">
            <div className="credit-score-value">
              <span className="grade">{commandCenterData.creditGrade}</span>
              <span className="score">{commandCenterData.creditScore}/100</span>
              <span className="health">{commandCenterData.creditHealth}</span>
            </div>
            <div className="credit-gauge">
              <div
                className="gauge-fill"
                style={{ width: `${commandCenterData.creditScore}%` }}
              ></div>
            </div>
          </div>
        </div>{" "}
        <div className="content-grades-section">
          <h3>Content Quality Distribution</h3>
          <div className="grade-distribution">
            <div className="grade-bar-container">
              <div className="grade-info">
                <span className="grade-label grade-a">A</span>
                <div className="grade-bar">
                  <div
                    className="grade-fill grade-a-fill"
                    style={{
                      width: `${
                        commandCenterData.contentGrades?.percentA || 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="grade-percent">
                  {Math.round(commandCenterData.contentGrades?.percentA || 0)}%
                </span>
                <span className="grade-count">
                  ({commandCenterData.contentGrades?.A || 0})
                </span>
              </div>

              <div className="grade-info">
                <span className="grade-label grade-b">B</span>
                <div className="grade-bar">
                  <div
                    className="grade-fill grade-b-fill"
                    style={{
                      width: `${
                        commandCenterData.contentGrades?.percentB || 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="grade-percent">
                  {Math.round(commandCenterData.contentGrades?.percentB || 0)}%
                </span>
                <span className="grade-count">
                  ({commandCenterData.contentGrades?.B || 0})
                </span>
              </div>

              <div className="grade-info">
                <span className="grade-label grade-c">C</span>
                <div className="grade-bar">
                  <div
                    className="grade-fill grade-c-fill"
                    style={{
                      width: `${
                        commandCenterData.contentGrades?.percentC || 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="grade-percent">
                  {Math.round(commandCenterData.contentGrades?.percentC || 0)}%
                </span>
                <span className="grade-count">
                  ({commandCenterData.contentGrades?.C || 0})
                </span>
              </div>

              <div className="grade-info">
                <span className="grade-label grade-d">D</span>
                <div className="grade-bar">
                  <div
                    className="grade-fill grade-d-fill"
                    style={{
                      width: `${
                        commandCenterData.contentGrades?.percentD || 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="grade-percent">
                  {Math.round(commandCenterData.contentGrades?.percentD || 0)}%
                </span>
                <span className="grade-count">
                  ({commandCenterData.contentGrades?.D || 0})
                </span>
              </div>
            </div>
          </div>
        </div>{" "}
        <div className="roi-recovery-section">
          <h3>ROI Recovery Potential</h3>
          <div className="recovery-display">
            <div className="recovery-amount">
              ${commandCenterData.roiRecoveryPotential.toLocaleString()}
              <span
                className={`recovery-trend ${commandCenterData.recoveryTrend}`}
              >
                {commandCenterData.recoveryTrend === "positive" ? "▲" : "▼"}80%
              </span>
            </div>
            <div className="recovery-timeframe">
              in ≤ {commandCenterData.recoveryTimeframe} days
            </div>
          </div>{" "}
          {/* 30/60/90 Day Recovery Breakdown */}
          <div className="recovery-breakdown">
            {" "}
            <div
              className="recovery-breakdown-header"
              onClick={() => {
                console.log(
                  "Header clicked, current state:",
                  isRecoveryBreakdownExpanded
                );
                setIsRecoveryBreakdownExpanded(!isRecoveryBreakdownExpanded);
              }}
            >
              <h4>
                Recovery Timeline Breakdown
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    marginLeft: "0.5rem",
                  }}
                >
                  ({isRecoveryBreakdownExpanded ? "Expanded" : "Collapsed"})
                </span>
              </h4>{" "}
              <button
                className="collapse-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    "Toggle button clicked, current state:",
                    isRecoveryBreakdownExpanded
                  );
                  setIsRecoveryBreakdownExpanded(!isRecoveryBreakdownExpanded);
                }}
              >
                {isRecoveryBreakdownExpanded ? (
                  <ChevronUp size={24} />
                ) : (
                  <ChevronDown size={24} />
                )}
              </button>
            </div>
            {isRecoveryBreakdownExpanded && (
              <div className="recovery-timeline">
                {" "}
                {/* 30-Day Recovery */}
                <div className="recovery-period" data-period="30-day">
                  <div className="period-header">
                    <span className="period-label">30 Days</span>
                    <span className="period-amount">
                      $
                      {(
                        Object.values(
                          commandCenterData.recoveryTimeframes?.["30-day"]
                            ?.opportunities || {}
                        ).reduce(
                          (sum, opp) => sum + (opp.recoveryPotential || 0),
                          0
                        ) || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="period-opportunities">
                    {Object.entries(
                      commandCenterData.recoveryTimeframes?.["30-day"]
                        ?.opportunities || {}
                    ).map(([name, data]) => (
                      <div key={name} className="opportunity-item">
                        <span className="opportunity-name">{name}</span>
                        <span className="opportunity-value">
                          ${(data.recoveryPotential || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>{" "}
                  <button
                    className="view-plan-btn"
                    onClick={() => togglePlan("30-day")}
                  >
                    {expandedPlans["30-day"] ? "Hide Plan" : "View 30-Day Plan"}
                    {expandedPlans["30-day"] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {expandedPlans["30-day"] && (
                    <div className="recovery-plan-content">
                      <div className="plan-content">
                        <h5>🚀 30-Day Quick Wins Strategy</h5>
                        <div className="plan-section">
                          <h6>Immediate Actions (Week 1-2):</h6>
                          <ul>
                            <li>
                              <strong>Keyword Optimization:</strong> Fix
                              high-impact keyword mismatches on top-performing
                              pages
                            </li>
                            <li>
                              <strong>Technical Quick Fixes:</strong> Resolve
                              critical SEO issues like broken links and meta tag
                              optimization
                            </li>
                            <li>
                              <strong>Content Updates:</strong> Refresh outdated
                              statistics and information on decay-affected pages
                            </li>
                          </ul>
                        </div>
                        <div className="plan-section">
                          <h6>Follow-up Actions (Week 3-4):</h6>
                          <ul>
                            <li>
                              <strong>Internal Linking:</strong> Improve link
                              structure for priority pages
                            </li>
                            <li>
                              <strong>Performance Monitoring:</strong> Track
                              improvements and adjust tactics
                            </li>
                            <li>
                              <strong>Quick Content Additions:</strong> Add FAQ
                              sections and related content blocks
                            </li>
                          </ul>
                        </div>
                        <div className="expected-results">
                          <strong>Expected Results:</strong> 10-15% improvement
                          in organic traffic and 5-10% boost in conversion rates
                          within 30 days.
                        </div>
                      </div>
                    </div>
                  )}
                </div>{" "}
                {/* 60-Day Recovery */}
                <div className="recovery-period" data-period="60-day">
                  <div className="period-header">
                    <span className="period-label">60 Days</span>
                    <span className="period-amount">
                      $
                      {(
                        Object.values(
                          commandCenterData.recoveryTimeframes?.["60-day"]
                            ?.opportunities || {}
                        ).reduce(
                          (sum, opp) => sum + (opp.recoveryPotential || 0),
                          0
                        ) || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="period-opportunities">
                    {Object.entries(
                      commandCenterData.recoveryTimeframes?.["60-day"]
                        ?.opportunities || {}
                    ).map(([name, data]) => (
                      <div key={name} className="opportunity-item">
                        <span className="opportunity-name">{name}</span>
                        <span className="opportunity-value">
                          ${(data.recoveryPotential || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>{" "}
                  <button
                    className="view-plan-btn"
                    onClick={() => togglePlan("60-day")}
                  >
                    {expandedPlans["60-day"] ? "Hide Plan" : "View 60-Day Plan"}
                    {expandedPlans["60-day"] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {expandedPlans["60-day"] && (
                    <div className="recovery-plan-content">
                      <div className="plan-content">
                        <h5>📈 60-Day Comprehensive Recovery</h5>
                        <div className="plan-section">
                          <h6>Strategic Content Improvements (Week 1-4):</h6>
                          <ul>
                            <li>
                              <strong>Content Decay Recovery:</strong>{" "}
                              Comprehensive refresh of underperforming content
                              with new data and enhanced UX
                            </li>
                            <li>
                              <strong>Keyword Strategy Refinement:</strong>{" "}
                              Optimize content alignment with search intent and
                              user behavior
                            </li>
                            <li>
                              <strong>Competitive Analysis:</strong> Identify
                              content gaps and opportunities vs competitors
                            </li>
                          </ul>
                        </div>
                        <div className="plan-section">
                          <h6>
                            Technical & Structural Optimization (Week 5-8):
                          </h6>
                          <ul>
                            <li>
                              <strong>Cannibalization Resolution:</strong>{" "}
                              Consolidate competing pages with proper redirects
                              and canonical tags
                            </li>
                            <li>
                              <strong>Site Architecture:</strong> Improve
                              internal linking structure and site hierarchy
                            </li>
                            <li>
                              <strong>Performance Optimization:</strong> Enhance
                              page speed and Core Web Vitals
                            </li>
                          </ul>
                        </div>
                        <div className="expected-results">
                          <strong>Expected Results:</strong> 15-25% improvement
                          in organic traffic and 20-30% boost in conversion
                          rates within 60 days.
                        </div>
                      </div>
                    </div>
                  )}
                </div>{" "}
                {/* 90-Day Recovery */}
                <div className="recovery-period" data-period="90-day">
                  <div className="period-header">
                    <span className="period-label">90 Days</span>
                    <span className="period-amount">
                      $
                      {(
                        Object.values(
                          commandCenterData.recoveryTimeframes?.["90-day"]
                            ?.opportunities || {}
                        ).reduce(
                          (sum, opp) => sum + (opp.recoveryPotential || 0),
                          0
                        ) || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="period-opportunities">
                    {Object.entries(
                      commandCenterData.recoveryTimeframes?.["90-day"]
                        ?.opportunities || {}
                    ).map(([name, data]) => (
                      <div key={name} className="opportunity-item">
                        <span className="opportunity-name">{name}</span>
                        <span className="opportunity-value">
                          ${(data.recoveryPotential || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>{" "}
                  <button
                    className="view-plan-btn"
                    onClick={() => togglePlan("90-day")}
                  >
                    {expandedPlans["90-day"] ? "Hide Plan" : "View 90-Day Plan"}
                    {expandedPlans["90-day"] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {expandedPlans["90-day"] && (
                    <div className="recovery-plan-content">
                      <div className="plan-content">
                        <h5>🚀 90-Day Strategic Transformation</h5>
                        <div className="plan-section">
                          <h6>Advanced SEO & Authority Building (Week 1-6):</h6>
                          <ul>
                            <li>
                              <strong>Link Structure Optimization:</strong>{" "}
                              Complete audit and restructuring of
                              internal/external links for maximum SEO value
                            </li>
                            <li>
                              <strong>Content Authority Enhancement:</strong>{" "}
                              Develop comprehensive topic clusters and pillar
                              pages
                            </li>
                            <li>
                              <strong>Technical SEO Mastery:</strong> Advanced
                              schema markup, site speed optimization, and
                              crawlability improvements
                            </li>
                          </ul>
                        </div>
                        <div className="plan-section">
                          <h6>Funnel & Conversion Optimization (Week 7-12):</h6>
                          <ul>
                            <li>
                              <strong>Funnel Alignment:</strong> Strategic
                              content mapping to buyer journey stages with
                              psychological triggers
                            </li>
                            <li>
                              <strong>Conversion Rate Optimization:</strong> A/B
                              testing of landing pages, CTAs, and user
                              experience flows
                            </li>
                            <li>
                              <strong>Analytics & Attribution:</strong> Enhanced
                              tracking and attribution modeling for better
                              decision making
                            </li>
                          </ul>
                        </div>
                        <div className="expected-results">
                          <strong>Expected Results:</strong> 30-50% improvement
                          in domain authority, 40-60% boost in qualified lead
                          generation, and sustainable long-term growth
                          foundation.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid-section">
        <h3>KPI GRID</h3>{" "}
        <div className="kpi-grid">
          <div
            className="kpi-tile waste"
            onClick={() => navigate("/riskdashboard")}
          >
            <div className="kpi-icon">💸</div>{" "}
            <div className="kpi-label">
              Waste $
              <FinancialTooltip
                title={
                  getTooltipContent("contentCreationCost", onboardingData).title
                }
                content={
                  getTooltipContent("contentCreationCost", onboardingData)
                    .content
                }
                position="top"
              />
            </div>
            <div className="kpi-value">
              ${commandCenterData.kpiMetrics.wastedSpend.toLocaleString()}{" "}
              <div className="kpi-dollar">
                + $
                {Math.round(
                  (onboardingData?.domainCostDetails?.totalInvested || 10000) *
                    0.05 // 5% opportunity loss for conversion optimization potential
                ).toLocaleString()}{" "}
                opportunity loss
              </div>
            </div>
          </div>
          <div
            className="kpi-tile decay"
            onClick={() => navigate("/contentledger")}
          >
            <div className="kpi-icon">📉</div>{" "}
            <div className="kpi-label">
              Deep Decay
              <FinancialTooltip
                title={getTooltipContent("contentDecay", onboardingData).title}
                content={
                  getTooltipContent("contentDecay", onboardingData).content
                }
                position="top"
              />
            </div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.deepDecayPages} pages
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.deepDecayDollarValue.toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>
          <div
            className="kpi-tile dilution"
            onClick={() => navigate("/riskdashboard")}
          >
            <div className="kpi-icon">🔗</div>{" "}
            <div className="kpi-label">
              Dilution
              <FinancialTooltip
                title={getTooltipContent("linkDilution", onboardingData).title}
                content={
                  getTooltipContent("linkDilution", onboardingData).content
                }
                position="top"
              />
            </div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.highDilutionPages} pages
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.dilutionDollarValue.toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>
          <div
            className="kpi-tile keyword"
            onClick={() => navigate("/agents/ideation")}
          >
            <div className="kpi-icon">🔑</div>{" "}
            <div className="kpi-label">
              KD≪DA
              <FinancialTooltip
                title={getTooltipContent("kwMismatch", onboardingData).title}
                content={
                  getTooltipContent("kwMismatch", onboardingData).content
                }
                position="top"
              />
            </div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.lowKDHighDAUrls} URLs
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.keywordMismatchDollarValue.toLocaleString()}{" "}
                potential
              </div>
            </div>
          </div>
          <div
            className="kpi-tile psych"
            onClick={() => navigate("/agents/strategy")}
          >
            <div className="kpi-icon">🧠</div>{" "}
            <div className="kpi-label">
              Psych%
              <FinancialTooltip
                title={
                  getTooltipContent("psychoMismatch", onboardingData).title
                }
                content={
                  getTooltipContent("psychoMismatch", onboardingData).content
                }
                position="top"
              />
            </div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.psychoMismatch}% miss
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.cannibalizationLossvalue.toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>
          <div
            className="kpi-tile funnel"
            onClick={() => navigate("/agents/content-creation")}
          >
            <div className="kpi-icon">🎯</div>{" "}
            <div className="kpi-label">
              FunnelGap
              <FinancialTooltip
                title={getTooltipContent("funnelGaps", onboardingData).title}
                content={
                  getTooltipContent("funnelGaps", onboardingData).content
                }
                position="top"
              />
            </div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.funnelGap}{" "}
              <div className="kpi-dollar">
                $
                {Math.round(
                  commandCenterData.kpiMetrics.psychoMismatchDollarValue
                ).toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>
        </div>
        <p className="kpi-note">
          • Tiles are click-thru to Risk, Ledger, or Strategy pages
        </p>
      </div>

      {/* Conversion Rate Slider */}
      <div className="conversion-rate-section">
        <h3>CONVERSION RATE OPTIMIZER</h3>
        <div className="slider-container">
          <div className="slider-info">
            <span className="slider-label">Conversion Rate:</span>
            <span className="slider-value">
              {conversionRate.toFixed(1)}%
            </span>{" "}
            <span className="slider-impact">
              ($
              {Math.round(
                (commandCenterData.kpiMetrics?.deepDecayDollarValue || 0) +
                  (commandCenterData.kpiMetrics?.dilutionDollarValue || 0) +
                  (commandCenterData.kpiMetrics?.keywordMismatchDollarValue ||
                    0) +
                  (commandCenterData.kpiMetrics?.psychoMismatchDollarValue ||
                    0) +
                  (commandCenterData.kpiMetrics?.funnelGapDollarValue || 0) +
                  (commandCenterData.kpiMetrics?.wastedSpend || 0) +
                  (commandCenterData.totalClicks || 0) *
                    (conversionRate / 100) *
                    (parseFloat(
                      onboardingData?.domainCostDetails?.averageOrderValue
                    ) || 50) *
                    0.4
              ).toLocaleString()}{" "}
              total KPI impact)
            </span>
          </div>{" "}
          <div className="slider-wrapper" onClick={(e) => e.stopPropagation()}>
            {" "}
            <input
              type="range"
              min="1.0"
              max="4.5"
              step="0.1"
              value={conversionRate}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                setConversionRate(newValue);
              }}
              onInput={(e) => {
                const newValue = parseFloat(e.target.value);
                setConversionRate(newValue);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="conversion-slider"
              aria-label="Adjust conversion rate"
            />
            <div className="slider-labels">
              <span>1.0%</span>
              <span>2.25%</span>
              <span>4.5%</span>
            </div>
          </div>{" "}
          <p className="slider-note">
            💡 Adjust conversion rate to see real-time impact on all KPI dollar
            calculations and total combined financial impact
          </p>
        </div>
      </div>

      {/* Traffic & ROI Sparks */}
      {/* <div className="sparks-section">
        <h3>TRAFFIC & ROI SPARKS (Last 90 days)</h3>
        <div className="sparks-grid">
          <div className="spark-item">
            <span className="spark-label">Impressions</span>
            <Sparkline
              data={commandCenterData.sparkData.impressions}
              type="default"
            />
          </div>
          <div className="spark-item">
            <span className="spark-label">Clicks</span>
            <Sparkline
              data={commandCenterData.sparkData.clicks}
              type="default"
            />
          </div>
          <div className="spark-item">
            <span className="spark-label">ROI</span>
            <Sparkline
              data={commandCenterData.sparkData.roi}
              type={commandCenterData.totalROI > 0 ? "positive" : "negative"}
            />
          </div>
          <div className="spark-item">
            <span className="spark-label">Waste</span>
            <Sparkline
              data={commandCenterData.sparkData.waste}
              type="warning"
            />
          </div>
        </div>
      </div> */}

      {/* Funnel Coverage & Psych Alignment */}
      {/* <div className="funnel-psych-section">
        <h3>FUNNEL COVERAGE & PSYCH ALIGNMENT</h3>
        <div className="funnel-coverage">
          <div className="funnel-stage tofu">
            <span className="stage-label">TOFU</span>
            <div className="stage-bar">
              <div
                className="stage-fill"
                style={{ width: `${commandCenterData.funnelCoverage.tofu}%` }}
              ></div>
            </div>
            <span className="stage-percent">
              {commandCenterData.funnelCoverage.tofu}%
            </span>
          </div>

          <div className="funnel-stage mofu">
            <span className="stage-label">MOFU</span>
            <div className="stage-bar">
              <div
                className="stage-fill"
                style={{ width: `${commandCenterData.funnelCoverage.mofu}%` }}
              ></div>
            </div>
            <span className="stage-percent">
              {commandCenterData.funnelCoverage.mofu}%
            </span>
          </div>

          <div className="funnel-stage bofu">
            <span className="stage-label">BOFU</span>
            <div className="stage-bar">
              <div
                className="stage-fill"
                style={{ width: `${commandCenterData.funnelCoverage.bofu}%` }}
              ></div>
            </div>
            <span className="stage-percent">
              {commandCenterData.funnelCoverage.bofu}%
            </span>
          </div>

          <div className="psych-match">
            <span className="psych-label">Psych Match:</span>
            <div className="psych-gauge">
              <div
                className="psych-ring"
                style={{
                  background: `conic-gradient(#10b981 0deg ${
                    commandCenterData.psychMatch * 3.6
                  }deg, #e5e7eb ${
                    commandCenterData.psychMatch * 3.6
                  }deg 360deg)`,
                }}
              >
                <div className="psych-center">
                  {commandCenterData.psychMatch}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          className="generate-tofu-btn"
          onClick={() => navigate("/agents/content-creation")}
        >
          ► Generate TOFU Briefs
        </button>
      </div> */}

      {/* Action Center */}
      <div className="action-center-section">
        <h3>ACTION CENTER</h3>
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={() => navigate("/agents/strategy")}
          >
            <BarChart3 size={16} />
            Generate ROI Plan
          </button>
          <button
            className="action-btn secondary"
            onClick={() => navigate("/riskdashboard")}
          >
            <Shield size={16} />
            Open Risk Dashboard
          </button>
          <button
            className="action-btn secondary"
            onClick={() => navigate("/agents/ideation")}
          >
            <Search size={16} />
            See Keyword Intel
          </button>
          <button
            className="action-btn secondary"
            onClick={() => navigate("/agents")}
          >
            <Settings size={16} />
            Launch Task Hub
          </button>
        </div>
      </div>

      {/* Premium Upgrade Section */}
      <div className="premium-upgrade-section">
        <div className="premium-header">
          <div className="premium-icon">🔒</div>
          <h3>PREMIUM ANALYSIS ZONES - Unlock with Pro Plan</h3>
        </div>

        <div className="analysis-limitation">
          <p className="limitation-text">
            <strong>
              We have analyzed only {commandCenterData.totalPages || 0} URLs
            </strong>{" "}
            - To analyze more, get Pro access
          </p>
        </div>

        <div className="premium-features">
          <div className="premium-feature">
            <div className="feature-icon">📊</div>
            <div className="feature-content">
              <span className="feature-label">
                Underperforming Pages (Low ROI / Dormant)
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon">⚡</div>
            <div className="feature-content">
              <span className="feature-label">
                Topic Fatigue / Plateau Detection
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon">🔄</div>
            <div className="feature-content">
              <span className="feature-label">
                Keyword Burnout (Repeated Targets)
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon">🍀</div>
            <div className="feature-content">
              <span className="feature-label">
                Missing Buyer-Journey Content
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon">🔴</div>
            <div className="feature-content">
              <span className="feature-label">
                Invisible Pages (No Index / No Impressions)
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon">💀</div>
            <div className="feature-content">
              <span className="feature-label">
                Content Cannibalization Risk (Deep)
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon">📦</div>
            <div className="feature-content">
              <span className="feature-label">
                UX / Format Issues (Structural Waste)
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon">🎯</div>
            <div className="feature-content">
              <span className="feature-label">
                Misaligned Targeting (Persona Drift)
              </span>
              <span className="feature-status">🔒 Unlock w/ Plan ►</span>
            </div>
          </div>
        </div>

        <div className="premium-cta">
          <p className="cta-instruction">
            ↑ Use arrow keys or click ► to drill into{" "}
            <span className="highlight">any</span> metric.
          </p>
          <p className="cta-upgrade">
            Upgrade to Pro to activate locked zones and full financial models.
          </p>
          <button className="upgrade-btn" onClick={() => navigate("/pricing")}>
            🚀 Upgrade to Pro Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterDashboard;
