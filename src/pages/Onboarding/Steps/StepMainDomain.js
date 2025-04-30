import React, { useState, useEffect } from "react";
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

  /* ────────────────────────────────
     1. Validate domain ⟵ **updated**
  ──────────────────────────────── */
  const handleValidateDomain = async () => {
    if (!domain || isSaving) return;

    setIsValidating(true);
    setError("");
    setSitemapError("");

    // Reset all steps
    setAnalysisSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" }))
    );

    try {
      // Update domain validation step
      updateStepStatus(0, "loading");
      const domainValidation = await formatAndValidateDomain(domain);
      if (!domainValidation.success) {
        updateStepStatus(0, "error", domainValidation.error);
        throw new Error(domainValidation.error);
      }
      updateStepStatus(0, "completed");
      setDomain(domainValidation.formattedDomain);

      // Start parallel operations with visual feedback
      updateStepStatus(1, "loading");
      updateStepStatus(2, "loading");
      updateStepStatus(3, "loading");
      updateStepStatus(4, "loading");

      const [
        sitemapResponse,
        metricsResponse,
        locationResponse,
        businessDetailsResponse,
      ] = await Promise.all([
        // Fetch sitemaps
        fetch(
          `https://ai.1upmedia.com:443/sitemap?site=${encodeURIComponent(
            domainValidation.formattedDomain
          )}`,
          { headers: { Accept: "application/json" } }
        ),

        // Fetch domain metrics
        fetch("https://ai.1upmedia.com:443/get-domain-authority", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site_url: `https://${domainValidation.formattedDomain}`,
            include_majestic: true,
          }),
        }),

        // Fetch business location
        fetch(
          `https://ai.1upmedia.com:443/get-business-location?url=${encodeURIComponent(
            domainValidation.formattedDomain
          )}`
        ),

        // Fetch business details
        fetch("https://ai.1upmedia.com:443/get-business-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: domainValidation.formattedDomain,
          }),
        }),
      ]);

      // Update status for each completed operation
      if (sitemapResponse.ok) {
        updateStepStatus(1, "completed");
      } else {
        updateStepStatus(1, "error");
      }

      if (metricsResponse.ok) {
        updateStepStatus(2, "completed");
      } else {
        updateStepStatus(2, "error");
      }

      if (locationResponse.ok) {
        updateStepStatus(3, "completed");
      } else {
        updateStepStatus(3, "error");
      }

      if (businessDetailsResponse.ok) {
        updateStepStatus(4, "completed");
      } else {
        updateStepStatus(4, "error");
      }

      // Process sitemap response
      const sitemapData = await sitemapResponse.json();
      if (!sitemapResponse.ok) {
        throw new Error(sitemapData.error || "Failed to fetch sitemaps");
      }
      const xmlList = [
        ...(sitemapData.data.mainXML || []),
        ...(sitemapData.data.blindXML || []),
      ];
      setSitemaps(xmlList);
      setIsSitemapValidated(xmlList.length > 0);
      if (!xmlList.length) {
        setSitemapError("No sitemaps found. Please provide manually.");
      }

      // Process metrics response
      const metricsData = await metricsResponse.json();
      if (!metricsResponse.ok) {
        throw new Error(
          metricsData.detail?.message || "Failed to analyze domain"
        );
      }
      const analysisResult = {
        domainAuthority: metricsData.detail.domain_authority,
        pageAuthority: metricsData.detail.page_authority,
        trustFlow: metricsData.detail.majestic?.majesticTF || 5,
        citationFlow: metricsData.detail.majestic?.majesticCF || 32,
      };
      setAnalysisData(analysisResult);
      onboardingData.initialAnalysisState = analysisResult;

      // Process location response
      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        if (locationData.detail) {
          setLocation(locationData.detail);
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
      }

      setIsValidated(true);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "step-main-domain__notification step-main-domain__notification--success";
      notification.textContent =
        "Site validation and analysis completed successfully!";
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      setError(error.message || "Validation process failed. Please try again.");
      console.error("Error in validation process:", error);
      setIsValidated(false);
      setIsSitemapValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  /* ────────────────────────────────
     2. Fetch sitemaps (unchanged)

  /* ────────────────────────────────
     3. Analyze domain (updated)
  ──────────────────────────────── */
  const handleAnalyzeDomain = async () => {
    if (!domain || !isValidated) return;

    setIsAnalyzing(true);
    setError("");

    try {
      // First fetch domain metrics
      const metricsResponse = await fetch(
        "https://ai.1upmedia.com:443/get-domain-authority",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site_url: `https://${domain}`,
            include_majestic: true,
          }),
        }
      );

      const { detail } = await metricsResponse.json();
      const data = detail;

      if (!metricsResponse.ok) {
        throw new Error(data.message || "Failed to analyze domain");
      }

      // Then fetch business location
      const locationResponse = await fetch(
        `https://ai.1upmedia.com:443/get-business-location?url=${encodeURIComponent(
          domain
        )}`
      );

      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        if (locationData.detail) {
          setLocation(locationData.detail);
        }
      }

      const analysisResult = {
        domainAuthority: data.domain_authority,
        pageAuthority: data.page_authority,
        trustFlow: data.majestic?.majesticTF || 5,
        citationFlow: data.majestic?.majesticCF || 32,
      };

      setAnalysisData(analysisResult);
      onboardingData.initialAnalysisState = analysisResult;
    } catch (error) {
      setError(error.message || "Failed to analyze domain. Please try again.");
      console.error("Error analyzing domain:", error);
    } finally {
      setIsAnalyzing(false);
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
     Save + next (updated)
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

  const MetricInput = ({ label, value }) => (
    <div className="step-main-domain__metric">
      <label className="step-main-domain__metric-label">
        <strong>{label}:</strong>
        <input
          type="number"
          value={value}
          className="step-main-domain__metric-input"
        />
      </label>
    </div>
  );

  const DomainSection = () => (
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
  );

  const MetricsDisplay = () =>
    analysisData.domainAuthority && (
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
              description: "Indicates how influential the site might be",
              color: "#FF9800",
            },
          ].map(({ label, key, icon, description, color }) => (
            <div
              key={key}
              className="step-main-domain__metric-card"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <div className="step-main-domain__metric-header">
                <span className="step-main-domain__metric-icon">{icon}</span>
                <h4 className="step-main-domain__metric-title">{label}</h4>
              </div>
              <p className="step-main-domain__metric-description">
                {description}
              </p>
              <div className="step-main-domain__metric-value-container">
                <input
                  type="number"
                  className="step-main-domain__metric-input"
                  value={analysisData[key]}
                  onChange={(e) => {
                    const value = Math.min(
                      100,
                      Math.max(0, Number(e.target.value))
                    );
                    setAnalysisData((prev) => ({
                      ...prev,
                      [key]: value,
                    }));
                  }}
                  min="0"
                  max="100"
                />
                <div
                  className="step-main-domain__metric-progress"
                  style={{
                    "--progress": `${analysisData[key]}%`,
                    "--color": color,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  const SitemapsDisplay = () =>
    sitemaps.length > 0 && (
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
                <div key={index} className="step-main-domain__sitemap-item">
                  <label className="step-main-domain__checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedSitemaps.includes(sitemap)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSitemaps((prev) => [...prev, sitemap]);
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
      </div>
    );

  const LocationDisplay = () => (
    <div className="step-main-domain__section">
      <h3 className="step-main-domain__subtitle">Business Location</h3>
      <div className="step-main-domain__location-card">
        <input
          type="text"
          className="step-main-domain__location-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter business location"
        />
      </div>
    </div>
  );

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
          <DomainSection />
          <MetricsDisplay />
          <SitemapsDisplay />
          <LocationDisplay />
        </div>

        {businessDetails && (
          <div className="step-main-domain__side-content">
            <BusinessDetailsDisplay />
          </div>
        )}
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
