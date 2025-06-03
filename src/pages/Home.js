import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  User,
  Settings,
  CheckCircle,
  AlertCircle,
  Target,
  Database,
  Link2,
  BarChart3,
  Zap,
} from "lucide-react";
import "./HomePage.css";
import { useOnboarding } from "../context/OnboardingContext";
import { useContentPnL } from "../hooks/useContentPnL";
import LeakDashboard from "../pages/Dashboard/Dashboard";

const quickLinks = [
  { name: "All Posts", path: "/dashboard", icon: <Globe size={24} /> },
  {
    name: "Create Content",
    path: "/agents/content-creation",
    icon: <User size={24} />,
  },
  {
    name: "Settings",
    path: "/settings/user-management",
    icon: <Settings size={24} />,
  },
];

// Rotating Features
const featureTexts = [
  "Content Creation",
  "Social Media Auto-Posting",
  "Site Analytics",
  "AI-Powered Research",
  "Smart SEO Insights",
];

// Section Configuration
const sectionConfig = {
  basicInfo: {
    name: "Basic Information",
    path: "/onboarding/step-main-domain",
    fields: ["Domain URL", "Location", "businessDetails"],
  },
  domainAnalysis: {
    name: "Domain Analysis",
    path: "/onboarding/step-main-domain",
    fields: [
      "Domain Authority",
      "Page Authority",
      "Trust Flow",
      "Citation Flow",
    ],
  },
  analytics: {
    name: "Keywords",
    path: "/onboarding/step-keywords",
    fields: ["Search Console Data", "Keywords"],
  },

  contentStrategy: {
    name: "Content Strategy",
    path: "/onboarding/step-suggestions",
    fields: ["Content Strategies", "Content Types", "Topic Clusters"],
  },
  team: {
    name: "Team Setup",
    path: "/onboarding/step-create-authors",
    fields: ["Authors"],
  },
};

