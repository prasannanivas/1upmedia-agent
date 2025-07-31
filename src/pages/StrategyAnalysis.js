/**
 /**
 * Strategy Lab™ — Unified Performance Command Center
 * Real‑time intelligence that turns raw URL metrics into an executive‑level game plan.
 */
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../context/OnboardingContext";
import { useFinancialCalculations } from "../context/FinancialCalculations";
import {
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Target,
  BarChart3,
  Download,
  Settings,
  ExternalLink,
  Database,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  LineChart,
  Zap,
  Award,
  ShieldCheck,
  Activity,
  Layers,
  HeartPulse,
  Scale,
  Lightbulb,
  Link,
  Gauge,
  CheckCircle,
  BookOpen,
  UserCheck,
  Workflow,
} from "lucide-react";
import "./StrategyAnalysis.css";
import { useSocialMedia } from "../context/SocialMediaContext";

const StrategyAnalysis = () => {
  const { onboardingData, loading } = useOnboarding();
  const { createTrelloCards } = useSocialMedia();
  const {
    getRevenueLeak,
    getCannibalizationLoss,
    getLinkDilution,
    funnelGapIdentifier,
    calculateTotalLoss,
  } = useFinancialCalculations();
  const navigate = useNavigate();
  // Calculate strategy engine metrics
  const strategyData = useMemo(() => {
    if (!onboardingData || loading) return { isBlind: true };

    const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];
    const keywords = Array.isArray(onboardingData.keywords)
      ? onboardingData.keywords
      : [];

    if (searchConsoleData.length === 0 && keywords.length === 0) {
      return { isBlind: true };
    } // Extract real domain metrics
    const domainAuthority =
      parseInt(onboardingData.initialAnalysisState?.domainAuthority) ||
      parseInt(onboardingData.domain_authority) ||
      17; // Real DA from sample data

    const pageAuthority =
      parseInt(onboardingData.initialAnalysisState?.pageAuthority) || 39;

    // Calculate keyword difficulty from real keyword data
    const avgKeywordDifficulty =
      keywords.length > 0
        ? keywords.reduce((sum, kw) => {
            // Try multiple possible property names for keyword difficulty
            const difficulty =
              parseInt(kw.difficulty) ||
              parseInt(kw.kd) ||
              parseInt(kw.keywordDifficulty) ||
              parseInt(kw.keyword_difficulty) ||
              50; // Default if no difficulty found
            return sum + difficulty;
          }, 0) / keywords.length
        : 50;

    const efficiencyRatio =
      avgKeywordDifficulty > 0 ? domainAuthority / avgKeywordDifficulty : 1.0;
    const deltaAboveClass = Math.max(0, avgKeywordDifficulty - domainAuthority); // Get funnel analysis data using funnelGapIdentifier from FinancialCalculations
    let tofPercentage = 0;
    let mofPercentage = 0;
    let bofPercentage = 0;
    let totalFunnelPages = 1;
    let idealToF = 25;
    let idealMoF = 10;
    let idealBoF = 65;

    try {
      // Use funnelGapIdentifier for comprehensive funnel analysis
      const funnelGapData = funnelGapIdentifier();
      const stageAnalysis = funnelGapData?.stageAnalysis || {};

      // Extract funnel percentages from gap analysis
      if (Object.keys(stageAnalysis).length > 0) {
        const tofData = stageAnalysis.ToF || {};
        const mofData = stageAnalysis.MoF || {};
        const bofData = stageAnalysis.BoF || {};

        tofPercentage = tofData.currentPercentage || 0;
        mofPercentage = mofData.currentPercentage || 0;
        bofPercentage = bofData.currentPercentage || 0;

        // Use optimal percentages from funnel gap analysis
        idealToF = tofData.optimalPercentage || 25;
        idealMoF = mofData.optimalPercentage || 10;
        idealBoF = bofData.optimalPercentage || 65;

        totalFunnelPages = funnelGapData?.summary?.totalAnalyzed || 1;
      }
    } catch (error) {
      console.error("Error getting funnel gap data:", error);
      // Fallback to manual calculation from onboarding data
      const funnelAnalysis = onboardingData.funnelAnalysis || {};
      const funnelData = funnelAnalysis.funnelDistribution || {
        ToF: 0,
        MoF: 0,
        BoF: 0,
        Retention: 0,
        Advocacy: 0,
        Unknown: 0,
      };

      totalFunnelPages =
        funnelAnalysis.totalAnalyzed ||
        funnelData.ToF +
          funnelData.MoF +
          funnelData.BoF +
          funnelData.Retention +
          funnelData.Advocacy +
          funnelData.Unknown ||
        searchConsoleData.length ||
        1;
      tofPercentage = (funnelData.ToF / totalFunnelPages) * 100;
      mofPercentage = (funnelData.MoF / totalFunnelPages) * 100;
      bofPercentage = (funnelData.BoF / totalFunnelPages) * 100;
    } // Calculate cannibalization from Search Console data (for fallback only)
    // This will only be used if FinancialCalculations fails// Calculate lost equity value using FinancialCalculations functions
    let lostEquityValue = 0;
    let cannibalizationValue = 0;
    let dilutionValue = 0;
    let cannibalizationUrls = 0;
    let dilutionPercentage = 0;

    try {
      // Use getCannibalizationLoss for cannibalization analysis
      const cannibalizationData = getCannibalizationLoss();
      cannibalizationValue =
        cannibalizationData?.summary?.totalRevenueLoss || 0;
      cannibalizationUrls = cannibalizationData?.summary?.affectedKeywords || 0;
    } catch (error) {
      console.error("Error getting cannibalization data:", error);
      // Fallback to manual calculation
      const cannibalizationPages = searchConsoleData.filter((page, index) => {
        const query = (page.query || page.keys?.[0] || "").toLowerCase();
        if (query.length <= 3) return false;

        return searchConsoleData.some((otherPage, otherIndex) => {
          if (index >= otherIndex) return false;
          const otherQuery = (
            otherPage.query ||
            otherPage.keys?.[0] ||
            ""
          ).toLowerCase();

          if (otherQuery.length <= 3) return false;

          // Check for keyword cannibalization
          const words1 = query.split(" ").filter((w) => w.length > 2);
          const words2 = otherQuery.split(" ").filter((w) => w.length > 2);
          const overlap = words1.filter((word) => words2.includes(word));

          return overlap.length >= 2; // At least 2 words in common
        });
      });

      const totalInvestment =
        onboardingData.domainCostDetails?.totalInvested || 10000;

      const cannibalizationImpactPercentage =
        getCannibalizationLoss().summary.cannibalizationPercentage;
      cannibalizationValue = getCannibalizationLoss().summary.totalRevenueLoss;
      cannibalizationUrls = getCannibalizationLoss().summary.totalUniqueUrls;
    }

    try {
      // Use getLinkDilution for link dilution analysis
      const linkDilutionData = getLinkDilution({});
      dilutionValue = linkDilutionData?.summary?.totalRevenueLoss || 0;
      dilutionPercentage = linkDilutionData?.summary?.dilutionPercentage || 0;
    } catch (error) {
      console.error("Error getting link dilution data:", error);
      // Fallback to manual calculation
      const orphanPages = searchConsoleData.filter(
        (page) =>
          parseFloat(page.position) > 50 &&
          parseInt(page.impressions || page.impressions) < 10
      );

      const totalInvestment =
        onboardingData.domainCostDetails?.totalInvested || 10000;

      const dilutionImpactPercentage =
        searchConsoleData.length > 0
          ? (orphanPages.length / searchConsoleData.length) * 0.08 // 8% impact for dilution
          : 0;
      dilutionValue = totalInvestment * dilutionImpactPercentage;
      dilutionPercentage =
        searchConsoleData.length > 0
          ? (orphanPages.length / searchConsoleData.length) * 100
          : 0;
    }

    try {
      // Use getRevenueLeak for additional revenue leak analysis
      const revenueLeakData = getRevenueLeak({});
      const additionalLeak = revenueLeakData?.estimatedRevenueLoss || 0;
      lostEquityValue =
        cannibalizationValue + dilutionValue + additionalLeak * 0.1; // 10% of revenue leak
    } catch (error) {
      console.error("Error getting revenue leak data:", error);
      // Fallback calculation
      lostEquityValue = cannibalizationValue + dilutionValue;
    }

    const totalInvestment =
      onboardingData.domainCostDetails?.totalInvested || 10000;

    // Cap total lost equity at maximum 25% of total investment (realistic business limit)
    lostEquityValue = Math.min(lostEquityValue, totalInvestment * 0.25);
    lostEquityValue = Math.floor(lostEquityValue);
    const cannibalizationPercentage =
      searchConsoleData.length > 0
        ? (cannibalizationUrls / searchConsoleData.length) * 100
        : 0;

    // Get real framework coverage from funnel analysis
    const funnelAnalysis = onboardingData.funnelAnalysis || {};
    const frameworkCoverage = funnelAnalysis.frameworkCoverage || [];

    // Get real HUTA scores from psychCompositeSummary
    const psychData = funnelAnalysis.psychCompositeSummary?.overall || {
      emotionalResonance: 42,
      cognitiveClarity: 61,
      persuasionLeverage: 54,
      behavioralMomentum: 42,
    };

    // Calculate journey distribution from Search Console data
    const journeyStages = {
      awareness: searchConsoleData.filter((page) => {
        const query = (page.query || page.keys?.[0] || "").toLowerCase();
        const pageUrl = (page.page || page.keys?.[1] || "").toLowerCase();
        return (
          query.includes("what") ||
          query.includes("how") ||
          query.includes("guide") ||
          query.includes("tips") ||
          query.includes("learn") ||
          pageUrl.includes("blog") ||
          pageUrl.includes("guide") ||
          pageUrl.includes("what")
        );
      }),
      consideration: searchConsoleData.filter((page) => {
        const query = (page.query || page.keys?.[0] || "").toLowerCase();
        const pageUrl = (page.page || page.keys?.[1] || "").toLowerCase();
        return (
          query.includes("vs") ||
          query.includes("compare") ||
          query.includes("best") ||
          query.includes("review") ||
          query.includes("alternative") ||
          pageUrl.includes("compare") ||
          pageUrl.includes("vs")
        );
      }),
      decision: searchConsoleData.filter((page) => {
        const query = (page.query || page.keys?.[0] || "").toLowerCase();
        const pageUrl = (page.page || page.keys?.[1] || "").toLowerCase();
        return (
          query.includes("price") ||
          query.includes("cost") ||
          query.includes("buy") ||
          query.includes("purchase") ||
          query.includes("order") ||
          pageUrl.includes("pricing") ||
          pageUrl.includes("plans") ||
          pageUrl.includes("buy")
        );
      }),
      retention: searchConsoleData.filter((page) => {
        const pageUrl = (page.page || page.keys?.[1] || "").toLowerCase();
        return (
          pageUrl.includes("help") ||
          pageUrl.includes("support") ||
          pageUrl.includes("faq") ||
          pageUrl.includes("tutorial") ||
          pageUrl.includes("docs") ||
          pageUrl.includes("account") ||
          pageUrl.includes("dashboard") ||
          pageUrl.includes("login")
        );
      }),
      advocacy: searchConsoleData.filter((page) => {
        const pageUrl = (page.page || page.keys?.[1] || "").toLowerCase();
        return (
          pageUrl.includes("testimonial") ||
          pageUrl.includes("case") ||
          pageUrl.includes("success") ||
          pageUrl.includes("referral") ||
          pageUrl.includes("review") ||
          pageUrl.includes("story")
        );
      }),
    };

    // Calculate percentages for journey stages
    const journeyCoverage = {
      awareness:
        (journeyStages.awareness.length / searchConsoleData.length) * 100 || 0,
      consideration:
        (journeyStages.consideration.length / searchConsoleData.length) * 100 ||
        0,
      decision:
        (journeyStages.decision.length / searchConsoleData.length) * 100 || 0,
      retention:
        (journeyStages.retention.length / searchConsoleData.length) * 100 || 0,
      advocacy:
        (journeyStages.advocacy.length / searchConsoleData.length) * 100 || 0,
      totalPages: searchConsoleData.length,
    };

    // Calculate keyword match-up efficiency
    const wellTargetedKeywords = keywords.filter((kw) => {
      const difficulty = parseInt(kw.difficulty) || parseInt(kw.kd) || 50;
      return difficulty <= domainAuthority + 5; // Within reasonable targeting range
    });

    const matchupScore =
      keywords.length > 0
        ? (wellTargetedKeywords.length / keywords.length) * 100
        : 0;
    return {
      isBlind: false,
      domainAuthority,
      pageAuthority,
      avgKeywordDifficulty: Math.round(avgKeywordDifficulty),
      efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
      deltaAboveClass: Math.round(deltaAboveClass),

      // Panel data calculated from real OnboardingData
      panels: {
        siteStrength: {
          siteStrength: domainAuthority,
          keywordBarrier: Math.round(avgKeywordDifficulty),
          deltaAboveClass: Math.round(deltaAboveClass),
          efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
          recommendations: [
            deltaAboveClass > 15
              ? `Drop KD > ${domainAuthority + 20} targets for next sprint`
              : `Focus on KD ${domainAuthority - 10}-${
                  domainAuthority + 10
                } sweet spot`,
            `Secure ${Math.ceil(deltaAboveClass / 10)} DA ${
              domainAuthority + 10
            }+ backlinks to raise Site Strength`,
            efficiencyRatio < 0.75
              ? `Re-score strategy after ratio ≤ 0.75`
              : `Maintain current targeting strategy`,
          ],
        },
        equityLeaks: {
          cannibalizationPercentage: Math.round(cannibalizationPercentage),
          cannibalizationUrls: cannibalizationUrls,
          dilutionPercentage: Math.round(dilutionPercentage),
          lostEquityValue: lostEquityValue,
          recommendations: [
            cannibalizationUrls > 0
              ? `Merge ${Math.min(
                  cannibalizationUrls,
                  5
                )} overlapping posts on similar keywords`
              : "No cannibalization detected - maintain keyword focus",
            dilutionPercentage > 5
              ? `Redirect ${Math.min(
                  Math.ceil(dilutionPercentage / 10),
                  8
                )} orphan pages into core hubs`
              : "No orphan pages detected - good internal linking",
            "Standardise internal-link anchor text on BOFU pages",
          ],
        },
        funnelMix: {
          tofPercentage: Math.round(tofPercentage),
          mofPercentage: Math.round(mofPercentage),
          bofPercentage: Math.round(bofPercentage),
          idealToF: idealToF, // From funnelGapIdentifier analysis
          idealMoF: idealMoF, // From funnelGapIdentifier analysis
          idealBoF: idealBoF, // From funnelGapIdentifier analysis
          bofOverweight: bofPercentage > 70,
          recommendations: [
            tofPercentage < 20
              ? `Publish ${Math.ceil(
                  (24 - tofPercentage) / 5
                )} TOFU primers targeting KD < ${domainAuthority - 10}`
              : "TOFU content distribution is healthy",
            mofPercentage < 5
              ? `Convert ${Math.ceil(
                  (5 - mofPercentage) / 2
                )} TOFU guides into MOFU comparisons`
              : "MOFU content coverage is adequate",
            bofPercentage < 60
              ? `Add ${Math.ceil(
                  (68 - bofPercentage) / 10
                )} trust-signals onto high-traffic BOFU pages`
              : "BOFU content focus is strong",
          ],
        },
        hutaChain: {
          hookScore: Math.round(psychData.emotionalResonance),
          understandScore: Math.round(psychData.cognitiveClarity),
          trustScore: Math.round(psychData.persuasionLeverage),
          actScore: Math.round(psychData.behavioralMomentum),
          recommendations: [
            psychData.emotionalResonance < 60
              ? `Rewrite ${Math.ceil(
                  (60 - psychData.emotionalResonance) / 8
                )} hero headlines with story-led phrasing (Hook +${Math.ceil(
                  (60 - psychData.emotionalResonance) / 8
                )} pts)`
              : "Emotional resonance is strong",
            psychData.cognitiveClarity < 70
              ? "Add icon + benefit bullets above folds (Clarity +6 pts)"
              : "Cognitive clarity is excellent",
            psychData.persuasionLeverage < 60
              ? `Insert ${Math.ceil(
                  (60 - psychData.persuasionLeverage) / 5
                )} third-party reviews on pricing page (Trust +${Math.ceil(
                  (60 - psychData.persuasionLeverage) / 5
                )} pts)`
              : "Trust signals are adequate",
            psychData.behavioralMomentum < 60
              ? "Single, vivid CTA on /pricing (Act +8 pts)"
              : "Behavioral triggers are effective",
          ],
        },
        matchupAnalysis: {
          efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
          matchupScore: Math.round(matchupScore),
          wellTargeted: wellTargetedKeywords.length,
          totalKeywords: keywords.length,
          status:
            efficiencyRatio >= 1.0
              ? "Green"
              : efficiencyRatio >= 0.75
              ? "Amber"
              : "Red",
          recommendations: [
            wellTargetedKeywords.length > 0
              ? `Prioritise ${Math.min(
                  wellTargetedKeywords.length,
                  10
                )} keywords KD < ${domainAuthority + 5}`
              : "No well-targeted keywords found - revise keyword strategy",
            deltaAboveClass > 15
              ? `Pause ads on KD > ${domainAuthority + 15} terms`
              : "Keyword targeting is within acceptable range",
            keywords.length > wellTargetedKeywords.length
              ? "Re-cluster mid-KD terms into supporting content"
              : "Keyword clustering is optimized",
          ],
        },
        playbookCompliance: {
          frameworkCoverage: frameworkCoverage,
          overallScore:
            frameworkCoverage.length > 0
              ? Math.round(
                  frameworkCoverage.reduce(
                    (sum, stage) => sum + stage.percent,
                    0
                  ) / frameworkCoverage.length
                )
              : 0,
          recommendations: [
            frameworkCoverage.find(
              (stage) => stage.stage === "MoF" && stage.percent < 100
            )
              ? 'Add "Engage" emails to MOFU (RACE gap)'
              : "MOFU framework coverage is complete",
            frameworkCoverage.find(
              (stage) => stage.stage === "BoF" && stage.applied < stage.total
            )
              ? "Embed authority proof on BOFU pages (Cialdini gap)"
              : "BOFU persuasion frameworks are well-covered",
            frameworkCoverage.find(
              (stage) => stage.stage === "Advocacy" && stage.percent === 0
            )
              ? "Launch loyalty perks email (Retention, AARRR)"
              : "Advocacy framework implementation is active",
          ],
        },
        journeyCoverage: {
          awareness: Math.round(journeyCoverage.awareness * 10) / 10,
          consideration: Math.round(journeyCoverage.consideration * 10) / 10,
          decision: Math.round(journeyCoverage.decision * 10) / 10,
          retention: Math.round(journeyCoverage.retention * 10) / 10,
          advocacy: Math.round(journeyCoverage.advocacy * 10) / 10,
          totalPages: journeyCoverage.totalPages,
          recommendations: [
            journeyCoverage.awareness < 20
              ? `Repurpose ${Math.ceil(
                  (22 - journeyCoverage.awareness) / 2
                )} Consideration posts into Awareness guides`
              : "Awareness content coverage is adequate",
            journeyCoverage.decision < 10
              ? "Deploy Decision-phase ROI calculator widget"
              : "Decision-stage content is well-represented",
            journeyCoverage.advocacy < 2
              ? "Replace low-performing Advocacy post with customer video testimonial"
              : "Advocacy content supports referral generation",
          ],
        },
      },
    };
  }, [
    onboardingData,
    loading,
    getCannibalizationLoss,
    getLinkDilution,
    getRevenueLeak,
    funnelGapIdentifier,
  ]);
  if (loading) {
    return (
      <div className="strategy-analysis-loading">
        <RefreshCw className="loading-spinner" />
        <p>Loading Strategy Analysis...</p>
      </div>
    );
  }

  if (strategyData.isBlind) {
    return (
      <div className="strategy-analysis-insufficient-data">
        <div className="insufficient-data-container">
          <AlertTriangle className="warning-icon" size={48} />
          <h2>Insufficient Data for Strategy Analysis</h2>
          <div className="data-requirements">
            <p>To display your Strategy Analysis, we need:</p>
            <ul>
              <li>
                <span
                  className={
                    onboardingData?.domain
                      ? "requirement-met"
                      : "requirement-missing"
                  }
                >
                  ✓ Domain configuration
                </span>
              </li>
              <li>
                <span
                  className={
                    onboardingData?.keywords?.length > 0
                      ? "requirement-met"
                      : "requirement-missing"
                  }
                >
                  ✓ Target keywords
                </span>
              </li>
              <li>
                <span
                  className={
                    onboardingData?.searchConsoleData?.length > 0
                      ? "requirement-met"
                      : "requirement-missing"
                  }
                >
                  ✓ Google Search Console data
                </span>
              </li>
            </ul>
          </div>
          <div className="insufficient-data-actions">
            <button
              className="action-btn primary"
              onClick={() => navigate("/onboarding/step-keywords")}
            >
              Complete Setup
            </button>
            <button
              className="action-btn secondary"
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { panels } = strategyData;

  const allRecommendations = [
    ...panels.siteStrength.recommendations,
    ...panels.equityLeaks.recommendations,
    ...panels.playbookCompliance.recommendations,
    ...panels.journeyCoverage.recommendations,
    ...panels.funnelMix.recommendations,
    ...panels.hutaChain.recommendations,
  ];

  createTrelloCards({
    listId: "strategy-recommendations",
    items: allRecommendations,
  });

  return (
    <div className="strategy-lab">
      {/* Header Section */}
      <div className="ledger-header">
        <div className="header-top">
          <div className="header-title">
            <Database className="header-icon" />
            <div>
              <h1>STRATEGY LAB™</h1>
              <p>Unified Performance Command Center</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn secondary">
              <Download size={16} />
              Export Analysis
            </button>
            <button className="action-btn primary">
              <RefreshCw size={16} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Site Overview */}
        <div className="site-overview">
          <div className="overview-grid">
            <div className="overview-item">
              <span className="overview-label">Domain Authority:</span>
              <span className="overview-value">
                {strategyData.domainAuthority}
              </span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Efficiency Ratio:</span>
              <span className="overview-value">
                {strategyData.efficiencyRatio}
              </span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Avg Keyword Difficulty:</span>
              <span className="overview-value">
                {strategyData.avgKeywordDifficulty}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* KPI Summary Cards */}{" "}
      <div className="kpi-summary">
        <div className="kpi-card lost-equity">
          <div className="kpi-icon">
            <TrendingDown size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                calculateTotalLoss().summary?.totalRevenueLoss ||
                  panels.equityLeaks.lostEquityValue
              )}
            </div>
            <div className="kpi-label">Lost Equity Value</div>
          </div>
        </div>
        <div className="kpi-card cannibalization">
          <div className="kpi-icon">
            <BarChart2 size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">
              {panels.equityLeaks.cannibalizationUrls}
            </div>
            <div className="kpi-label">Cannibalization URLs</div>
          </div>
        </div>
        <div className="kpi-card dilution">
          <div className="kpi-icon">
            <Link size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">
              {panels.equityLeaks.dilutionPercentage}%
            </div>
            <div className="kpi-label">Link Dilution</div>
          </div>
        </div>
        <div className="kpi-card huta-score">
          <div className="kpi-icon">
            <Target size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">
              {panels.playbookCompliance.overallScore}%
            </div>
            <div className="kpi-label">Playbook Compliance</div>
          </div>
        </div>
      </div>
      {/* Strategy Panels */}
      <div className="strategy-panels">
        {" "}
        {/* 1. Site Strength vs Keyword Barrier */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              <div className="panel-title">
                <Gauge size={18} className="panel-icon" />
                1. SITE STRENGTH vs KEYWORD BARRIER
              </div>
              <em>
                *(DA {strategyData.domainAuthority} | KD avg{" "}
                {strategyData.avgKeywordDifficulty})*
              </em>
            </h3>
            <p className="subtitle">
              <em>Checks if you're throwing punches above your weight.</em>
            </p>
          </div>

          <div className="strength-barrier-display">
            <div className="strength-section">
              <div className="strength-value">
                [ {panels.siteStrength.siteStrength} ]
              </div>
              <div className="strength-label">Site Strength</div>
            </div>

            <div className="divider">│</div>

            <div className="barrier-section">
              <div className="barrier-label">Keyword Barrier</div>
              <div className="barrier-value">
                [ {panels.siteStrength.keywordBarrier} ]
              </div>
            </div>
          </div>

          <div className="delta-efficiency">
            <div className="delta">
              Δ +{panels.siteStrength.deltaAboveClass} (Above Class) →
              Efficiency Ratio {panels.siteStrength.efficiencyRatio} ⚠
            </div>
          </div>

          <div className="quick-wins">
            <h4>🔧 Quick Wins</h4>
            <ul>
              {panels.siteStrength.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>{" "}
        {/* 2. Equity Leaks */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              <div className="panel-title">
                <Link size={18} className="panel-icon" />
                2. EQUITY LEAKS
              </div>
              <em>
                *(Cannibal {panels.equityLeaks.cannibalizationPercentage} % |
                Dilution {panels.equityLeaks.dilutionPercentage} %)*
              </em>
            </h3>
            <p className="subtitle">
              <em>
                Shows where authority leaks before it can rank or convert.
              </em>
            </p>
          </div>

          <div className="equity-metrics">
            <div className="metric-row">
              <span>Cannibalization</span>
              <div className="progress-bar">
                <div
                  className="progress-fill cannibalization"
                  style={{
                    width: `${Math.min(
                      panels.equityLeaks.cannibalizationPercentage * 5,
                      100
                    )}%`,
                  }}
                >
                  ▆▆▁▁▁
                </div>
              </div>
              <span>({panels.equityLeaks.cannibalizationUrls} URLs)</span>
            </div>
            <div className="metric-row">
              <span>Link Dilution</span>
              <div className="progress-bar">
                {" "}
                <div
                  className="progress-fill dilution"
                  style={{
                    width: `${Math.min(
                      panels.equityLeaks.dilutionPercentage * 8,
                      100
                    )}%`,
                  }}
                >
                  {panels.equityLeaks.dilutionPercentage > 5 &&
                    `${panels.equityLeaks.dilutionPercentage}%`}
                </div>
              </div>
              <span>({panels.equityLeaks.dilutionPercentage} % of links)</span>
            </div>
            <div className="metric-row">
              <span>Lost Equity</span>
              <span className="lost-value">
                ${panels.equityLeaks.lostEquityValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="quick-wins">
            <h4>🔧 Quick Wins</h4>
            <ul>
              {panels.equityLeaks.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>{" "}
        {/* 3. Funnel Mix Health */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              <div className="panel-title">
                <Layers size={18} className="panel-icon" />
                3. FUNNEL MIX HEALTH
              </div>
              <em>
                *(TOFU {panels.funnelMix.tofPercentage} % | MOFU{" "}
                {panels.funnelMix.mofPercentage} % | BOFU{" "}
                {panels.funnelMix.bofPercentage} %)*
              </em>
            </h3>
            <p className="subtitle">
              <em>
                Balances content inventory so strength converts across the
                journey.
              </em>
            </p>
          </div>

          <div className="funnel-distribution">
            <div className="funnel-stage">
              <span>TOFU</span>
              <div className="stage-bar">
                {" "}
                <div
                  className="stage-fill tofu"
                  style={{
                    width: `${Math.min(panels.funnelMix.tofPercentage, 100)}%`,
                  }}
                >
                  {panels.funnelMix.tofPercentage > 5 &&
                    `${panels.funnelMix.tofPercentage}%`}
                </div>
              </div>
              <span>
                {panels.funnelMix.tofPercentage} % (ideal{" "}
                {panels.funnelMix.idealToF} %)
              </span>
            </div>
            <div className="funnel-stage">
              <span>MOFU</span>
              <div className="stage-bar">
                {" "}
                <div
                  className="stage-fill mofu"
                  style={{
                    width: `${Math.min(panels.funnelMix.mofPercentage, 100)}%`,
                  }}
                >
                  {panels.funnelMix.mofPercentage > 5 &&
                    `${panels.funnelMix.mofPercentage}%`}
                </div>
              </div>
              <span>
                {panels.funnelMix.mofPercentage} % (ideal{" "}
                {panels.funnelMix.idealMoF} %)
              </span>
            </div>
            <div className="funnel-stage">
              <span>BOFU</span>
              <div className="stage-bar">
                {" "}
                <div
                  className="stage-fill bofu"
                  style={{
                    width: `${Math.min(panels.funnelMix.bofPercentage, 100)}%`,
                  }}
                >
                  {panels.funnelMix.bofPercentage > 5 &&
                    `${panels.funnelMix.bofPercentage}%`}
                </div>
              </div>
              <span>
                {panels.funnelMix.bofPercentage} % (ideal{" "}
                {panels.funnelMix.idealBoF} %){" "}
                {panels.funnelMix.bofOverweight ? "❗ BOFU overweight" : ""}
              </span>
            </div>
          </div>

          <div className="quick-wins">
            <h4>🔧 Quick Wins</h4>
            <ul>
              {panels.funnelMix.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>{" "}
        {/* 4. HUTA Chain */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              <div className="panel-title">
                <HeartPulse size={18} className="panel-icon" />
                4. HOOK → UNDERSTAND → TRUST → ACT CHAIN
              </div>
              <em>
                *({panels.hutaChain.hookScore} % |{" "}
                {panels.hutaChain.understandScore} % |{" "}
                {panels.hutaChain.trustScore} % | {panels.hutaChain.actScore}{" "}
                %)*
              </em>
            </h3>
            <p className="subtitle">
              <em>Psych sequence that turns traffic into momentum.</em>
            </p>
          </div>

          <div className="huta-chain">
            <div className="huta-step">
              <span>❤️ Hook / Emotional Resonance</span>
              <span className="score">{panels.hutaChain.hookScore} %</span>
            </div>
            <div className="huta-step">
              <span>🧠 Understand / Cognitive Clarity</span>
              <span className="score">
                {panels.hutaChain.understandScore} %
              </span>
            </div>
            <div className="huta-step">
              <span>🤝 Trust / Persuasion Leverage</span>
              <span className="score">{panels.hutaChain.trustScore} %</span>
            </div>
            <div className="huta-step">
              <span>🏃 Act / Behavioural Momentum</span>
              <span className="score">{panels.hutaChain.actScore} %</span>
            </div>
          </div>

          <div className="quick-wins">
            <h4>🔧 Quick Wins</h4>
            <ul>
              {panels.hutaChain.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>{" "}
        {/* 5. Match-up Analysis */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              <div className="panel-title">
                <Scale size={18} className="panel-icon" />
                5. MATCH‑UP ANALYSIS
              </div>
              <em>
                *(Efficiency Ratio {panels.matchupAnalysis.efficiencyRatio}{" "}
                {panels.matchupAnalysis.status === "Amber"
                  ? "⚠"
                  : panels.matchupAnalysis.status === "Red"
                  ? "❌"
                  : "✅"}
                )*
              </em>
            </h3>
            <p className="subtitle">
              <em>Quantifies how well keyword targets fit the weight class.</em>
            </p>
          </div>

          <div className="efficiency-gauge">
            <div className="gauge-line">Gauge: 0──0.75──1.0──1.25</div>
            <div className="gauge-marker">
              <span
                style={{
                  marginLeft: `${
                    panels.matchupAnalysis.efficiencyRatio * 100
                  }px`,
                }}
              >
                ▲ {panels.matchupAnalysis.efficiencyRatio} (
                {panels.matchupAnalysis.status})
              </span>
            </div>
          </div>

          <div className="quick-wins">
            <h4>🔧 Quick Wins</h4>
            <ul>
              {panels.matchupAnalysis.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>{" "}
        {/* 6. Playbook Compliance */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              <div className="panel-title">
                <CheckCircle size={18} className="panel-icon" />
                6. PLAYBOOK COMPLIANCE
              </div>
              <em>*(Framework Coverage)*</em>
            </h3>
            <p className="subtitle">
              <em>
                Confirms every stage follows an approved persuasion framework.
              </em>
            </p>
          </div>

          <div className="framework-table">
            <div className="table-header">
              <span>Stage</span>
              <span>Coverage</span>
              <span>Frameworks (met vs required)</span>
            </div>
            <div className="table-divider">
              ────────────────────────────────────────────────────────
            </div>
            {panels.playbookCompliance.frameworkCoverage.map(
              (framework, index) => (
                <div key={index} className="table-row">
                  <span>{framework.stage}</span>
                  <span
                    className={framework.percent >= 100 ? "success" : "warning"}
                  >
                    {framework.percent} % {framework.percent >= 100 ? "✓" : "✗"}
                  </span>
                  <span>{framework.frameworks.join("  ")}</span>
                </div>
              )
            )}
          </div>

          <div className="quick-wins">
            <h4>🔧 Quick Wins</h4>
            <ul>
              {panels.playbookCompliance.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>{" "}
        {/* 7. Journey Coverage */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              <div className="panel-title">
                <Workflow size={18} className="panel-icon" />
                7. JOURNEY COVERAGE
              </div>
            </h3>
            <p className="subtitle">
              <em>Maps live URL distribution to the ideal customer journey.</em>
            </p>
          </div>

          <div className="journey-distribution">
            <div className="journey-stage">
              <span>Awareness</span>
              <div className="journey-bar">
                <div
                  className="journey-fill awareness"
                  style={{
                    width: `${Math.min(
                      panels.journeyCoverage.awareness,
                      100
                    )}%`,
                  }}
                >
                  {panels.journeyCoverage.awareness > 5 &&
                    `${panels.journeyCoverage.awareness}%`}
                </div>
              </div>
              <span>
                {panels.journeyCoverage.awareness}% (
                {Math.round(
                  panels.journeyCoverage.totalPages *
                    (panels.journeyCoverage.awareness / 100)
                )}{" "}
                pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Consideration</span>
              <div className="journey-bar">
                <div
                  className="journey-fill consideration"
                  style={{
                    width: `${Math.min(
                      panels.journeyCoverage.consideration,
                      100
                    )}%`,
                  }}
                >
                  {panels.journeyCoverage.consideration > 5 &&
                    `${panels.journeyCoverage.consideration}%`}
                </div>
              </div>
              <span>
                {panels.journeyCoverage.consideration}% (
                {Math.round(
                  panels.journeyCoverage.totalPages *
                    (panels.journeyCoverage.consideration / 100)
                )}{" "}
                pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Decision</span>
              <div className="journey-bar">
                <div
                  className="journey-fill decision"
                  style={{
                    width: `${Math.min(panels.journeyCoverage.decision, 100)}%`,
                  }}
                >
                  {panels.journeyCoverage.decision > 5 &&
                    `${panels.journeyCoverage.decision}%`}
                </div>
              </div>
              <span>
                {panels.journeyCoverage.decision}% (
                {Math.round(
                  panels.journeyCoverage.totalPages *
                    (panels.journeyCoverage.decision / 100)
                )}{" "}
                pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Retention</span>
              <div className="journey-bar">
                <div
                  className="journey-fill retention"
                  style={{
                    width: `${Math.min(
                      panels.journeyCoverage.retention,
                      100
                    )}%`,
                  }}
                >
                  {panels.journeyCoverage.retention > 5 &&
                    `${panels.journeyCoverage.retention}%`}
                </div>
              </div>
              <span>
                {panels.journeyCoverage.retention}% (
                {Math.round(
                  panels.journeyCoverage.totalPages *
                    (panels.journeyCoverage.retention / 100)
                )}{" "}
                pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Advocacy</span>
              <div className="journey-bar">
                <div
                  className="journey-fill advocacy"
                  style={{
                    width: `${Math.min(panels.journeyCoverage.advocacy, 100)}%`,
                  }}
                >
                  {panels.journeyCoverage.advocacy > 5 &&
                    `${panels.journeyCoverage.advocacy}%`}
                </div>
              </div>
              <span>
                {panels.journeyCoverage.advocacy}% (
                {Math.round(
                  panels.journeyCoverage.totalPages *
                    (panels.journeyCoverage.advocacy / 100)
                )}{" "}
                page
                {panels.journeyCoverage.totalPages *
                  (panels.journeyCoverage.advocacy / 100) !==
                1
                  ? "s"
                  : ""}
                )
              </span>
            </div>
          </div>

          <div className="quick-wins">
            <h4>🔧 Quick Wins</h4>
            <ul>
              {panels.journeyCoverage.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysis;
