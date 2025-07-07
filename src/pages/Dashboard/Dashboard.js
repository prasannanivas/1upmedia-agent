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
  Settings,
} from "lucide-react";
import "./Dashboard.css";
import "./SettingsButton.css";
import FinancialTooltip from "../../components/FinancialTooltip";
import BucketDataVisualization from "../../components/BucketDataVisualization";
import CalculationParametersModal from "./CalculationParametersModal";

// BucketDataVisualization component

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
    processGSCDataForCalculations,
    categoriseIntoBuckets,
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

  const [rollUpData, setRollUpData] = useState({});
  const [showRollupData, setShowRollupData] = useState(false);
  const [showSitemapOnlyData, setShowSitemapOnlyData] = useState(false);
  const [showGAUrlsOnly, setShowGAUrlsOnly] = useState(false);
  const [CFOMode, setCFOMode] = useState(false);
  const [bucketData, setBucketData] = useState({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parameter settings for financial calculations
  const [calculationParams, setCalculationParams] = useState({
    revenueLeak: {
      conversionRate: 0.02,
      recoveryRate: 0.8,
      discountRate: 0.1,
      horizonDays: 700,
    },
    contentDecay: {
      conversionRate: 0.02,
      recoveryRate: 0.7,
      discountRate: 0.1,
      horizonDays: 700,
      defaultAvgContentCost: 400,
    },
    keywordMismatch: {
      conversionRate: 0.02,
      discountRate: 0.1,
      recoveryRate: 0.8,
      horizonDays: 700,
      defaultAvgContentCost: 400,
      impressionsClickRate: 0.003,
      clicksMultiplier: 0.1,
      maxLostClicksCap: 15,
      minLostClicks: 2,
      strandedCapexPercentage: 0.05,
      maxRevenueLossCap: 0.6,
    },
    linkDilution: {
      conversionRate: 0.02,
      discountRate: 0.1,
      recoveryRate: 0.8,
      horizonDays: 700,
      capexLossRate: 0.05,
      clickLossMultiplier: 0.3,
      maxDilutionFactor: 0.4,
      maxClicksLost: 8,
    },
    psychMismatch: {
      conversionRate: 0.02,
      revenueLossRatio: 0.15,
      highMismatchThreshold: 30,
      mediumMismatchThreshold: 15,
      lowMismatchThreshold: 5,
    },
    cannibalizationLoss: {
      conversionRate: 0.02,
      discountRate: 0.1,
      recoveryRate: 0.8,
      horizonDays: 700,
      defaultAvgContentCost: 400,
      lostClicksPercentage: 0.15,
      maxLostClicksCap: 10,
      investmentCapPercentage: 0.5,
    },
    buckets: {
      highCTRThreshold: 0.05,
      mismatchRiskThreshold: 0.3,
      linkDilutionThreshold: 0.4,
      cannibalRiskThreshold: 0.5,
    },
  });

  // Calculate all dashboard metrics using FinancialCalculations functions
  useEffect(() => {
    if (!onboardingData?.GSCAnalysisData) return;

    try {
      // Use FinancialCalculations functions with parameters from calculationParams
      const revenueLeakData = getRevenueLeak(calculationParams.revenueLeak);
      const contentDecayData = getContentDecay(calculationParams.contentDecay);
      const keywordMismatchData = getKeywordMismatch(
        calculationParams.keywordMismatch
      );
      const linkDilutionData = getLinkDilution(calculationParams.linkDilution);
      const psychoMismatchData = getPsychMismatch(
        calculationParams.psychMismatch
      );
      const cannibalizationData = getCannibalizationLoss(
        calculationParams.cannibalizationLoss
      );
      const totalLossData = calculateTotalLoss();

      setBucketData(categoriseIntoBuckets(calculationParams.buckets));

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
        "Bucket Data:",
        bucketData,
        "Total Loss Data:",
        totalLossData
      );

      setRollUpData(totalLossData.RollingUpTotal);

      // Update stats with calculated values from FinancialCalculations
      console.log("Total Loss Data Detailed:", {
        totalRevenueLoss: totalLossData?.summary?.totalRevenueLoss,
        parsedValue: parseFloat(totalLossData?.summary?.totalRevenueLoss || 0),
        urls: totalLossData?.summary?.urls,
        tooltip: totalLossData?.summary?.tooltip,
      });

      console.log("RollUp Data:", rollUpData);

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
          value: Math.abs(Math.min(revenueLeakData?.estimatedRevenueLoss)),
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
    calculationParams,
    categoriseIntoBuckets,
    // We're intentionally not including rollUpData and bucketData as dependencies
    // to prevent infinite render loops, as they're set within this effect
  ]);

  useEffect(() => {
    processGSCDataForCalculations(
      onboardingData?.GSCAnalysisData,
      showSitemapOnlyData
    );
  }, [
    onboardingData?.GSCAnalysisData,
    showSitemapOnlyData,
    processGSCDataForCalculations,
  ]);

  useEffect(() => {
    if (onboardingData?.GSCAnalysisData) {
      processGSCDataForCalculations(
        onboardingData.GSCAnalysisData,
        false,
        showGAUrlsOnly
      );
    }
  }, [
    onboardingData?.GSCAnalysisData,
    showGAUrlsOnly,
    processGSCDataForCalculations,
  ]);

  // Function to handle applying the new parameter settings
  const applySettings = (newParams) => {
    setCalculationParams(newParams);
    // The useEffect will automatically recompute with new parameters
    setIsModalOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* Calculation Parameters Modal */}
      {isModalOpen && (
        <CalculationParametersModal
          params={calculationParams}
          onClose={() => setIsModalOpen(false)}
          onApply={applySettings}
        />
      )}

      {/* <h1>Content Ledger Dashboard</h1> */}
      {/* <header className="dashboard-header">
        <p>
          Content strategy insights for {onboardingData.domain || "your domain"}
        </p>
      </header> */}

      <section className="dashboard-main">
        <div className="dashboard-revenue-leaks">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">💸</span>
              Revenue Leak Detection
            </h2>
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showRollupData}
                  onChange={(e) => setShowRollupData(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Show rollup data</span>
            </div>
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showSitemapOnlyData}
                  onChange={(e) => setShowSitemapOnlyData(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Show Sitemap only data</span>
            </div>

            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showGAUrlsOnly}
                  onChange={(e) => setShowGAUrlsOnly(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Show GA only data</span>
            </div>

            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={CFOMode}
                  onChange={(e) => setCFOMode(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Show CFO Mode</span>
            </div>

            <button
              className="settings-button"
              onClick={() => setIsModalOpen(true)}
              title="Adjust calculation parameters"
            >
              <Settings size={18} />
              <span>Calculation Settings</span>
            </button>
          </div>
          <div className="dashboard-cards">
            {showRollupData &&
              rollUpData &&
              Object.keys(rollUpData).length > 0 && (
                <div className="rollup-data-container">
                  <div className="rollup-data-header">
                    <h3>
                      Total Revenue Loss: $
                      {formatNumber(rollUpData.totalLoss || 0)}
                    </h3>
                    <p>Breakdown of revenue loss by category</p>
                  </div>
                  <div className="rollup-chart">
                    {Object.entries(rollUpData)
                      .filter(([key]) => key !== "totalLoss")
                      .map(([key, value]) => (
                        <div key={key} className="rollup-bar-container">
                          <div className="rollup-bar-label">
                            <span className="rollup-category">
                              {formatRollupCategory(key)}
                            </span>
                            <span className="rollup-value">
                              ${formatNumber(value)}
                            </span>
                          </div>
                          <div className="rollup-bar-wrapper">
                            <div
                              className={`rollup-bar rollup-bar-${key}`}
                              style={{
                                width: `${
                                  (value / rollUpData.totalLoss) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <div className="rollup-percentage">
                            {Math.round((value / rollUpData.totalLoss) * 100)}%
                          </div>
                        </div>
                      ))}
                  </div>{" "}
                  <div className="rollup-pie-chart">
                    <div className="rollup-pie-segments">
                      <svg width="220" height="220" viewBox="0 0 220 220">
                        {Object.entries(rollUpData)
                          .filter(([key]) => key !== "totalLoss")
                          .reduce((acc, [key, value], index, arr) => {
                            const percentage =
                              (value / rollUpData.totalLoss) * 100;
                            let previousPercentages = 0;

                            for (let i = 0; i < index; i++) {
                              const [, prevValue] = arr[i];
                              previousPercentages +=
                                (prevValue / rollUpData.totalLoss) * 100;
                            }

                            const startAngle = previousPercentages * 3.6;
                            const endAngle = startAngle + percentage * 3.6;

                            // Calculate start and end points
                            const startX =
                              110 +
                              100 *
                                Math.cos((startAngle - 90) * (Math.PI / 180));
                            const startY =
                              110 +
                              100 *
                                Math.sin((startAngle - 90) * (Math.PI / 180));
                            const endX =
                              110 +
                              100 * Math.cos((endAngle - 90) * (Math.PI / 180));
                            const endY =
                              110 +
                              100 * Math.sin((endAngle - 90) * (Math.PI / 180));

                            // Create path
                            const largeArcFlag = percentage > 50 ? 1 : 0;
                            const pathData = [
                              "M",
                              110,
                              110,
                              "L",
                              startX,
                              startY,
                              "A",
                              100,
                              100,
                              0,
                              largeArcFlag,
                              1,
                              endX,
                              endY,
                              "Z",
                            ].join(" ");

                            acc.push(
                              <path
                                key={key}
                                d={pathData}
                                fill={getColorForCategory(key)}
                                stroke="#fff"
                                strokeWidth="0.5"
                                title={`${formatRollupCategory(
                                  key
                                )}: $${formatNumber(value)} (${Math.round(
                                  percentage
                                )}%)`}
                              />
                            );

                            return acc;
                          }, [])}
                      </svg>
                    </div>
                    <div className="rollup-legend">
                      {Object.entries(rollUpData)
                        .filter(([key]) => key !== "totalLoss")
                        .map(([key, value]) => (
                          <div key={key} className="rollup-legend-item">
                            <div
                              className="rollup-legend-color"
                              style={{
                                backgroundColor: getColorForCategory(key),
                              }}
                            ></div>
                            <span className="rollup-legend-label">
                              {formatRollupCategory(key)}: $
                              {formatNumber(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

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
                      {formatLeakTitle(key, CFOMode ? "CFO" : "default")}
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

        <div className="dashboard-bucket-analysis">
          <h2 className="section-title">
            <span className="title-icon">📊</span>
            Content Bucket Analysis
          </h2>

          <BucketDataVisualization bucketData={bucketData} />
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
function formatLeakTitle(key, mode = "CFO") {
  if (mode === "CFO") {
    switch (key) {
      case "revenueLeak":
        return "Recoverable Revenue Opportunity";
      case "contentDecay":
        return "Recoverable Engagement Value";
      case "kwMismatch":
        return "Recoverable Intent value";
      case "linkDilution":
        return "Recoverable Authority value";
      case "psychoMismatch":
        return "Recoverable Cannibalization Value";
      case "contentCreationCost":
        return "Recoverable Relevance Value";
      default:
        return key;
    }
  }

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
      return "Cannibalization Loss";
    case "contentCreationCost":
      return "Psycho Mismatch";
    default:
      return key;
  }
}

function formatRollupCategory(key) {
  switch (key) {
    case "revenueLeak":
      return "Revenue Leak";
    case "contentDecay":
      return "Content Decay";
    case "keywordMismatch":
      return "Keyword Mismatch";
    case "cannibalization":
      return "Cannibalization";
    case "linkDilution":
      return "Link Dilution";
    case "psychoMismatch":
      return "Psycho Mismatch";
    default:
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
  }
}

function getColorForCategory(key) {
  const colorMap = {
    revenueLeak: "#FF6384",
    contentDecay: "#36A2EB",
    keywordMismatch: "#FFCE56",
    cannibalization: "#4BC0C0",
    linkDilution: "#9966FF",
    psychoMismatch: "#FF9F40",
  };

  return colorMap[key] || "#CCCCCC";
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
