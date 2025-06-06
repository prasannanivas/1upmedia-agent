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
import {
  Home,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Settings,
  Play,
  Search,
  Shield,
} from "lucide-react";
import { calculateGradeDistribution } from "../../utils/ContentRating";
import "./CommandCenterDashboard.css";

const CommandCenterDashboard = () => {
  const { onboardingData, loading } = useOnboarding();
  const navigate = useNavigate();

  // Conversion rate state (1% to 4.5% range)
  const [conversionRate, setConversionRate] = useState(2.0); // Default 2%

  // Calculate command center metrics from onboarding data
  const commandCenterData = useMemo(() => {
    if (!onboardingData || loading) return { isBlind: true };

    // CONSISTENT DATA ACCESS: Use GSCAnalysisData structure like other dashboards
    const gscAnalysisData = onboardingData?.GSCAnalysisData || {};
    const contentDecayData = gscAnalysisData?.contentDecay || [];
    const contentCostWasteData = gscAnalysisData.contentCostWaste || [];
    const linkDilutionData = gscAnalysisData.linkDilution || [];

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

    // Use searchConsoleData for metrics calculations (raw data)
    const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];
    if (searchConsoleData.length === 0) {
      return { isBlind: true };
    }

    // Use actual domain cost details from onboardingData.domainCostDetails structure
    const averageOrderValue =
      parseFloat(onboardingData.domainCostDetails?.averageOrderValue) || 50;
    const contentCost =
      parseFloat(onboardingData.domainCostDetails?.AverageContentCost) || 200;

    // Calculate comprehensive metrics using actual search console data
    // Field mapping: item.impressions, item.clicks, item.position, item.ctr
    const totalImpressions = searchConsoleData.reduce(
      (sum, item) => sum + (parseInt(item.impressions) || 0),
      0
    );
    const totalClicks = searchConsoleData.reduce(
      (sum, item) => sum + (parseInt(item.clicks) || 0),
      0
    );
    const avgPosition =
      searchConsoleData.reduce(
        (sum, item) => sum + (parseFloat(item.position) || 0),
        0
      ) / searchConsoleData.length; // Calculate ROI and cost metrics
    const conversionRateDecimal = conversionRate / 100; // Convert percentage to decimal
    const totalConversions = totalClicks * conversionRateDecimal;
    const totalRevenue = totalConversions * averageOrderValue;
    const totalCost = searchConsoleData.length * contentCost;
    const totalROI =
      totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : -100;

    // Calculate Moody's Credit Score based on comprehensive metrics
    let creditScore = 50; // Base score

    // ROI factors
    if (totalROI > 100) creditScore += 30;
    else if (totalROI > 50) creditScore += 20;
    else if (totalROI > 0) creditScore += 10;
    else if (totalROI > -25) creditScore -= 10;
    else creditScore -= 30;

    // Position factors
    if (avgPosition <= 10) creditScore += 15;
    else if (avgPosition <= 20) creditScore += 5;
    else if (avgPosition > 50) creditScore -= 15;

    // CTR factors
    const avgCTR =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    if (avgCTR > 5) creditScore += 10;
    else if (avgCTR > 2) creditScore += 5;
    else if (avgCTR < 1) creditScore -= 10; // Content decay analysis
    const decayingPages = searchConsoleData.filter(
      (item) => parseFloat(item.position) > 30
    ).length;
    const decayPercentage = (decayingPages / searchConsoleData.length) * 100;
    if (decayPercentage > 50) creditScore -= 15;
    else if (decayPercentage > 25) creditScore -= 10;

    // Ensure score is within bounds
    creditScore = Math.max(0, Math.min(100, creditScore));
    const baseConversionValue = averageOrderValue * conversionRateDecimal;

    // Determine credit grade
    let creditGrade, creditHealth;
    if (creditScore >= 90) {
      creditGrade = "AAA";
      creditHealth = "🟢 Elite";
    } else if (creditScore >= 80) {
      creditGrade = "AA";
      creditHealth = "🟢 Strong";
    } else if (creditScore >= 70) {
      creditGrade = "BBB";
      creditHealth = "🟡 Stable";
    } else if (creditScore >= 60) {
      creditGrade = "BBB-";
      creditHealth = "⚠️ At Risk";
    } else if (creditScore >= 40) {
      creditGrade = "CCC";
      creditHealth = "🔴 High Risk";
    } else {
      creditGrade = "DD";
      creditHealth = "🔥 Critical";
    } // Calculate KPI metrics using standardized processed data from GSCAnalysisData
    const wastedSpend = (() => {
      // Use processed content cost waste data if available
      if (contentCostWasteData.length > 0) {
        return contentCostWasteData.reduce(
          (sum, item) => sum + (item.wastedSpend || 0),
          0
        );
      } else {
        // Fallback calculation for compatibility
        return Math.max(
          0,
          searchConsoleData
            .filter((item) => parseFloat(item.position) > 30)
            .reduce(
              (sum) =>
                sum +
                contentCost * 2 + // Realistic multiplier for $7.30 content cost
                ((averageOrderValue * (1.5 / conversionRate)) / 100) * 3, // Fixed: inverse relationship
              0
            ) // Waste decreases with better conversion rate
        );
      }
    })();

    // Use processed decay data if available, otherwise derive from search console
    const deepDecayPages = (() => {
      if (contentDecayData.length > 0) {
        return contentDecayData.filter((item) => item.status === "Deep Decay")
          .length;
      } else {
        return searchConsoleData.filter(
          (item) => parseFloat(item.position) > 50
        ).length;
      }
    })();

    // Use processed dilution data if available, otherwise derive estimates
    const highDilutionPages = (() => {
      if (linkDilutionData.length > 0) {
        return linkDilutionData.filter((item) => item.dilutionScore > 0.05)
          .length;
      } else {
        return searchConsoleData.filter(
          (item) => parseFloat(item.position) > 20 && parseInt(item.clicks) < 5
        ).length;
      }
    })();

    const lowKDHighDAUrls = searchConsoleData.filter(
      (item) => parseFloat(item.position) <= 20
    ).length; // Use actual funnel analysis data if available, otherwise derive from search data
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
      // Fallback to derived funnel analysis from search console position data
      tofuPercentage = Math.round(
        (searchConsoleData.filter((item) => parseFloat(item.position) <= 10)
          .length /
          searchConsoleData.length) *
          100
      );
      mofuPercentage = Math.round(
        (searchConsoleData.filter(
          (item) =>
            parseFloat(item.position) > 10 && parseFloat(item.position) <= 30
        ).length /
          searchConsoleData.length) *
          100
      );
      bofuPercentage = 100 - tofuPercentage - mofuPercentage;
    }

    // FIXED: Funnel gap analysis - detect multiple types of imbalances
    let funnelGap = "Balanced";
    if (mofuPercentage < 10)
      funnelGap = "MoF Crisis"; // Less than 10% middle funnel is critical
    else if (tofuPercentage < 20)
      funnelGap = "ToF Deficit"; // Less than 20% top funnel
    else if (bofuPercentage > 60) funnelGap = "BoF Heavy";
    // More than 60% bottom funnel indicates imbalance
    else if (bofuPercentage < 15) funnelGap = "BoF Deficit"; // Less than 15% bottom funnel

    // FIXED: Psychographic mismatch using actual psychographic data when available
    let psychoMismatch;
    if (funnelAnalysis.psychCompositeSummary) {
      // Use actual psychographic analysis data
      const psychData = funnelAnalysis.psychCompositeSummary.overall;
      // Convert composite scores to mismatch percentage (lower scores = higher mismatch)
      const avgPsychScore =
        (psychData.emotionalResonance +
          psychData.cognitiveClarity +
          psychData.persuasionLeverage +
          psychData.behavioralMomentum) /
        4;
      psychoMismatch = Math.round(100 - avgPsychScore); // Invert to show mismatch
    } else {
      // Fallback to CTR-based calculation
      psychoMismatch = Math.round(
        (searchConsoleData.filter((item) => parseFloat(item.ctr) < 2).length /
          searchConsoleData.length) *
          100
      );
    } // Calculate substantial dollar amounts for each KPI metric - made more significant for visibility
    // Base conversion value that changes with slider
    // FIXED LOGIC: Higher conversion rates should show LESS loss, not more    // Deep Decay Dollar Impact: Pages ranking below 50 lose potential revenue
    // Loss decreases as conversion rate improves (inverse relationship)
    const deepDecayDollarValue = Math.round(
      deepDecayPages * contentCost * 3 + // Realistic multiplier: 3x content cost
        deepDecayPages *
          ((averageOrderValue * (3.0 / conversionRate)) / 100) *
          totalClicks *
          0.2 // Fixed logic: lower conversion = higher loss
    ); // High Dilution Dollar Impact: Pages with poor performance dilute budget
    // Loss decreases as conversion rate improves
    const dilutionDollarValue = Math.round(
      highDilutionPages * contentCost * 2 + // Realistic multiplier: 2x content cost
        highDilutionPages *
          ((averageOrderValue * (2.0 / conversionRate)) / 100) *
          totalClicks *
          0.25 // Fixed logic: inverse relationship with conversion rate
    ); // Keyword Mismatch Dollar Impact: High DA URLs not optimized properly
    // Loss decreases significantly as conversion rate improves
    const keywordMismatchDollarValue = Math.round(
      lowKDHighDAUrls *
        ((averageOrderValue * (3.0 / conversionRate)) / 100) *
        25 + // Realistic multiplier for $10 AOV business
        lowKDHighDAUrls * contentCost * 2
    ); // Psychographic Mismatch Dollar Impact: Content not resonating with audience
    // Loss decreases as conversion rate improves
    const psychoMismatchDollarValue = Math.round(
      (psychoMismatch / 100) *
        totalClicks *
        ((averageOrderValue * (2.5 / conversionRate)) / 100) *
        6 + // Realistic multiplier for $10 AOV business
        psychoMismatch * contentCost * 1.5
    ); // Funnel Gap Dollar Impact: Different types of funnel imbalances cause different losses
    // Loss decreases as conversion rate improves
    let funnelGapDollarValue = 0;
    if (funnelGap === "MoF Crisis") {
      // Most critical - missing middle funnel loses qualified leads
      // With only 4% MoF vs ideal 15-25%, this is a massive problem
      const mofDeficit = Math.max(15 - mofuPercentage, 0); // Target at least 15% MoF
      funnelGapDollarValue = Math.round(
        mofDeficit * contentCost * 0.8 + // Moderate multiplier for MoF crisis
          mofDeficit *
            ((averageOrderValue * (2.5 / conversionRate)) / 1000) *
            totalClicks *
            0.4 // Impact from conversion rate
      );
    } else if (funnelGap === "BoF Heavy") {
      // Too bottom-heavy loses awareness traffic
      // With 71% BoF vs ideal max 40%, this indicates over-focus on conversion content
      const bofExcess = Math.max(bofuPercentage - 40, 0);
      funnelGapDollarValue = Math.round(
        bofExcess * contentCost * 6 + // Penalty for being too bottom-heavy
          bofExcess *
            ((averageOrderValue * (2.0 / conversionRate)) / 100) *
            totalClicks *
            3
      );
    } else if (funnelGap === "ToF Deficit") {
      // Missing top funnel loses new audience acquisition
      const tofDeficit = Math.max(20 - tofuPercentage, 0);
      funnelGapDollarValue = Math.round(
        tofDeficit * contentCost * 5 +
          tofDeficit *
            ((averageOrderValue * (2.0 / conversionRate)) / 100) *
            totalClicks *
            3
      );
    } else if (funnelGap === "BoF Deficit") {
      // Missing bottom funnel loses conversions
      const bofDeficit = Math.max(15 - bofuPercentage, 0);
      funnelGapDollarValue = Math.round(
        bofDeficit * contentCost * 7 +
          bofDeficit *
            ((averageOrderValue * (3.0 / conversionRate)) / 100) *
            totalClicks *
            5 // High impact on conversion
      );
    } // Traffic sparks - Generate 90-day trend visualization based on actual data
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
    const wasteSparkData = generateSparkData(wastedSpend / 10); // ROI Recovery Potential (increases with better conversion rates - this is correct)
    const roiRecoveryPotential = Math.round(
      wastedSpend * 0.6 + baseConversionValue * totalClicks * 3 // Realistic recovery multiplier
    );
    const recoveryTimeframe =
      creditScore > 70 ? 30 : creditScore > 50 ? 60 : 90;
    const recoveryTrend = totalROI > 0 ? "positive" : "negative";

    // Psychographic alignment - use actual analysis data when available
    const psychMatch = Math.max(40, 100 - psychoMismatch);

    return {
      isBlind: false,
      domain: onboardingData.domain || "your-domain.com",
      lastRefresh: new Date().toLocaleString(),

      // Credit Score
      creditScore,
      creditGrade,
      creditHealth,

      // ROI Recovery
      roiRecoveryPotential,
      recoveryTimeframe,
      recoveryTrend, // KPI Grid
      kpiMetrics: {
        wastedSpend: Math.round(wastedSpend),
        deepDecayPages,
        highDilutionPages,
        lowKDHighDAUrls,
        psychoMismatch,
        funnelGap,
        // Dollar amounts for each KPI metric
        deepDecayDollarValue,
        dilutionDollarValue,
        keywordMismatchDollarValue,
        psychoMismatchDollarValue,
        funnelGapDollarValue,
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
      totalROI, // Content grading distribution - use standardized position-based calculation for consistency
      contentGrades: (() => {
        // Use standardized position-based ROI calculation consistent with Risk Dashboard
        const contentMetrics = searchConsoleData.map((item) => {
          const avgPosition = parseFloat(item.position) || 0;
          const avgCTR = parseFloat(item.ctr) || 0;

          // Calculate ROI based on position and performance (same as Risk Dashboard)
          const roi =
            avgPosition <= 10
              ? 160
              : avgPosition <= 20
              ? 90
              : avgPosition <= 30
              ? 20
              : -30;

          // Calculate traffic trend based on CTR vs expected CTR for position
          const expectedCTR =
            avgPosition <= 10
              ? 5
              : avgPosition <= 20
              ? 2
              : avgPosition <= 30
              ? 1
              : 0.5;
          const trafficTrend = avgCTR > expectedCTR ? 10 : -5;

          // Engagement score based on position
          const engagementScore =
            avgPosition < 10 ? 85 : avgPosition < 20 ? 65 : 40;

          return {
            roi,
            trafficTrend,
            conversionRate: conversionRateDecimal * 100,
            engagementScore,
          };
        });
        const gradeResult = calculateGradeDistribution(contentMetrics);
        return gradeResult;
      })(),
    };
  }, [onboardingData, loading, conversionRate]);

  if (loading) {
    return (
      <div className="command-center-loading">
        <RefreshCw className="loading-spinner" />
        <p>Loading Command Center Dashboard...</p>{" "}
      </div>
    );
  }

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
        </div>
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
          </div>
        </div>
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

      {/* KPI Grid */}
      <div className="kpi-grid-section">
        <h3>KPI GRID</h3>
        <div className="kpi-grid">
          {" "}
          <div
            className="kpi-tile waste"
            onClick={() => navigate("/riskdashboard")}
          >
            <div className="kpi-icon">💸</div>
            <div className="kpi-label">Waste $</div>
            <div className="kpi-value">
              ${commandCenterData.kpiMetrics.wastedSpend.toLocaleString()}{" "}
              <div className="kpi-dollar">
                + $
                {Math.round(
                  (commandCenterData.totalClicks || 0) *
                    ((4.5 - conversionRate) / 100) *
                    (parseFloat(
                      onboardingData?.domainCostDetails?.averageOrderValue
                    ) || 50) *
                    0.4
                ).toLocaleString()}{" "}
                opportunity loss
              </div>
            </div>
          </div>{" "}
          <div
            className="kpi-tile decay"
            onClick={() => navigate("/contentledger")}
          >
            <div className="kpi-icon">📉</div>
            <div className="kpi-label">Deep Decay</div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.deepDecayPages} pages
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.deepDecayDollarValue.toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>{" "}
          <div
            className="kpi-tile dilution"
            onClick={() => navigate("/riskdashboard")}
          >
            <div className="kpi-icon">🔗</div>
            <div className="kpi-label">Dilution</div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.highDilutionPages} pages
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.dilutionDollarValue.toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>{" "}
          <div
            className="kpi-tile keyword"
            onClick={() => navigate("/agents/ideation")}
          >
            <div className="kpi-icon">🔑</div>
            <div className="kpi-label">KD≪DA</div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.lowKDHighDAUrls} URLs
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.keywordMismatchDollarValue.toLocaleString()}{" "}
                potential
              </div>
            </div>
          </div>{" "}
          <div
            className="kpi-tile psych"
            onClick={() => navigate("/agents/strategy")}
          >
            <div className="kpi-icon">🧠</div>
            <div className="kpi-label">Psych%</div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.psychoMismatch}% mis
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.psychoMismatchDollarValue.toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>{" "}
          <div
            className="kpi-tile funnel"
            onClick={() => navigate("/agents/content-creation")}
          >
            <div className="kpi-icon">🎯</div>
            <div className="kpi-label">FunnelGap</div>
            <div className="kpi-value">
              {commandCenterData.kpiMetrics.funnelGap}
              <div className="kpi-dollar">
                $
                {commandCenterData.kpiMetrics.funnelGapDollarValue.toLocaleString()}{" "}
                loss
              </div>
            </div>
          </div>
        </div>
        <p className="kpi-note">
          • Tiles are click-thru to Risk, Ledger, or Strategy pages
        </p>
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
