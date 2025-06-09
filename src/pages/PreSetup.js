import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Link2,
  Target,
  Database,
  Globe,
  User,
  Zap,
  CheckCircle,
} from "lucide-react";
import "./HomePage.css";
import "./PreSetup.css";

const PreSetup = () => {
  const navigate = useNavigate();

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
            STEP 1 OF 4 - INITIAL SETUP
          </div>
          <h1 className="ledger-title">
            WELCOME TO CONTENT LEDGER OS
            <span className="activation-status">SETUP REQUIRED</span>
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
            <h3>Ready to connect your domain and unlock insights?</h3>
            <p>Just 4 simple steps to get your Content Ledger OS running</p>
          </div>
          <motion.button
            className="activate-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/onboarding")}
          >
            Start Setup Process
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

      {/* Enhanced Setup Instructions */}
      <motion.section
        className="setup-steps-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="setup-steps-container">
          <h2 className="setup-steps-title">Quick Setup - 4 Simple Steps</h2>
          <div className="setup-steps-grid">
            <motion.div
              className="setup-step"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Business Details</h3>
                <p>Tell us about your domain and business</p>
              </div>
            </motion.div>

            <motion.div
              className="setup-step"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Connect Google Analytics</h3>
                <p>Link Google Search Console & Google Analytics</p>
              </div>
            </motion.div>

            <motion.div
              className="setup-step"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>See Your RAG</h3>
                <p>Review your content analysis and insights</p>
              </div>
            </motion.div>

            <motion.div
              className="setup-step"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Finished Onboarding</h3>
                <p>Complete setup and access your dashboard</p>
              </div>
            </motion.div>
          </div>
        </div>
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
    </div>
  );
};

export default PreSetup;
