import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useAuth } from "../../../context/AuthContext";
import "./StepMainDomain.css";
import Loader from "../../../components/Loader";
import { LinearProgress, CircularProgress } from "@mui/material";

// ───────────────────────────────────────────────────────────
// Did-You-Know facts (unchanged)
// ───────────────────────────────────────────────────────────
const DID_YOU_KNOW_FACTS = [
  {
    title: "Domain Authority (DA)",
    fact: "Domain Authority is a search engine ranking score that predicts how likely a website is to rank in search engine result pages. Scores range from 1 to 100, with higher scores indicating better ranking ability.",
  },
  {
    title: "Page Authority (PA)",
    fact: "Page Authority specifically measures the predictive ranking strength of a single page, rather than an entire domain. It's particularly useful for comparing different pages competing for the same keywords.",
  },
  {
    title: "Trust Flow",
    fact: "Trust Flow measures the quality of links pointing to a website. Sites with high Trust Flow are likely to be more trustworthy as they're linked to by other trusted sites.",
  },
  {
    title: "Citation Flow",
    fact: "Citation Flow measures the quantity of links pointing to a website. It's a useful metric when viewed alongside Trust Flow to understand both quantity and quality of backlinks.",
  },
  {
    title: "Website Health",
    fact: "Regular monitoring of your website's metrics helps identify potential SEO issues early and ensures your site maintains its competitive edge in search rankings.",
  },
];

const CheckMarkIcon = () => (
  <svg
    className="step-main-domain__check-icon"
    viewBox="0 0 24 24"
    width="24"
    height="24"
  >
    <path
      fill="currentColor"
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
    />
  </svg>
);

const LoadingFacts = ({ isValidating = false }) => {
  const [currentFact, setCurrentFact] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % DID_YOU_KNOW_FACTS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="step-main-domain__loading-facts">
      <div className="step-main-domain__loading-spinner">
        <span className="step-main-domain__spinner"></span>
        <p>
          {isValidating
            ? "Validating your website..."
            : "Analyzing your website metrics..."}
        </p>
      </div>
      <div className="step-main-domain__fact-card">
        <h4>Did You Know?</h4>
        <h5>{DID_YOU_KNOW_FACTS[currentFact].title}</h5>
        <p>{DID_YOU_KNOW_FACTS[currentFact].fact}</p>
      </div>
    </div>
  );
};

