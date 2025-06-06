import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import {
  TrendingDown,
  AlertCircle,
  BarChart2,
  Link2,
  Zap,
  DollarSign,
  FileText,
  Activity,
  ExternalLink,
} from "lucide-react";
import "./Dashboard.css";
import {
  calculateContentGrade,
  getGradeColor,
  getGradeDescription,
} from "../../utils/ContentRating";

const Dashboard = () => {
  const { onboardingData } = useOnboarding();
  const navigate = useNavigate();

  // Initialize state with data from context or defaults
  const [stats, setStats] = useState({
    revenueLeak: { value: 0, urls: 0 },
    contentDecay: { value: 0, urls: 0 },
    kwMismatch: { value: 0, urls: 0 },
    linkDilution: { value: 0, urls: 0 },
    psychoMismatch: { value: 0, urls: 0 },
    contentCreationCost: { value: 0, urls: 0 },
  });

  const [funnelData, setFunnelData] = useState({
    tofu: { current: 0, ideal: 0 },
    mofu: { current: 0, ideal: 0 },
    bofu: { current: 0, ideal: 0 },
    gap: "",
  });

  const [keywordEfficiency, setKeywordEfficiency] = useState({
    da: 0,
    kdAvg: 0,
    mismatchValue: 0,
  });

  // Calculate and set dashboard data from onboardingData
  useEffect(() => {
    if (onboardingData) {
      // Process revenue leak stats
      const averageOrderValue =
        onboardingData.domainCostDetails?.averageOrderValue || 0;
      const contentCost =
        onboardingData.domainCostDetails?.AverageContentCost || 0;

      // Process SEO analysis data if available
      const analysisData = onboardingData.GSCAnalysisData || {};

      // Calculate stats based on available data
      const calculatedStats = {
        revenueLeak: {
          value: calculateRevenueLeak(onboardingData),
          urls: onboardingData.funnelAnalysis?.details?.length || 0,
        },
        contentDecay: {
          value: calculateContentDecay(onboardingData),
          urls: getContentDecayUrls(onboardingData),
        },
        kwMismatch: {
          value: calculateKwMismatch(onboardingData),
          urls: getKwMismatchUrls(onboardingData),
        },
        linkDilution: {
          value: calculateLinkDilution(onboardingData),
          urls: getLinkDilutionUrls(onboardingData),
        },
        psychoMismatch: {
          value: calculatePsychoMismatch(onboardingData),
          urls: getPsychoMismatchUrls(onboardingData),
        },
        contentCreationCost: {
          value:
            contentCost * (onboardingData.funnelAnalysis?.totalAnalyzed || 0),
          urls: 0,
        },
      };

      setStats(calculatedStats);

      // Process funnel data if available
      if (onboardingData.funnelAnalysis?.funnelDistribution) {
        const { funnelDistribution } = onboardingData.funnelAnalysis;
        const totalPages = onboardingData.funnelAnalysis.totalAnalyzed || 1;

        // Calculate percentages for each stage
        const tofuPercent =
          Math.round((funnelDistribution.ToF / totalPages) * 100) || 0;
        const mofuPercent =
          Math.round((funnelDistribution.MoF / totalPages) * 100) || 0;
        const bofuPercent =
          Math.round((funnelDistribution.BoF / totalPages) * 100) || 0;

        // Ideal distribution (based on industry standards or configurable)
        const tofuIdeal = 55;
        const mofuIdeal = 30;
        const bofuIdeal = 25;

        // Determine the gap
        let gap = "";
        if (bofuPercent < bofuIdeal) {
          gap = `Missing BOFU content (${bofuPercent}%)`;
        } else if (mofuPercent < mofuIdeal) {
          gap = `Missing MOFU content (${mofuPercent}%)`;
        } else if (tofuPercent < tofuIdeal) {
          gap = `Missing TOFU content (${tofuPercent}%)`;
        }

        setFunnelData({
          tofu: { current: tofuPercent, ideal: tofuIdeal },
          mofu: { current: mofuPercent, ideal: mofuIdeal },
          bofu: { current: bofuPercent, ideal: bofuIdeal },
          gap,
        });
      }

      // Set keyword efficiency data
      setKeywordEfficiency({
        da: onboardingData.siteAnalysis?.domainAuthority || 0,
        kdAvg: analysisData.averageDifficulty || 55,
        mismatchValue: calculateKeywordMismatchValue(onboardingData),
      });
    }
  }, [onboardingData]);
  // Helper functions for calculations
  const calculateRevenueLeak = (data) => {
    // Revenue leak calculated using standardized approach
    const averageOrderValue = data.domainCostDetails?.averageOrderValue || 50;
    const totalAnalyzed = data.funnelAnalysis?.totalAnalyzed || 0;
    const conversionRate = 0.02; // Default 2% conversion rate
    const potentialRevenue = totalAnalyzed * averageOrderValue * conversionRate;
    const leakPercent = 0.05; // 5% of potential revenue is leaking

    return Math.round(potentialRevenue * leakPercent);
  };
  const calculateContentDecay = (data) => {
    // Standardized content decay calculation using actual decay metrics
    const averageOrderValue = data.domainCostDetails?.averageOrderValue || 50;
    const contentDecayPages = data.funnelAnalysis?.decayPages || 0;
    const totalImpressions =
      data.searchConsoleData?.reduce(
        (sum, item) => sum + (item.impressions || 0),
        0
      ) || 0;

    // Calculate potential clicks lost due to decay
    const potentialClicks = totalImpressions * 0.03; // 3% target CTR
    const decayIntensity = 0.4; // 40% decay intensity
    const lostClicks =
      potentialClicks *
      decayIntensity *
      (contentDecayPages /
        Math.max(data.funnelAnalysis?.totalAnalyzed || 1, 1));

    // Calculate revenue loss using standard conversion rate
    return Math.round(lostClicks * 0.02 * averageOrderValue); // 2% conversion rate
  };

  const calculateKwMismatch = (data) => {
    // Standardized keyword mismatch calculation using DA vs KD gap
    const averageOrderValue = data.domainCostDetails?.averageOrderValue || 50;
    const domainAuthority = data.siteAnalysis?.domainAuthority || 30;
    const avgDifficulty = data.siteAnalysis?.averageDifficulty || 55;
    const kdGap = Math.max(0, avgDifficulty - domainAuthority);

    // Calculate potential loss based on DA/KD gap
    const totalAnalyzed = data.funnelAnalysis?.totalAnalyzed || 1;
    const impactMultiplier = kdGap * 5; // 5x multiplier for each point of KD gap

    return Math.round(
      averageOrderValue * totalAnalyzed * 0.02 * (impactMultiplier / 100)
    ); // 2% conversion rate
  };
  const calculateLinkDilution = (data) => {
    // Standardized link dilution calculation
    const averageOrderValue = data.domainCostDetails?.averageOrderValue || 50;
    const totalAnalyzed = data.funnelAnalysis?.totalAnalyzed || 1;
    const dilutionPages =
      data.funnelAnalysis?.dilutionPages || Math.round(totalAnalyzed * 0.15); // Estimate 15% of pages have dilution

    // Calculate traffic loss due to dilution
    const totalImpressions =
      data.searchConsoleData?.reduce(
        (sum, item) => sum + (item.impressions || 0),
        0
      ) || 0;
    const dilutionScore = 0.1; // 10% dilution intensity
    const trafficLoss =
      totalImpressions * dilutionScore * (dilutionPages / totalAnalyzed);

    // Calculate revenue loss using standard conversion rate
    return Math.round(trafficLoss * 0.03 * 0.02 * averageOrderValue); // 3% CTR, 2% conversion
  };

  const calculatePsychoMismatch = (data) => {
    // Standardized psychological mismatch calculation
    const averageOrderValue = data.domainCostDetails?.averageOrderValue || 50;
    const totalClicks =
      data.searchConsoleData?.reduce(
        (sum, item) => sum + (item.clicks || 0),
        0
      ) || 0;

    // Calculate psych score if available
    const psychSummary = data.funnelAnalysis?.psychCompositeSummary?.overall;
    let mismatchPercent = 0.4; // Default 40% mismatch

    if (psychSummary) {
      const avgScore =
        (psychSummary.emotionalResonance +
          psychSummary.cognitiveClarity +
          psychSummary.persuasionLeverage +
          psychSummary.behavioralMomentum) /
        4;

      // Calculate mismatch as inverse of score percentage
      mismatchPercent = (100 - avgScore) / 100;
    }

    // Calculate revenue loss based on clicks and mismatch percentage
    return Math.round(totalClicks * mismatchPercent * 0.02 * averageOrderValue); // 2% conversion rate
  };
  const calculateKeywordMismatchValue = (data) => {
    const averageOrderValue = data.domainCostDetails?.averageOrderValue || 50;
    const da = data.siteAnalysis?.domainAuthority || 30;
    const avgDifficulty = data.siteAnalysis?.averageDifficulty || 55;

    // Calculate potential impact using standardized approach
    const totalImpressions =
      data.searchConsoleData?.reduce(
        (sum, item) => sum + (item.impressions || 0),
        0
      ) || 10000; // Default 10k impressions

    // Calculate CTR adjustment based on DA vs KD gap
    const kdGapFactor = Math.max(0, avgDifficulty - da) / 100;
    const potentialCTRImprovement = 0.02 + kdGapFactor * 0.03; // 2% base + up to 3% more with gap

    // Calculate potential clicks and conversions lost
    const potentialClicks = totalImpressions * potentialCTRImprovement;
    const actualCTR = 0.03; // 3% actual CTR
    const actualClicks = totalImpressions * actualCTR;
    const lostClicks = Math.max(0, potentialClicks - actualClicks);

    // Calculate dollar value using standard conversion rate
    return Math.round(lostClicks * 0.02 * averageOrderValue); // 2% conversion
  };

  // Helper functions to count URLs
  const getContentDecayUrls = (data) => {
    // Count pages with content decay issues
    return Math.round((data.funnelAnalysis?.totalAnalyzed || 0) * 0.2); // Example: 20% of pages
  };

  const getKwMismatchUrls = (data) => {
    // Count pages with keyword mismatch issues
    return Math.round((data.funnelAnalysis?.totalAnalyzed || 0) * 0.3); // Example: 30% of pages
  };

  const getLinkDilutionUrls = (data) => {
    // Count pages with link dilution issues
    return Math.round((data.funnelAnalysis?.totalAnalyzed || 0) * 0.2); // Example: 20% of pages
  };

  const getPsychoMismatchUrls = (data) => {
    // Count pages with psychological mismatch issues
    return Math.round((data.funnelAnalysis?.totalAnalyzed || 0) * 0.3); // Example: 30% of pages
  };

  return (
    <div className="dashboard-container">
      {/* <h1>Content Ledger Dashboard</h1> */}
      {/* <header className="dashboard-header">
        <p>
          Content strategy insights for {onboardingData.domain || "your domain"}
        </p>
      </header> */}

      <section className="dashboard-main">
        <div className="dashboard-revenue-leaks">
          <h2 className="section-title">
            <span className="title-icon">💸</span>
            Revenue Leak Detection
          </h2>

          <div className="dashboard-cards">
            {Object.entries(stats).map(([key, data], index) => (
              <div key={key} className="revenue-card">
                <div className="card-header">
                  <h3>{formatLeakTitle(key)}</h3>
                  {data.urls > 0 && (
                    <span className="affected-urls">{data.urls} URLs</span>
                  )}
                </div>
                <div className="card-value">
                  <span className="value-estimate">
                    ${formatNumber(data.value)}
                  </span>
                  <span className="value-label">estimated</span>
                </div>
                <div className="card-footer">
                  {getIconForLeakType(key)}
                  <button className="btn-view-details">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="dashboard-funnel-analysis">
          <h2 className="section-title">
            <span className="title-icon">📊</span>
            Content Strategy Ratio
          </h2>

          <div className="funnel-visualization">
            <div className="funnel-stages">
              {["TOFU", "MOFU", "BOFU"].map((stage) => (
                <div key={stage} className="funnel-stage">
                  <div className="stage-header">
                    <h4>{stage}</h4>
                  </div>
                  <div className="stage-metrics">
                    <div className="stage-current">
                      <div
                        className="percent-bar"
                        style={{
                          width: `${funnelData[stage.toLowerCase()].current}%`,
                        }}
                      ></div>
                      <span>{funnelData[stage.toLowerCase()].current}%</span>
                      <label>Current</label>
                    </div>
                    <div className="stage-ideal">
                      <div
                        className="percent-bar ideal"
                        style={{
                          width: `${funnelData[stage.toLowerCase()].ideal}%`,
                        }}
                      ></div>
                      <span>{funnelData[stage.toLowerCase()].ideal}%</span>
                      <label>Ideal</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="funnel-gap">
              <div className="gap-label">Funnel Gap</div>
              <div className="gap-value">
                {funnelData.gap || "No significant gaps detected"}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-keyword-efficiency">
          <h2 className="section-title">
            <span className="title-icon">🎯</span>
            Keyword Efficiency {!onboardingData.GSCAnalysisData && "(Unlock)"}
          </h2>

          <div className="keyword-metrics">
            <div className="kw-metric">
              <span className="kw-label">DA:</span>
              <span className="kw-value">{keywordEfficiency.da}</span>
            </div>
            <span className="kw-separator">vs</span>
            <div className="kw-metric">
              <span className="kw-label">KD avg:</span>
              <span className="kw-value">{keywordEfficiency.kdAvg}</span>
            </div>
          </div>

          <div className="keyword-mismatch">
            <div className="mismatch-label">Keyword Mismatch Value</div>
            <div className="mismatch-value">
              ${formatNumber(keywordEfficiency.mismatchValue)}
            </div>
          </div>
        </div> */}
      </section>

      {/* <div className="dashboard-actions">
        <button
          className="btn-secondary"
          onClick={() => navigate("/onboarding/step-keywords")}
        >
          Complete Setup
        </button>
        <button
          className="btn-primary"
          onClick={() => navigate("/agents/content-creation")}
        >
          Start Creating Content
        </button>
      </div> */}
    </div>
  );
};

// Helper functions
function formatLeakTitle(key) {
  switch (key) {
    case "revenueLeak":
      return "Revenue Leak Detected";
    case "contentDecay":
      return "Content Decay";
    case "kwMismatch":
      return "KW Mismatch";
    case "linkDilution":
      return "Link Dilution";
    case "psychoMismatch":
      return "Psycho Mismatch";
    case "contentCreationCost":
      return "Content Creation Cost";
    default:
      return key;
  }
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getIconForLeakType(type) {
  switch (type) {
    case "revenueLeak":
      return <DollarSign size={18} />;
    case "contentDecay":
      return <TrendingDown size={18} />;
    case "kwMismatch":
      return <FileText size={18} />;
    case "linkDilution":
      return <Link2 size={18} />;
    case "psychoMismatch":
      return <Activity size={18} />;
    case "contentCreationCost":
      return <DollarSign size={18} />;
    default:
      return <AlertCircle size={18} />;
  }
}

export default Dashboard;
