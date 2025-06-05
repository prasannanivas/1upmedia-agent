/**
 * Strategy Lab™ — Unified Performance Command Center
 * Real‑time intelligence that turns raw URL metrics into an executive‑level game plan.
 */
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../context/OnboardingContext";
import { generateRecommendations } from "../utils/recommendationEngine";
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

const StrategyAnalysisNew = () => {
  const { onboardingData, loading } = useOnboarding();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState({});

  // Generate recommendations based on calculated metrics
  useEffect(() => {
    if (!onboardingData || loading) return;

    const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];
    const keywords = Array.isArray(onboardingData.keywords)
      ? onboardingData.keywords
      : [];

    if (searchConsoleData.length === 0) return;

    // Calculate basic metrics for recommendation generation
    const domainAuthority =
      parseInt(onboardingData.initialAnalysisState?.domainAuthority) ||
      parseInt(onboardingData.domain_authority) ||
      42; // Use example data

    const avgKeywordDifficulty =
      keywords.length > 0
        ? keywords.reduce((sum, kw) => sum + parseInt(kw.difficulty || 0), 0) /
          keywords.length
        : 55; // Use example data

    const efficiencyRatio =
      domainAuthority > 0 ? avgKeywordDifficulty / domainAuthority : 0;

    // Prepare audit data for recommendations
    const auditData = {
      domain_authority: domainAuthority,
      avg_kd: Math.round(avgKeywordDifficulty),
      efficiency_ratio: Math.round(efficiencyRatio * 100) / 100,
      total_keywords: keywords.length,
      total_pages: searchConsoleData.length,
      kd_threshold_high: domainAuthority + 20,
      kd_lower: Math.max(10, domainAuthority - 25),
      kd_upper: Math.max(20, domainAuthority - 10),
      n_new_kw: 10,
      n_backlinks: Math.ceil((domainAuthority + 20 - domainAuthority) / 5),
      backlink_da: domainAuthority + 10,
      cannibal_urls: Math.floor(searchConsoleData.length * 0.1),
      dilution_pct: 12,
      topic: "ledger template",
      n_tofu_posts: 4,
      repurpose_count: 3,
      new_awareness: 3,
      headline_count: 5,
      n_priority_kw: Math.min(keywords.length, 10),
      kd_priority_max: domainAuthority - 5,
      kd_ad_pause: domainAuthority + 15,
      hook_score: 60,
      understand_score: 74,
      trust_score: 70,
      act_score: 62,
      retention_coverage: 25,
      advocacy_coverage: 25,
      tofu_pct: 38,
      bofu_pct: 35,
      mofu_pct: 27,
      awareness_pct: 21.8,
      decision_pct: 12.7,
      advocacy_pct: 1.8,
    };

    // Generate recommendations for all panels
    const newRecommendations = {};
    const panelKeys = [
      "1_site_strength_vs_keyword_barrier",
      "2_equity_leaks",
      "3_funnel_mix_health",
      "4_hook_understand_trust_act_chain",
      "5_matchup_analysis",
      "6_playbook_compliance",
      "7_journey_coverage",
    ];

    panelKeys.forEach((panelKey) => {
      newRecommendations[panelKey] = generateRecommendations(
        panelKey,
        auditData,
        3
      );
    });

    setRecommendations(newRecommendations);
  }, [onboardingData, loading]);

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
    }

    // Use real data or fall back to spec examples
    const domainAuthority =
      parseInt(onboardingData.initialAnalysisState?.domainAuthority) ||
      parseInt(onboardingData.domain_authority) ||
      42;

    const avgKeywordDifficulty =
      keywords.length > 0
        ? keywords.reduce((sum, kw) => {
            const difficulty =
              parseInt(kw.difficulty) ||
              parseInt(kw.kd) ||
              parseInt(kw.keywordDifficulty) ||
              55;
            return sum + difficulty;
          }, 0) / keywords.length
        : 55;

    const efficiencyRatio =
      avgKeywordDifficulty > 0 ? domainAuthority / avgKeywordDifficulty : 0.88;
    const deltaAboveClass = Math.max(0, avgKeywordDifficulty - domainAuthority);

    // Get funnel data from onboarding or use fallback
    const funnelData = onboardingData.funnelAnalysis?.funnelDistribution || {
      ToF: Math.floor(searchConsoleData.length * 0.38),
      MoF: Math.floor(searchConsoleData.length * 0.27),
      BoF: Math.floor(searchConsoleData.length * 0.35),
      Unknown: 0,
    };

    const totalFunnelPages =
      funnelData.ToF + funnelData.MoF + funnelData.BoF + funnelData.Unknown;
    const tofPercentage =
      totalFunnelPages > 0 ? (funnelData.ToF / totalFunnelPages) * 100 : 38;
    const mofPercentage =
      totalFunnelPages > 0 ? (funnelData.MoF / totalFunnelPages) * 100 : 27;
    const bofPercentage =
      totalFunnelPages > 0 ? (funnelData.BoF / totalFunnelPages) * 100 : 35;

    // Calculate cannibalization and dilution from real data or use examples
    const cannibalizationPages = searchConsoleData.filter((page, index) => {
      const query = (page.query || page.keys?.[0] || "").toLowerCase();
      return searchConsoleData.some((otherPage, otherIndex) => {
        if (index >= otherIndex) return false;
        const otherQuery = (
          otherPage.query ||
          otherPage.keys?.[0] ||
          ""
        ).toLowerCase();
        return (
          query.length > 3 &&
          otherQuery.length > 3 &&
          (query.includes(otherQuery) || otherQuery.includes(query))
        );
      });
    });

    const orphanPages = searchConsoleData.filter(
      (page) =>
        parseFloat(page.position) > 50 && parseInt(page.impressions) < 10
    );

    const cannibalizationPercentage =
      searchConsoleData.length > 0
        ? (cannibalizationPages.length / searchConsoleData.length) * 100
        : 9;

    const dilutionPercentage =
      searchConsoleData.length > 0
        ? (orphanPages.length / searchConsoleData.length) * 100
        : 12;

    const lostEquityValue =
      Math.floor(
        (cannibalizationPages.length * 1200 + orphanPages.length * 800) * 0.5
      ) || 46000;

    // Framework coverage analysis
    const frameworkCoverage = onboardingData.funnelAnalysis
      ?.frameworkCoverage || [
      {
        stage: "Awareness",
        applied: 4,
        total: 4,
        percent: 167,
        frameworks: ["AIDA", "RACE", "AARRR", "Cialdini"],
      },
      {
        stage: "Consideration",
        applied: 3,
        total: 3,
        percent: 140,
        frameworks: ["AIDA", "RACE", "Cialdini"],
      },
      {
        stage: "Decision",
        applied: 4,
        total: 4,
        percent: 83,
        frameworks: ["AARRR", "ADA", "RACE", "Cialdini"],
      },
      {
        stage: "Retention",
        applied: 0,
        total: 1,
        percent: 25,
        frameworks: ["AARRR"],
      },
      {
        stage: "Advocacy",
        applied: 0,
        total: 1,
        percent: 25,
        frameworks: ["Cialdini"],
      },
    ];

    return {
      isBlind: false,
      domainAuthority,
      avgKeywordDifficulty: Math.round(avgKeywordDifficulty),
      efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
      deltaAboveClass: Math.round(deltaAboveClass),

      // Panel data matching your spec
      panels: {
        siteStrength: {
          siteStrength: domainAuthority,
          keywordBarrier: Math.round(avgKeywordDifficulty),
          deltaAboveClass: Math.round(deltaAboveClass),
          efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
          recommendations: [
            `Drop KD > ${domainAuthority + 20} targets for next sprint`,
            `Secure 5 DA ${
              domainAuthority + 10
            }+ backlinks to raise Site Strength`,
            `Re-score strategy after ratio ≤ 0.75`,
          ],
        },
        equityLeaks: {
          cannibalizationPercentage: Math.round(cannibalizationPercentage),
          cannibalizationUrls: cannibalizationPages.length || 7,
          dilutionPercentage: Math.round(dilutionPercentage),
          lostEquityValue: lostEquityValue,
          recommendations: [
            'Merge overlapping posts on "ledger template"',
            "Redirect orphan pages (5 URLs) into core hubs",
            "Standardise internal-link anchor text on BOFU pages",
          ],
        },
        funnelMix: {
          tofPercentage: Math.round(tofPercentage),
          mofPercentage: Math.round(mofPercentage),
          bofPercentage: Math.round(bofPercentage),
          idealToF: 55,
          idealMoF: 30,
          idealBoF: 15,
          bofOverweight: bofPercentage > 30,
          recommendations: [
            "Publish 4 TOFU primers targeting KD < 40",
            "Convert MOFU guide #12 into BOFU calculator",
            "Add 3 trust-signals onto high-traffic BOFU pages",
          ],
        },
        hutaChain: {
          hookScore: 60,
          understandScore: 74,
          trustScore: 70,
          actScore: 62,
          recommendations: [
            "Rewrite 5 hero headlines with story-led phrasing (Hook +8 pts)",
            "Add icon + benefit bullets above folds (Clarity +6 pts)",
            "Insert 2 third-party reviews on pricing page (Trust +5 pts)",
            "Single, vivid CTA on /pricing (Act +8 pts)",
          ],
        },
        matchupAnalysis: {
          efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
          status:
            efficiencyRatio >= 1.0
              ? "Green"
              : efficiencyRatio >= 0.75
              ? "Amber"
              : "Red",
          recommendations: [
            `Prioritise 10 keywords KD < ${domainAuthority - 5}`,
            `Pause ads on KD > ${domainAuthority + 15} terms`,
            "Re-cluster mid-KD terms into supporting content",
          ],
        },
        playbookCompliance: {
          frameworkCoverage,
          recommendations: [
            'Add "Engage" emails to MOFU (RACE gap)',
            "Embed authority proof on BOFU pages (Cialdini gap)",
            "Launch loyalty perks email (Retention, AARRR)",
          ],
        },
        journeyCoverage: {
          awareness: 21.8,
          consideration: 45.5,
          decision: 12.7,
          retention: 18.2,
          advocacy: 1.8,
          totalPages: totalFunnelPages || 55,
          recommendations: [
            "Repurpose 3 Awareness posts into Retention guides",
            "Deploy Decision-phase ROI calculator widget",
            "Replace low-performing Advocacy post with customer video testimonial",
          ],
        },
      },
    };
  }, [onboardingData, loading, recommendations]);

  if (loading) {
    return (
      <div className="strategy-lab loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading Strategy Lab™...</p>
        </div>
      </div>
    );
  }

  if (strategyData.isBlind) {
    return (
      <div className="strategy-lab no-data">
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

  const { panels } = strategyData;

  return (
    <div className="strategy-lab">
      {/* Header with Weight-Class Principle */}
      <div className="strategy-header">
        <div className="header-box">
          <div className="title-section">
            <h1>Strategy Lab™ — Unified Performance Command Center</h1>
            <p>
              Real‑time intelligence that turns raw URL metrics into an
              executive‑level game plan.
            </p>
          </div>
          <div className="weight-class-section">
            <h3>⚖ WEIGHT‑CLASS PRINCIPLE</h3>
            <p>
              Your <strong>Site Strength (DA)</strong> decides the division you
              fight in.
            </p>
            <p>
              Targeting keywords tougher than that weight class spawns{" "}
              <strong>content cannibalization</strong>
            </p>
            <p>
              and <strong>link dilution</strong> (see HubSpot, Dec 2024). Keep{" "}
              <strong>Efficiency Ratio ≤ 1.00</strong> to
            </p>
            <p>scale clean.</p>
          </div>
        </div>
      </div>

      {/* Strategy Panels */}
      <div className="strategy-panels">
        {/* 1. Site Strength vs Keyword Barrier */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              1. SITE STRENGTH vs KEYWORD BARRIER{" "}
              <em>
                *(DA {strategyData.domainAuthority} | KD avg{" "}
                {strategyData.avgKeywordDifficulty})*
              </em>
            </h3>
            <p className="subtitle">
              ▸ Subtitle:{" "}
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
        </div>

        {/* 2. Equity Leaks */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              2. EQUITY LEAKS{" "}
              <em>
                *(Cannibal {panels.equityLeaks.cannibalizationPercentage} % |
                Dilution {panels.equityLeaks.dilutionPercentage} %)*
              </em>
            </h3>
            <p className="subtitle">
              ▸ Subtitle:{" "}
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
                <div
                  className="progress-fill dilution"
                  style={{
                    width: `${Math.min(
                      panels.equityLeaks.dilutionPercentage * 8,
                      100
                    )}%`,
                  }}
                >
                  ▂▂▅▇█
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
        </div>

        {/* 3. Funnel Mix Health */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              3. FUNNEL MIX HEALTH{" "}
              <em>
                *(TOFU {panels.funnelMix.tofPercentage} % | MOFU{" "}
                {panels.funnelMix.mofPercentage} % | BOFU{" "}
                {panels.funnelMix.bofPercentage} %)*
              </em>
            </h3>
            <p className="subtitle">
              ▸ Subtitle:{" "}
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
                <div
                  className="stage-fill tofu"
                  style={{
                    width: `${(panels.funnelMix.tofPercentage / 100) * 200}px`,
                  }}
                >
                  ███░░░░
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
                <div
                  className="stage-fill mofu"
                  style={{
                    width: `${(panels.funnelMix.mofPercentage / 100) * 200}px`,
                  }}
                >
                  ██░░░░░
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
                <div
                  className="stage-fill bofu"
                  style={{
                    width: `${(panels.funnelMix.bofPercentage / 100) * 200}px`,
                  }}
                >
                  █░░░░░░
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
        </div>

        {/* 4. HUTA Chain */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              4. HOOK → UNDERSTAND → TRUST → ACT CHAIN{" "}
              <em>
                *({panels.hutaChain.hookScore} % |{" "}
                {panels.hutaChain.understandScore} % |{" "}
                {panels.hutaChain.trustScore} % | {panels.hutaChain.actScore}{" "}
                %)*
              </em>
            </h3>
            <p className="subtitle">
              ▸ Subtitle:{" "}
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
        </div>

        {/* 5. Match-up Analysis */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              5. MATCH‑UP ANALYSIS{" "}
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
              ▸ Subtitle:{" "}
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
        </div>

        {/* 6. Playbook Compliance */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>
              6. PLAYBOOK COMPLIANCE <em>*(Framework Coverage)*</em>
            </h3>
            <p className="subtitle">
              ▸ Subtitle:{" "}
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
        </div>

        {/* 7. Journey Coverage */}
        <div className="strategy-panel">
          <div className="panel-header">
            <h3>7. JOURNEY COVERAGE</h3>
            <p className="subtitle">
              ▸ Subtitle:{" "}
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
                    width: `${panels.journeyCoverage.awareness * 10}px`,
                  }}
                >
                  ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▎
                </div>
              </div>
              <span>
                {panels.journeyCoverage.awareness} % (
                {Math.round(panels.journeyCoverage.totalPages * 0.218)} pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Consideration</span>
              <div className="journey-bar">
                <div
                  className="journey-fill consideration"
                  style={{
                    width: `${panels.journeyCoverage.consideration * 5}px`,
                  }}
                >
                  ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
                </div>
              </div>
              <span>
                {panels.journeyCoverage.consideration} % (
                {Math.round(panels.journeyCoverage.totalPages * 0.455)} pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Decision</span>
              <div className="journey-bar">
                <div
                  className="journey-fill decision"
                  style={{ width: `${panels.journeyCoverage.decision * 15}px` }}
                >
                  ▌▌▌▌▌▌▌
                </div>
              </div>
              <span>
                {panels.journeyCoverage.decision} % (
                {Math.round(panels.journeyCoverage.totalPages * 0.127)} pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Retention</span>
              <div className="journey-bar">
                <div
                  className="journey-fill retention"
                  style={{
                    width: `${panels.journeyCoverage.retention * 10}px`,
                  }}
                >
                  ▌▌▌▌▌▌▌▌▌▌
                </div>
              </div>
              <span>
                {panels.journeyCoverage.retention} % (
                {Math.round(panels.journeyCoverage.totalPages * 0.182)} pages)
              </span>
            </div>
            <div className="journey-stage">
              <span>Advocacy</span>
              <div className="journey-bar">
                <div
                  className="journey-fill advocacy"
                  style={{ width: `${panels.journeyCoverage.advocacy * 50}px` }}
                >
                  ▌
                </div>
              </div>
              <span>
                {panels.journeyCoverage.advocacy} % (
                {Math.round(panels.journeyCoverage.totalPages * 0.018)} page)
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

export default StrategyAnalysisNew;
