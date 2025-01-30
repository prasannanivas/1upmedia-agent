import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, User, Settings } from "lucide-react";
import "./HomePage.css";
import { useOnboarding } from "../context/OnboardingContext";

const quickLinks = [
  { name: "Dashboard", path: "/dashboard", icon: <Globe size={24} /> },
  { name: "Profile", path: "/profile", icon: <User size={24} /> },
  { name: "Settings", path: "/settings", icon: <Settings size={24} /> },
];

// Rotating Features
const featureTexts = [
  "Content Creation",
  "Social Media Auto-Posting",
  "Site Analytics",
  "AI-Powered Research",
  "Smart SEO Insights",
];

const HomePage = () => {
  const [index, setIndex] = useState(0);
  const { getPercentageProfileCompletion } = useOnboarding();
  const navigate = useNavigate();

  const completionPercentage = getPercentageProfileCompletion(); // Fetch completion percentage

  // Change text every 1.5 seconds
  const intervalRef = useRef(null); // ✅ Use ref to store interval

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % featureTexts.length);
    }, 1500);

    return () => clearInterval(intervalRef.current); // ✅ Cleanup interval
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

        {/* Display Different Buttons Based on Completion Percentage */}
        {completionPercentage === 0 ? (
          <motion.button
            onClick={() => navigate("/onboarding")}
            whileHover={{ scale: 1.1 }}
            className="homepage-cta-button"
          >
            Get Started
          </motion.button>
        ) : (
          <div className="homepage-progress-container">
            <p className="homepage-progress-text">
              <strong>{completionPercentage}%</strong> completed
            </p>
            <motion.button
              onClick={() => navigate("/onboarding")}
              whileHover={{ scale: 1.1 }}
              className="homepage-complete-onboarding-button"
            >
              Complete Onboarding to Generate Content
            </motion.button>
          </div>
        )}
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
    </div>
  );
};

export default HomePage;
