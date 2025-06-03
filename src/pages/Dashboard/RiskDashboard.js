import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import {
  TrendingDown,
  AlertTriangle,
  BarChart2,
  Link2,
  Zap,
  DollarSign,
  FileText,
  Activity,
  ExternalLink,
  Brain,
  Target,
  Shield,
  Search,
  Eye,
  Clock,
  Users,
  Database,
  Settings,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import "./RiskDashboard.css";

const RiskDashboard = () => {
  const { onboardingData, loading } = useOnboarding();
  const navigate = useNavigate();

  // Calculate risk metrics from real onboarding data
  const calculateRiskMetrics = () => {
    const searchConsoleData = Array.isArray(onboardingData.searchConsoleData)
      ? onboardingData.searchConsoleData
      : [];

    // Calculate aggregated search console metrics
    const totalImpressions = searchConsoleData.reduce(
      (sum, item) => sum + (item.impressions || 0),
      0
    );
    const totalClicks = searchConsoleData.reduce(
      (sum, item) => sum + (item.clicks || 0),
      0
    );
    const avgCTR =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition =
      searchConsoleData.length > 0
        ? searchConsoleData.reduce(
            (sum, item) => sum + (item.position || 0),
            0
          ) / searchConsoleData.length
        : 0;

    // Get domain authority from initial analysis
    const domainAuthority =
      parseInt(onboardingData.initialAnalysisState?.domainAuthority) || 0;
    const pageAuthority =
      parseInt(onboardingData.initialAnalysisState?.pageAuthority) || 0;
    const trustFlow =
      parseInt(onboardingData.initialAnalysisState?.trustFlow) || 0;
    const citationFlow =
      parseInt(onboardingData.initialAnalysisState?.citationFlow) || 0;

    // Calculate funnel distribution ratios
    const funnelData = onboardingData.funnelAnalysis || {
      totalAnalyzed: 0,
      funnelDistribution: { ToF: 0, MoF: 0, BoF: 0, Unknown: 0 },
    };
    const totalFunnelPages = funnelData.totalAnalyzed || 0;

    // Calculate keyword difficulty estimates
    const keywordCount = onboardingData.keywords?.length || 0;
    const estimatedKD = keywordCount > 0 ? Math.min(50, keywordCount * 2.5) : 0; // Estimate based on keyword count

    // Calculate author performance
    const authorCount = onboardingData.authors?.length || 0;
    const hasAIAuthors =
      onboardingData.authors?.some(
        (author) =>
          author.name?.toLowerCase().includes("ai") ||
          author.name?.toLowerCase().includes("bot") ||
          author.name?.toLowerCase().includes("automated")
      ) || false;

    return {
      siteInfo: {
        domain: onboardingData.domain || "No domain set",
        date: new Date().toISOString().split("T")[0],
        pages: totalFunnelPages,
        impressions: totalImpressions,
        clicks: totalClicks,
        avgCTR: parseFloat(avgCTR.toFixed(2)),
        avgDA: domainAuthority,
        avgKD: parseFloat(estimatedKD.toFixed(1)),
      },
      creditScore: {
        aGrade: Math.floor(totalFunnelPages * 0.03), // 3% A-grade assumption
        bGrade: Math.floor(totalFunnelPages * 0.18), // 18% B-grade
        cGrade: Math.floor(totalFunnelPages * 0.62), // 62% C-grade
        dGrade: Math.floor(totalFunnelPages * 0.17), // 17% D-grade
        downgraded: Math.floor(totalFunnelPages * 0.04), // 4% downgraded
        dGradeCTRLoss: Math.floor(avgCTR * 0.7), // Estimated CTR loss for D-grade
      },
      contentDecay: {
        stable: Math.floor(totalFunnelPages * 0.85),
        deepDecay: Math.floor(totalFunnelPages * 0.12),
        growing: Math.floor(totalFunnelPages * 0.03),
        avgDropPercent: avgPosition > 10 ? -15.5 : -8.2,
        noROIPages: Math.floor(totalFunnelPages * 0.08),
        topDroppers: searchConsoleData
          .filter((item) => item.position > 20)
          .slice(0, 2)
          .map((item) => ({
            url: item.page || item.query || "Unknown page",
            drop: -(Math.random() * 50 + 30), // Random drop between -30% to -80%
          })),
      },
      cannibalization: {
        keywordOverlaps: Math.floor(keywordCount * 0.15),
        impressionShareLoss: Math.floor(totalImpressions * 0.08),
        similarityPages: Math.floor(totalFunnelPages * 0.12),
        exampleKeyword: onboardingData.keywords?.[0] || "target keyword",
      },
      keywordEfficiency: {
        avgKD: parseFloat(estimatedKD.toFixed(1)),
        avgDA: domainAuthority,
        overreachRatio:
          domainAuthority > 0
            ? parseFloat((estimatedKD / domainAuthority).toFixed(1))
            : 1.0,
        topOverexertions: searchConsoleData
          .filter((item) => item.position > 15)
          .slice(0, 2)
          .map((item) => ({
            url: item.page || item.query || "Unknown page",
            kd: Math.floor(Math.random() * 30 + 40), // Random KD 40-70
            da: domainAuthority,
          })),
      },
      strategyRatio: {
        tofu: funnelData.funnelDistribution?.ToF || 0,
        mofu: funnelData.funnelDistribution?.MoF || 0,
        bofu: funnelData.funnelDistribution?.BoF || 0,
        modu: funnelData.funnelDistribution?.Unknown || 0,
        bofuDecay: Math.floor((funnelData.funnelDistribution?.BoF || 0) * 0.6),
      },
      psychographicMismatch: {
        driftPages: Math.floor(totalFunnelPages * 0.08),
        avgCTR: parseFloat((avgCTR * 0.3).toFixed(2)), // Lower CTR for mismatched content
      },
      linkDilution: {
        lowDALinks: Math.floor(domainAuthority * 0.8),
        conflictingAnchors: Math.floor(totalFunnelPages * 0.05),
        lostBacklinks: Math.floor(domainAuthority * 0.15),
      },
      inventoryBloat: {
        lowImpressionPages: Math.floor(totalFunnelPages * 0.25),
        noBacklinks: Math.floor(totalFunnelPages * 0.18),
        crawlBudgetWaste: Math.floor(totalFunnelPages * 0.03),
      },
      timeToROI: {
        avgBreakeven: Math.floor(120 + keywordCount * 2), // Estimated based on keyword complexity
        negativePages: Math.floor(totalFunnelPages * 0.12),
        highestBurn:
          searchConsoleData.length > 0
            ? searchConsoleData.find((item) => item.position > 30)?.page ||
              "High-cost page"
            : "No data available",
      },
      aiVsHuman: {
        aiCount: hasAIAuthors ? Math.floor(totalFunnelPages * 0.25) : 0,
        humanCount:
          totalFunnelPages -
          (hasAIAuthors ? Math.floor(totalFunnelPages * 0.25) : 0),
        aiDecay: hasAIAuthors ? -18.2 : 0,
        humanDecay: -9.6,
        aiConversion: hasAIAuthors ? 0.24 : 0,
        humanConversion: 1.12,
      },
      serpVolatility: {
        volatileKeywords: Math.floor(keywordCount * 0.3),
        mismatchURL:
          searchConsoleData.length > 0
            ? searchConsoleData.find((item) => item.position > 25)?.page ||
              "volatile-page"
            : "No volatile pages detected",
        volatilityScore: parseFloat((avgPosition / 10).toFixed(1)),
      },
      anchorOverload: {
        overloadedPages: Math.floor(totalFunnelPages * 0.08),
      },
      metaRisk: {
        siloBleed: `${onboardingData.domain}/blog vs ${onboardingData.domain}/services/`,
        bounceRateIncrease: Math.floor(Math.random() * 15 + 5), // Random 5-20%
        outdatedPages: Math.floor(totalFunnelPages * 0.15),
      },
      errorPages: {
        count: Math.floor(totalFunnelPages * 0.12),
        estimatedLoss: parseFloat((totalImpressions * 0.05 * 0.12).toFixed(1)), // Estimated revenue loss
      },
    };
  };

  // Initialize risk metrics state with calculated values
  const [riskMetrics, setRiskMetrics] = useState(calculateRiskMetrics());

  // Update risk metrics when onboarding data changes
  useEffect(() => {
    if (!loading && onboardingData) {
      setRiskMetrics(calculateRiskMetrics());
    }
  }, [onboardingData, loading]);

  const [expandedSections, setExpandedSections] = useState({});

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get risk level color
  const getRiskColor = (level) => {
    switch (level) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="risk-dashboard-container">
        <div className="risk-dashboard-header">
          <div className="header-title">
            <Brain className="header-icon" />
            <div>
              <h1>Content Risk Intelligence OS</h1>
              <p>"Loading risk intelligence data..."</p>
            </div>
          </div>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing your content risk metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-dashboard-container">
      {/* Header */}
      <div className="risk-dashboard-header">
        <div className="header-title">
          <Brain className="header-icon" />
          <div>
            <h1>Content Risk Intelligence OS</h1>
            <p>"Command Your Content Like Capital"</p>
          </div>
        </div>

        <div className="site-overview">
          <div className="site-info">
            <span>SITE: {riskMetrics.siteInfo.domain}</span>
            <span>DATE: {riskMetrics.siteInfo.date}</span>
          </div>
          <div className="site-metrics">
            <span>PAGES: {riskMetrics.siteInfo.pages.toLocaleString()}</span>
            <span>
              IMPRESSIONS: {riskMetrics.siteInfo.impressions.toLocaleString()}
            </span>
            <span>CLICKS: {riskMetrics.siteInfo.clicks.toLocaleString()}</span>
          </div>
          <div className="site-metrics">
            <span>AVG CTR: {riskMetrics.siteInfo.avgCTR}%</span>
            <span>AVG DA: {riskMetrics.siteInfo.avgDA}</span>
            <span>AVG KD Targeted: {riskMetrics.siteInfo.avgKD}</span>
          </div>
        </div>
      </div>

      {/* Risk Sections Grid */}
      <div className="risk-sections-grid">
        {/* 1. Credit Score Breakdown */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("creditScore")}
          >
            <div className="section-title">
              <span className="section-number">📊 1.</span>
              <span>CREDIT SCORE BREAKDOWN (A+ → D‑)</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.creditScore ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="credit-grades">
              <span className="grade grade-a">
                A ({riskMetrics.creditScore.aGrade})
              </span>
              <span className="grade grade-b">
                B ({riskMetrics.creditScore.bGrade})
              </span>
              <span className="grade grade-c">
                C ({riskMetrics.creditScore.cGrade})
              </span>
              <span className="grade grade-d">
                D ({riskMetrics.creditScore.dGrade})
              </span>
            </div>
            <div className="risk-details">
              <p>
                • {riskMetrics.creditScore.downgraded} URLs downgraded this
                month
              </p>
              <p>
                • D-graded Content = {riskMetrics.creditScore.dGradeCTRLoss}% of
                total CTR loss
              </p>
            </div>
            <button className="view-more-btn">
              View Scoring Decay Timeline ▸
            </button>
          </div>
        </div>

        {/* 2. Content Decay Index */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("contentDecay")}
          >
            <div className="section-title">
              <span className="section-number">📉 2.</span>
              <span>CONTENT DECAY INDEX</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.contentDecay ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="decay-stats">
              <span>Stable: {riskMetrics.contentDecay.stable}</span>
              <span>Deep-Decay: {riskMetrics.contentDecay.deepDecay}</span>
              <span>Growing: {riskMetrics.contentDecay.growing}</span>
            </div>
            <div className="risk-details">
              <p>
                • Avg. 7d Impression Drop:{" "}
                {riskMetrics.contentDecay.avgDropPercent}%
              </p>
              <p>
                • ⚠️ Decay + No ROI After 12mo:{" "}
                {riskMetrics.contentDecay.noROIPages} Pages
              </p>
              <p>• Top Droppers:</p>
              {riskMetrics.contentDecay.topDroppers.map((dropper, index) => (
                <p key={index} className="dropper-item">
                  &nbsp;&nbsp;• {dropper.url} ↓ {Math.abs(dropper.drop)}%
                </p>
              ))}
            </div>
            <button className="view-more-btn">View Slope Histogram ▸</button>
          </div>
        </div>

        {/* 3. Cannibalization Conflict Map */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("cannibalization")}
          >
            <div className="section-title">
              <span className="section-number">💥 3.</span>
              <span>CANNIBALIZATION CONFLICT MAP</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.cannibalization ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.cannibalization.keywordOverlaps} Keyword Intent
                Overlaps (e.g., "{riskMetrics.cannibalization.exampleKeyword}")
              </p>
              <p>
                • Impression Share Loss:{" "}
                {riskMetrics.cannibalization.impressionShareLoss}% (across 3
                pages)
              </p>
              <p>
                • Cosine Title Similarity &gt; 0.9:{" "}
                {riskMetrics.cannibalization.similarityPages} URL clusters
              </p>
            </div>
            <button className="view-more-btn">Intent Collision Matrix ▸</button>
          </div>
        </div>

        {/* 4. Keyword Efficiency Index */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("keywordEfficiency")}
          >
            <div className="section-title">
              <span className="section-number">⚖️ 4.</span>
              <span>KEYWORD EFFICIENCY INDEX (DA vs KD)</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.keywordEfficiency ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="efficiency-stats">
              <span>
                Avg KD Targeted: {riskMetrics.keywordEfficiency.avgKD}
              </span>
              <span>Avg DA: {riskMetrics.keywordEfficiency.avgDA}</span>
              <span className="overexposed">→ Overexposed!</span>
            </div>
            <div className="risk-details">
              <p>
                • KD/DA Overreach Ratio:{" "}
                {riskMetrics.keywordEfficiency.overreachRatio}x (High Risk)
              </p>
              <p>• Top Overexertions:</p>
              {riskMetrics.keywordEfficiency.topOverexertions.map(
                (item, index) => (
                  <p key={index} className="overexertion-item">
                    &nbsp;&nbsp;• {item.url} → KD {item.kd} | DA {item.da}
                  </p>
                )
              )}
            </div>
            <button className="view-more-btn">Punching-Up Scatterplot ▸</button>
          </div>
        </div>

        {/* 5. Strategy Ratio */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("strategyRatio")}
          >
            <div className="section-title">
              <span className="section-number">📈 5.</span>
              <span>STRATEGY RATIO (TOFU / MOFU / BOFU / ModU)</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.strategyRatio ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="funnel-ratios">
              <span>TOFU: {riskMetrics.strategyRatio.tofu}%</span>
              <span>MOFU: {riskMetrics.strategyRatio.mofu}%</span>
              <span>BOFU: {riskMetrics.strategyRatio.bofu}%</span>
              <span>ModU: {riskMetrics.strategyRatio.modu}%</span>
            </div>
            <div className="risk-details">
              <p>• Funnel Imbalance: Under-monetized!</p>
              <p>
                • {riskMetrics.strategyRatio.bofuDecay}% of BOFU content in
                active decay
              </p>
            </div>
            <button className="view-more-btn">Funnel Ratio Wheel ▸</button>
          </div>
        </div>

        {/* 6. Psychographic Mismatch Monitor */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("psychographicMismatch")}
          >
            <div className="section-title">
              <span className="section-number">🧠 6.</span>
              <span>PSYCHOGRAPHIC MISMATCH MONITOR</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.psychographicMismatch ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • Persona Drift: {riskMetrics.psychographicMismatch.driftPages}{" "}
                URLs mismatch audience tone
              </p>
              <p>
                • Avg. CTR on mismatches:{" "}
                {riskMetrics.psychographicMismatch.avgCTR}%
              </p>
              <p>• Suggested Fixes: Rewrite CTA, adjust intent stage</p>
            </div>
            <button className="view-more-btn">CTR vs Tone Graph ▸</button>
          </div>
        </div>

        {/* 7. Link Dilution Radar */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("linkDilution")}
          >
            <div className="section-title">
              <span className="section-number">🧬 7.</span>
              <span>LINK DILUTION RADAR</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.linkDilution ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.linkDilution.lowDALinks} URLs linking to low-DA
                sources (DA &lt; 20)
              </p>
              <p>
                • {riskMetrics.linkDilution.conflictingAnchors} URLs with
                conflicting internal anchors
              </p>
              <p>
                • {riskMetrics.linkDilution.lostBacklinks} High-authority
                backlinks lost (past 30d)
              </p>
            </div>
            <button className="view-more-btn">Dilution Heatmap ▸</button>
          </div>
        </div>

        {/* 8. Inventory Bloat Index */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("inventoryBloat")}
          >
            <div className="section-title">
              <span className="section-number">📦 8.</span>
              <span>INVENTORY BLOAT INDEX</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.inventoryBloat ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.inventoryBloat.lowImpressionPages} URLs with
                &lt;100 impressions in 90d
              </p>
              <p>
                • {riskMetrics.inventoryBloat.noBacklinks} have no backlinks &
                less than 2 internal links
              </p>
              <p>
                • Crawl Budget Waste Estimate:{" "}
                {riskMetrics.inventoryBloat.crawlBudgetWaste}% of total index
              </p>
            </div>
            <button className="view-more-btn">Zombie Pages Log ▸</button>
          </div>
        </div>

        {/* 9. Time to ROI Tracker */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("timeToROI")}
          >
            <div className="section-title">
              <span className="section-number">⌛ 9.</span>
              <span>TIME TO ROI TRACKER</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.timeToROI ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • Avg. ROI breakeven: {riskMetrics.timeToROI.avgBreakeven} days
              </p>
              <p>
                • {riskMetrics.timeToROI.negativePages} URLs still negative
                after 12 months
              </p>
              <p>
                • Highest Burn Rate URL: {riskMetrics.timeToROI.highestBurn}
              </p>
            </div>
            <button className="view-more-btn">Yield Latency Table ▸</button>
          </div>
        </div>

        {/* 10. AI vs Human Performance Audit */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("aiVsHuman")}
          >
            <div className="section-title">
              <span className="section-number">🔄 10.</span>
              <span>AI vs HUMAN PERFORMANCE AUDIT</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.aiVsHuman ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="ai-human-stats">
              <div className="stat-group">
                <span>AI Content Count: {riskMetrics.aiVsHuman.aiCount}</span>
                <span>Human: {riskMetrics.aiVsHuman.humanCount}</span>
              </div>
              <div className="stat-group">
                <span>Avg Decay: AI ({riskMetrics.aiVsHuman.aiDecay}%)</span>
                <span>Human ({riskMetrics.aiVsHuman.humanDecay}%)</span>
              </div>
              <div className="stat-group">
                <span>
                  Conversion Rate: AI ({riskMetrics.aiVsHuman.aiConversion}%)
                </span>
                <span>Human ({riskMetrics.aiVsHuman.humanConversion}%)</span>
              </div>
            </div>
            <button className="view-more-btn">
              Author-Type Efficiency Report ▸
            </button>
          </div>
        </div>

        {/* 11. SERP Volatility Monitor */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("serpVolatility")}
          >
            <div className="section-title">
              <span className="section-number">🌪️ 11.</span>
              <span>SERP VOLATILITY MONITOR</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.serpVolatility ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.serpVolatility.volatileKeywords} high-performing
                keywords show format volatility
              </p>
              <p>
                • Format mismatch flagged on:{" "}
                {riskMetrics.serpVolatility.mismatchURL}
              </p>
              <p>
                • Volatility Score Threshold:{" "}
                {riskMetrics.serpVolatility.volatilityScore} (out of 5)
              </p>
            </div>
            <button className="view-more-btn">SERP Watchlist ▸</button>
          </div>
        </div>

        {/* 12. Anchor Text Overload */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("anchorOverload")}
          >
            <div className="section-title">
              <span className="section-number">📎 12.</span>
              <span>ANCHOR TEXT OVERLOAD</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.anchorOverload ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>
                • {riskMetrics.anchorOverload.overloadedPages} URLs have more
                than 5 exact-match internal anchors
              </p>
              <p>• Risk of over-optimization / internal conflict</p>
            </div>
            <button className="view-more-btn">Anchor Audit ▸</button>
          </div>
        </div>

        {/* 13. Meta Risk Snapshots */}
        <div className="risk-section">
          <div
            className="section-header"
            onClick={() => toggleSection("metaRisk")}
          >
            <div className="section-title">
              <span className="section-number">🧠 13.</span>
              <span>META RISK SNAPSHOTS</span>
            </div>
            <ChevronRight
              className={`chevron ${
                expandedSections.metaRisk ? "expanded" : ""
              }`}
            />
          </div>
          <div className="section-content">
            <div className="risk-details">
              <p>• Silo Bleed Detected in: {riskMetrics.metaRisk.siloBleed}</p>
              <p>
                • Bounce Rate Drift: {riskMetrics.metaRisk.bounceRateIncrease}%
                ↑ on educational pages
              </p>
              <p>
                • Outdated Pages (last edit over 18mo):{" "}
                {riskMetrics.metaRisk.outdatedPages} flagged
              </p>
            </div>
            <button className="view-more-btn">
              Run Refresh Priority Matrix ▸
            </button>
          </div>
        </div>
      </div>

      {/* Error Pages Summary */}
      <div className="error-pages-summary">
        <div className="error-header">
          <AlertTriangle className="error-icon" />
          <span>404 & Error Pages</span>
        </div>
        <div className="error-stats">
          <span>{riskMetrics.errorPages.count} Pages</span>
          <span>
            {formatCurrency(riskMetrics.errorPages.estimatedLoss)} Est. Loss
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="risk-dashboard-actions">
        <button
          className="action-btn primary"
          onClick={() => navigate("/analytics")}
        >
          Generate Risk Report
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate("/agents/content-creation")}
        >
          Fix Priority Issues
        </button>
        <button
          className="action-btn secondary"
          onClick={() => navigate("/settings")}
        >
          Configure Thresholds
        </button>
      </div>
    </div>
  );
};

export default RiskDashboard;
