import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useAuth } from "../../../context/AuthContext";
import "./StepMainDomain.css";
import Loader from "../../../components/Loader";

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

  useEffect(() => {
    setDomain(onboardingData.domain || "");
    setLocation(onboardingData.location || "");
    setAnalysisData(onboardingData.initialAnalysisState);
  }, [onboardingData]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  /* ────────────────────────────────
     1. Validate domain ⟵ **updated**
  ──────────────────────────────── */
  const handleValidateDomain = async () => {
    if (!domain) return;

    setIsValidating(true);
    setError("");
    setSitemapError("");

    try {
      // 1. First validate the domain
      const domainValidation = await formatAndValidateDomain(domain);

      if (!domainValidation.success) {
        throw new Error(domainValidation.error);
      }

      console.log("Domain validation successful:", domainValidation);
      setDomain(domainValidation.formattedDomain);

      // 2. Then fetch sitemaps
      const res = await fetch(
        `https://ai.1upmedia.com:443/sitemap?site=${encodeURIComponent(
          domainValidation.formattedDomain
        )}`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to fetch sitemaps");
      }

      const { data } = await res.json();
      const xmlList = [...(data.mainXML || []), ...(data.blindXML || [])];

      if (xmlList.length) {
        setSitemaps(xmlList);
        setIsSitemapValidated(true);
      } else {
        setSitemapError("No sitemaps found. Please provide manually.");
      }
      setIsValidated(true);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "step-main-domain__notification step-main-domain__notification--success";
      notification.textContent = "Domain validated successfully!";
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      setError(error.message || "Failed to validate domain. Please try again.");
      console.error("Error validating domain:", error);
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
  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const filteredSiteData = {
        URL: domain,
        location,
        dynamic_fields: { ...analysisData },
        sitemaps: selectedSitemaps,
      };

      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/updateBusinessdetails",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, siteData: filteredSiteData }),
        }
      );

      if (!response.ok) throw new Error("Failed to save domain details");

      const notification = document.createElement("div");
      notification.className =
        "step-main-domain__notification step-main-domain__notification--success";
      notification.textContent = "Domain details saved successfully!";
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      console.error("Error saving domain details:", error);
      setError("Failed to save domain details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    setOnboardingData((prev) => ({
      ...prev,
      domain,
      location,
      siteAnalysis: analysisData,
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

  const MetricInput = ({ label, value, onChange }) => (
    <div className="step-main-domain__metric">
      <label className="step-main-domain__metric-label">
        <strong>{label}:</strong>
        <div className="step-main-domain__metric-input-wrapper">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="step-main-domain__metric-input"
            min="0"
            max="100"
          />
          <div className="step-main-domain__metric-bar">
            <div
              className="step-main-domain__metric-progress"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </label>
    </div>
  );

  return (
    <div className="step-main-domain">
      <h2 className="step-main-domain__title">Main Domain Setup</h2>

      {error && <div className="step-main-domain__error">{error}</div>}

      {/* ── domain input + buttons ⟵ **updated** ─────────────────── */}
      <div className="step-main-domain__input-group">
        <div className="step-main-domain__input-wrapper">
          <label className="step-main-domain__label">
            <strong>Domain:</strong>
            <div className="step-main-domain__input-container">
              <input
                type="text"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setIsValidated(false);
                  setIsSitemapValidated(false);
                }}
                placeholder="Enter your domain (e.g., example.com)"
                className={`step-main-domain__input ${
                  isValidated ? "step-main-domain__input--validated" : ""
                }`}
                disabled={isValidating || isAnalyzing}
              />
              {isValidated && (
                <div className="step-main-domain__validation-success">
                  <CheckMarkIcon />
                  <span>Site validated successfully!</span>
                </div>
              )}
              {isSitemapValidated && (
                <div className="step-main-domain__validation-success">
                  <CheckMarkIcon />
                  <span>Sitemaps found successfully!</span>
                </div>
              )}

              {(sitemaps.length > 0 || sitemapError) && (
                <div className="step-main-domain__sitemaps">
                  <h4>Sitemaps</h4>
                  {sitemapError ? (
                    <div className="step-main-domain__sitemap-error">
                      {sitemapError}
                    </div>
                  ) : (
                    <div className="step-main-domain__sitemap-container">
                      <div className="step-main-domain__sitemap-header">
                        <label className="step-main-domain__checkbox-label">
                          <input
                            type="checkbox"
                            checked={
                              selectedSitemaps.length === sitemaps.length
                            }
                            onChange={(e) => {
                              setSelectedSitemaps(
                                e.target.checked ? [...sitemaps] : []
                              );
                            }}
                          />
                          Select All
                        </label>
                      </div>
                      <ul className="step-main-domain__sitemap-list">
                        {sitemaps.map((sitemap, index) => (
                          <li
                            key={index}
                            className="step-main-domain__sitemap-item"
                          >
                            <label className="step-main-domain__checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedSitemaps.includes(sitemap)}
                                onChange={(e) => {
                                  setSelectedSitemaps((prev) =>
                                    e.target.checked
                                      ? [...prev, sitemap]
                                      : prev.filter((s) => s !== sitemap)
                                  );
                                }}
                              />
                              <a
                                href={sitemap}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {sitemap}
                              </a>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </label>
        </div>

        <div className="step-main-domain__action-container">
          {!isValidated ? (
            <button
              onClick={handleValidateDomain}
              disabled={!domain || isValidating}
              className={`step-main-domain__validate-btn ${
                isValidating ? "step-main-domain__validate-btn--validating" : ""
              }`}
            >
              {isValidating ? (
                <>
                  <span className="step-main-domain__spinner-small" />
                  Validating Site...
                </>
              ) : (
                "Validate Site"
              )}
            </button>
          ) : (
            <button
              onClick={handleAnalyzeDomain}
              disabled={!domain || isAnalyzing}
              className={`step-main-domain__analyze-btn ${
                isAnalyzing ? "step-main-domain__analyze-btn--analyzing" : ""
              }`}
            >
              {isAnalyzing ? (
                <>
                  <span className="step-main-domain__spinner-small" />
                  Fetching Site Metrics...
                </>
              ) : (
                "Get Site Metrics"
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── analysis metrics ───────────────────────── */}
      {analysisData.domainAuthority && (
        <div className="step-main-domain__analysis">
          <h3 className="step-main-domain__subtitle">Site Analysis Results</h3>
          <div className="step-main-domain__metrics-grid">
            <MetricInput
              label="Domain Authority (DA)"
              value={analysisData.domainAuthority}
              onChange={(value) =>
                setAnalysisData((prev) => ({ ...prev, domainAuthority: value }))
              }
            />
            <MetricInput
              label="Page Authority (PA)"
              value={analysisData.pageAuthority}
              onChange={(value) =>
                setAnalysisData((prev) => ({ ...prev, pageAuthority: value }))
              }
            />
            <MetricInput
              label="Trust Flow"
              value={analysisData.trustFlow}
              onChange={(value) =>
                setAnalysisData((prev) => ({ ...prev, trustFlow: value }))
              }
            />
            <MetricInput
              label="Citation Flow"
              value={analysisData.citationFlow}
              onChange={(value) =>
                setAnalysisData((prev) => ({ ...prev, citationFlow: value }))
              }
            />
          </div>
        </div>
      )}

      {/* ── location input ─────────────────────────── */}
      <div className="step-main-domain__input-group">
        <label className="step-main-domain__label">
          <strong>Location:</strong>
          <div className="step-main-domain__input-container">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location (e.g., New York, USA)"
              className="step-main-domain__input"
              disabled={isLocationLoading}
            />
            <button
              onClick={async () => {
                setIsLocationLoading(true);
                try {
                  const response = await fetch(
                    `https://ai.1upmedia.com:443/get-business-location?url=${encodeURIComponent(
                      domain
                    )}`
                  );
                  if (response.ok) {
                    const data = await response.json();
                    if (data.detail) {
                      setLocation(data.detail);
                    }
                  }
                } catch (error) {
                  console.error("Error fetching location:", error);
                  setError("Failed to fetch location");
                } finally {
                  setIsLocationLoading(false);
                }
              }}
              className="step-main-domain__get-location-btn"
              disabled={!domain || isLocationLoading}
            >
              {isLocationLoading ? (
                <>
                  <span className="step-main-domain__spinner-small" />
                  Loading...
                </>
              ) : (
                "Get Location"
              )}
            </button>
          </div>
        </label>
      </div>

      {/* ── action buttons ─────────────────────────── */}
      <div className="step-main-domain__button-group">
        <button
          onClick={handleSave}
          disabled={!domain || !location || isSaving}
          className={`step-main-domain__save-btn ${
            isSaving ? "step-main-domain__save-btn--saving" : ""
          }`}
        >
          {isSaving ? (
            <>
              <span className="step-main-domain__spinner-small" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
        <button
          onClick={handleNext}
          disabled={!domain || !location || isSaving}
          className="step-main-domain__next-btn"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StepMainDomain;
