import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useSocialMedia } from "../../../context/SocialMediaContext";
import {
  FaPlus,
  FaSearch,
  FaTimes,
  FaGoogle,
  FaChartLine,
  FaRocket,
  FaKeyboard,
  FaBullseye,
  FaChevronRight,
  FaInfoCircle,
  FaCrown,
  FaLightbulb,
  FaCheck,
} from "react-icons/fa";
import ConnectGoogleModal from "./ConnectGoogleModal";
import "./StepKeywords.css";
import Loader from "../../../components/Loader";
import { useAuth } from "../../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const StepKeywords = () => {
  const {
    onboardingData,
    setOnboardingData,
    loading,
    connectedSites,
    setConnectedSites,
  } = useOnboarding();
  const { googleProfiles } = useSocialMedia();
  const { authState } = useAuth();
  const { email } = authState;
  const [siteURL, setSiteURL] = useState(onboardingData.domain || "");
  const [location, setLocation] = useState(onboardingData.location || "");
  const [keyword, setKeyword] = useState("");
  const [keywordList, setKeywordList] = useState(onboardingData.keywords || []);
  const [relatedKeywords, setRelatedKeywords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState(
    onboardingData.initialAnalysisState || {}
  );
  const [GSCdata, setGSCdata] = useState(
    onboardingData.searchConsoleData || {}
  );
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingBusinessKeywords, setLoadingBusinessKeywords] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showGSCSuccess, setShowGSCSuccess] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Calculate progress
  useEffect(() => {
    // Calculate progress percentage based on completed tasks
    const hasURL = !!siteURL;
    const hasKeywords = keywordList.length > 0;
    const hasGSC = Object.keys(GSCdata).length > 0 || connectedSites.length > 0;

    let progressValue = 0;
    if (hasURL) progressValue += 20;
    if (hasKeywords) progressValue += Math.min(60, keywordList.length * 10);
    if (hasGSC) progressValue += 20;

    setProgress(Math.min(100, progressValue));
  }, [siteURL, keywordList, GSCdata, connectedSites]);

  const handleAddKeyword = () => {
    const trimmed = keyword.trim();
    if (trimmed && !keywordList.includes(trimmed)) {
      setKeywordList((prev) => [...prev, trimmed]);
      setKeyword("");
      setRelatedKeywords((prev) => prev.filter((k) => k !== trimmed));
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }
  };

  const handleAddRelatedKeyword = (relatedKeyword) => {
    if (!keywordList.includes(relatedKeyword)) {
      setKeywordList((prev) => [...prev, relatedKeyword]);
      setRelatedKeywords((prev) => prev.filter((k) => k !== relatedKeyword));
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }
  };

  const handleRemoveKeyword = (index) => {
    setKeywordList((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchRelatedKeywords = async () => {
    setLoadingRelated(true);
    try {
      // Focus on input with pulse effect
      if (inputRef.current) {
        inputRef.current.classList.add("pulse-effect");
        setTimeout(
          () => inputRef.current?.classList.remove("pulse-effect"),
          1000
        );
      }

      const response = await fetch(
        `https://ai.1upmedia.com:443/get-keywords-and-target-audience`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: keyword,
            goal: "SEO",
            business_details: "Finding related Keywords for google search",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch related keywords");
      const data = await response.json();
      setRelatedKeywords(data.result.keywords.split(", ") || []);
    } catch (error) {
      console.error("Error fetching related keywords:", error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const fetchBusinessKeywords = async () => {
    if (!siteURL) {
      alert("Please enter a site URL first");
      return;
    }

    setLoadingBusinessKeywords(true);
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/get-business-keywords?url=${encodeURIComponent(
          siteURL
        )}`
      );
      if (!response.ok) throw new Error("Failed to fetch business keywords");
      const data = await response.json();

      // Add suggested keywords to related keywords list
      if (data.keywords && Array.isArray(data.keywords)) {
        setRelatedKeywords((prev) => [...new Set([...prev, ...data.keywords])]);
      }
    } catch (error) {
      console.error("Error fetching business keywords:", error);
      alert("Error fetching business keywords. Please try again.");
    } finally {
      setLoadingBusinessKeywords(false);
    }
  };

  useEffect(() => {
    setSiteURL(onboardingData.domain || "");
    setLocation(onboardingData.location || "");
    setAnalysisData(onboardingData.initialAnalysisState || {});
    setKeywordList(onboardingData.keywords || []);
    setGSCdata(onboardingData.searchConsoleData || {});
  }, [onboardingData]);

  useEffect(() => {
    setOnboardingData((prev) => ({
      ...prev,
      searchConsoleData: GSCdata,
    }));
  }, [GSCdata]);

  const handleGSCConnect = (e) => {
    // Stop event propagation to prevent any parent elements from capturing the click
    if (e) e.stopPropagation();

    // Add debugging to verify the function is being called
    console.log("GSC Connect clicked");

    // Force close and reopen with a delay to ensure proper state reset
    setIsModalOpen(false);
    setTimeout(() => {
      setIsModalOpen(true);
    }, 100);
  };

  const handleGSCConnected = () => {
    setShowGSCSuccess(true);
    setTimeout(() => setShowGSCSuccess(false), 3000);
  };

  const handleSave = async () => {
    try {
      const filteredSiteData = {
        ...(siteURL && { URL: siteURL }),
        ...(location && { location }),
        ...(keywordList && { keywordList }),
        ...(GSCdata && { search_analytics: GSCdata }),
        dynamic_fields: {
          ...analysisData,
          ...(onboardingData.suggestionsFromAi && {
            suggestions: {
              ...onboardingData.suggestionsFromAi,
            },
          }),
        },
      };

      if (Object.keys(filteredSiteData.dynamic_fields).length === 0) {
        delete filteredSiteData.dynamic_fields;
      }

      await fetch("https://ai.1upmedia.com:443/aiagent/updateBusinessdetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          siteData: filteredSiteData,
        }),
      });

      const url = `https://ai.1upmedia.com:443/aiagent/keyword-classify`;

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywords: GSCdata,
          domain: siteURL,
          email,
        }),
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving business details:", error);
      alert("Error saving business details. Please try again.");
    }
    navigate("/onboarding/step-suggestions");
  };

  const handleNext = async () => {
    setOnboardingData((prev) => ({
      ...prev,
      keywords: keywordList,
    }));
    await handleSave();
    navigate("/onboarding/step-business-details");
  };

  // Premium tooltips
  const tooltips = {
    gsc: "Connect Google Search Console to unlock powerful insights about your website's search performance.",
    keywords:
      "Add keywords that are most relevant to your business and content strategy.",
    related: "Discover related keywords to expand your content reach.",
    difficulty:
      "Shows how competitive a keyword is to rank for. Lower numbers are easier to rank for.",
  };

  return (
    <div className="step-keywords premium-layout">
      <div className="step-keywords__container">
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-filled"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{progress}% Complete</div>
        </div>

        <motion.h2
          className="step-keywords__title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Define Your Keywords
        </motion.h2>

        {loading ? (
          <Loader />
        ) : (
          <>
            {/* GSC Hero Section - Conditional rendering based on connection status */}
            <motion.div
              className={`gsc-hero-section premium-gsc ${
                connectedSites.length > 0 ? "connected" : ""
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              {connectedSites.length > 0 ? (
                // Connected state - simplified view with tick mark
                <div className="gsc-connected-state">
                  <div className="gsc-connected-header">
                    <motion.div
                      className="gsc-connected-icon"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                    >
                      <FaCheck />
                    </motion.div>
                    <div className="gsc-connected-text">
                      <h3>Google Search Console Connected</h3>
                      <p>{connectedSites[0].siteUrl}</p>
                    </div>
                  </div>

                  <motion.button
                    className="gsc-manage-button"
                    onClick={handleGSCConnect}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    Manage Connection
                  </motion.button>
                </div>
              ) : (
                // Not connected state - full promotional view
                <>
                  <div className="gsc-overlay-decoration"></div>
                  <div className="gsc-hero-content">
                    <motion.div
                      className="gsc-hero-icon"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                    >
                      <FaGoogle />
                    </motion.div>
                    <h3>Connect Google Search Console</h3>
                    <p>
                      Unlock powerful insights and optimize your keyword
                      strategy
                    </p>

                    <motion.button
                      className="gsc-connect-button"
                      onClick={handleGSCConnect}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.05 }}
                      onMouseEnter={() => setShowTooltip("gsc")}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      Connect Google Search Console
                    </motion.button>

                    {showTooltip === "gsc" && (
                      <div className="premium-tooltip">{tooltips.gsc}</div>
                    )}
                  </div>

                  {/* Benefits cards with animated hover */}
                  <div className="gsc-benefits">
                    <motion.div
                      className="benefit-card"
                      whileHover={{
                        y: -10,
                        boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="benefit-icon">
                        <FaChartLine />
                      </div>
                      <h4>Keyword Analysis</h4>
                      <p>
                        We analyze your keywords and find the difficulty level
                        for each to help you rank better
                      </p>
                    </motion.div>

                    <motion.div
                      className="benefit-card"
                      whileHover={{
                        y: -10,
                        boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="benefit-icon">
                        <FaRocket />
                      </div>
                      <h4>Content Improvement</h4>
                      <p>
                        Analyze the decay value for your content and get
                        actionable insights to improve them
                      </p>
                    </motion.div>

                    <motion.div
                      className="benefit-card"
                      whileHover={{
                        y: -10,
                        boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="benefit-icon">
                        <FaKeyboard />
                      </div>
                      <h4>Opportunity Discovery</h4>
                      <p>
                        Find similar keywords where you can rank better with
                        less effort
                      </p>
                    </motion.div>
                  </div>
                </>
              )}

              <AnimatePresence>
                {showGSCSuccess && (
                  <motion.div
                    className="success-notification"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <FaCheck /> Successfully connected!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Keyword Management Section - Premium UX */}
            <motion.div
              className="keyword-management-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="section-header">
                <h3>
                  <FaLightbulb className="section-icon" />
                  Manage Your Keywords
                </h3>
                <div className="keyword-counter">
                  <span className="counter-value">{keywordList.length}</span>
                  <span className="counter-label">Keywords</span>
                </div>
              </div>

              <div className="step-keywords__input-section">
                <div className="step-keywords__input-group">
                  <div className="input-container">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Enter a keyword"
                      className="step-keywords__input"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                    />
                    <FaSearch className="input-icon" />
                  </div>

                  <motion.button
                    className="add-keyword-btn"
                    onClick={handleAddKeyword}
                    disabled={!keyword}
                    whileTap={{ scale: 0.95 }}
                    whileHover={!keyword ? {} : { scale: 1.05 }}
                  >
                    <FaPlus /> Add
                  </motion.button>
                </div>

                <div className="keyword-actions">
                  {keyword && (
                    <motion.button
                      onClick={fetchRelatedKeywords}
                      className="step-keywords__related-btn"
                      disabled={loadingRelated}
                      whileTap={{ scale: 0.95 }}
                      whileHover={loadingRelated ? {} : { scale: 1.05 }}
                      onMouseEnter={() => setShowTooltip("related")}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      {loadingRelated ? (
                        <>
                          <span className="loading-spinner"></span> Finding
                          Keywords...
                        </>
                      ) : (
                        <>
                          <FaSearch /> Find Related Keywords
                        </>
                      )}
                    </motion.button>
                  )}

                  {siteURL && (
                    <motion.button
                      onClick={fetchBusinessKeywords}
                      className="step-keywords__business-btn"
                      disabled={loadingBusinessKeywords}
                      whileTap={{ scale: 0.95 }}
                      whileHover={
                        loadingBusinessKeywords ? {} : { scale: 1.05 }
                      }
                    >
                      {loadingBusinessKeywords ? (
                        <>
                          <span className="loading-spinner"></span> Analyzing
                          Site...
                        </>
                      ) : (
                        <>
                          <FaBullseye /> Fetch Business Keywords
                        </>
                      )}
                    </motion.button>
                  )}

                  {showTooltip === "related" && (
                    <div className="premium-tooltip tooltip-right">
                      {tooltips.related}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Keywords Section with animations */}
              <div className="step-keywords__content">
                <AnimatePresence>
                  {relatedKeywords.length > 0 && (
                    <motion.div
                      className="step-keywords__related-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h3 className="step-keywords__subtitle">
                        Related Keywords
                        <span className="keyword-badge secondary">
                          {relatedKeywords.length}
                        </span>
                      </h3>
                      <div className="step-keywords__related-tags">
                        {relatedKeywords.map((related, index) => (
                          <motion.div
                            key={index}
                            className="step-keywords__related-tag"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <span>{related}</span>
                            <motion.div
                              className="step-keywords__tag-add"
                              onClick={() => handleAddRelatedKeyword(related)}
                              whileHover={{ scale: 1.2, rotate: 90 }}
                            >
                              <FaPlus />
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {keywordList.length > 0 && (
                    <motion.div
                      className="step-keywords__section"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="step-keywords__subtitle">
                        Selected Keywords
                        <span className="keyword-badge">
                          {keywordList.length}
                        </span>
                      </h3>
                      <div className="step-keywords__tags">
                        {keywordList.map((kw, index) => (
                          <motion.div
                            key={index}
                            className={`step-keywords__tag ${
                              animate && index === keywordList.length - 1
                                ? "pulse"
                                : ""
                            }`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                            whileHover={{ y: -5 }}
                          >
                            <div className="tag-content">
                              <span>{kw}</span>
                            </div>
                            <motion.div
                              className="step-keywords__tag-remove"
                              onClick={() => handleRemoveKeyword(index)}
                              whileHover={{ scale: 1.2 }}
                            >
                              <FaTimes />
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Related Keywords Section */}
            </motion.div>

            <div className="step-keywords__actions">
              <motion.button
                onClick={handleNext}
                disabled={keywordList.length === 0}
                className="step-keywords__next-btn"
                whileHover={keywordList.length === 0 ? {} : { scale: 1.05 }}
                whileTap={keywordList.length === 0 ? {} : { scale: 0.95 }}
              >
                Next <FaChevronRight />
              </motion.button>
            </div>
          </>
        )}
      </div>
      <ConnectGoogleModal
        connectedSites={connectedSites}
        setConnectedSites={setConnectedSites}
        isOpen={isModalOpen}
        forDomain={siteURL}
        onClose={() => setIsModalOpen(false)}
        onKeywordsSelected={setKeywordList}
        onGSCreceived={(data) => {
          setGSCdata(data);
          handleGSCConnected();
        }}
      />
    </div>
  );
};

export default StepKeywords;
