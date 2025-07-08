import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  } = useFinancialCalculations();

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
              <h3 className="metric-label">Content Decay</h3>
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