const StepMainDomain = () => {
  const { onboardingData, setOnboardingData, loading } = useOnboarding();
  const { authState } = useAuth();
  const { email } = authState;
  const navigate = useNavigate();

  /* ── state ───────────────────────────────────────────── */
  const [domain, setDomain] = useState(onboardingData.domain || "");
  const [location, setLocation] = useState(onboardingData.location || "");
  const [analysisData, setAnalysisData] = useState(
    onboardingData.initialAnalysisState
  );
  const [sitemaps, setSitemaps] = useState([]);
  const [sitemapError, setSitemapError] = useState("");
  const [isFetchingSitemaps, setIsFetchingSitemaps] = useState(false);
  const [selectedSitemaps, setSelectedSitemaps] = useState([]);
  const [isSitemapValidated, setIsSitemapValidated] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [businessDetails, setBusinessDetails] = useState(
    onboardingData.businessDetails || ""
  );

  const [analysisSteps, setAnalysisSteps] = useState([
    {
      label: "Domain Validation",
      status: "pending",
      successMessage: "Domain validated successfully",
      errorMessage: "Failed to validate domain",
    },
    {
      label: "Sitemap Analysis",
      status: "pending",
      successMessage: "Sitemaps retrieved successfully",
      errorMessage: "Failed to fetch sitemaps",
    },
    {
      label: "Metrics Analysis",
      status: "pending",
      successMessage: "Site metrics analyzed",
      errorMessage: "Failed to analyze metrics",
    },
    {
      label: "Location Detection",
      status: "pending",
      successMessage: "Business location detected",
      errorMessage: "Could not detect location",
    },
    {
      label: "Business Details",
      status: "pending",
      successMessage: "Business details retrieved",
      errorMessage: "Failed to fetch business details",
    },
  ]);

  const [funnelAnalysis, setFunnelAnalysis] = useState({
    totalAnalyzed: 0,
    funnelDistribution: {
      ToF: 0,
      MoF: 0,
      BoF: 0,
      Unknown: 0,
    },
  });

  useEffect(() => {
    setDomain(onboardingData.domain || "");
    setLocation(onboardingData.location || "");
    setAnalysisData(onboardingData.initialAnalysisState);
    setBusinessDetails(onboardingData.businessDetails || "");
  }, [onboardingData]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isFunnelAnalyzing, setIsFunnelAnalyzing] = useState(false);

  const updateStepStatus = (index, status, message = "") => {
    setAnalysisSteps((prev) =>
      prev.map((step, i) =>
        i === index
          ? {
              ...step,
              status,
              ...(message ? { errorMessage: message } : {}),
            }
          : step
      )
    );
  };

  const analyzeFunnel = async (xmlUrls) => {
    if (!xmlUrls || xmlUrls.length === 0) return;

    setIsFunnelAnalyzing(true);
    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/sitemap/funnel-analysis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ xmlUrls }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setFunnelAnalysis({
          totalAnalyzed: data.totalAnalyzed,
          funnelDistribution: data.funnelDistribution,
        });
      }
    } catch (error) {
      console.error("Error analyzing funnel:", error);
    } finally {
      setIsFunnelAnalyzing(false);
    }
  };

  /* ────────────────────────────────
     1. Validate domain ⟵ **updated**
  ──────────────────────────────── */
  const handleValidateDomain = async () => {
    if (!domain || isSaving) return;

    setIsValidating(true);
    setError("");
    setSitemapError("");
    setAnalysisData({});
    setFunnelAnalysis({
      totalAnalyzed: 0,
      funnelDistribution: {
        ToF: 0,
        MoF: 0,
        BoF: 0,
        Unknown: 0,
      },
    });
    setBusinessDetails("");
    setLocation("");

    // Reset all steps
    setAnalysisSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" }))
    );

    try {
      // 1. First validate domain
      updateStepStatus(0, "loading");
      const domainValidation = await formatAndValidateDomain(domain);
      if (!domainValidation.success) {
        updateStepStatus(0, "error", domainValidation.error);
        throw new Error(domainValidation.error);
      }
      updateStepStatus(0, "completed");
      setDomain(domainValidation.formattedDomain);

      // 2. Fetch sitemaps
      updateStepStatus(1, "loading");
      const sitemapResponse = await fetch(
        `https://ai.1upmedia.com:443/sitemap?site=${encodeURIComponent(
          domainValidation.formattedDomain
        )}`,
        { headers: { Accept: "application/json" } }
      );

      const sitemapData = await sitemapResponse.json();
      if (!sitemapResponse.ok) {
        updateStepStatus(1, "error", "Failed to fetch sitemaps");
        throw new Error(sitemapData.error || "Failed to fetch sitemaps");
      }

      const xmlList = [
        ...(sitemapData.data.mainXML || []),
        ...(sitemapData.data.blindXML || []),
      ];
      setSitemaps(xmlList);
      setIsSitemapValidated(xmlList.length > 0);
      updateStepStatus(1, "completed");

      if (!xmlList.length) {
        setSitemapError("No sitemaps found. Please provide manually.");
      }

      // Don't proceed with other analysis until sitemaps are selected
      setIsValidated(true);
    } catch (error) {
      setError(error.message || "Validation process failed. Please try again.");
      console.error("Error in validation process:", error);
      setIsValidated(false);
      setIsSitemapValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Add this new function to handle when sitemaps are selected
  const handleSitemapSelection = async (selectedXmls) => {
    if (!selectedXmls.length) return;

    try {
      // Start parallel operations for remaining analysis
      updateStepStatus(2, "loading");
      updateStepStatus(3, "loading");
      updateStepStatus(4, "loading");

      // Run funnel analysis for selected sitemaps
      await analyzeFunnel(selectedXmls);

      const [metricsResponse, locationResponse, businessDetailsResponse] =
        await Promise.all([
          // Fetch domain metrics
          fetch("https://ai.1upmedia.com:443/get-domain-authority", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              site_url: `https://${domain}`,
              include_majestic: true,
            }),
          }),

          // Fetch business location
          fetch(
            `https://ai.1upmedia.com:443/get-business-location?url=${encodeURIComponent(
              domain
            )}`
          ),

          // Fetch business details
          fetch("https://ai.1upmedia.com:443/get-business-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: domain,
            }),
          }),
        ]);

      // Process metrics response
      const metricsData = await metricsResponse.json();
      if (metricsResponse.ok) {
        updateStepStatus(2, "completed");
        const analysisResult = {
          domainAuthority: metricsData.detail.domain_authority,
          pageAuthority: metricsData.detail.page_authority,
          trustFlow: metricsData.detail.majestic?.majesticTF || 5,
          citationFlow: metricsData.detail.majestic?.majesticCF || 32,
        };
        setAnalysisData(analysisResult);
        onboardingData.initialAnalysisState = analysisResult;
      } else {
        updateStepStatus(2, "error");
      }

      // Process location response
      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        if (locationData.detail) {
          setLocation(locationData.detail);
          updateStepStatus(3, "completed");
        } else {
          updateStepStatus(3, "error");
        }
      }

      // Process business details response
      if (businessDetailsResponse.ok) {
        const businessData = await businessDetailsResponse.json();
        const details =
          typeof businessData.detail === "string"
            ? businessData.detail
            : JSON.stringify(businessData.detail || "");
        setBusinessDetails(details);
        updateStepStatus(4, "completed");
      } else {
        updateStepStatus(4, "error");
      }
    } catch (error) {
      setError(error.message || "Analysis failed. Please try again.");
      console.error("Error in analysis process:", error);
    }
  };

  /* ────────────────────────────────
     Helpers (unchanged)
  ──────────────────────────────── */
  const checkDomainStatus = async (url) => {
    try {
      await fetch(url, { method: "HEAD", mode: "no-cors" });
      return true;
    } catch {
      return false;
    }
  };

  const formatAndValidateDomain = async (rawDomain) => {
    let formattedDomain = rawDomain.trim().toLowerCase();
    formattedDomain = formattedDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
    formattedDomain = formattedDomain.split("/")[0];

    const protocols = ["https://", "http://"];
    const variations = [formattedDomain, `www.${formattedDomain}`];

    for (const protocol of protocols) {
      for (const variation of variations) {
        const urlToTry = `${protocol}${variation}`;
        const isAccessible = await checkDomainStatus(urlToTry);
        if (isAccessible) {
          return { success: true, url: urlToTry, formattedDomain: variation };
        }
      }
    }
    return {
      success: false,
      error: "Could not establish a connection to the domain",
    };
  };

  /* ────────────────────────────────
     Save + next (unchanged)
  ──────────────────────────────── */

  const handleNext = () => {
    setOnboardingData((prev) => ({
      ...prev,
      domain,
      location,
      siteAnalysis: analysisData,
      businessDetails,
    }));
    navigate("/onboarding/step-keywords");
  };

  /* ────────────────────────────────
     Render
  ──────────────────────────────── */
  if (loading) {
    return (
      <div className="step-main-domain__loading">
        <div className="step-main-domain__spinner"></div>
        <Loader />
      </div>
    );
  }

  const MetricCard = ({ label, value, icon, description, color, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
      onEdit(tempValue);
      setIsEditing(false);
    };

    return (
      <div
        className="step-main-domain__metric-card"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="step-main-domain__metric-header">
          <span className="step-main-domain__metric-icon">{icon}</span>
          <h4 className="step-main-domain__metric-title">{label}</h4>
          {!isEditing && (
            <button
              className="step-main-domain__edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <span role="img" aria-label="edit">
                ✏️
              </span>
            </button>
          )}
        </div>
        <p className="step-main-domain__metric-description">{description}</p>
        <div className="step-main-domain__metric-value-container">
          {isEditing ? (
            <div className="step-main-domain__edit-actions">
              <input
                type="number"
                className="step-main-domain__metric-input"
                value={tempValue}
                onChange={(e) =>
                  setTempValue(
                    Math.min(100, Math.max(0, Number(e.target.value)))
                  )
                }
                min="0"
                max="100"
              />
              <div className="step-main-domain__button-group">
                <button
                  className="step-main-domain__save-btn"
                  onClick={handleSave}
                >
                  Save
                </button>
                <button
                  className="step-main-domain__cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="step-main-domain__metric-value">{value}</span>
              <div
                className="step-main-domain__metric-progress"
                style={{
                  "--progress": `${value}%`,
                  "--color": color,
                }}
              ></div>
            </>
          )}
        </div>
      </div>
    );
  };

  const LocationSection = ({ location, setLocation }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempLocation, setTempLocation] = useState(location);

    const handleSave = () => {
      setLocation(tempLocation);
      setIsEditing(false);
    };

    return (
      <div className="step-main-domain__section">
        <div className="step-main-domain__section-header">
          <h3 className="step-main-domain__subtitle">
            <span role="img" aria-label="location">
              📍
            </span>{" "}
            Business Location
          </h3>
          {!isEditing && (
            <button
              className="step-main-domain__edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <span role="img" aria-label="edit">
                ✏️
              </span>
              Edit
            </button>
          )}
        </div>
        <div className="step-main-domain__location-card">
          {isEditing ? (
            <div className="step-main-domain__edit-container">
              <input
                type="text"
                className="step-main-domain__location-input"
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                placeholder="Enter business location"
              />
              <div className="step-main-domain__button-group">
                <button
                  className="step-main-domain__save-btn"
                  onClick={handleSave}
                >
                  Save
                </button>
                <button
                  className="step-main-domain__cancel-btn"
                  onClick={() => {
                    setTempLocation(location);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="step-main-domain__location-display">
              {location || "No location set"}
            </div>
          )}
        </div>
      </div>
    );
  };

  const BusinessDetailsDisplay = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempDetails, setTempDetails] = useState(businessDetails);

    const handleSave = () => {
      setBusinessDetails(tempDetails);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempDetails(businessDetails);
      setIsEditing(false);
    };

    return (
      <div className="step-main-domain__side-section">
        <div className="step-main-domain__business-header">
          <h3 className="step-main-domain__subtitle">
            <span role="img" aria-label="business">
              💼
            </span>{" "}
            Business Profile
          </h3>
          {!isEditing && (
            <button
              className="step-main-domain__edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <span role="img" aria-label="edit">
                ✏️
              </span>
              Edit
            </button>
          )}
        </div>
        <div className="step-main-domain__business-card">
          {isEditing ? (
            <>
              <textarea
                className="step-main-domain__business-textarea"
                value={tempDetails}
                onChange={(e) => setTempDetails(e.target.value)}
                placeholder="Enter your business description, products/services offered, and key information about your company..."
                spellCheck="true"
              />
              <div className="step-main-domain__edit-actions">
                <button
                  className="step-main-domain__save-btn"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
                <button
                  className="step-main-domain__cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="step-main-domain__business-content">
              {businessDetails ? (
                <p>{businessDetails}</p>
              ) : (
                <p className="step-main-domain__business-placeholder">
                  No business description added yet. Click edit to add your
                  business details.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="step-main-domain">
      <h2 className="step-main-domain__title">Site Analysis</h2>
      {error && <div className="step-main-domain__error">{error}</div>}

      <div className="step-main-domain__split-container">
        <div className="step-main-domain__main-content">
          {/** Domain Details */}
          <div className="step-main-domain__section">
            <div className="step-main-domain__input-container">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter your website domain (e.g., example.com)"
                className="step-main-domain__input"
                disabled={isValidating}
              />
              <button
                onClick={handleValidateDomain}
                className={`step-main-domain__primary-btn ${
                  isValidating ? "step-main-domain__primary-btn--loading" : ""
                }`}
                disabled={!domain || isValidating}
              >
                {isValidating ? (
                  <div className="step-main-domain__loading-state">
                    <CircularProgress size={20} color="inherit" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <span className="step-main-domain__btn-icon">🔍</span>
                    <span>Analyze Site</span>
                  </>
                )}
              </button>
            </div>
            {isValidating && <AnalysisProgress steps={analysisSteps} />}
          </div>

          {/** Sitemaps */}
          {!isValidating && sitemaps.length > 0 && (
            <div className="step-main-domain__sitemap-section">
              <h3 className="step-main-domain__subtitle">
                <span role="img" aria-label="sitemap">
                  🗺️
                </span>{" "}
                Sitemaps
              </h3>
              {isFetchingSitemaps ? (
                <div className="step-main-domain__loading-pulse" />
              ) : (
                <>
                  <div className="step-main-domain__sitemap-header">
                    <button
                      className="step-main-domain__select-all"
                      onClick={() => {
                        if (selectedSitemaps.length === sitemaps.length) {
                          setSelectedSitemaps([]);
                        } else {
                          setSelectedSitemaps([...sitemaps]);
                        }
                      }}
                    >
                      {selectedSitemaps.length === sitemaps.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                    <span className="step-main-domain__sitemap-count">
                      {selectedSitemaps.length} of {sitemaps.length} selected
                    </span>
                  </div>
                  <div className="step-main-domain__sitemap-list">
                    {sitemaps.map((sitemap, index) => (
                      <div
                        key={index}
                        className="step-main-domain__sitemap-item"
                      >
                        <label className="step-main-domain__checkbox-container">
                          <input
                            type="checkbox"
                            checked={selectedSitemaps.includes(sitemap)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSitemaps((prev) => [
                                  ...prev,
                                  sitemap,
                                ]);
                              } else {
                                setSelectedSitemaps((prev) =>
                                  prev.filter((item) => item !== sitemap)
                                );
                              }
                            }}
                          />
                          <span className="step-main-domain__checkbox-custom"></span>
                          <span
                            className="step-main-domain__sitemap-link"
                            title={sitemap}
                          >
                            {sitemap}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {sitemapError && (
                <div className="step-main-domain__error">{sitemapError}</div>
              )}
              {selectedSitemaps.length > 0 && (
                <button
                  className="step-main-domain__analyze-btn"
                  onClick={() => handleSitemapSelection(selectedSitemaps)}
                  disabled={isFunnelAnalyzing}
                >
                  {isFunnelAnalyzing ? "Analyzing Funnel..." : "Analyze Funnel"}
                </button>
              )}
            </div>
          )}

          {!isValidating && funnelAnalysis.totalAnalyzed > 0 && (
            <div
              className={`step-main-domain__funnel-section ${
                isFunnelAnalyzing ? "loading" : ""
              }`}
            >
              <h3 className="step-main-domain__subtitle">
                <span role="img" aria-label="funnel">
                  🔷
                </span>{" "}
                Content Funnel Analysis
              </h3>
              <div className="step-main-domain__funnel-container">
                <div className="step-main-domain__total-analyzed">
                  <span className="step-main-domain__stat-label">
                    Total Pages Analyzed:
                  </span>
                  <span className="step-main-domain__stat-value">
                    {funnelAnalysis.totalAnalyzed}
                  </span>
                </div>
                <div className="step-main-domain__funnel-distribution">
                  {Object.entries(funnelAnalysis.funnelDistribution).map(
                    ([stage, count]) => {
                      const percentage = (
                        (count / funnelAnalysis.totalAnalyzed) *
                        100
                      ).toFixed(1);
                      const getStageColor = (stage) => {
                        switch (stage) {
                          case "ToF":
                            return {
                              gradient:
                                "linear-gradient(90deg, #4CAF50, #81C784)",
                              shadow: "rgba(76, 175, 80, 0.2)",
                            };
                          case "MoF":
                            return {
                              gradient:
                                "linear-gradient(90deg, #2196F3, #64B5F6)",
                              shadow: "rgba(33, 150, 243, 0.2)",
                            };
                          case "BoF":
                            return {
                              gradient:
                                "linear-gradient(90deg, #9C27B0, #BA68C8)",
                              shadow: "rgba(156, 39, 176, 0.2)",
                            };
                          default:
                            return {
                              gradient:
                                "linear-gradient(90deg, #FF9800, #FFB74D)",
                              shadow: "rgba(255, 152, 0, 0.2)",
                            };
                        }
                      };

                      const stageStyle = getStageColor(stage);

                      return (
                        <div
                          key={stage}
                          className="step-main-domain__funnel-stage"
                          style={{
                            boxShadow: `0 4px 15px ${stageStyle.shadow}`,
                            borderLeft: `4px solid ${stageStyle.gradient
                              .split(",")[0]
                              .slice(21)}`,
                          }}
                        >
                          <div className="step-main-domain__stage-header">
                            <span className="step-main-domain__stage-name">
                              {stage}
                            </span>
                            <span className="step-main-domain__stage-count">
                              {count}
                            </span>
                          </div>
                          <div className="step-main-domain__progress-bar">
                            <div
                              className="step-main-domain__progress-fill"
                              data-stage={stage}
                              style={{
                                width: `${percentage}%`,
                                background: stageStyle.gradient,
                              }}
                            />
                          </div>
                          <span className="step-main-domain__percentage">
                            {percentage}% of total content
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {/** Analysis Details */}
          {!isValidating &&
            (analysisData.domainAuthority ||
              analysisData.pageAuthority ||
              analysisData.trustFlow ||
              analysisData.citationFlow) && (
              <div className="step-main-domain__section">
                <h3 className="step-main-domain__subtitle">
                  <span role="img" aria-label="metrics">
                    📊
                  </span>{" "}
                  Site Metrics
                </h3>
                <div className="step-main-domain__metrics-grid">
                  {[
                    {
                      label: "Domain Authority",
                      key: "domainAuthority",
                      icon: "🏆",
                      description:
                        "Predicts how well a website will rank on search engines",
                      color: "#4CAF50",
                    },
                    {
                      label: "Page Authority",
                      key: "pageAuthority",
                      icon: "📈",
                      description: "Indicates the strength of individual pages",
                      color: "#2196F3",
                    },
                    {
                      label: "Trust Flow",
                      key: "trustFlow",
                      icon: "🔒",
                      description:
                        "Measures the quality of links pointing to your site",
                      color: "#9C27B0",
                    },
                    {
                      label: "Citation Flow",
                      key: "citationFlow",
                      icon: "🔗",
                      description:
                        "Indicates how influential the site might be",
                      color: "#FF9800",
                    },
                  ].map(({ label, key, icon, description, color }) => (
                    <MetricCard
                      key={key}
                      label={label}
                      value={analysisData[key]}
                      icon={icon}
                      description={description}
                      color={color}
                      onEdit={(value) =>
                        setAnalysisData((prev) => ({
                          ...prev,
                          [key]: value,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Side content with loading state */}
        <div className="step-main-domain__side-content">
          {isValidating || analysisSteps[4].status === "loading" ? (
            <div className="step-main-domain__loading-business">
              <CircularProgress size={24} />
              <p>Loading business details...</p>
            </div>
          ) : (
            businessDetails && <BusinessDetailsDisplay />
          )}
        </div>
      </div>

      <div className="step-main-domain__footer">
        <button onClick={handleNext} className="step-main-domain__next-btn">
          Continue to Keywords
          <span className="step-main-domain__next-icon">→</span>
        </button>
      </div>
    </div>
  );
};

const ProgressSteps = ({ currentStep }) => {
  const steps = [
    { label: "Domain", icon: "🌐" },
    { label: "Sitemaps", icon: "🗺️" },
    { label: "Metrics", icon: "📊" },
    { label: "Location", icon: "📍" },
  ];

  return (
    <div className="step-main-domain__progress-container">
      <div className="step-main-domain__progress-header">
        <CircularProgress size={20} />
        <h4 className="step-main-domain__progress-title">
          Analysis in Progress
        </h4>
      </div>

      <div className="step-main-domain__progress-steps">
        <div className="step-main-domain__progress-line">
          <div
            className="step-main-domain__progress-line-fill"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => (
          <div key={index} className="step-main-domain__progress-step">
            <div
              className={`step-main-domain__step-indicator ${
                index < currentStep
                  ? "complete"
                  : index === currentStep
                  ? "active"
                  : ""
              }`}
            >
              {index < currentStep ? "✓" : step.icon}
            </div>
            <span className="step-main-domain__step-label">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalysisProgress = ({ steps }) => (
  <div className="step-main-domain__analysis-stepper">
    {steps.map((step, index) => (
      <div key={index} className="step-main-domain__step-container">
        {/* Step Icon with Status */}
        <div className={`step-main-domain__step-icon ${step.status}`}>
          {step.status === "completed" ? (
            <i className="material-icons success">
              {getStepIcon(step.label, true)}
            </i>
          ) : step.status === "loading" ? (
            <CircularProgress size={24} thickness={3} />
          ) : step.status === "error" ? (
            <i className="material-icons error">
              {getStepIcon(step.label, false)}
            </i>
          ) : (
            <i className="material-icons pending">
              {getStepIcon(step.label, false)}
            </i>
          )}
        </div>

        {/* Connector Line */}
        {index < steps.length - 1 && (
          <div className="step-main-domain__step-connector">
            <span
              className={`step-main-domain__connector-line ${
                steps[index].status === "completed"
                  ? "completed"
                  : steps[index].status === "loading"
                  ? "active"
                  : ""
              }`}
            />
          </div>
        )}

        {/* Step Content */}
        <div className="step-main-domain__step-content">
          <span className={`step-main-domain__step-label ${step.status}`}>
            {step.label}
          </span>
          <span className="step-main-domain__step-message">
            {step.status === "completed" && step.successMessage}
            {step.status === "error" && (
              <span className="step-main-domain__error-message">
                {step.errorMessage}
              </span>
            )}
            {step.status === "loading" && (
              <span className="step-main-domain__loading-message">
                Processing<span className="step-main-domain__dots">...</span>
              </span>
            )}
          </span>
        </div>
      </div>
    ))}
  </div>
);

// Helper function to get appropriate icon for each step
const getStepIcon = (stepLabel, isComplete) => {
  switch (stepLabel) {
    case "Domain Validation":
      return isComplete ? "domain_verified" : "domain";
    case "Sitemap Analysis":
      return isComplete ? "map" : "map_outlined";
    case "Metrics Analysis":
      return isComplete ? "analytics" : "monitoring";
    case "Location Detection":
      return isComplete ? "location_on" : "location_searching";
    case "Business Details":
      return isComplete ? "business_center" : "store";
    default:
      return isComplete ? "check_circle" : "radio_button_unchecked";
  }
};

export default StepMainDomain;
