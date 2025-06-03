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
    // Revenue leak could be calculated from multiple sources
    // This is a simplified example
    const averageOrderValue = data.domainCostDetails?.averageOrderValue || 0;
    const totalAnalyzed = data.funnelAnalysis?.totalAnalyzed || 0;
    const leakPercent = 0.05; // Example: 5% of potential revenue is leaking

    return Math.round(averageOrderValue * totalAnalyzed * leakPercent);
  };

  const calculateContentDecay = (data) => {
    // Simplified calculation based on content age and performance
    return Math.round(calculateRevenueLeak(data) * 0.6); // 60% of revenue leak
  };

  const calculateKwMismatch = (data) => {
    // Simplified calculation based on keywords and search volume
    return Math.round(calculateRevenueLeak(data) * 0.8); // 80% of revenue leak
  };

  const calculateLinkDilution = (data) => {
    // Simplified calculation
    return Math.round(calculateRevenueLeak(data) * 0.4); // 40% of revenue leak
  };

  const calculatePsychoMismatch = (data) => {
    // Based on psychological composite summary if available
    const psychSummary = data.funnelAnalysis?.psychCompositeSummary?.overall;
    if (psychSummary) {
      const avgScore =
        (psychSummary.emotionalResonance +
          psychSummary.cognitiveClarity +
          psychSummary.persuasionLeverage +
          psychSummary.behavioralMomentum) /
        4;

      // Calculate mismatch as inverse of score percentage
      const mismatchPercent = (100 - avgScore) / 100;
      return Math.round(calculateRevenueLeak(data) * mismatchPercent);
    }
    return Math.round(calculateRevenueLeak(data) * 0.7); // Fallback: 70% of revenue leak
  };

  const calculateKeywordMismatchValue = (data) => {
    const da = data.siteAnalysis?.domainAuthority || 0;
    const avgDifficulty = 55; // Default or from analysis data
    const mismatchFactor = Math.abs(da - avgDifficulty) * 200;
    return Math.round(Math.max(5000, mismatchFactor * 30));
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
      <header className="dashboard-header">
        {/* <h1>Content Ledger Dashboard</h1> */}
        <p>
          Content strategy insights for {onboardingData.domain || "your domain"}
        </p>
      </header>

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

        <div className="dashboard-funnel-analysis">
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
        </div>
      </section>

      <div className="dashboard-actions">
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
      </div>
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
