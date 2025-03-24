import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, User, Settings, CheckCircle, AlertCircle } from "lucide-react";
import "./HomePage.css";
import { useOnboarding } from "../context/OnboardingContext";

const quickLinks = [
  { name: "All Posts", path: "/dashboard", icon: <Globe size={24} /> },
  {
    name: "Create Content",
    path: "/agents/content-creation/by-seo-ideas",
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

  const completionPercentage = getPercentageProfileCompletion(); // Fetch completion percentage

  // Change text every 1.5 seconds
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % featureTexts.length);
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="homepage-container">
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

        <h1 className="homepage-hero-title">Welcome to 1UP AI</h1>
        <p className="homepage-hero-subtitle">
          Your AI-powered assistant to streamline content, research, and
          strategy in one place.
        </p>

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
                    to="/agents/content-creation/by-seo-ideas"
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

      {/* Quick Links */}
      <motion.section
        className="homepage-quick-links"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {quickLinks.map((link) => (
          <Link key={link.name} to={link.path} className="homepage-quick-link">
            {link.icon}
            <h3>{link.name}</h3>
          </Link>
        ))}
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
    </div>
  );
};

export default HomePage;
