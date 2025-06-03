/**
 * Strategy Engine Dashboard - Strategy Lab™ Unified Performance Command Center
 *
 * Implements the "weight-class" principle where site strength (DA) determines
 * appropriate keyword difficulty targeting:
 * - Heavyweight (DA 60+): Can target high difficulty keywords (60+)
 * - Middleweight (DA 30-59): Target medium difficulty keywords (30-59)
 * - Lightweight (DA <30): Focus on low difficulty keywords (<30)
 *
 * Seven Core Analysis Sections:
 * 1. Site Strength vs Keyword Barrier
 * 2. Equity Leaks
 * 3. Funnel Mix Health
 * 4. Hook→Understand→Trust→Act Chain
 * 5. Match-up Analysis
 * 6. Playbook Compliance
 * 7. Journey Coverage
 */
import React, { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../context/OnboardingContext";
import {
  Target,
  AlertTriangle,
  TrendingUp,
  Shield,
  Users,
  BookOpen,
  Navigation,
  BarChart3,
  Activity,
  Zap,
  Eye,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import "./StrategyAnalysis.css";

const StrategyAnalysis = () => {
  const { onboardingData, loading } = useOnboarding();
  const navigate = useNavigate();

  // Mouse tracking for interactive background effect

  // Redirect if insufficient data
  useEffect(() => {
    const hasMinimalData = () => {
      const hasSearchConsole =
        Array.isArray(onboardingData.searchConsoleData) &&
        onboardingData.searchConsoleData.length > 0;
      const hasDomain =
        onboardingData.domain && onboardingData.domain.trim() !== "";
      const hasKeywords =
        Array.isArray(onboardingData.keywords) &&
        onboardingData.keywords.length > 0;

      return hasSearchConsole && hasDomain && hasKeywords;
    };

    if (!loading && onboardingData && !hasMinimalData()) {
      navigate("/onboarding/step-keywords");
    }
  }, [onboardingData, loading, navigate]);

  // Calculate strategy engine metrics
  const strategyData = useMemo(() => {
    if (!onboardingData || loading) return { isBlind: true };

    const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];
    const keywords = Array.isArray(onboardingData.keywords)
      ? onboardingData.keywords
      : [];

    if (searchConsoleData.length === 0) {
      return { isBlind: true };
    } // Get domain authority for weight class determination - use multiple sources
    const domainAuthority =
      parseInt(onboardingData.initialAnalysisState?.domainAuthority) ||
      parseInt(onboardingData.domain_authority) ||
      // Calculate estimated DA based on site performance if none available
      Math.min(
        Math.max(
          Math.floor(
            (searchConsoleData.filter((page) => parseFloat(page.position) <= 10)
              .length /
              Math.max(searchConsoleData.length, 1)) *
              60 +
              (keywords.filter((kw) => parseInt(kw.difficulty) >= 50).length /
                Math.max(keywords.length, 1)) *
                40
          ),
          15
        ),
        85
      );

    // Get additional authority metrics for enhanced analysis
    const pageAuthority =
      parseInt(onboardingData.initialAnalysisState?.pageAuthority) ||
      parseInt(onboardingData.page_authority) ||
      Math.floor(domainAuthority * 0.8);
    const trustFlow =
      parseInt(onboardingData.initialAnalysisState?.trustFlow) || 0;
    const citationFlow =
      parseInt(onboardingData.initialAnalysisState?.citationFlow) || 0;

    // Determine weight class
    let weightClass, targetDifficulty, classColor;
    if (domainAuthority >= 60) {
      weightClass = "Heavyweight";
      targetDifficulty = "60+ Difficulty";
      classColor = "#10B981"; // Green
    } else if (domainAuthority >= 30) {
      weightClass = "Middleweight";
      targetDifficulty = "30-59 Difficulty";
      classColor = "#F59E0B"; // Yellow
    } else {
      weightClass = "Lightweight";
      targetDifficulty = "<30 Difficulty";
      classColor = "#EF4444"; // Red
    }

    // Calculate total metrics
    const totalImpressions = searchConsoleData.reduce(
      (sum, page) => sum + (parseInt(page.impressions) || 0),
      0
    );
    const totalClicks = searchConsoleData.reduce(
      (sum, page) => sum + (parseInt(page.clicks) || 0),
      0
    );
    const avgPosition =
      searchConsoleData.reduce(
        (sum, page) => sum + (parseFloat(page.position) || 0),
        0
      ) / searchConsoleData.length; // 1. Site Strength vs Keyword Barrier Analysis - Enhanced with real keyword data
    const keywordMismatch = keywords.filter((kw) => {
      // Use actual keyword difficulty from data, with intelligent fallback
      const difficulty =
        parseInt(kw.difficulty) ||
        parseInt(kw.kd) ||
        parseInt(kw.keywordDifficulty) ||
        // Estimate difficulty based on search volume and competition
        Math.min(
          Math.max(
            (parseInt(kw.searchVolume) || 100) / 100 +
              (parseFloat(kw.competition) || 0.5) * 50,
            10
          ),
          80
        );

      if (domainAuthority >= 60) return difficulty < 30; // Heavyweight targeting too easy
      if (domainAuthority >= 30) return difficulty > 59 || difficulty < 15; // Middleweight out of range
      return difficulty > 40; // Lightweight targeting too hard
    }).length;

    const mismatchPercentage =
      keywords.length > 0 ? (keywordMismatch / keywords.length) * 100 : 0;

    // 2. Equity Leaks (pages losing ranking positions)
    const equityLeaks = searchConsoleData.filter(
      (page) => parseFloat(page.position) > 20
    );
    const leakPercentage =
      (equityLeaks.length / searchConsoleData.length) * 100;

    // 3. Funnel Mix Health
    const funnelData = onboardingData.funnelAnalysis?.funnelDistribution || {
      ToF: 0,
      MoF: 0,
      BoF: 0,
      Unknown: 0,
    };
    const totalFunnelPages =
      funnelData.ToF + funnelData.MoF + funnelData.BoF + funnelData.Unknown;
    const tofPercentage =
      totalFunnelPages > 0 ? (funnelData.ToF / totalFunnelPages) * 100 : 0;
    const mofPercentage =
      totalFunnelPages > 0 ? (funnelData.MoF / totalFunnelPages) * 100 : 0;
    const bofPercentage =
      totalFunnelPages > 0 ? (funnelData.BoF / totalFunnelPages) * 100 : 0;

    // Ideal funnel distribution: 60% ToF, 30% MoF, 10% BoF
    const funnelHealthScore =
      100 -
      Math.abs(tofPercentage - 60) -
      Math.abs(mofPercentage - 30) -
      Math.abs(bofPercentage - 10); // 4. HUTA Chain Analysis (Hook→Understand→Trust→Act) - Enhanced with multiple trust signals
    const avgCTR =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Hook: Based on CTR performance and title optimization
    const hookScore = Math.min(
      100,
      avgCTR * 20 +
        (searchConsoleData.filter((page) => parseFloat(page.ctr || 0) > 5)
          .length /
          Math.max(searchConsoleData.length, 1)) *
          30
    );

    // Understand: Based on position and user engagement signals
    const understandScore =
      Math.max(0, 100 - avgPosition * 2) +
      (searchConsoleData.filter((page) => parseFloat(page.position) <= 3)
        .length /
        Math.max(searchConsoleData.length, 1)) *
        20;

    // Trust: Multi-factor trust score including DA, PA, TF, CF
    const trustScore = Math.min(
      100,
      domainAuthority * 0.4 +
        pageAuthority * 0.3 +
        trustFlow * 0.15 +
        citationFlow * 0.15 +
        // Add author credibility if available
        (onboardingData.authors?.filter(
          (author) =>
            !author.name?.toLowerCase().includes("ai") &&
            !author.name?.toLowerCase().includes("bot")
        ).length || 0) *
          5
    );

    // Act: Based on conversion-oriented content and bottom-funnel performance
    const actScore = Math.min(
      100,
      (funnelData.BoF / Math.max(totalFunnelPages, 1)) * 100 + // BoF content ratio
        (searchConsoleData.filter(
          (page) =>
            page.query?.toLowerCase().includes("buy") ||
            page.query?.toLowerCase().includes("price") ||
            page.query?.toLowerCase().includes("review")
        ).length /
          Math.max(searchConsoleData.length, 1)) *
          50 + // Commercial intent queries
        Math.min(
          (parseFloat(onboardingData.domainCostDetails?.averageOrderValue) ||
            0) / 100,
          30
        ) // AOV indicator
    );

    const hutaScore = (hookScore + understandScore + trustScore + actScore) / 4; // 5. Match-up Analysis (keyword targeting efficiency) - Enhanced with real keyword data
    const wellTargetedKeywords = keywords.filter((kw) => {
      // Use same enhanced difficulty calculation as above
      const difficulty =
        parseInt(kw.difficulty) ||
        parseInt(kw.kd) ||
        parseInt(kw.keywordDifficulty) ||
        Math.min(
          Math.max(
            (parseInt(kw.searchVolume) || 100) / 100 +
              (parseFloat(kw.competition) || 0.5) * 50,
            10
          ),
          80
        );

      if (domainAuthority >= 60) return difficulty >= 40;
      if (domainAuthority >= 30) return difficulty >= 20 && difficulty <= 50;
      return difficulty <= 30;
    }).length;

    const matchupScore =
      keywords.length > 0 ? (wellTargetedKeywords / keywords.length) * 100 : 0; // 6. Playbook Compliance (content strategy adherence) - Enhanced with real content analysis
    const contentStrategies =
      onboardingData.suggestionsFromAi?.content_strategies || [];
    const topicClusters =
      onboardingData.suggestionsFromAi?.topic_clusters || [];
    const contentTypes = onboardingData.suggestionsFromAi?.content_types || [];

    // Calculate compliance based on actual implementation vs suggestions
    const strategyCoverage =
      contentStrategies.length > 0
        ? Math.min(
            100,
            (funnelData.totalAnalyzed / contentStrategies.length) * 20
          )
        : 0;
    const clusterCoverage =
      topicClusters.length > 0
        ? Math.min(
            100,
            (searchConsoleData.filter((page) =>
              topicClusters.some(
                (cluster) =>
                  page.query?.toLowerCase().includes(cluster.toLowerCase()) ||
                  page.page?.toLowerCase().includes(cluster.toLowerCase())
              )
            ).length /
              topicClusters.length) *
              50
          )
        : 0;

    const complianceScore = Math.min(
      100,
      strategyCoverage * 0.4 +
        clusterCoverage * 0.4 +
        contentTypes.length * 5 + // Diversity bonus
        (onboardingData.authors?.length || 0) * 2 // Team structure bonus
    ); // 7. Journey Coverage (search intent coverage) - Enhanced with intent analysis
    const journeyCoverage = Math.min(
      100,
      // Page coverage weighted by funnel distribution
      (searchConsoleData.length / Math.max(keywords.length, 10)) * 30 +
        // Click engagement performance
        avgCTR * 8 +
        // Search visibility across positions
        Math.max(0, 100 - avgPosition * 2.5) * 0.4 +
        // Intent coverage based on query analysis
        (searchConsoleData.filter((page) => {
          const query = (page.query || "").toLowerCase();
          return (
            query.includes("how") ||
            query.includes("what") ||
            query.includes("best") ||
            query.includes("vs") ||
            query.includes("buy") ||
            query.includes("price")
          );
        }).length /
          Math.max(searchConsoleData.length, 1)) *
          30
    );
    return {
      isBlind: false,
      domainAuthority,
      pageAuthority,
      trustFlow,
      citationFlow,
      weightClass,
      targetDifficulty,
      classColor,
      totalImpressions,
      totalClicks,
      avgPosition,
      avgCTR,
      // Additional performance indicators
      topPerformingPages: searchConsoleData.filter(
        (page) => parseFloat(page.position) <= 5
      ).length,
      underperformingPages: searchConsoleData.filter(
        (page) => parseFloat(page.position) > 30
      ).length,
      commercialQueryCoverage: searchConsoleData.filter((page) => {
        const query = (page.query || "").toLowerCase();
        return (
          query.includes("buy") ||
          query.includes("price") ||
          query.includes("review") ||
          query.includes("vs") ||
          query.includes("best")
        );
      }).length,
      sections: {
        siteStrength: {
          mismatchPercentage: Math.round(mismatchPercentage),
          wellTargeted: wellTargetedKeywords,
          totalKeywords: keywords.length,
          recommendation:
            mismatchPercentage > 50
              ? "Critical: Realign keyword targeting"
              : mismatchPercentage > 25
              ? "Warning: Review keyword strategy"
              : "Good: Keywords match site strength",
        },
        equityLeaks: {
          leakPercentage: Math.round(leakPercentage),
          leakingPages: equityLeaks.length,
          totalPages: searchConsoleData.length,
          recommendation:
            leakPercentage > 60
              ? "Critical: Major equity leaks detected"
              : leakPercentage > 30
              ? "Warning: Moderate equity leaks"
              : "Good: Minimal equity leaks",
        },
        funnelHealth: {
          tofPercentage: Math.round(tofPercentage),
          mofPercentage: Math.round(mofPercentage),
          bofPercentage: Math.round(bofPercentage),
          healthScore: Math.round(funnelHealthScore),
          recommendation:
            funnelHealthScore < 50
              ? "Critical: Funnel distribution imbalanced"
              : funnelHealthScore < 75
              ? "Warning: Funnel needs optimization"
              : "Good: Healthy funnel distribution",
        },
        hutaChain: {
          score: Math.round(hutaScore),
          hookScore: Math.round(hookScore),
          understandScore: Math.round(understandScore),
          trustScore: Math.round(trustScore),
          actScore: Math.round(actScore),
          recommendation:
            hutaScore < 40
              ? "Critical: HUTA chain broken"
              : hutaScore < 65
              ? "Warning: HUTA chain needs work"
              : "Good: Strong HUTA performance",
        },
        matchup: {
          score: Math.round(matchupScore),
          wellTargeted: wellTargetedKeywords,
          totalKeywords: keywords.length,
          recommendation:
            matchupScore < 40
              ? "Critical: Poor keyword match-up"
              : matchupScore < 70
              ? "Warning: Improve keyword targeting"
              : "Good: Strong keyword alignment",
        },
        playbook: {
          score: Math.round(complianceScore),
          strategies: contentStrategies.length,
          clusters: topicClusters.length,
          contentTypes: contentTypes.length,
          strategyCoverage: Math.round(strategyCoverage),
          clusterCoverage: Math.round(clusterCoverage),
          recommendation:
            complianceScore < 40
              ? "Critical: Develop content playbook"
              : complianceScore < 70
              ? "Warning: Expand content strategy"
              : "Good: Strong playbook compliance",
        },
        journey: {
          score: Math.round(journeyCoverage),
          pageCount: searchConsoleData.length,
          engagement: Math.round(avgCTR),
          visibility: Math.round(Math.max(0, 100 - avgPosition * 3)),
          recommendation:
            journeyCoverage < 40
              ? "Critical: Poor journey coverage"
              : journeyCoverage < 65
              ? "Warning: Expand journey mapping"
              : "Good: Comprehensive journey coverage",
        },
      },
    };
  }, [onboardingData, loading]);

  if (loading) {
    return (
      <div className="strategy-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading Strategy Engine...</p>
        </div>
      </div>
    );
  }

  if (strategyData.isBlind) {
    return (
      <div className="strategy-dashboard no-data">
        <div className="no-data-content">
          <AlertTriangle size={48} color="#F59E0B" />
          <h2>Insufficient Data for Strategy Analysis</h2>
          <p>
            Connect your search data and add keywords to unlock the Strategy
            Lab™ dashboard.
          </p>
          <button
            onClick={() => navigate("/onboarding/step-keywords")}
            className="cta-button"
          >
            Set Up Keywords <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const { sections } = strategyData;

  return (
    <div className="strategy-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Target size={28} />
            <div>
              <h1>Strategy Lab™</h1>
              <p>Unified Performance Command Center</p>
            </div>
          </div>
          <div className="weight-class-badge">
            <div
              className="weight-indicator"
              style={{ backgroundColor: strategyData.classColor }}
            >
              <Shield size={16} />
              <span>
                {strategyData.weightClass} (DA {strategyData.domainAuthority})
              </span>
            </div>
            <div className="target-difficulty">
              Target: {strategyData.targetDifficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Core Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-card">
          <Eye size={20} />
          <div className="metric-value">
            {strategyData.totalImpressions.toLocaleString()}
          </div>
          <div className="metric-label">Total Impressions</div>
        </div>
        <div className="metric-card">
          <Activity size={20} />
          <div className="metric-value">
            {strategyData.totalClicks.toLocaleString()}
          </div>
          <div className="metric-label">Total Clicks</div>
        </div>
        <div className="metric-card">
          <TrendingUp size={20} />
          <div className="metric-value">
            {strategyData.avgPosition.toFixed(1)}
          </div>
          <div className="metric-label">Avg Position</div>
        </div>
        <div className="metric-card">
          <Zap size={20} />
          <div className="metric-value">{strategyData.avgCTR.toFixed(2)}%</div>
          <div className="metric-label">Avg CTR</div>
        </div>
      </div>

      {/* Strategy Analysis Sections */}
      <div className="strategy-sections">
        {/* 1. Site Strength vs Keyword Barrier */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <Target size={20} />
              <h3>Site Strength vs Keyword Barrier</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.siteStrength.mismatchPercentage <= 25
                  ? "good"
                  : sections.siteStrength.mismatchPercentage <= 50
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.siteStrength.mismatchPercentage <= 25 ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {100 - sections.siteStrength.mismatchPercentage}% Match
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{
                  width: `${100 - sections.siteStrength.mismatchPercentage}%`,
                }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Well Targeted:</span>
                <strong>
                  {sections.siteStrength.wellTargeted}/
                  {sections.siteStrength.totalKeywords}
                </strong>
              </div>
              <div className="stat">
                <span>Mismatch:</span>
                <strong>{sections.siteStrength.mismatchPercentage}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.siteStrength.recommendation}
            </div>
          </div>
        </div>

        {/* 2. Equity Leaks */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <AlertTriangle size={20} />
              <h3>Equity Leaks</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.equityLeaks.leakPercentage <= 30
                  ? "good"
                  : sections.equityLeaks.leakPercentage <= 60
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.equityLeaks.leakPercentage <= 30 ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              {100 - sections.equityLeaks.leakPercentage}% Sealed
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill critical"
                style={{ width: `${sections.equityLeaks.leakPercentage}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Leaking Pages:</span>
                <strong>
                  {sections.equityLeaks.leakingPages}/
                  {sections.equityLeaks.totalPages}
                </strong>
              </div>
              <div className="stat">
                <span>Leak Rate:</span>
                <strong>{sections.equityLeaks.leakPercentage}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.equityLeaks.recommendation}
            </div>
          </div>
        </div>

        {/* 3. Funnel Mix Health */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <BarChart3 size={20} />
              <h3>Funnel Mix Health</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.funnelHealth.healthScore >= 75
                  ? "good"
                  : sections.funnelHealth.healthScore >= 50
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.funnelHealth.healthScore >= 75 ? (
                <CheckCircle size={16} />
              ) : sections.funnelHealth.healthScore >= 50 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.funnelHealth.healthScore}% Healthy
            </div>
          </div>
          <div className="section-content">
            <div className="funnel-distribution">
              <div className="funnel-stage">
                <div className="stage-label">ToF</div>
                <div className="stage-bar">
                  <div
                    className="stage-fill tof"
                    style={{ width: `${sections.funnelHealth.tofPercentage}%` }}
                  ></div>
                </div>
                <div className="stage-value">
                  {sections.funnelHealth.tofPercentage}%
                </div>
              </div>
              <div className="funnel-stage">
                <div className="stage-label">MoF</div>
                <div className="stage-bar">
                  <div
                    className="stage-fill mof"
                    style={{ width: `${sections.funnelHealth.mofPercentage}%` }}
                  ></div>
                </div>
                <div className="stage-value">
                  {sections.funnelHealth.mofPercentage}%
                </div>
              </div>
              <div className="funnel-stage">
                <div className="stage-label">BoF</div>
                <div className="stage-bar">
                  <div
                    className="stage-fill bof"
                    style={{ width: `${sections.funnelHealth.bofPercentage}%` }}
                  ></div>
                </div>
                <div className="stage-value">
                  {sections.funnelHealth.bofPercentage}%
                </div>
              </div>
            </div>
            <div className="recommendation">
              {sections.funnelHealth.recommendation}
            </div>
          </div>
        </div>

        {/* 4. HUTA Chain */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <ArrowRight size={20} />
              <h3>Hook→Understand→Trust→Act Chain</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.hutaChain.score >= 65
                  ? "good"
                  : sections.hutaChain.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.hutaChain.score >= 65 ? (
                <CheckCircle size={16} />
              ) : sections.hutaChain.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.hutaChain.score}% Strong
            </div>
          </div>
          <div className="section-content">
            <div className="huta-chain">
              <div className="huta-link">
                <div className="link-label">Hook</div>
                <div className="link-score">
                  {sections.hutaChain.hookScore}%
                </div>
              </div>
              <ArrowRight size={16} className="chain-arrow" />
              <div className="huta-link">
                <div className="link-label">Understand</div>
                <div className="link-score">
                  {sections.hutaChain.understandScore}%
                </div>
              </div>
              <ArrowRight size={16} className="chain-arrow" />
              <div className="huta-link">
                <div className="link-label">Trust</div>
                <div className="link-score">
                  {sections.hutaChain.trustScore}%
                </div>
              </div>
              <ArrowRight size={16} className="chain-arrow" />
              <div className="huta-link">
                <div className="link-label">Act</div>
                <div className="link-score">{sections.hutaChain.actScore}%</div>
              </div>
            </div>
            <div className="recommendation">
              {sections.hutaChain.recommendation}
            </div>
          </div>
        </div>

        {/* 5. Match-up Analysis */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <Users size={20} />
              <h3>Match-up Analysis</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.matchup.score >= 70
                  ? "good"
                  : sections.matchup.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.matchup.score >= 70 ? (
                <CheckCircle size={16} />
              ) : sections.matchup.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.matchup.score}% Aligned
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{ width: `${sections.matchup.score}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Well Matched:</span>
                <strong>
                  {sections.matchup.wellTargeted}/
                  {sections.matchup.totalKeywords}
                </strong>
              </div>
              <div className="stat">
                <span>Success Rate:</span>
                <strong>{sections.matchup.score}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.matchup.recommendation}
            </div>
          </div>
        </div>

        {/* 6. Playbook Compliance */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <BookOpen size={20} />
              <h3>Playbook Compliance</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.playbook.score >= 70
                  ? "good"
                  : sections.playbook.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.playbook.score >= 70 ? (
                <CheckCircle size={16} />
              ) : sections.playbook.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.playbook.score}% Complete
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{ width: `${sections.playbook.score}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Strategies:</span>
                <strong>{sections.playbook.strategies}</strong>
              </div>
              <div className="stat">
                <span>Topic Clusters:</span>
                <strong>{sections.playbook.clusters}</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.playbook.recommendation}
            </div>
          </div>
        </div>

        {/* 7. Journey Coverage */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              <Navigation size={20} />
              <h3>Journey Coverage</h3>
            </div>
            <div
              className={`status-indicator ${
                sections.journey.score >= 65
                  ? "good"
                  : sections.journey.score >= 40
                  ? "warning"
                  : "critical"
              }`}
            >
              {sections.journey.score >= 65 ? (
                <CheckCircle size={16} />
              ) : sections.journey.score >= 40 ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {sections.journey.score}% Covered
            </div>
          </div>
          <div className="section-content">
            <div className="progress-bar">
              <div
                className="progress-fill good"
                style={{ width: `${sections.journey.score}%` }}
              ></div>
            </div>
            <div className="section-stats">
              <div className="stat">
                <span>Pages:</span>
                <strong>{sections.journey.pageCount}</strong>
              </div>
              <div className="stat">
                <span>Engagement:</span>
                <strong>{sections.journey.engagement}%</strong>
              </div>
              <div className="stat">
                <span>Visibility:</span>
                <strong>{sections.journey.visibility}%</strong>
              </div>
            </div>
            <div className="recommendation">
              {sections.journey.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysis;
