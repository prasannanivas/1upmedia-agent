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
import { executeCalculationsForDashboard } from "../../utils/calculationMapping";
import FinancialTooltip from "../../components/FinancialTooltip";
import { getTooltipContent } from "../../utils/tooltipContent";

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
      // Use centralized calculations with consistent conversion rate (2.0% as percentage)
      const calculatedStats = executeCalculationsForDashboard(
        "dashboard",
        onboardingData,
        { conversionRate: 2.0 } // Pass conversion rate as percentage to match other dashboards
      );

      // Map the results to the expected format with safety checks
      const statsFormat = {
        revenueLeak: {
          value:
            typeof calculatedStats.revenueLeak === "number"
              ? calculatedStats.revenueLeak
              : 0,
          urls: calculatedStats.revenueLeakUrls || 0,
        },
        contentDecay: {
          value:
            typeof calculatedStats.contentDecay === "number"
              ? calculatedStats.contentDecay
              : 0,
          urls: calculatedStats.contentDecayUrls || 0,
        },
        kwMismatch: {
          value:
            typeof calculatedStats.kwMismatch === "number"
              ? calculatedStats.kwMismatch
              : 0,
          urls: calculatedStats.kwMismatchUrls || 0,
        },
        linkDilution: {
          value:
            typeof calculatedStats.linkDilution === "number"
              ? calculatedStats.linkDilution
              : 0,
          urls: calculatedStats.linkDilutionUrls || 0,
        },
        psychoMismatch: {
          value:
            typeof calculatedStats.psychoMismatch === "number"
              ? calculatedStats.psychoMismatch
              : 0,
          urls: calculatedStats.psychoMismatchUrls || 0,
        },
        contentCreationCost: {
          value:
            typeof calculatedStats.contentCreationCost === "number"
              ? calculatedStats.contentCreationCost
              : 0,
          urls: calculatedStats.contentCreationCostUrls || 0,
        },
      };

      setStats(statsFormat);

      // Process funnel data if available (keep existing logic for now)
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
        const bofuIdeal = 25; // Use centralized funnel gap calculation result
        const funnelGapResult = calculatedStats.funnelGaps || {
          gapType: "Balanced",
          impact: 0,
        };
        const gap = funnelGapResult.gapType || "No significant gaps detected";

        setFunnelData({
          tofu: { current: tofuPercent, ideal: tofuIdeal },
          mofu: { current: mofuPercent, ideal: mofuIdeal },
          bofu: { current: bofuPercent, ideal: bofuIdeal },
          gap,
        });
      }

      // Set keyword efficiency data (keep existing logic for now)
      const analysisData = onboardingData.GSCAnalysisData || {};
      setKeywordEfficiency({
        da: onboardingData.siteAnalysis?.domainAuthority || 0,
        kdAvg: analysisData.averageDifficulty || 55,
        mismatchValue: calculatedStats.kwMismatch || 0,
      });
    }
  }, [onboardingData]);
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
          </h2>{" "}
          <div className="dashboard-cards">
            {Object.entries(stats).map(([key, data], index) => {
              const tooltipContent = getTooltipContent(key, onboardingData);
              return (
                <div key={key} className="revenue-card">
                  <div className="card-header">
                    <h3>
                      {formatLeakTitle(key)}
                      <FinancialTooltip
                        title={tooltipContent.title}
                        content={tooltipContent.content}
                        position="top"
                      />
                    </h3>
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
              );
            })}
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
  // Ensure we have a valid number
  if (typeof num !== "number" || isNaN(num) || !isFinite(num)) {
    return "0";
  }

  // Round to avoid floating point precision issues
  const rounded = Math.round(num * 100) / 100;

  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
