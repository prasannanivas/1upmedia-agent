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
import SEOAnalysisDashboard from "../../../components/SEOAnalysisDashboard";

const StepKeywords = () => {
  const {
    onboardingData,
    setOnboardingData,
    loading,
    connectedSites,
    setConnectedSites,
  } = useOnboarding();
  const { socialMediaProfiles, storeSocialMediaToken } = useSocialMedia();
  const { authState } = useAuth();
  const { email } = authState;
  const [siteURL, setSiteURL] = useState(onboardingData.domain || "");
  const [location, setLocation] = useState(onboardingData.location || "");
  const [keyword, setKeyword] = useState("");
  const [keywordList, setKeywordList] = useState(onboardingData.keywords || []);
  const [relatedKeywords, setRelatedKeywords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState(
    onboardingData.GSCAnalysisData || {}
  );

  const [allSitemapUrls, setAllSitemapUrls] = useState([]);
  const [GSCdata, setGSCdata] = useState(
    onboardingData.searchConsoleData || {}
  );
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingBusinessKeywords, setLoadingBusinessKeywords] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showGSCSuccess, setShowGSCSuccess] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [domainCostDetails, setDomainCostDetails] = useState({
    averageOrderValue: "",
    AverageContentCost: "",
    totalInvested: "",
  });

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

  // const handleAddRelatedKeyword = (relatedKeyword) => {
  //   if (!keywordList.includes(relatedKeyword)) {
  //     setKeywordList((prev) => [...prev, relatedKeyword]);
  //     setRelatedKeywords((prev) => prev.filter((k) => k !== relatedKeyword));
  //     setAnimate(true);
  //     setTimeout(() => setAnimate(false), 1000);
  //   }
  // };

  // const handleRemoveKeyword = (index) => {
  //   setKeywordList((prev) => prev.filter((_, i) => i !== index));
  // };

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

    setAnalysisData(onboardingData.GSCAnalysisData || {});
    setKeywordList(onboardingData.keywords || []);
    setGSCdata(onboardingData.searchConsoleData || {});
    setAnalysisData(onboardingData.GSCAnalysisData || {});
    setDomainCostDetails({
      averageOrderValue:
        onboardingData.domainCostDetails?.averageOrderValue || 0,
      AverageContentCost:
        onboardingData.domainCostDetails?.AverageContentCost || 0,
      totalInvested: onboardingData.domainCostDetails?.totalInvested || 0,
    });

    setAllSitemapUrls(onboardingData.allSitemapUrls);

    if (!analysisData) {
      handleAnalyzeSite();
    }
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
          GSCAnalysisData: analysisData,
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

      const fd = new FormData();
      const td = new FormData();
      fd.append("email", email);
      td.append("email", email);
      fd.append("engineType", "signal"); // Signal engine is best for
      td.append("engineType", "intent");

      // Add keywords as JSON string
      if (keywordList.length > 0) {
        fd.append(
          "keywordData",
          JSON.stringify(keywordList) + JSON.stringify(GSCdata)
        );
      }

      if (analysisData && Object.keys(analysisData).length > 0) {
        td.append("templateData", JSON.stringify(analysisData));
      }

      // Include site URL
      if (siteURL) {
        fd.append("domain", siteURL);
        td.append("domain", siteURL);
      }

      // Send to RAG system
      fetch("https://ai.1upmedia.com:443/RAG/analyzeStyleChunks", {
        method: "POST",
        body: fd,
      }).catch((error) => {
        console.error("Error sending data to RAG system:", error);
      });

      // Send to RAG system
      fetch("https://ai.1upmedia.com:443/RAG/analyzeStyleChunks", {
        method: "POST",
        body: td,
      }).catch((error) => {
        console.error("Error sending data to RAG system:", error);
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

      await fetch("https://ai.1upmedia.com:443/aiagent/updateBusinessdetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          siteData: filteredSiteData,
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
    navigate("/onboarding/step-create-authors");
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
  const handleAnalyzeSite = async () => {
    // Mandatory: Check if GSC is connected
    if (connectedSites.length === 0) {
      alert(
        "Please connect Google Search Console first. This is mandatory for SEO analysis."
      );
      return;
    }

    const site = connectedSites[0];
    console.log("Connected site:", site);
    // Check if GSC access token is available
    if (!site.google_console?.accessToken) {
      alert(
        "No Google Search Console access token found. Please reconnect your Google Search Console."
      );
      return;
    }

    // Optional: Check if GA is connected and warn if not
    const hasGoogleAnalytics =
      site.google_analytics && site.google_analytics.propertyName;

    if (!hasGoogleAnalytics) {
      const proceed = window.confirm(
        "⚠️ Google Analytics Not Connected\n\n" +
          "You have not added a Google Analytics property ID. " +
          "Without Google Analytics, we won't be able to fetch your website traffic data, " +
          "which may limit the depth of your SEO analysis.\n\n" +
          "Do you want to proceed with Search Console data only?"
      );

      if (!proceed) {
        return;
      }
    }

    setAnalysisLoading(true);
    setAnalysisComplete(false);
    try {
      console.log("Starting site analysis...", site, site.google_console);
      let accessToken = site.google_console?.accessToken;
      let refreshToken = site.google_console?.refreshToken; // Prepare dates for analysis
      const today = new Date();
      const startDate = new Date(today);
      startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago

      const comparisonEnd = new Date(today);
      comparisonEnd.setMonth(comparisonEnd.getMonth() - 1); // 1 month ago

      const comparisonStart = new Date(comparisonEnd);
      comparisonStart.setMonth(comparisonStart.getMonth() - 12); // 12 months before comparison end

      // API call with retry logic for token refresh
      for (let attempt = 0; attempt < 2; attempt++) {
        setAnalysisData({});
        try {
          const response = await fetch(
            "https://ai.1upmedia.com:443/google/seo-analysis",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                // Use the exact format and values required
                siteUrl: site.siteUrl,
                gscToken: accessToken,
                startDate: startDate.toISOString().split("T")[0],
                endDate: today.toISOString().split("T")[0],
                comparisonStart: comparisonStart.toISOString().split("T")[0],
                comparisonEnd: comparisonEnd.toISOString().split("T")[0],
                averageOrderValue: domainCostDetails.averageOrderValue,
                averageContentCost: domainCostDetails.AverageContentCost || 50,
                totalInvested: domainCostDetails.totalInvested,
                allSitemapUrls: allSitemapUrls,
                domainAuthority:
                  onboardingData.initialAnalysisState?.domainAuthority || 26,
                conversionRate: 0.03,
                // Include Google Analytics property if available
                ...(hasGoogleAnalytics && {
                  gaPropertyId: site.google_analytics?.propertyId,
                  gaToken: accessToken,
                  gaPropertyName: site.google_analytics?.propertyName,
                  gaAccountName: site.google_analytics?.accountName,
                }),
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Store analysis data in context
            console.log("setting new analysis data..");
            setAnalysisData(data);

            setOnboardingData((prev) => ({
              ...prev,
              GSCAnalysisData: data,
            }));

            setAnalysisComplete(true);

            break; // Exit retry loop on success
          } else if (response.status === 401 && attempt === 0) {
            // Token expired, try refreshing
            console.log("Access token expired. Refreshing...");

            // Find the Google profile with refresh token
            const googleProfile = socialMediaProfiles.find(
              (profile) =>
                profile.social_media_name.toLowerCase() === "google" &&
                refreshToken
            );

            if (!googleProfile) {
              throw new Error("No refresh token available");
            }

            const refreshResponse = await fetch(
              "https://ai.1upmedia.com:443/google/fetch-new-access-token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  refreshToken,
                }),
              }
            );

            if (refreshResponse.ok) {
              const { access_token: newAccessToken } =
                await refreshResponse.json();
              accessToken = newAccessToken; // Update token for retry

              // Update the token in storage
              await storeSocialMediaToken({
                email,
                social_media: {
                  social_media_name: googleProfile.social_media_name,
                  account_name: googleProfile.account_name,
                  profile_picture: googleProfile.profile_picture,
                  access_token: newAccessToken,
                  dynamic_fields: {
                    refreshToken: refreshToken,
                  },
                },
              });

              console.log("Access token refreshed successfully");
            } else {
              throw new Error("Failed to refresh access token");
            }
          } else {
            throw new Error(`Request failed with status: ${response.status}`);
          }
        } catch (error) {
          if (attempt === 1) {
            // Only throw on final attempt
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing site:", error);
      alert("Error analyzing site: " + error.message);
    } finally {
      setAnalysisLoading(false);
    }
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
          Measure Content Decay
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
                    </motion.div>{" "}
                    <div className="gsc-connected-text">
                      <h3>Google Services Connected</h3>
                      <div className="connection-details">
                        <div className="connection-item">
                          <span className="service-icon">🔍</span>
                          <div className="property-id">
                            <strong>Search Console:</strong>{" "}
                            {connectedSites[0].siteUrl}
                          </div>
                        </div>
                        {connectedSites[0].google_analytics && (
                          <div className="connection-item">
                            <span className="service-icon">📊</span>
                            <div className="service-info">
                              <strong>Analytics:</strong>{" "}
                              {connectedSites[0].google_analytics.accountName}
                              <span className="property-id">
                                (Property:{" "}
                                {
                                  connectedSites[0].google_analytics
                                    .propertyName
                                }
                                )
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="gsc-connected-actions"
                    style={{ position: "relative", zIndex: 10 }}
                  >
                    <motion.button
                      className="gsc-manage-button"
                      onClick={handleGSCConnect}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      Manage Connection
                    </motion.button>

                    <motion.button
                      className="gsc-analyze-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnalyzeSite();
                      }}
                      disabled={analysisLoading}
                      whileTap={{ scale: 0.95 }}
                      whileHover={analysisLoading ? {} : { scale: 1.05 }}
                    >
                      {analysisLoading ? (
                        <>
                          <span className="loading-spinner"></span> Analyzing...
                        </>
                      ) : (
                        <>
                          <FaChartLine />{" "}
                          {analysisData ? "Re-fetch data" : "Analyze data"}
                        </>
                      )}
                    </motion.button>
                  </div>
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
                    <h3>
                      Unlock the curve of decay before it costs you. We read the
                      data so you don’t have to.
                    </h3>

                    <button
                      className="gsc-connect-button"
                      onClick={handleGSCConnect}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.05 }}
                      onMouseEnter={() => setShowTooltip("gsc")}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      Connect Google Search Console and Analytics
                    </button>

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
            {/* <motion.div
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
              </div> */}

            {/* <div className="step-keywords__input-section">
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
              </div> */}

            {/* Selected Keywords Section with animations */}
            {/* <div className="step-keywords__content">
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
              </div> */}

            {/* Related Keywords Section */}
            {/* </motion.div> */}

            {/* Show analysis results if data exists */}
            {Object.keys(analysisData).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="analysis-results-container"
              >
                <SEOAnalysisDashboard
                  analysisData={analysisData}
                  onboardingData={onboardingData}
                />
              </motion.div>
            )}

            {/* Optional: Show a temporary success message when analysis completes */}
            {analysisComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="analysis-success-message"
              >
                <FaCheck /> Analysis completed successfully
              </motion.div>
            )}

            <div className="step-keywords__actions">
              <motion.button
                onClick={handleNext}
                className="step-keywords__next-btn"
                whileHover={keywordList.length === 0 ? {} : { scale: 1.05 }}
                whileTap={keywordList.length === 0 ? {} : { scale: 0.95 }}
              >
                Proceed to Train the Engines <FaChevronRight />
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
