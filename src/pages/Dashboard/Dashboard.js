import React, { useState, useEffect } from "react";
import { useOnboarding } from "../../context/OnboardingContext";
import { useFinancialCalculations } from "../../context/FinancialCalculations";
import {
  TrendingDown,
  AlertCircle,
  Link2,
  DollarSign,
  FileText,
  Activity,
  AlertTriangle,
} from "lucide-react";
import "./Dashboard.css";
import FinancialTooltip from "../../components/FinancialTooltip";

const Dashboard = () => {
  const { onboardingData } = useOnboarding();
  const {
    getRevenueLeak,
    getContentDecay,
    getKeywordMismatch,
    getLinkDilution,
    getPsychMismatch,
    getCannibalizationLoss,
    calculateTotalLoss,
  } = useFinancialCalculations();
  // Initialize state with data from context or defaults
  const [stats, setStats] = useState({
    totalLoss: { value: 0, urls: 0, tooltip: null },
    revenueLeak: { value: 0, urls: 0, tooltip: null },
    contentDecay: { value: 0, urls: 0, tooltip: null },
    kwMismatch: { value: 0, urls: 0, tooltip: null },
    linkDilution: { value: 0, urls: 0, tooltip: null },
    psychoMismatch: { value: 0, urls: 0, tooltip: null },
    contentCreationCost: { value: 0, urls: 0, tooltip: null },
  });

  // Calculate all dashboard metrics using FinancialCalculations functions
  useEffect(() => {
    if (!onboardingData?.GSCAnalysisData) return;

    try {
      // Use FinancialCalculations functions instead of manual calculations
      const revenueLeakData = getRevenueLeak();
      const contentDecayData = getContentDecay();
      const keywordMismatchData = getKeywordMismatch();
      const linkDilutionData = getLinkDilution();
      const psychoMismatchData = getPsychMismatch();
      const cannibalizationData = getCannibalizationLoss();
      const totalLossData = calculateTotalLoss();

      console.log(
        "Revenue Leak Data:",
        revenueLeakData,
        "Content Decay Data:",
        contentDecayData,
        "Keyword Mismatch Data:",
        keywordMismatchData,
        "Link Dilution Data:",
        linkDilutionData,
        "Psycho Mismatch Data:",
        psychoMismatchData,
        "Cannibalization Data:",
        cannibalizationData,
        "Total Loss Data:",
        totalLossData
      );
      // Update stats with calculated values from FinancialCalculations
      console.log("Total Loss Data Detailed:", {
        totalRevenueLoss: totalLossData?.summary?.totalRevenueLoss,
        parsedValue: parseFloat(totalLossData?.summary?.totalRevenueLoss || 0),
        urls: totalLossData?.summary?.urls,
        tooltip: totalLossData?.summary?.tooltip,
      });

      setStats({
        totalLoss: {
          value: parseFloat(totalLossData?.summary?.totalRevenueLoss || 0),
          urls: totalLossData?.summary?.urls || 0,
          percentage:
            totalLossData?.summary?.percentOfContentCost?.toFixed(1) || "0.0",
          tooltip: {
            title: "Total Revenue Loss",
            content:
              totalLossData?.summary?.tooltip || "No tooltip data available",
          },
        },
        revenueLeak: {
          value: Math.abs(
            Math.min(0, revenueLeakData?.estimatedRevenueLoss || 0)
          ),
          urls: revenueLeakData?.urlsBelowThreshold || 0,
          percentage: (
            ((revenueLeakData?.urlsBelowThreshold || 0) /
              (revenueLeakData?.totalUrls || 1)) *
            100
          ).toFixed(1),
          tooltip: revenueLeakData?.tooltip || null,
        },
        contentDecay: {
          value: contentDecayData?.summary?.totalRevenueLoss || 0,
          urls: contentDecayData?.summary?.urlsWithDecay || 0,
          percentage:
            contentDecayData?.summary?.decayPercentage?.toFixed(1) || "0.0",
          tooltip: contentDecayData?.summary?.tooltip || null,
        },
        kwMismatch: {
          value: keywordMismatchData?.summary?.totalRevenueLoss || 0,
          urls: keywordMismatchData?.summary?.totalMismatchedContent || 0,
          percentage:
            keywordMismatchData?.summary?.mismatchPercentage?.toFixed(1) ||
            "0.0",
          tooltip: keywordMismatchData?.summary?.tooltip || null,
        },
        linkDilution: {
          value: linkDilutionData?.summary?.totalRevenueLoss || 0,
          urls: linkDilutionData?.summary?.urlsWithDilution || 0,
          percentage:
            linkDilutionData?.summary?.dilutionPercentage?.toFixed(1) || "0.0",
          tooltip: linkDilutionData?.summary?.tooltip || null,
        },
        psychoMismatch: {
          value: cannibalizationData?.summary?.totalRevenueLoss || 0,
          urls: cannibalizationData?.summary?.urlsWithCannibalization || 0,
          percentage:
            cannibalizationData?.summary?.cannibalizationPercentage?.toFixed(
              1
            ) || "0.0",
          tooltip: cannibalizationData?.summary?.tooltip || null,
        },
        contentCreationCost: {
          value: psychoMismatchData?.summary?.totalRevenueLoss || 0,
          urls: psychoMismatchData?.summary?.totalMismatchedContent || 0,
          percentage: "N/A",
          tooltip: psychoMismatchData?.summary?.tooltip || null,
        },
      });
    } catch (error) {
      console.error("Error calculating financial metrics:", error); // Set default values on error
      setStats({
        totalLoss: { value: 0, urls: 0, percentage: "0.0", tooltip: null },
        revenueLeak: { value: 0, urls: 0, percentage: "0.0", tooltip: null },
        contentDecay: { value: 0, urls: 0, percentage: "0.0", tooltip: null },
        kwMismatch: { value: 0, urls: 0, percentage: "0.0", tooltip: null },
        linkDilution: { value: 0, urls: 0, percentage: "0.0", tooltip: null },
        psychoMismatch: { value: 0, urls: 0, percentage: "0.0", tooltip: null },
        contentCreationCost: {
          value: 0,
          urls: 0,
          percentage: "N/A",
          tooltip: null,
        },
      });
    }
  }, [
    onboardingData,
    getRevenueLeak,
    getContentDecay,
    getKeywordMismatch,
    getLinkDilution,
    getPsychMismatch,
    getCannibalizationLoss,
    calculateTotalLoss,
  ]);

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
              // Add a special class for the totalLoss card
              const isHighlighted = key === "totalLoss";
              return (
                <div
                  key={key}
                  className={`revenue-card ${
                    isHighlighted ? "highlighted-card" : ""
                  }`}
                >
                  <div className="card-header">
                    <h3>
                      {formatLeakTitle(key)}
                      {data.tooltip && (
                        <FinancialTooltip
                          title={data.tooltip.title}
                          content={data.tooltip.content}
                          position="top"
                        />
                      )}
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
      return "Wasted Content Investment";
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
    case "totalLoss":
      return <AlertTriangle size={18} />;
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
