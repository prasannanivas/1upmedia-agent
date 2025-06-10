import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useAuth } from "../../../context/AuthContext";
import "./StepMainDomain.css";
import Loader from "../../../components/Loader";
import { CircularProgress } from "@mui/material";
import { STYLE_TEXT } from "./StepMainDomainStyleText";
import AnalysisProgress from "./AnalysisProgress";

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
  const [uniqueUrlCount, setUniqueUrlCount] = useState(0);
  const [domainCostDetails, setDomainCostDetails] = useState({
    averageOrderValue: 0,
    totalInvested: 0,
    AverageContentCost: 0,
  });
  const [businessDetails, setBusinessDetails] = useState(
    onboardingData.businessDetails || ""
  );
  const [funnelAnalysis, setFunnelAnalysis] = useState({
    totalAnalyzed: 0,
    funnelDistribution: {
      ToF: 0,
      MoF: 0,
      BoF: 0,
      Retention: 0,
      Advocacy: 0,
      Unknown: 0,
    },
    frameworkCoverage: [],
    psychCompositeSummary: {
      overall: {
        emotionalResonance: 0,
        cognitiveClarity: 0,
        persuasionLeverage: 0,
        behavioralMomentum: 0,
      },
      byStage: {},
    },
    details: [],
  });

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

  useEffect(() => {
    setDomain(onboardingData.domain || "");
    setLocation(onboardingData.location || "");

    setAnalysisData(onboardingData.initialAnalysisState);
    setBusinessDetails(onboardingData.businessDetails || "");
    setFunnelAnalysis(
      onboardingData.funnelAnalysis || {
        totalAnalyzed: 0,
        funnelDistribution: {
          ToF: 0,
          MoF: 0,
          BoF: 0,
          Retention: 0,
          Advocacy: 0,
          Unknown: 0,
        },
        frameworkCoverage: [],
        psychCompositeSummary: {
          overall: {
            emotionalResonance: 0,
            cognitiveClarity: 0,
            persuasionLeverage: 0,
            behavioralMomentum: 0,
          },
          byStage: {},
        },
        details: [],
      }
    );
    setSitemaps(onboardingData.sitemaps || []);
    setSelectedSitemaps(onboardingData.selectedSitemaps || []);
    setIsSitemapValidated(onboardingData.isSitemapValidated || false);
    setDomainCostDetails(
      onboardingData.domainCostDetails || {
        averageOrderValue: "",
        AverageContentCost: "",
        totalInvested: "",
      }
    );

    setUniqueUrlCount(
      onboardingData.uniqueUrlCount ||
        domainCostDetails.totalInvested / 1000 ||
        0
    );
    if (onboardingData.isSitemapValidated) {
      updateStepStatus(1, "success");
    }
  }, [onboardingData]);

  // Calculate AverageContentCost when totalInvested or uniqueUrlCount changes
  useEffect(() => {
    if (domainCostDetails.totalInvested > 0 && uniqueUrlCount > 0) {
      const calculatedAverageContentCost =
        domainCostDetails.totalInvested / uniqueUrlCount;
      setDomainCostDetails((prev) => ({
        ...prev,
        AverageContentCost: calculatedAverageContentCost,
      }));
    } else if (domainCostDetails.totalInvested === 0) {
      // Reset AverageContentCost when totalInvested is 0
      setDomainCostDetails((prev) => ({
        ...prev,
        AverageContentCost: 0,
      }));
    }
  }, [domainCostDetails.totalInvested, uniqueUrlCount]);

  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isFunnelAnalyzing, setIsFunnelAnalyzing] = useState(false); // Initialize sitemap section to be expanded only if no sitemaps are selected
  const [isSitemapExpanded, setIsSitemapExpanded] = useState(false);
  // Add these new state variables to the StepMainDomain component
  const [rateLimitedData, setRateLimitedData] = useState({
    count: 0,
    urls: [],
  });
  const [errorsData, setErrorsData] = useState({ count: 0, details: [] });
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [isRetryingRateLimited, setIsRetryingRateLimited] = useState(false);

  // Create a RateLimitDialog component inside StepMainDomain
  const RateLimitDialog = () => {
    if (!showRateLimitDialog) return null;

    const handleRetry = async () => {
      setShowRateLimitDialog(false);
      setIsRetryingRateLimited(true);

      try {
        const response = await fetch(
          "https://ai.1upmedia.com:443/sitemap/content-analysis/retry-with-ratelimits",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              xmlUrls: rateLimitedData.urls,
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          setFunnelAnalysis({
            totalAnalyzed: data.totalAnalyzed,
            funnelDistribution: data.funnelDistribution,
            frameworkCoverage: data.frameworkCoverage,
            psychCompositeSummary: data.psychCompositeSummary,
            details: data.details,
          });

          // Update rate limited data if there are still some
          if (data.rateLimited && data.rateLimited.count > 0) {
            setRateLimitedData(data.rateLimited);
          } else {
            setRateLimitedData({ count: 0, urls: [] });
          }

          // Update errors data if any
          if (data.otherErrors && data.otherErrors.count > 0) {
            setErrorsData(data.otherErrors);
          } else {
            setErrorsData({ count: 0, details: [] });
          }
        }
      } catch (error) {
        console.error("Error retrying rate-limited URLs:", error);
      } finally {
        setIsRetryingRateLimited(false);
      }
    };

    const handleCancel = () => {
      setShowRateLimitDialog(false);
    };

    return (
      <div className="step-main-domain__modal-overlay">
        <div className="step-main-domain__modal">
          <div className="step-main-domain__modal-header">
            <h3>Rate Limiting Detected</h3>
            <button
              className="step-main-domain__modal-close"
              onClick={handleCancel}
            >
              ×
            </button>
          </div>
          <div className="step-main-domain__modal-body">
            <div className="step-main-domain__modal-icon">⚠️</div>
            <p>
              <strong>{rateLimitedData.count} pages</strong> were blocked due to
              rate limiting.
            </p>
            <p>
              Would you like to retry analyzing these pages? This may take
              longer as we need to work around rate limits.
            </p>

            {rateLimitedData.urls.length > 0 && (
              <div className="step-main-domain__url-preview">
                <details>
                  <summary>
                    View affected URLs (
                    {Math.min(5, rateLimitedData.urls.length)} of{" "}
                    {rateLimitedData.urls.length})
                  </summary>
                  <div className="step-main-domain__url-list">
                    {rateLimitedData.urls.slice(0, 5).map((url, index) => (
                      <div key={index} className="step-main-domain__url-item">
                        {url}
                      </div>
                    ))}
                    {rateLimitedData.urls.length > 5 && (
                      <div className="step-main-domain__url-more">
                        ...and {rateLimitedData.urls.length - 5} more
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
          <div className="step-main-domain__modal-footer">
            <button
              className="step-main-domain__modal-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="step-main-domain__modal-primary"
              onClick={handleRetry}
            >
              Proceed with Retry (Longer waiting time)
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create an ErrorsInfoPanel component to show other errors
  // Create an ErrorsInfoPanel component to show other errors
  const ErrorsInfoPanel = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (errorsData.count === 0 || !isVisible) return null;

    const handleClose = () => {
      setIsVisible(false);
    };

    return (
      <div className="step-main-domain__errors-panel">
        <div className="step-main-domain__errors-header">
          <span className="step-main-domain__errors-icon">⚠️</span>
          <h4 className="step-main-domain__errors-title">Analysis Issues</h4>
          <span className="step-main-domain__errors-count">
            {errorsData.count}
          </span>
          <button
            className="step-main-domain__errors-close"
            onClick={handleClose}
            title="Dismiss"
          >
            ×
          </button>
        </div>

        <div className="step-main-domain__errors-content">
          <p>Some pages couldn't be analyzed due to errors:</p>

          <div className="step-main-domain__errors-list">
            {errorsData.details.slice(0, 3).map((error, index) => (
              <div key={index} className="step-main-domain__error-item">
                <div className="step-main-domain__error-url">{error.url}</div>
                <div className="step-main-domain__error-message">
                  {error.error}
                </div>
              </div>
            ))}

            {errorsData.details.length > 3 && (
              <details className="step-main-domain__errors-more">
                <summary>
                  Show {errorsData.details.length - 3} more errors
                </summary>
                {errorsData.details.slice(3).map((error, index) => (
                  <div key={index + 3} className="step-main-domain__error-item">
                    <div className="step-main-domain__error-url">
                      {error.url}
                    </div>
                    <div className="step-main-domain__error-message">
                      {error.error}
                    </div>
                  </div>
                ))}
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };
  // Effect to manage the sitemap expansion state when selections change
  useEffect(() => {
    // Collapse the sitemap section when user selects sitemaps
    if (selectedSitemaps.length > 0 && isSitemapExpanded) {
      setIsSitemapExpanded(false);
    }
  }, []);

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
        "https://ai.1upmedia.com:443/sitemap/content-analysis",
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
          frameworkCoverage: data.frameworkCoverage,
          psychCompositeSummary: data.psychCompositeSummary,
          details: data.details,
        });

        // Handle rate limited data if present
        if (data.rateLimited && data.rateLimited.count > 0) {
          setRateLimitedData(data.rateLimited);
          setShowRateLimitDialog(true);
        }

        // Handle other errors if present
        if (data.otherErrors && data.otherErrors.count > 0) {
          setErrorsData(data.otherErrors);
        }

        setTimeout(() => {
          // Set the framework section to be expanded
          document
            .getElementById("frameworkSection")
            ?.classList.add("expanded");

          // Add dynamic animations to elements
          const animateElements = document.querySelectorAll(
            ".step-main-domain__funnel-stage, .step-main-domain__mini-metric"
          );
          animateElements.forEach((element, index) => {
            element.style.setProperty("--index", index);
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error analyzing funnel:", error);
    } finally {
      setIsFunnelAnalyzing(false);
      setIsSitemapExpanded(false);
    }
  };

  /* ────────────────────────────────
     1. Validate domain ⟵ **updated**
  ──────────────────────────────── */
  const handleValidateDomain = async () => {
    if (!domain) return;

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
        Retention: 0,
        Advocacy: 0,
        Unknown: 0,
      },
      frameworkCoverage: [],
      psychCompositeSummary: {
        overall: {
          emotionalResonance: 0,
          cognitiveClarity: 0,
          persuasionLeverage: 0,
          behavioralMomentum: 0,
        },
        byStage: {},
      },
      details: [],
    });
    setBusinessDetails("");
    setLocation("");
    setSitemaps([]);
    setSelectedSitemaps([]);
    setUniqueUrlCount(0);

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
        )}&includeSites=true`,
        { headers: { Accept: "application/json" } }
      );
      const sitemapData = await sitemapResponse.json();
      if (!sitemapResponse.ok) {
        updateStepStatus(1, "error", "Failed to fetch sitemaps");
        throw new Error(sitemapData.error || "Failed to fetch sitemaps");
      }

      const uniqueUrls = new Set();

      console.log("Sitemap data:", sitemapData.data.sites);

      // Extract URLs from the API response data.sites if available
      if (sitemapData.data.sites && Array.isArray(sitemapData.data.sites)) {
        sitemapData.data.sites.forEach((url) => {
          uniqueUrls.add(url);
        });
      }

      console.log("Unique URLs from API:", uniqueUrls);

      // If we don't have URLs from the API response, fetch XML sitemaps and parse them
      const xmlList = [
        ...(sitemapData.data.mainXML || []),
        ...(sitemapData.data.blindXML || []),
      ];
      setSitemaps(xmlList);
      setUniqueUrlCount(uniqueUrls.size);
      setIsSitemapValidated(xmlList.length > 0);
      updateStepStatus(1, "completed");

      if (!xmlList.length) {
        setSitemapError("No sitemaps found. Please provide manually.");
      }

      // Don't proceed with other analysis until sitemaps are selected
    } catch (error) {
      setError(error.message || "Validation process failed. Please try again.");
      console.error("Error in validation process:", error);

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

      const [metricsResponse, businessDetailsResponse] = await Promise.all([
        // Fetch domain metrics
        fetch("https://ai.1upmedia.com:443/get-domain-authority", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site_url: `https://${domain}`,
            include_majestic: true,
          }),
        }),

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

  /* Get color based on metric value */
  const getMetricColor = (value) => {
    if (value >= 80) return "#4CAF50"; // Green - Excellent
    if (value >= 70) return "#8BC34A"; // Light Green - Very Good
    if (value >= 60) return "#CDDC39"; // Lime - Good
    if (value >= 50) return "#FFEB3B"; // Yellow - Acceptable
    if (value >= 40) return "#FFC107"; // Amber - Needs Improvement
    if (value >= 30) return "#FF9800"; // Orange - Poor
    return "#F44336"; // Red - Critical
  };

  /* ────────────────────────────────
     Save + next
  ──────────────────────────────── */
  const handleSave = async () => {
    try {
      const filteredSiteData = {
        ...(domain && { URL: domain }),
        ...(location && { location }),
        ...(businessDetails && { businessDetails }),
        dynamic_fields: {
          ...(analysisData && { analysisData }),
          ...(sitemaps && { sitemaps }),
          ...(selectedSitemaps && { selectedSitemaps }),
          ...(funnelAnalysis && { funnelAnalysis }),
          ...(domainCostDetails && { domainCostDetails }),
          uniqueUrlCount,
          ...(onboardingData.suggestionsFromAi && {
            suggestions: {
              ...onboardingData.suggestionsFromAi,
            },
          }),
        },
      };

      if (Object.keys(filteredSiteData.dynamic_fields).length === 0) {
        delete filteredSiteData.dynamic_fields;
      } // Update the onboarding context
      const updatedData = {
        ...onboardingData,
        domain,
        location,
        siteAnalysis: analysisData,
        businessDetails,
        sitemaps,
        selectedSitemaps,
        domainCostDetails,
        isSitemapValidated,
        funnelAnalysis,
        uniqueUrlCount,
        lastUpdated: new Date().toISOString(),
      };
      setOnboardingData(updatedData);

      const fd = new FormData();
      fd.append("email", email);
      fd.append("engineType", "voice");

      // Add onboarding data if available
      if (businessDetails.trim()) {
        fd.append(
          "businessDetails",
          businessDetails +
            "\n" +
            domain +
            "\n" +
            location +
            +"\n" +
            JSON.stringify(analysisData)
        );
      }

      // Make the POST request without waiting for response
      fetch("https://ai.1upmedia.com:443/RAG/analyzeStyleChunks", {
        method: "POST",
        body: fd,
      }).catch((error) => {
        console.error("Error analyzing style chunks:", error);
        setError("Failed to analyze style chunks. Please try again.");
      });

      // Save to backend
      await fetch("https://ai.1upmedia.com:443/aiagent/updateBusinessdetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          siteData: filteredSiteData,
        }),
      });

      // Code continues executing immediately...

      return true;
    } catch (error) {
      console.error("Error in handleSave:", error);
      throw error;
    }
  };

  const handleNext = async () => {
    try {
      await handleSave();
      navigate("/onboarding/step-keywords");
    } catch (error) {
      console.error("Error saving data:", error);
      setError("Failed to save your progress. Please try again.");
    }
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
  const BusinessDetailsDisplay = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempDetails, setTempDetails] = useState(businessDetails);

    // Add enhanced styles inline for business details display
    useEffect(() => {
      const styleEl = document.createElement("style");
      styleEl.id = "business-details-styles";
      styleEl.textContent = STYLE_TEXT;
      document.head.appendChild(styleEl);

      return () => {
        const existingStyle = document.getElementById(
          "business-details-styles"
        );
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }, []);

    // Get appropriate emoji based on section title
    const getSectionEmoji = useCallback((title) => {
      const titleLower = title.toLowerCase();
      if (titleLower.includes("overview") || titleLower.includes("about"))
        return "🏢";
      if (titleLower.includes("product") || titleLower.includes("service"))
        return "🛍️";
      if (titleLower.includes("contact") || titleLower.includes("info"))
        return "📞";
      if (
        titleLower.includes("team") ||
        titleLower.includes("staff") ||
        titleLower.includes("employee")
      )
        return "👥";
      if (
        titleLower.includes("mission") ||
        titleLower.includes("vision") ||
        titleLower.includes("value")
      )
        return "🚀";
      if (titleLower.includes("history") || titleLower.includes("journey"))
        return "🗓️";
      if (titleLower.includes("location") || titleLower.includes("address"))
        return "📍";
      if (titleLower.includes("hour")) return "🕒";
      if (titleLower.includes("award") || titleLower.includes("achievement"))
        return "🏆";
      if (titleLower.includes("client") || titleLower.includes("customer"))
        return "🤝";
      if (titleLower.includes("project")) return "📋";
      if (titleLower.includes("technology") || titleLower.includes("tech"))
        return "💻";
      if (titleLower.includes("price") || titleLower.includes("pricing"))
        return "💰";
      if (titleLower.includes("faq")) return "❓";
      return "✨"; // Default emoji
    }, []);

    // Function to get key-specific emojis
    const getKeyEmoji = useCallback((key) => {
      const keyLower = key.toLowerCase();
      if (keyLower.includes("name") || keyLower.includes("brand")) return "✨";
      if (keyLower.includes("founded") || keyLower.includes("established"))
        return "🗓️";
      if (keyLower.includes("industry") || keyLower.includes("sector"))
        return "🏭";
      if (keyLower.includes("size") || keyLower.includes("employees"))
        return "👥";
      if (keyLower.includes("revenue") || keyLower.includes("income"))
        return "💵";
      if (keyLower.includes("website")) return "🌐";
      if (keyLower.includes("email")) return "📧";
      if (keyLower.includes("phone")) return "📱";
      if (keyLower.includes("address") || keyLower.includes("location"))
        return "📍";
      if (keyLower.includes("social")) return "📱";
      if (
        keyLower.includes("ceo") ||
        keyLower.includes("founder") ||
        keyLower.includes("president")
      )
        return "👔";
      if (keyLower.includes("mission")) return "🎯";
      if (keyLower.includes("vision")) return "🔮";
      if (keyLower.includes("value")) return "💎";
      if (keyLower.includes("product")) return "📦";
      if (keyLower.includes("service")) return "🛠️";
      if (keyLower.includes("client") || keyLower.includes("customer"))
        return "🤝";
      if (keyLower.includes("award")) return "🏆";
      if (keyLower.includes("hour")) return "🕒";
      return null; // No emoji for this key
    }, []);
    const handleSave = () => {
      setBusinessDetails(tempDetails);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setTempDetails(businessDetails);
      setIsEditing(false);
    };
    // Function to parse and format a specific type of content with improved styling
    const parseFormattedContent = useCallback(
      (line) => {
        // Handle bullet points (starting with dash)
        if (line.trim().startsWith("-")) {
          // Try to determine bullet type based on content
          let bulletEmoji = "•";
          const content = line.substring(1).trim().toLowerCase();

          if (content.includes("award") || content.includes("achievement"))
            bulletEmoji = "🏆";
          else if (
            content.includes("year") ||
            content.includes("since") ||
            content.includes("established")
          )
            bulletEmoji = "📅";
          else if (content.includes("product") || content.includes("offer"))
            bulletEmoji = "📦";
          else if (content.includes("service")) bulletEmoji = "🛠️";
          else if (content.includes("client") || content.includes("customer"))
            bulletEmoji = "🤝";
          else if (content.includes("technology") || content.includes("tech"))
            bulletEmoji = "💻";
          else if (content.includes("feature")) bulletEmoji = "✨";
          else if (content.includes("benefit")) bulletEmoji = "💎";
          else bulletEmoji = "✅";

          return (
            <div className="step-main-domain__business-list-item">
              <span className="step-main-domain__business-bullet">
                {bulletEmoji}
              </span>
              <span>{line.substring(1).trim()}</span>
            </div>
          );
        }

        // Handle numbered items (starting with numbers followed by period)
        else if (/^\d+\./.test(line.trim())) {
          const [num, ...rest] = line.trim().split(/\.\s+/);
          const content = rest.join(". ").toLowerCase();

          // Determine appropriate icon based on content
          let icon = num;
          if (content.includes("step")) icon = "🔄";
          else if (content.includes("rank")) icon = "🏆";
          else if (content.includes("phase")) icon = "📈";
          else if (content.includes("stage")) icon = "🚩";

          return (
            <div className="step-main-domain__business-list-item">
              <span className="step-main-domain__business-number">{icon}</span>
              <span>{rest.join(". ")}</span>
            </div>
          );
        }

        // Handle key-value pairs (separated by colon)
        else if (line.includes(":")) {
          const [key, ...value] = line.split(":");
          const keyEmoji = getKeyEmoji(key.trim());

          return (
            <div className="step-main-domain__business-detail-row">
              <span className="step-main-domain__business-detail-key">
                {keyEmoji && (
                  <span className="step-main-domain__key-emoji">
                    {keyEmoji}
                  </span>
                )}
                {key.trim()}
              </span>
              <span className="step-main-domain__business-detail-value">
                {value.join(":").trim()}
              </span>
            </div>
          );
        }

        // Handle plain text
        else {
          return line.trim() ? <p>{line.trim()}</p> : null;
        }
      },
      [getKeyEmoji]
    );

    // Function to check if a line is a section title (starts with asterisks)
    const isSectionTitle = useCallback((line) => {
      return line.trim().startsWith("*") || /^\*+\s+\w+/.test(line);
    }, []);

    // Format the business details with enhanced styling
    const renderFormattedDetails = useCallback(() => {
      if (!businessDetails) {
        return (
          <div className="step-main-domain__business-placeholder">
            <div className="step-main-domain__placeholder-icon">📋</div>
            <p>No business description added yet.</p>
            <p>
              Click <span className="step-main-domain__highlight">Edit</span> to
              add your business details
            </p>
            <div className="step-main-domain__placeholder-helper">
              <div className="step-main-domain__placeholder-tip">
                <span className="step-main-domain__tip-icon">💡</span>
                <span>Use sections marked with * like *Company Overview*</span>
              </div>
            </div>
          </div>
        );
      }

      // Split into major sections (separated by double new lines)
      const sections = businessDetails.split("\n\n");
      return (
        <div className="step-main-domain__business-formatted">
          {sections.map((section, sectionIndex) => {
            const lines = section.split("\n");

            // Skip empty sections
            if (
              lines.length === 0 ||
              (lines.length === 1 && !lines[0].trim())
            ) {
              return null;
            }

            // Check if the first line is a section title (starts with asterisks)
            const firstLine = lines[0];
            const hasSectionTitle = isSectionTitle(firstLine);
            const sectionTitle = hasSectionTitle
              ? firstLine.replace(/\*/g, "").trim()
              : "";

            // Get appropriate section emoji
            const sectionEmoji = hasSectionTitle
              ? getSectionEmoji(sectionTitle)
              : "📝";

            // Content lines are all lines after the title (or all lines if no title)
            const contentLines = hasSectionTitle ? lines.slice(1) : lines;

            return (
              <div
                key={sectionIndex}
                className="step-main-domain__business-section"
                style={{ animationDelay: `${sectionIndex * 0.15}s` }}
              >
                {sectionTitle && (
                  <h4 className="step-main-domain__business-section-title">
                    <span className="step-main-domain__section-emoji">
                      {sectionEmoji}
                    </span>
                    {sectionTitle}
                  </h4>
                )}

                <div className="step-main-domain__business-section-content">
                  {contentLines.map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {parseFormattedContent(line)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }, [
      parseFormattedContent,
      isSectionTitle,
      businessDetails,
      getSectionEmoji,
    ]);

    // Add this style block to enhance the emoji appearance
    useEffect(() => {
      const styleEl = document.createElement("style");
      styleEl.id = "business-details-emoji-styles";
      styleEl.textContent = `
        .step-main-domain__section-emoji {
          margin-right: 10px;
          font-size: 1.2em;
          display: inline-block;
          vertical-align: middle;
          animation: bounce 1s ease infinite alternate;
        }
        
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-3px); }
        }
        
        .step-main-domain__key-emoji {
          margin-right: 8px;
          opacity: 0.9;
          font-size: 0.95em;
        }
        
        .step-main-domain__placeholder-icon {
          font-size: 42px;
          margin-bottom: 15px;
          animation: pulse 2s ease infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .step-main-domain__placeholder-helper {
          margin-top: 20px;
          font-size: 0.9em;
        }
        
        .step-main-domain__placeholder-tip {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        }
        
        .step-main-domain__tip-icon {
          margin-right: 8px;
          animation: glow 2s ease infinite;
        }
        
        @keyframes glow {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .step-main-domain__highlight {
          font-weight: 700;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .step-main-domain__business-bullet {
          font-size: 0.9rem !important;
        }
        
        .step-main-domain__business-card {
          position: relative;
          overflow: hidden;
        }
        
        .step-main-domain__business-card:after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          height: 200px;
          width: 200px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(37, 99, 235, 0.08) 100%);
          border-radius: 50%;
          transform: translate(50%, -50%);
          z-index: 0;
          pointer-events: none;
        }
      `;
      document.head.appendChild(styleEl);

      return () => {
        const existingStyle = document.getElementById(
          "business-details-emoji-styles"
        );
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }, []);

    return (
      <div className="step-main-domain__side-section">
        <div className="step-main-domain__business-header">
          <h3 className="step-main-domain__subtitle">
            <span
              role="img"
              aria-label="business"
              style={{ marginRight: "10px" }}
            >
              💼
            </span>
            Business Profile
          </h3>
          {!isEditing && (
            <button
              className="step-main-domain__edit-btn"
              onClick={() => setIsEditing(true)}
              title="Edit business profile"
            >
              <span role="img" aria-label="edit" style={{ marginRight: "6px" }}>
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
                placeholder="Enter your business details using the following format:
*Company Overview*
Business Name: Your Company Name
Founded: Year founded
Industry: Your Industry
- Key point about your business
- Another key point
- One more key point

*Products & Services*
1. Main product or service
2. Secondary product or service

*Contact Information*
Website: example.com
Email: contact@example.com
Phone: (555) 123-4567"
                spellCheck="true"
              />
              <div className="step-main-domain__edit-actions">
                <button
                  className="step-main-domain__save-btn"
                  onClick={handleSave}
                >
                  <span
                    role="img"
                    aria-label="save"
                    style={{ marginRight: "6px" }}
                  >
                    💾
                  </span>
                  Save Changes
                </button>
                <button
                  className="step-main-domain__cancel-btn"
                  onClick={handleCancel}
                >
                  <span
                    role="img"
                    aria-label="cancel"
                    style={{ marginRight: "6px" }}
                  >
                    ↩️
                  </span>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="step-main-domain__business-content">
              {renderFormattedDetails()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="step-main-domain">
      <h2 className="step-main-domain__title">System Activation Report</h2>
      <p
        className="step-main-domain__subtitle-text"
        style={{
          fontSize: "14px",
          color: "#666",
          maxWidth: "90%",
          margin: "-5px auto 20px",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        This system is blind by default. The moment you complete setup, you
        unlock insight your team has never measured.
      </p>
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
            </div>

            {/* Cost Input Fields */}
            <div className="step-main-domain__cost-inputs">
              <div className="step-main-domain__input-group">
                <label className="step-main-domain__input-label">
                  <span role="img" aria-label="money">
                    💰
                  </span>{" "}
                  Average Order Value ($)
                </label>
                <input
                  type="number"
                  value={domainCostDetails.averageOrderValue}
                  onChange={(e) =>
                    setDomainCostDetails((prev) => ({
                      ...prev,
                      averageOrderValue: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                  className="step-main-domain__cost-input"
                  min="0"
                />
              </div>{" "}
              <div className="step-main-domain__input-group">
                <label className="step-main-domain__input-label">
                  <span role="img" aria-label="investment">
                    💵
                  </span>{" "}
                  Total Website Investment ($)
                </label>
                <input
                  type="number"
                  value={domainCostDetails.totalInvested}
                  onChange={(e) =>
                    setDomainCostDetails((prev) => ({
                      ...prev,
                      totalInvested: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                  className="step-main-domain__cost-input"
                  min="0"
                />
              </div>
            </div>
            <button
              onClick={handleValidateDomain}
              className={`step-main-domain__primary-btn ${
                isValidating ? "step-main-domain__primary-btn--loading" : ""
              }`}
              disabled={!domain || isValidating}
              style={{
                marginTop: "20px",
                width: "99%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {isValidating ? (
                <div
                  className="step-main-domain__loading-state"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
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

            {isValidating && <AnalysisProgress steps={analysisSteps} />}
          </div>{" "}
          {/** Sitemaps */}
          {!isValidating && sitemaps.length > 0 && (
            <div className="step-main-domain__sitemap-section step-main-domain__collapsible-section">
              <div className="step-main-domain__section-toggle">
                <h3 className="step-main-domain__subtitle">
                  <span role="img" aria-label="sitemap">
                    🗺️
                  </span>{" "}
                  Sitemaps
                  {selectedSitemaps.length > 0 && (
                    <span className="step-main-domain__selection-badge">
                      {selectedSitemaps.length} selected
                    </span>
                  )}
                </h3>{" "}
                <button
                  className="step-main-domain__toggle-btn"
                  onClick={() => setIsSitemapExpanded(!isSitemapExpanded)}
                  title={isSitemapExpanded ? "Collapse" : "Expand"}
                >
                  <span
                    style={{
                      transform: isSitemapExpanded ? "rotate(180deg)" : "none",
                    }}
                  >
                    ▼
                  </span>
                </button>
              </div>{" "}
              <div
                className={`step-main-domain__collapsible-content ${
                  isSitemapExpanded ? "expanded" : ""
                }`}
              >
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
                        {selectedSitemaps.length === sitemaps.length ? (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M19 13H5v-2h14v2z"></path>
                            </svg>
                            Deselect All
                          </>
                        ) : (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                            </svg>
                            Select All
                          </>
                        )}
                      </button>
                      <span className="step-main-domain__sitemap-count">
                        {selectedSitemaps.length} of {sitemaps.length} selected
                      </span>
                    </div>
                    <div className="step-main-domain__sitemap-list">
                      {sitemaps.map((sitemap, index) => {
                        // Extract domain and path for better visualization
                        let displayUrl = sitemap;
                        try {
                          const urlObj = new URL(sitemap);
                          displayUrl = `${urlObj.hostname}${urlObj.pathname}`;
                        } catch (e) {
                          // Keep original if invalid URL
                        }

                        return (
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
                                {displayUrl}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {sitemapError && (
                  <div className="step-main-domain__error">{sitemapError}</div>
                )}
                {selectedSitemaps.length > 0 && (
                  <button
                    className={`step-main-domain__analyze-btn ${
                      isFunnelAnalyzing ? "loading" : ""
                    }`}
                    onClick={() => handleSitemapSelection(selectedSitemaps)}
                    disabled={isFunnelAnalyzing}
                  >
                    {isFunnelAnalyzing ? (
                      <>
                        <div className="step-main-domain__btn-spinner"></div>
                        <span>Analyzing Content...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                        </svg>
                        <span>Analyze Content</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}{" "}
          {/* Add the Rate Limit Dialog */}
          <RateLimitDialog />
          {/* Show errors panel if there are any */}
          {!isFunnelAnalyzing && errorsData.count > 0 && <ErrorsInfoPanel />}
          {/* Show analysis section with conditional rendering based on state */}
          <div
            className={`step-main-domain__funnel-section ${
              isFunnelAnalyzing ? "loading" : ""
            }`}
          >
            <h3 className="step-main-domain__subtitle">
              <span role="img" aria-label="funnel">
                📊
              </span>{" "}
              Content Analysis
              {isFunnelAnalyzing && (
                <span className="step-main-domain__loading-badge">
                  <div className="step-main-domain__spinner"></div> Analyzing...
                </span>
              )}
            </h3>

            {/* When no data and not validating - show the prompt */}
            {!isValidating &&
              !isFunnelAnalyzing &&
              funnelAnalysis.totalAnalyzed === 0 && (
                <div className="step-main-domain__empty-state">
                  <div className="step-main-domain__empty-icon">📈</div>
                  <h4>No Content Analysis Data</h4>
                  <p>
                    Select sitemaps and analyze your content to see insights.
                  </p>
                </div>
              )}

            {/* Show loading state when analyzing */}
            {isFunnelAnalyzing && (
              <div className="step-main-domain__analysis-loading">
                <div className="step-main-domain__card-skeleton step-main-domain__skeleton"></div>
                <div className="step-main-domain__chart-skeleton step-main-domain__skeleton"></div>
                <div className="step-main-domain__card-skeleton step-main-domain__skeleton"></div>
              </div>
            )}

            {/* Show results when data is available */}
            {!isFunnelAnalyzing && funnelAnalysis.totalAnalyzed > 0 && (
              <div className="step-main-domain__analysis-content">
                {/* Minimalist Key Metrics */}{" "}
                <div className="step-main-domain__key-metrics">
                  <div className="step-main-domain__total-card">
                    <div className="step-main-domain__total-icon">📄</div>
                    <div className="step-main-domain__total-info">
                      <span className="step-main-domain__total-label">
                        Pages Analyzed
                      </span>
                      <span className="step-main-domain__total-number">
                        {funnelAnalysis.totalAnalyzed}
                      </span>
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className="step-main-domain__score-card">
                    <div className="step-main-domain__score-header">
                      Content Effectiveness
                    </div>
                    <div className="step-main-domain__score-metrics">
                      {funnelAnalysis.psychCompositeSummary?.overall && (
                        <>
                          <div
                            className="step-main-domain__mini-metric"
                            title="Emotional Resonance - How well your content connects on an emotional level"
                            style={{
                              borderTop: `4px solid ${getMetricColor(
                                funnelAnalysis.psychCompositeSummary.overall
                                  .emotionalResonance
                              )}`,
                              "--index": 0,
                            }}
                          >
                            <span>❤️</span>
                            <span>
                              {
                                funnelAnalysis.psychCompositeSummary.overall
                                  .emotionalResonance
                              }
                              %
                            </span>
                          </div>
                          <div
                            className="step-main-domain__mini-metric"
                            title="Cognitive Clarity - How clear and understandable your content is"
                            style={{
                              borderTop: `4px solid ${getMetricColor(
                                funnelAnalysis.psychCompositeSummary.overall
                                  .cognitiveClarity
                              )}`,
                              "--index": 1,
                            }}
                          >
                            <span>🧠</span>
                            <span>
                              {
                                funnelAnalysis.psychCompositeSummary.overall
                                  .cognitiveClarity
                              }
                              %
                            </span>
                          </div>
                          <div
                            className="step-main-domain__mini-metric"
                            title="Persuasion Leverage - How effectively your content persuades visitors"
                            style={{
                              borderTop: `4px solid ${getMetricColor(
                                funnelAnalysis.psychCompositeSummary.overall
                                  .persuasionLeverage
                              )}`,
                              "--index": 2,
                            }}
                          >
                            <span>🎯</span>
                            <span>
                              {
                                funnelAnalysis.psychCompositeSummary.overall
                                  .persuasionLeverage
                              }
                              %
                            </span>
                          </div>
                          <div
                            className="step-main-domain__mini-metric"
                            title="Behavioral Momentum - How well your content drives action"
                            style={{
                              borderTop: `4px solid ${getMetricColor(
                                funnelAnalysis.psychCompositeSummary.overall
                                  .behavioralMomentum
                              )}`,
                              "--index": 3,
                            }}
                          >
                            <span>🔄</span>
                            <span>
                              {
                                funnelAnalysis.psychCompositeSummary.overall
                                  .behavioralMomentum
                              }
                              %
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Streamlined Funnel Distribution */}
                <div className="step-main-domain__funnel-visualization">
                  <h4 className="step-main-domain__funnel-title">
                    Marketing Funnel Distribution
                  </h4>
                  {Object.entries(funnelAnalysis.funnelDistribution)
                    .filter(([stage, _]) => stage !== "Unknown")
                    .map(([stage, count], index) => {
                      const percentage =
                        count > 0
                          ? (
                              (count / funnelAnalysis.totalAnalyzed) *
                              100
                            ).toFixed(1)
                          : 0;

                      // Color palette for stages - updated with RGB values for advanced effects
                      const stageColors = {
                        ToF: "#4CAF50",
                        MoF: "#2196F3",
                        BoF: "#9C27B0",
                        Retention: "#FF5722",
                        Advocacy: "#FFC107",
                      };

                      const stageColorsRGB = {
                        ToF: "76, 175, 80",
                        MoF: "33, 150, 243",
                        BoF: "156, 39, 176",
                        Retention: "255, 87, 34",
                        Advocacy: "255, 193, 7",
                      };

                      // Icons for stages
                      const stageIcons = {
                        ToF: "🌱",
                        MoF: "🔍",
                        BoF: "🛒",
                        Retention: "🔄",
                        Advocacy: "📣",
                      };

                      // Labels for stages
                      const stageLabels = {
                        ToF: "Awareness",
                        MoF: "Consideration",
                        BoF: "Decision",
                        Retention: "Retention",
                        Advocacy: "Advocacy",
                      };

                      return (
                        <div
                          key={stage}
                          className="step-main-domain__funnel-stage"
                          style={{
                            "--stage-color": stageColors[stage],
                            "--stage-color-rgb": stageColorsRGB[stage],
                            "--index": index,
                          }}
                        >
                          <div className="step-main-domain__funnel-stage-header">
                            <div className="step-main-domain__funnel-stage-icon">
                              {stageIcons[stage]}
                            </div>
                            <div className="step-main-domain__funnel-stage-info">
                              <div className="step-main-domain__funnel-stage-name">
                                {stageLabels[stage]}
                              </div>
                              <div className="step-main-domain__funnel-stage-count">
                                {count} {count === 1 ? "page" : "pages"}
                              </div>
                            </div>
                            <div className="step-main-domain__funnel-stage-percentage">
                              {percentage}%
                            </div>
                          </div>
                          <div className="step-main-domain__funnel-progress-container">
                            <div
                              className="step-main-domain__funnel-progress-bar"
                              style={{
                                width: `${percentage}%`,
                                "--index": index,
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {/* Expandable Sections - Framework Coverage */}
                <div className="step-main-domain__collapsible-section">
                  <div className="step-main-domain__section-toggle">
                    <h4 className="step-main-domain__analysis-title">
                      <span role="img" aria-label="framework">
                        📐
                      </span>{" "}
                      Marketing Framework Coverage
                    </h4>
                    <button
                      className="step-main-domain__toggle-btn"
                      onClick={() =>
                        document
                          .getElementById("frameworkSection")
                          .classList.toggle("expanded")
                      }
                    >
                      <span>▼</span>
                    </button>
                  </div>

                  <div
                    id="frameworkSection"
                    className="step-main-domain__collapsible-content"
                  >
                    {" "}
                    {funnelAnalysis.frameworkCoverage &&
                    funnelAnalysis.frameworkCoverage.length > 0 ? (
                      <div className="step-main-domain__framework-table-container">
                        <table className="step-main-domain__framework-table">
                          <thead>
                            <tr>
                              <th>Stage</th>
                              <th>Coverage</th>
                              <th>Status</th>
                              <th>Applied Frameworks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {funnelAnalysis.frameworkCoverage.map(
                              (framework) => {
                                // Determine RAG color
                                let ragColor, statusClass;
                                switch (framework.rag) {
                                  case "Red":
                                    ragColor = "#f44336";
                                    statusClass = "status-red";
                                    break;
                                  case "Amber":
                                    ragColor = "#ff9800";
                                    statusClass = "status-amber";
                                    break;
                                  case "Green":
                                    ragColor = "#4caf50";
                                    statusClass = "status-green";
                                    break;
                                  default:
                                    ragColor = "#9e9e9e";
                                    statusClass = "status-neutral";
                                }

                                return (
                                  <tr key={framework.stage}>
                                    <td className="step-main-domain__framework-stage-cell">
                                      {framework.stage}
                                    </td>
                                    <td className="step-main-domain__framework-coverage-cell">
                                      {" "}
                                      <div className="step-main-domain__framework-coverage-wrapper">
                                        <span className="step-main-domain__framework-coverage-text">
                                          {framework.applied} of{" "}
                                          {framework.total}
                                        </span>
                                        <div className="step-main-domain__framework-bar">
                                          <div
                                            className="step-main-domain__framework-progress"
                                            style={{
                                              width: `${framework.percent}%`,
                                              backgroundColor: ragColor,
                                            }}
                                            data-progress={`${framework.percent}%`}
                                          ></div>
                                        </div>
                                        <span className="step-main-domain__framework-percent">
                                          {framework.percent}%
                                        </span>
                                      </div>
                                    </td>
                                    <td className="step-main-domain__framework-status-cell">
                                      {" "}
                                      <div
                                        className={`step-main-domain__framework-status ${statusClass}`}
                                      >
                                        {framework.rag}
                                      </div>
                                    </td>
                                    <td className="step-main-domain__framework-tags-cell">
                                      <div className="step-main-domain__framework-tags">
                                        {framework.frameworks.map((fw, idx) => (
                                          <span
                                            key={idx}
                                            className="step-main-domain__framework-tag"
                                          >
                                            {fw}
                                          </span>
                                        ))}
                                        {framework.frameworks.length === 0 && (
                                          <span className="step-main-domain__framework-empty">
                                            No frameworks applied
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="step-main-domain__no-data">
                        No framework data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
          Continue to Content Decay
          <span className="step-main-domain__next-icon">→</span>
        </button>
      </div>
    </div>
  );
};

export default StepMainDomain;