const HomePage = () => {
  const [index, setIndex] = useState(0);
  const { getPercentageProfileCompletion } = useOnboarding();
  const navigate = useNavigate();
  const pnlMetrics = useContentPnL();

  const completionPercentage = getPercentageProfileCompletion();

  // Change text every 1.5 seconds
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % featureTexts.length);
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Enhanced setup tasks with icons and better descriptions
  const setupTasks = [
    {
      id: 1,
      title: "Complete Business Profile",
      description: "Set up your business domain, location, and core details",
      icon: <Database size={20} />,
      completed: completionPercentage.total >= 100,
      path: "/onboarding/step-main-domain",
      category: "foundation",
    },
    {
      id: 2,
      title: "Set Funnel Ratio (60/20/20)",
      description: "Define your content strategy distribution",
      icon: <Target size={20} />,
      completed: false,
      path: "/onboarding/step-suggestions",
      category: "strategy",
    },
    {
      id: 3,
      title: "Connect Google Analytics & Search Console",
      description: "Link your analytics for data-driven insights",
      icon: <BarChart3 size={20} />,
      completed: false,
      path: "/onboarding/step-keywords",
      category: "data",
    },
    {
      id: 4,
      title: "Add Your Domain or Import URLs",
      description: "Import existing content for analysis",
      icon: <Link2 size={20} />,
      completed:
        completionPercentage.details.find((d) => d.name === "basicInfo")
          ?.percentage >= 100,
      path: "/onboarding/step-main-domain",
      category: "foundation",
    },
    {
      id: 5,
      title: "Connect Your CRM",
      description: "Enable full attribution tracking",
      icon: <User size={20} />,
      completed: false,
      path: "/integrations",
      category: "integration",
    },
    {
      id: 6,
      title: "Install Attribution Pixel",
      description: "Track visitor journey from content to conversion",
      icon: <Zap size={20} />,
      completed: false,
      path: "/analytics",
      category: "tracking",
    },
  ];

  const completedTasksCount = setupTasks.filter(
    (task) => task.completed
  ).length;
  // Interactive task click handler with haptic feedback
  const handleTaskClick = (task) => {
    // Vibration feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    navigate(task.path);
  };

  return (
    <div className="homepage-container">
      {/* Content Ledger OS System Activation */}
      <motion.section
        className="content-ledger-os"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="ledger-header"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="activation-badge">
            <span className="pulse-dot"></span>
            SYSTEM STATUS
          </div>
          <h1 className="ledger-title">
            CONTENT LEDGER OS
            <span className="activation-status">NOT ACTIVATED</span>
          </h1>
          <div className="ledger-divider gradient-divider"></div>
        </motion.div>

        <div className="ledger-content-grid">
          <motion.div
            className="ledger-status-card"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="card-header">
              <AlertCircle size={22} />
              <h3> Right now, we don't know:</h3>
            </div>
            <div className="ledger-unknown-items">
              {[
                "What you've published",
                "What your funnel looks like",
                "What your content costs",
                "Where your revenue comes from",
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="ledger-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <CheckCircle size={18} className="item-icon" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="ledger-preview-card"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="card-header">
              <BarChart3 size={22} />
              <h3>Unlock Analytics</h3>
            </div>
            <div className="ledger-preview-items">
              {[
                {
                  icon: <Link2 size={16} />,
                  text: "Content Investment vs Verified Revenue",
                },
                {
                  icon: <Target size={16} />,
                  text: "Decay Map (Content Losing Visibility)",
                },
                {
                  icon: <Database size={16} />,
                  text: "Funnel Imbalance (TOFU / MOFU / BOFU Gaps)",
                },
                {
                  icon: <Globe size={16} />,
                  text: "Keyword Efficiency Gap (DA vs KD Mismatch)",
                },
                {
                  icon: <User size={16} />,
                  text: "Psychographic Fit Score (Persona Relevance)",
                },
                {
                  icon: <Zap size={16} />,
                  text: "Full Attribution Chain (View → Form → CRM → Closed Deal)",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="ledger-preview-item"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="ledger-divider gradient-divider"></div>

        <motion.div
          className="activation-cta-container"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="activation-message">
            <Zap size={24} className="activation-icon" />
            <h3>Ready to unlock the full potential of your content?</h3>
          </div>
          <motion.button
            className="activate-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/onboarding")}
          >
            Activate Ledger Now
          </motion.button>
        </motion.div>

        <div className="ledger-divider gradient-divider"></div>

        <motion.div
          className="ledger-quote"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          <div className="quote-icon">💡</div>
          <p>
            "The system is blind by default. But when turned on, it doesn't
            blink."
          </p>
        </motion.div>
      </motion.section>
      <LeakDashboard />
      {/* Content P&L Snapshot Section */}
      <motion.section
        className="content-pnl-snapshot"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        {" "}
        <div className="pnl-header">
          <h2 className="pnl-title">🚨 CONTENT P&L SNAPSHOT</h2>
          {pnlMetrics.isLoading ? (
            <div className="pnl-loading">⏳ Loading financial data...</div>
          ) : (
            <div className="pnl-data-indicator">
              {pnlMetrics.hasRealData ? (
                <span className="pnl-real-data">📊 Live Data</span>
              ) : (
                <span className="pnl-demo-data">🔮 Projected Data</span>
              )}
            </div>
          )}
        </div>{" "}
        <div className="pnl-metrics-grid">
          {pnlMetrics.isLoading ? (
            // Loading skeleton
            <>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Total Content Investment:</span>
                <span className="pnl-value investment pnl-loading">⏳</span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Estimated Revenue Impact:</span>
                <span className="pnl-value revenue pnl-loading">⏳</span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ ROI:</span>
                <span className="pnl-value roi pnl-loading">⏳</span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Verified Attribution:</span>
                <span className="pnl-value status inactive pnl-loading">
                  ⏳
                </span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Active Attribution Pixel:</span>
                <span className="pnl-value status inactive pnl-loading">
                  ⏳
                </span>
              </div>
            </>
          ) : (
            // Actual data
            <>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Total Content Investment:</span>
                <span className="pnl-value investment">
                  ${pnlMetrics.totalContentInvestment.toLocaleString()}
                </span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Estimated Revenue Impact:</span>
                <span className="pnl-value revenue">
                  ${pnlMetrics.estimatedRevenueImpact.toLocaleString()}
                </span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ ROI:</span>
                <span
                  className={`pnl-value roi ${
                    pnlMetrics.roi >= 0 ? "positive" : "negative"
                  }`}
                >
                  {pnlMetrics.roi >= 0 ? "+" : ""}
                  {pnlMetrics.roi}%
                </span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Verified Attribution:</span>
                <span className="pnl-value status inactive">
                  {pnlMetrics.verifiedAttribution}
                </span>
              </div>
              <div className="pnl-metric">
                <span className="pnl-label">▸ Active Attribution Pixel:</span>
                <span className="pnl-value status inactive">
                  {pnlMetrics.attributionPixel}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="pnl-divider">
          ────────────────────────────────────────────────────────────────────────────
        </div>
        <div className="revenue-leak-section">
          <h3 className="leak-title">💸 REVENUE LEAK MAP (SUMMARY)</h3>{" "}
          <div className="leak-items">
            <motion.div
              className="leak-item"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/analytics/content-waste")}
            >
              <span className="leak-indicator">[!]</span>
              <span className="leak-type">Content Cost Waste</span>
              <span className="leak-separator">▸</span>
              <span className="leak-amount">
                ${pnlMetrics.revenueLeak.contentCostWaste.toLocaleString()}
              </span>
              <span className="leak-action">[View Affected Assets]</span>
            </motion.div>
            <motion.div
              className="leak-item"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/analytics/decay-analysis")}
            >
              <span className="leak-indicator">[!]</span>
              <span className="leak-type">Content Decay Loss</span>
              <span className="leak-separator">▸</span>
              <span className="leak-amount">
                ${pnlMetrics.revenueLeak.contentDecayLoss.toLocaleString()}
              </span>
              <span className="leak-action">[View Decay Curve]</span>
            </motion.div>
            <motion.div
              className="leak-item"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/analytics/keyword-efficiency")}
            >
              <span className="leak-indicator">[!]</span>
              <span className="leak-type">Keyword Efficiency Gap</span>
              <span className="leak-separator">▸</span>
              <span className="leak-amount">
                ${pnlMetrics.revenueLeak.keywordEfficiencyGap.toLocaleString()}
              </span>
              <span className="leak-action">[Audit Keywords]</span>
            </motion.div>
            <motion.div
              className="leak-item"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/onboarding/step-suggestions")}
            >
              <span className="leak-indicator">[!]</span>
              <span className="leak-type">Funnel Gap</span>
              <span className="leak-separator">▸</span>
              <span className="leak-amount">
                {pnlMetrics.revenueLeak.funnelGaps} Keywords
              </span>
              <span className="leak-action">[Fill Funnel]</span>
            </motion.div>
            <motion.div
              className="leak-item"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/analytics/persona-match")}
            >
              <span className="leak-indicator">[!]</span>
              <span className="leak-type">Psychographic Mismatch</span>
              <span className="leak-separator">▸</span>
              <span className="leak-amount">
                {pnlMetrics.revenueLeak.psychographicMismatch}% Misfit
              </span>
              <span className="leak-action">[Match Personas]</span>
            </motion.div>
            <motion.div
              className="leak-item"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/analytics/link-structure")}
            >
              <span className="leak-indicator">[!]</span>
              <span className="leak-type">Link Dilution</span>
              <span className="leak-separator">▸</span>
              <span className="leak-amount">
                ${pnlMetrics.revenueLeak.linkDilution.toLocaleString()}
              </span>
              <span className="leak-action">[Fix Structure]</span>
            </motion.div>
          </div>
        </div>
        <div className="pnl-divider">
          ────────────────────────────────────────────────────────────────────────────
        </div>
        <div className="quick-actions-section">
          <h3 className="section-title">Quick Actions</h3>

          <div className="quick-actions-container">
            <button className="quick-action-button primary">
              <span className="quick-action-icon">
                <Zap size={18} />
              </span>
              <span className="quick-action-label">Create Content</span>
            </button>

            <button className="quick-action-button success">
              <span className="quick-action-icon">
                <Globe size={18} />
              </span>
              <span className="quick-action-label">Publish Post</span>
            </button>

            <button className="quick-action-button info">
              <span className="quick-action-icon">
                <BarChart3 size={18} />
              </span>
              <span className="quick-action-label">View Analytics</span>
            </button>

            <button className="quick-action-button warning">
              <span className="quick-action-icon">
                <Settings size={18} />
              </span>
              <span className="quick-action-label">Configure Settings</span>
            </button>
          </div>
        </div>
        <div className="pnl-divider">
          ────────────────────────────────────────────────────────────────────────────
        </div>
        <div className="pnl-tip">
          <p>
            💡 <strong>TIP:</strong>
            <br />
            This system is estimating your losses. Connect your real data to
            reveal which content is underperforming, what's actually profitable,
            and how to stop wasting budget without firing your entire marketing
            team.
          </p>
        </div>
        <div className="pnl-divider">
          ────────────────────────────────────────────────────────────────────────────
        </div>
      </motion.section>
      {/* Hero Section */}
      <motion.section
        className="homepage-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Rotating Features */}
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="homepage-rotating-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.6 }}
          >
            {featureTexts[index]}
          </motion.p>
        </AnimatePresence>

        {/* <h1 className="homepage-hero-title">Welcome to 1UP AI</h1>
        <p className="homepage-hero-subtitle">
          Your AI-powered assistant to streamline content, research, and
          strategy in one place.
        </p> */}

        {/* Quick Links */}
        <motion.section
          className="homepage-quick-links"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="homepage-quick-link"
            >
              {link.icon}
              <h3>{link.name}</h3>
            </Link>
          ))}
        </motion.section>

        {/* Progress Section */}
        <div className="homepage-progress-container">
          <div className="progress-header">
            <p className="homepage-progress-text">
              <strong>{completionPercentage.total}%</strong> Profile Completed
              {completionPercentage.total === 100 && (
                <>
                  {" "}
                  |{" "}
                  <Link
                    className="homepage-create-content-link"
                    to="/agents/content-creation"
                  >
                    Create Content
                  </Link>
                </>
              )}
            </p>
            {completionPercentage.total < 100 && (
              <motion.button
                onClick={() => navigate("/onboarding")}
                whileHover={{ scale: 1.05 }}
                className="homepage-complete-onboarding-button"
              >
                Complete Setup
              </motion.button>
            )}
          </div>

          <div className="onboarding-steps-grid">
            {completionPercentage.details.map((section) => {
              const sectionName = section.name;
              const config = sectionConfig[sectionName] || {
                name: "Unknown Section",
                path: "/onboarding",
              };
              const completedFields = section.completedFields || 0;
              const totalFields = section.totalFields || 0;

              return (
                <motion.div
                  key={sectionName}
                  className="onboarding-step-card"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(config.path)}
                >
                  <div className="step-header">
                    <h3>{config.name || "Unknown Section"}</h3>
                    {section.percentage === 100 ? (
                      <CheckCircle
                        className="check-icon"
                        size={20}
                        color="#28a745"
                      />
                    ) : (
                      <AlertCircle
                        className="alert-icon"
                        size={20}
                        color="#ffc107"
                      />
                    )}
                  </div>
                  <div className="step-progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${section.percentage}%` }}
                    />
                  </div>
                  <div className="step-content">
                    <p className="step-details">
                      {completedFields}/{totalFields} fields completed
                    </p>
                    <div className="step-fields">
                      {config.fields.map((field, idx) => {
                        const isCompleted = idx < completedFields;
                        const stepPath = config.path;
                        return (
                          <div
                            key={idx}
                            className={`field-item ${
                              isCompleted ? "completed" : ""
                            }`}
                          >
                            <span>{field}</span>
                            {isCompleted ? (
                              <CheckCircle size={14} color="#28a745" />
                            ) : (
                              <Link to={stepPath}>
                                <AlertCircle size={14} color="#ffc107" />
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>
      {/* About Video Section */}
      <motion.section
        className="homepage-video-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h2>Learn More About 1UP AI</h2>
        <div className="video-wrapper">
          <iframe
            src="https://www.youtube.com/embed/SvbIsQ00laM"
            title="About 1UP AI"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </motion.section>
      {/* Software Overview */}
      <motion.section
        className="homepage-overview"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h2>Revolutionizing Productivity</h2>
        <p>
          1UP AI enhances your workflow with seamless automation, smart
          recommendations, and powerful integrations.
        </p>
      </motion.section>
      {/* Security & Privacy Section */}
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
      <motion.section
        className="content-ledger-description"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="ledger-description-container">
          <h2 className="ledger-description-title">
            CONTENT LEDGER OS — THE CONTENT P&L MRI
          </h2>
          <p className="ledger-description-subtitle">
            "Expose hidden revenue leaks before they bankrupt your content
            budget."
          </p>
        </div>
      </motion.section>
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
