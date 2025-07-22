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
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const [calculationsLoading, setCalculationsLoading] = useState(true); // Loading state for calculations
  const [calcProgress, setCalcProgress] = useState(0); // Track calculation progress
  const {
    getRevenueLeak,
    getContentDecay,
    getKeywordMismatch,
    getLinkDilution,
    getPsychMismatch,
    getCannibalizationLoss,
    funnelGapIdentifier,
    getContentQualityDistribution,
    calculateTotalLoss,
    getMoodyCreditScore,
    getROIRecoveryPotential,
  } = useFinancialCalculations();
  const navigate = useNavigate();
  const location = useLocation();
  const showInitialLoader = location.state?.showLoading;
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
    "180-day": false,
    "360-day": false,
  });

  // Toggle function for individual plans
  const togglePlan = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset calculations loading state when onboardingData changes
  useEffect(() => {
    if (onboardingData) {
      setCalculationsLoading(true);
      setCalcProgress(0);
    }
  }, [onboardingData]);
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
      // Start calculation process - set loading state
      setCalculationsLoading(true);
      setCalcProgress(10); // Started calculations

      // Use FinancialCalculations context functions for all metrics
      const revenueLeakData = getRevenueLeak({});
      setCalcProgress(20); // 20% complete

      const contentDecayData = getContentDecay();
      setCalcProgress(30); // 30% complete

      const keywordMismatchData = getKeywordMismatch();
      setCalcProgress(40); // 40% complete

      const linkDilutionData = getLinkDilution({});
      setCalcProgress(50); // 50% complete

      const psychMismatchData = getPsychMismatch({});
      setCalcProgress(60); // 60% complete

      const funnelGapData = funnelGapIdentifier();
      setCalcProgress(70); // 70% complete

      const contentQualityData = getContentQualityDistribution();
      setCalcProgress(80); // 80% complete

      const creditScoreData = getMoodyCreditScore();
      setCalcProgress(90); // 90% complete

      const cannibalizationLossData = getCannibalizationLoss();
      const roiRecoveryData = getROIRecoveryPotential();

      // Calculations complete
      setCalcProgress(100);
      setTimeout(() => setCalculationsLoading(false), 100); // Small delay to ensure UI updates // Use searchConsoleData for basic metrics calculations

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
        investmentRequired: roiRecoveryData?.summary?.investmentRequired || 0,
        baseHourlyRate: roiRecoveryData?.summary?.baseHourlyRate || 50,
        effectiveHours: roiRecoveryData?.summary?.effectiveHours || 0,
        recoveryTimeframe,
        recoveryTrend,
        // Full recovery breakdown for 30/60/90/180/360 day display
        recoveryTimeframes: roiRecoveryData?.recoveryTimeframes || {},
        // Include the threeSixtyDay data and totalSystemLoss for the 360-day view
        threeSixtyDay: roiRecoveryData?.threeSixtyDay || {},
        totalSystemLoss: roiRecoveryData?.totalSystemLoss || 0,
        roiRecoveryTooltip: roiRecoveryData?.summary?.tooltip || {},

        // KPI Grid using context data

        kpiMetrics: {
          wastedSpend: Math.round(
            calculateTotalLoss()?.summary?.totalRevenueLoss ||
              revenueLeakData?.estimatedRevenueLoss ||
              0
          ),
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
    calculateTotalLoss,
    getMoodyCreditScore,
    getROIRecoveryPotential,
  ]);

  if (loading || calculationsLoading) {
    return (
      <div className="command-center-loading">
        <RefreshCw className="loading-spinner" />
        <p>
          {loading
            ? "Loading Command Center Dashboard..."
            : `Calculating financial metrics... ${calcProgress}%`}
        </p>
        {!loading && calculationsLoading && (
          <div className="calculation-progress-bar">
            <div
              className="calculation-progress-fill"
              style={{ width: `${calcProgress}%` }}
            ></div>
          </div>
        )}
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
          <h3>Credit Score</h3>
          <div className="credit-score-display">
            <div className="credit-score-value">
              <span className="grade-moody">
                {commandCenterData.creditGrade}
              </span>
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
        <div className="roi-recovery-section">
          <h3>ROI Recovery Potential</h3>
          <div className="recovery-display">
            <div className="recovery-amount">
              ${commandCenterData.roiRecoveryPotential.toLocaleString()}
              <span
                className={`recovery-trend ${commandCenterData.recoveryTrend}`}
              >
                {commandCenterData.recoveryTrend === "positive" ? "▲" : "▼"}
                {Math.round(
                  (commandCenterData.roiRecoveryPotential /
                    Math.max(commandCenterData.totalSystemLoss || 1, 1)) *
                    100
                )}
                %
              </span>
            </div>
            <div className="recovery-timeframe">in ≤ 360 days</div>
            <div className="recovery-summary">
              <div className="summary-stat">
                <span className="stat-label">Total System Loss:</span>
                <span className="stat-value">
                  ${(commandCenterData.totalSystemLoss || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Recovery Rate:</span>
                <span className="stat-value">
                  {Math.round(
                    (commandCenterData.roiRecoveryPotential /
                      Math.max(commandCenterData.totalSystemLoss || 1, 1)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Investment Required:</span>
                <div className="stat-item">
                  <span className="stat-label-highlight">
                    Base Hourly Rate:
                  </span>
                  <span className="stat-value-highlight">
                    $
                    {Math.round(
                      commandCenterData?.baseHourlyRate || 0
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label-highlight">Effective Hours:</span>
                  <span className="stat-value-highlight">
                    {Math.round(
                      commandCenterData?.effectiveHours || 0
                    ).toLocaleString()}{" "}
                    hours
                  </span>
                </div>
                <span className="stat-value">
                  $
                  {Math.round(
                    Math.max(commandCenterData?.investmentRequired || 0)
                  ).toLocaleString()}
                </span>
              </div>
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
                {/* 30-Day Recovery */}
                <div className="recovery-period" data-period="30-day">
                  <div className="period-header">
                    <span className="period-label">30 Days</span>
                    <span className="period-amount">
                      $
                      {(
                        commandCenterData.recoveryTimeframes?.["30-day"]
                          ?.recoveryPotential || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="period-factors">
                    {(
                      commandCenterData.recoveryTimeframes?.["30-day"]
                        ?.factors || []
                    ).map((factor, index) => (
                      <div key={index} className="factor-item">
                        <span className="factor-name">{factor}</span>
                      </div>
                    ))}
                  </div>
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
                              high-impact keyword mismatches and search intent
                              alignment
                            </li>
                            <li>
                              <strong>Content Updates:</strong> Refresh
                              top-performing content showing decay signals
                            </li>
                            <li>
                              <strong>Technical Fixes:</strong> Resolve critical
                              cannibalization conflicts
                            </li>
                          </ul>
                        </div>
                        <div className="expected-results">
                          <strong>Expected Results:</strong> 5-15% improvement
                          in organic traffic and quick revenue recovery from
                          low-hanging fruit optimizations.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 90-Day Recovery */}
                <div className="recovery-period" data-period="90-day">
                  <div className="period-header">
                    <span className="period-label">90 Days</span>
                    <span className="period-amount">
                      $
                      {(
                        commandCenterData.recoveryTimeframes?.["90-day"]
                          ?.recoveryPotential || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="period-factors">
                    {(
                      commandCenterData.recoveryTimeframes?.["90-day"]
                        ?.factors || []
                    ).map((factor, index) => (
                      <div key={index} className="factor-item">
                        <span className="factor-name">{factor}</span>
                      </div>
                    ))}
                  </div>
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
                        <h5>📈 90-Day Strategic Recovery</h5>
                        <div className="plan-section">
                          <h6>Content Strategy (Month 1-2):</h6>
                          <ul>
                            <li>
                              <strong>Content Decay Recovery:</strong>{" "}
                              Comprehensive refresh of underperforming content
                              with enhanced UX
                            </li>
                            <li>
                              <strong>Link Authority Building:</strong>{" "}
                              Strategic internal linking and authority flow
                              optimization
                            </li>
                            <li>
                              <strong>Psychographic Alignment:</strong> Content
                              messaging optimization for target audience
                            </li>
                          </ul>
                        </div>
                        <div className="plan-section">
                          <h6>Technical & Structural (Month 3):</h6>
                          <ul>
                            <li>
                              <strong>Site Architecture:</strong> Improve
                              content hierarchy and user journey flows
                            </li>
                            <li>
                              <strong>Performance Optimization:</strong>{" "}
                              Enhanced page speed and Core Web Vitals
                            </li>
                          </ul>
                        </div>
                        <div className="expected-results">
                          <strong>Expected Results:</strong> 25-40% improvement
                          in organic traffic and 30-45% boost in conversion
                          rates.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 180-Day Recovery */}
                <div className="recovery-period" data-period="180-day">
                  <div className="period-header">
                    <span className="period-label">180 Days</span>
                    <span className="period-amount">
                      $
                      {(
                        commandCenterData.recoveryTimeframes?.["180-day"]
                          ?.recoveryPotential || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="period-factors">
                    {(
                      commandCenterData.recoveryTimeframes?.["180-day"]
                        ?.factors || []
                    ).map((factor, index) => (
                      <div key={index} className="factor-item">
                        <span className="factor-name">{factor}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="view-plan-btn"
                    onClick={() => togglePlan("180-day")}
                  >
                    {expandedPlans["180-day"]
                      ? "Hide Plan"
                      : "View 180-Day Plan"}
                    {expandedPlans["180-day"] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {expandedPlans["180-day"] && (
                    <div className="recovery-plan-content">
                      <div className="plan-content">
                        <h5>🎯 180-Day Comprehensive Recovery</h5>
                        <div className="plan-section">
                          <h6>Advanced Content Strategy (Month 1-4):</h6>
                          <ul>
                            <li>
                              <strong>Content Portfolio Optimization:</strong>{" "}
                              Complete content audit and strategic restructuring
                            </li>
                            <li>
                              <strong>Competitive Positioning:</strong> Market
                              gap analysis and authority building initiatives
                            </li>
                            <li>
                              <strong>User Experience Enhancement:</strong>{" "}
                              Advanced UX optimization based on user behavior
                              data
                            </li>
                          </ul>
                        </div>
                        <div className="plan-section">
                          <h6>Authority & Technical Excellence (Month 5-6):</h6>
                          <ul>
                            <li>
                              <strong>Domain Authority Building:</strong>{" "}
                              Strategic link acquisition and content
                              partnerships
                            </li>
                            <li>
                              <strong>Technical SEO Mastery:</strong> Advanced
                              schema, structured data, and site optimization
                            </li>
                            <li>
                              <strong>Conversion Optimization:</strong> A/B
                              testing and funnel optimization implementation
                            </li>
                          </ul>
                        </div>
                        <div className="expected-results">
                          <strong>Expected Results:</strong> 50-70% improvement
                          in organic performance with established market
                          authority and sustainable growth foundation.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 360-Day Recovery */}
                <div className="recovery-period" data-period="360-day">
                  <div className="period-header">
                    <span className="period-label">360 Days</span>
                    <span className="period-amount">
                      $
                      {(
                        commandCenterData.recoveryTimeframes?.["360-day"]
                          ?.recoveryPotential || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="period-factors">
                    {(
                      commandCenterData.recoveryTimeframes?.["360-day"]
                        ?.factors || []
                    ).map((factor, index) => (
                      <div key={index} className="factor-item">
                        <span className="factor-name">{factor}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="view-plan-btn"
                    onClick={() => togglePlan("360-day")}
                  >
                    {expandedPlans["360-day"]
                      ? "Hide Plan"
                      : "View 360-Day Plan"}
                    {expandedPlans["360-day"] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {expandedPlans["360-day"] && (
                    <div className="recovery-plan-content">
                      <div className="plan-content">
                        <h5>🏆 360-Day Market Leadership Strategy</h5>
                        <div className="plan-section">
                          <h6>Strategic Foundation (Q1-Q2):</h6>
                          <ul>
                            <li>
                              <strong>Complete System Optimization:</strong>{" "}
                              Full implementation of all 6 recovery factors
                            </li>
                            <li>
                              <strong>Content Authority Development:</strong>{" "}
                              Thought leadership establishment and topical
                              expertise
                            </li>
                            <li>
                              <strong>Market Position Solidification:</strong>{" "}
                              Competitive moat building and sustainable
                              advantage creation
                            </li>
                          </ul>
                        </div>
                        <div className="plan-section">
                          <h6>Market Leadership & Scaling (Q3-Q4):</h6>
                          <ul>
                            <li>
                              <strong>Industry Authority:</strong> Recognition
                              as market leader through content excellence and
                              expertise
                            </li>
                            <li>
                              <strong>Predictive Optimization:</strong>{" "}
                              AI-driven content strategy and performance
                              prediction systems
                            </li>
                            <li>
                              <strong>Ecosystem Development:</strong>{" "}
                              Partnership networks and collaborative content
                              strategies
                            </li>
                          </ul>
                        </div>
                        <div className="expected-results">
                          <strong>Expected Results:</strong>{" "}
                          {Math.round(
                            (commandCenterData.threeSixtyDay?.recoveryFactor ||
                              0.8) * 100
                          )}
                          % recovery of total system loss, market leadership
                          position, and sustainable competitive advantage with
                          predictive optimization systems.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
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
      {/* <div className="conversion-rate-section">
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
      </div> */}

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
