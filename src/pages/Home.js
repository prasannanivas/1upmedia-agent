import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  User,
  CheckCircle,
  Target,
  Database,
  Link2,
  BarChart3,
  Zap,
} from "lucide-react";
import "./HomePage.css";
import { useOnboarding } from "../context/OnboardingContext";
import LeakDashboard from "../pages/Dashboard/Dashboard";
import { useFinancialCalculations } from "../context/FinancialCalculations";

const HomePage = () => {
  const {
    getPercentageProfileCompletion,
    onboardingData,
    loading,
    setOnboardingData,
  } = useOnboarding();
  const navigate = useNavigate();
  const {
    getRevenueLeak,
    getContentDecay,
    getKeywordMismatch,
    getLinkDilution,
    getPsychMismatch,
    getCannibalizationLoss,
    calculateTotalLoss,
    decay30Days,
    decay60Days,
    decay90Days,
  } = useFinancialCalculations();

  const [decayTimeframe, setDecayTimeframe] = useState(30);

  // Function to extrapolate decay percentage for any day value
  // Maximum decay is 95% at 700 days
  const getExtrapolatedDecayPercentage = (days) => {
    if (!onboardingData.GSCAnalysisData || !onboardingData.domainCostDetails) {
      return 0;
    }

    try {
      const totalContentUrls =
        onboardingData?.GSCAnalysisData?.contentCostWaste?.length || 1;

      // Known data points
      const dataPoints = [
        { days: 30, count: decay30Days.length },
        { days: 60, count: decay60Days.length },
        { days: 90, count: decay90Days.length },
      ];

      // Convert counts to percentages for easier calculation
      const dataPercentages = dataPoints.map((point) => ({
        days: point.days,
        percentage:
          totalContentUrls > 0 ? (point.count / totalContentUrls) * 100 : 0,
      }));

      // If we have exact data point, use it
      const exactMatch = dataPercentages.find((point) => point.days === days);
      if (exactMatch) {
        return Math.round(exactMatch.percentage);
      }

      // Constants for the decay model
      const MAX_DECAY_PERCENTAGE = 95; // Maximum decay at 700 days
      const MAX_DECAY_DAYS = 700;

      // Use logarithmic decay model: percentage = MAX * (1 - exp(-k * days))
      // This ensures asymptotic approach to 95% at 700 days

      // Calculate decay constant k based on known data points
      // Use the 90-day data point to calibrate the model
      const p90 = dataPercentages[2].percentage; // 90-day percentage

      // Solve for k: p90 = 95 * (1 - exp(-k * 90))
      // k = -ln(1 - p90/95) / 90
      const k =
        p90 > 0
          ? -Math.log(1 - Math.min(p90 / MAX_DECAY_PERCENTAGE, 0.99)) / 90
          : 0.01;

      let estimatedPercentage;

      if (days <= 90) {
        // For days 0-90, use interpolation between known points for accuracy
        if (days < 30) {
          // Linear interpolation from 0 to 30-day point
          const ratio = days / 30;
          estimatedPercentage = ratio * dataPercentages[0].percentage;
        } else if (days <= 60) {
          // Linear interpolation between 30 and 60
          const ratio = (days - 30) / (60 - 30);
          estimatedPercentage =
            dataPercentages[0].percentage +
            ratio *
              (dataPercentages[1].percentage - dataPercentages[0].percentage);
        } else {
          // Linear interpolation between 60 and 90
          const ratio = (days - 60) / (90 - 60);
          estimatedPercentage =
            dataPercentages[1].percentage +
            ratio *
              (dataPercentages[2].percentage - dataPercentages[1].percentage);
        }
      } else {
        // For days > 90, use logarithmic decay model
        estimatedPercentage = MAX_DECAY_PERCENTAGE * (1 - Math.exp(-k * days));

        // Ensure we don't exceed the maximum
        estimatedPercentage = Math.min(
          estimatedPercentage,
          MAX_DECAY_PERCENTAGE
        );
      }

      // Ensure minimum bound
      estimatedPercentage = Math.max(0, estimatedPercentage);

      return Math.round(estimatedPercentage);
    } catch (error) {
      console.error("Error extrapolating decay:", error);
      return 0;
    }
  };

  const completionPercentage = getPercentageProfileCompletion();

  return (
    <div className="homepage-container">
      {/* Key Metrics Section */}
      <motion.section
        className="key-metrics-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.div
          className="metrics-header"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="metrics-title">KEY METRICS OVERVIEW</h2>
          <div className="metrics-divider gradient-divider"></div>
        </motion.div>{" "}
        <div className="metrics-grid">
          <motion.div
            className="metric-card total-invested"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3 className="metric-label">Total Invested</h3>
              {loading ? (
                <div className="metric-value loading">⏳ Loading...</div>
              ) : (
                <div className="metric-value">
                  $
                  <input
                    type="text"
                    value={
                      onboardingData.domainCostDetails?.totalInvested ===
                      undefined
                        ? ""
                        : Number(
                            onboardingData.domainCostDetails.totalInvested
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                    }
                    style={{
                      width: "240px",
                      fontSize: "1em",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      textAlign: "right",
                      background: "rgba(255,255,255,0.7)",
                    }}
                    onChange={(e) => {
                      // Remove commas and non-numeric except dot
                      const raw = e.target.value.replace(/,/g, "");
                      const num = parseFloat(raw);
                      setOnboardingData((prev) => ({
                        ...prev,
                        domainCostDetails: {
                          ...prev.domainCostDetails,
                          totalInvested: isNaN(num) ? "" : num,
                        },
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.target.blur();
                      }
                    }}
                  />
                </div>
              )}
              <div className="metric-subtitle">Content investment to date</div>
            </div>
          </motion.div>{" "}
          <motion.div
            className="metric-card current-value"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <h3 className="metric-label">Current Content Value</h3>
              {loading ? (
                <div className="metric-value loading">⏳ Loading...</div>
              ) : (
                <div className="metric-value">
                  {" "}
                  ${" "}
                  {(() => {
                    console.log(
                      "test dashboard",
                      onboardingData.GSCAnalysisData
                    );
                    const totalInvested =
                      onboardingData.domainCostDetails?.totalInvested || 0;

                    // Wait for onboarding data to be loaded before calculating
                    if (
                      !onboardingData.GSCAnalysisData ||
                      !onboardingData.domainCostDetails
                    ) {
                      // Format with 2 decimals, subscripting decimals (no dot in main, dot in subscript)
                      const value = (totalInvested || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      );
                      const [intPart, decPart] = value.split(".");
                      return (
                        <>
                          {intPart}
                          {decPart && <span>{decPart}</span>}
                        </>
                      );
                    }
                    try {
                      // Get comprehensive loss using FinancialCalculations context
                      const currentContentValue =
                        totalInvested -
                        calculateTotalLoss()?.summary.totalRevenueLoss;
                      // Format with 2 decimals, subscripting decimals (no dot in main, dot in subscript)
                      const value = currentContentValue.toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      );
                      const [intPart, decPart] = value.split(".");
                      return (
                        <>
                          {intPart}
                          {decPart && (
                            <>
                              <span style={{ fontSize: "1em" }}>.</span>
                              <span
                                style={{
                                  fontSize: "0.7em",
                                }}
                              >
                                {decPart}
                              </span>
                            </>
                          )}
                        </>
                      );
                    } catch (error) {
                      console.error(
                        "Error calculating comprehensive loss:",
                        error
                      );
                      const value = (totalInvested || 0).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      );
                      const [intPart, decPart] = value.split(".");
                      return (
                        <>
                          {intPart}
                          {decPart && (
                            <>
                              <span style={{ fontSize: "1em" }}>.</span>
                              <sub
                                style={{
                                  fontSize: "0.7em",
                                  verticalAlign: "sub",
                                }}
                              >
                                {decPart}
                              </sub>
                            </>
                          )}
                        </>
                      );
                    }
                  })()}
                </div>
              )}{" "}
              <div className="metric-subtitle">
                Total loss across 6 categories
              </div>
            </div>
          </motion.div>{" "}
          <motion.div
            className="metric-card content-decay"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="metric-icon">📉</div>
            <div className="metric-content">
              <h3 className="metric-label">Loss Percentage</h3>
              {loading ? (
                <div className="metric-value loading">⏳ Loading...</div>
              ) : (
                <div className="metric-value">
                  {" "}
                  {(() => {
                    // Calculate comprehensive loss percentage (average of ALL loss types)
                    const totalInvested =
                      onboardingData.domainCostDetails?.totalInvested || 0;

                    // Wait for onboarding data to be loaded before calculating
                    if (
                      !onboardingData.GSCAnalysisData ||
                      !onboardingData.domainCostDetails
                    ) {
                      return "0%";
                    }
                    try {
                      // Get comprehensive loss using FinancialCalculations context
                      const totalRevenueLoss =
                        calculateTotalLoss()?.summary.totalRevenueLoss;

                      // Calculate total revenue loss from all sources

                      // Calculate average loss percentage based on total invested (divide by 6 loss types)

                      const averageLossPercentage =
                        totalInvested > 0
                          ? Math.round((totalRevenueLoss / totalInvested) * 100)
                          : 0;

                      // Debug: Show comprehensive loss breakdown

                      return `${averageLossPercentage}%`;
                    } catch (error) {
                      console.error(
                        "Error calculating comprehensive loss:",
                        error
                      );
                      return "0%";
                    }
                  })()}
                </div>
              )}{" "}
              <div className="metric-subtitle">
                Average across all 6 loss types
              </div>
            </div>
          </motion.div>
          <motion.div
            className="metric-card decay-percentage"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <h3 className="metric-label">Decay Percentage</h3>
              {loading ? (
                <div className="metric-value loading">⏳ Loading...</div>
              ) : (
                <div className="metric-value">
                  {(() => {
                    // Wait for onboarding data to be loaded before calculating
                    if (
                      !onboardingData.GSCAnalysisData ||
                      !onboardingData.domainCostDetails
                    ) {
                      return "0%";
                    }
                    try {
                      // Use extrapolated decay percentage for any day value
                      const decayPercentage =
                        getExtrapolatedDecayPercentage(decayTimeframe);
                      return `${decayPercentage}%`;
                    } catch (error) {
                      console.error("Error calculating content decay:", error);
                      return "0%";
                    }
                  })()}
                </div>
              )}

              {/* Timeframe Slider */}
              <div
                className="decay-timeframe-slider"
                style={{ margin: "10px 0" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "0.8em", color: "#666" }}>7d</span>
                  <input
                    type="range"
                    min="7"
                    max="700"
                    step="1"
                    value={decayTimeframe}
                    onChange={(e) => {
                      setDecayTimeframe(parseInt(e.target.value));
                    }}
                    style={{
                      flex: 1,
                      height: "6px",
                      background:
                        "linear-gradient(to right, #4CAF50, #FFC107, #FF5722, #F44336, #8B0000)",
                      borderRadius: "3px",
                      outline: "none",
                      cursor: "pointer",
                      WebkitAppearance: "none",
                    }}
                  />
                  <span style={{ fontSize: "0.8em", color: "#666" }}>700d</span>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "0.75em",
                    color: "#888",
                    marginTop: "4px",
                  }}
                >
                  {decayTimeframe} day decay window
                  {(decayTimeframe === 30 ||
                    decayTimeframe === 60 ||
                    decayTimeframe === 90) && (
                    <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
                      {" "}
                      ✓ Real Data
                    </span>
                  )}
                  {decayTimeframe === 700 && (
                    <span style={{ color: "#8B0000", fontWeight: "bold" }}>
                      {" "}
                      ⚠ Max Decay (95%)
                    </span>
                  )}
                </div>
                {/* Quick preset buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  {[7, 14, 30, 60, 90, 180, 365, 700].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setDecayTimeframe(preset)}
                      style={{
                        padding: "2px 6px",
                        fontSize: "0.7em",
                        border:
                          decayTimeframe === preset
                            ? "1px solid #4CAF50"
                            : "1px solid #ddd",
                        borderRadius: "3px",
                        background:
                          decayTimeframe === preset ? "#4CAF50" : "white",
                        color: decayTimeframe === preset ? "white" : "#666",
                        cursor: "pointer",
                      }}
                    >
                      {preset}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="metric-subtitle">
                {(() => {
                  try {
                    if (
                      !onboardingData.GSCAnalysisData ||
                      !onboardingData.domainCostDetails
                    ) {
                      return `${decayTimeframe} day content decay analysis`;
                    }

                    // Calculate estimated affected URLs
                    const totalContentUrls =
                      onboardingData?.GSCAnalysisData?.contentCostWaste
                        ?.length || 1;
                    const decayPercentage =
                      getExtrapolatedDecayPercentage(decayTimeframe);
                    const estimatedUrls = Math.round(
                      (decayPercentage / 100) * totalContentUrls
                    );

                    return `~${estimatedUrls} URLs estimated affected in ${decayTimeframe} days`;
                  } catch (error) {
                    return `${decayTimeframe} day content decay analysis`;
                  }
                })()}
              </div>
            </div>
          </motion.div>
        </div>{" "}
        <motion.div
          className="metrics-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="metrics-status">
            {onboardingData.domainCostDetails?.totalInvested ? (
              <span className="real-data-indicator">📊 Onboarding Data</span>
            ) : (
              <span className="demo-data-indicator">🔮 Setup Required</span>
            )}
          </div>
          <button
            className="view-detailed-analytics"
            onClick={() => navigate("/dashboard")}
          >
            View Detailed Analytics →
          </button>
        </motion.div>
      </motion.section>
      <LeakDashboard />
      <motion.section
        className="homepage-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      ></motion.section>
      <motion.section
        className="security-privacy-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="security-privacy-container">
          <h2>Security & Privacy</h2>
          <div className="security-features">
            <div className="security-item">
              <CheckCircle size={18} className="security-icon" />
              <span>OAuth 2.0 read-only connections - no write access</span>
            </div>
            <div className="security-item">
              <CheckCircle size={18} className="security-icon" />
              <span>Revoke anytime from your dashboard</span>
            </div>
            <div className="security-item">
              <CheckCircle size={18} className="security-icon" />
              <span>Data encrypted at rest & in transit</span>
            </div>
          </div>
        </div>
      </motion.section>
      {/* Content MRI Activation CTA */}
      <motion.section
        className="content-mri-cta"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mri-cta-container">
          <h2 className="mri-cta-title">
            ► PLUG THE LEAKS — ACTIVATE YOUR CONTENT MRI NOW
          </h2>
          <motion.button
            className="mri-activate-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/onboarding")}
          >
            Activate Content MRI
          </motion.button>
        </div>
      </motion.section>{" "}
      {/* Content Ledger OS Description */}
      {/* Optional Full MRI Checklist */}
      <motion.section
        className="full-mri-checklist"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="checklist-container">
          <h2 className="checklist-title">
            OPTIONAL FULL MRI & FULL-SITE AUDIT CHECKLIST (Boost Accuracy)
          </h2>
          <div className="checklist-items">
            <div className="checklist-item">
              <span className="checkbox">[ ]</span>
              <span className="item-text">
                Connect Google Search Console – unlock real click data
              </span>
            </div>
            <div className="checklist-item">
              <span className="checkbox">[ ]</span>
              <span className="item-text">
                Connect GA-4 – map revenue to URLs
              </span>
            </div>
            <div className="checklist-item">
              <span className="checkbox">[ ]</span>
              <span className="item-text">
                Install Attribution Pixel – track view → form conversions
              </span>
            </div>
            <div className="checklist-item">
              <span className="checkbox">[ ]</span>
              <span className="item-text">
                Connect CRM (read-only) – trace to closed deals
              </span>
            </div>
            <div className="checklist-item">
              <span className="checkbox">[ ]</span>
              <span className="item-text">
                Upgrade to Full Audit (∞ URLs) – see complete leak report 💵
              </span>
            </div>
          </div>
          <div className="checklist-notes">
            <p className="note-item">
              ► Expect detected leaks to increase 2–3× after these steps.
            </p>
            <p className="note-item">
              ► Full-site audit starts at $XXX (pricing details).
            </p>
          </div>
        </div>
      </motion.section>
      {/* Baseline Data Disclaimer */}
      <motion.section
        className="baseline-data-disclaimer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="disclaimer-container">
          <p className="disclaimer-text">
            Baseline uses public data only — real leak is 2–3× larger once
            Search Console & GA-4 are connected for the full MRI.
          </p>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
