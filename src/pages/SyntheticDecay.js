import React, { useState } from "react";
import Loader from "../components/Loader";
import "./SyntheticDecay.css";

const SyntheticDecay = () => {
  // State management for comprehensive decay analysis
  const [domain, setDomain] = useState("");
  const [totalInvestment, setTotalInvestment] = useState("");
  const [avgOrderValue, setAvgOrderValue] = useState("");
  const [urlCountOverride, setUrlCountOverride] = useState("");
  const [selectedDays, setSelectedDays] = useState(180);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [urlCount, setUrlCount] = useState(0);

  // Available day options for the slider
  const dayOptions = [7, 30, 60, 180, 365, 547];
  // Global constants
  const MIN_RETAIN = 0.15; // 15% minimum retention

  // Decay calculation functions
  const calculateDecayModels = (startValue, days) => {
    const MIN_VAL = MIN_RETAIN * startValue;

    // Baseline model: r(d) = e^(-k₁·d) where k₁ = 0.0035
    const baseline = Math.max(startValue * Math.exp(-0.0035 * days), MIN_VAL);

    // Cannibalization model: r(d) = e^(-k₂·d) where k₂ = 0.0042
    const cannibal = Math.max(startValue * Math.exp(-0.0042 * days), MIN_VAL);

    // DA vs KD mismatch model: piecewise exponential
    let dakd;
    if (days <= 60) {
      dakd = startValue * Math.exp(-0.003 * days);
    } else {
      dakd =
        startValue * Math.exp(-0.003 * 60) * Math.exp(-0.006 * (days - 60));
    }
    dakd = Math.max(dakd, MIN_VAL);

    // Content-waste plateau model: step function
    let plateauMultiplier;
    if (days <= 7) plateauMultiplier = 1.0;
    else if (days <= 30) plateauMultiplier = 0.85;
    else if (days <= 60) plateauMultiplier = 0.65;
    else if (days <= 90) plateauMultiplier = 0.4;
    else if (days <= 180) plateauMultiplier = 0.2;
    else plateauMultiplier = 0.15;

    const plateau = Math.max(startValue * plateauMultiplier, MIN_VAL);

    // Calculate aggregate metrics
    const currentContentValue = (baseline + cannibal + dakd + plateau) / 4;
    const contentDecayPercent = (1 - currentContentValue / startValue) * 100;

    return {
      models: {
        baseline,
        cannibal,
        daKdMismatch: dakd,
        plateau,
      },
      currentContentValue,
      contentDecayPercent,
      startValue,
    };
  };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  // Helper function to normalize domain
  const normalizeDomain = (domainInput) => {
    let normalized = domainInput.toLowerCase().trim();
    // Remove protocol if present
    normalized = normalized.replace(/^https?:\/\//, "");
    // Remove www. if present
    normalized = normalized.replace(/^www\./, "");
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, "");
    return normalized;
  };
  // Helper function to fetch sitemap URLs using the API
  const fetchSitemapUrls = async (domainName) => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/sitemap?site=${encodeURIComponent(
          domainName
        )}&includeSites=true`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sitemap data");
      }

      const sitemapData = await response.json();

      // Extract URLs from sitemapData.data.sites
      if (
        sitemapData.data &&
        sitemapData.data.sites &&
        Array.isArray(sitemapData.data.sites)
      ) {
        // Return top 100 URLs
        return sitemapData.data.sites.slice(0, 100);
      }

      return [];
    } catch (error) {
      console.error("Error fetching sitemap:", error);
      throw error;
    }
  };

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      setError("Please enter a valid domain");
      return;
    }

    if (!totalInvestment.trim() || isNaN(parseFloat(totalInvestment))) {
      setError("Please enter a valid total investment amount");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    setResults(null);
    setAnalysisProgress("Fetching sitemap URLs...");

    try {
      const normalizedDomain = normalizeDomain(domain);

      if (!normalizedDomain.includes(".")) {
        throw new Error("Please enter a valid domain name");
      }

      // Determine URL count
      let finalUrlCount = 0;

      if (urlCountOverride && !isNaN(parseInt(urlCountOverride))) {
        // Use manual override if provided
        finalUrlCount = parseInt(urlCountOverride);
        setUrlCount(finalUrlCount);
        setAnalysisProgress("Using manual URL count...");
      } else {
        // Try to fetch from sitemap
        setAnalysisProgress("Parsing sitemap and extracting URLs...");
        try {
          const urls = await fetchSitemapUrls(normalizedDomain);
          finalUrlCount = urls.length;
          setUrlCount(finalUrlCount);

          if (finalUrlCount === 0) {
            throw new Error(
              "No URLs found in sitemap. Please enter URL count manually."
            );
          }
        } catch (sitemapError) {
          throw new Error(
            "Failed to fetch sitemap. Please enter URL count manually in the override field."
          );
        }
      }

      setAnalysisProgress("Calculating content decay models..."); // Calculate start value (V0) - FIXED LOGIC
      const avgOrderVal = avgOrderValue ? parseFloat(avgOrderValue) : null;
      const totalInvest = parseFloat(totalInvestment);

      // Start value should never exceed total investment
      let startValue;
      if (avgOrderVal) {
        // If AOV is provided, calculate potential value but cap at investment
        const potentialValue = finalUrlCount * avgOrderVal;
        startValue = Math.min(potentialValue, totalInvest);
      } else {
        // Use total investment as start value
        startValue = totalInvest;
      }

      // Calculate decay using the comprehensive model
      const decayResults = calculateDecayModels(startValue, selectedDays);

      // Calculate financial loss
      const financialLoss = startValue - decayResults.currentContentValue;

      setResults({
        domain: normalizedDomain,
        urlCount: finalUrlCount,
        totalInvestment: totalInvest,
        avgOrderValue: avgOrderVal,
        selectedDays,
        startValue,
        ...decayResults,
        financialLoss,
        // Legacy compatibility fields
        totalUrls: finalUrlCount,
        decayPercentage: decayResults.contentDecayPercent,
        totalLoss: financialLoss,
        avgCostPerUrl: startValue / finalUrlCount,
      });
    } catch (err) {
      console.error("Error during analysis:", err);
      setError(err.message || "An error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };
  // Effect to recalculate when slider changes
  React.useEffect(() => {
    if (urlCount > 0 && totalInvestment && !isAnalyzing) {
      const avgOrderVal = avgOrderValue ? parseFloat(avgOrderValue) : null;
      const totalInvest = parseFloat(totalInvestment);

      // Fixed logic: cap start value at total investment
      let startValue;
      if (avgOrderVal) {
        const potentialValue = urlCount * avgOrderVal;
        startValue = Math.min(potentialValue, totalInvest);
      } else {
        startValue = totalInvest;
      }

      if (startValue > 0) {
        const decayResults = calculateDecayModels(startValue, selectedDays);
        const financialLoss = startValue - decayResults.currentContentValue;

        setResults((prev) =>
          prev
            ? {
                ...prev,
                selectedDays,
                startValue,
                ...decayResults,
                financialLoss,
                decayPercentage: decayResults.contentDecayPercent,
                totalLoss: financialLoss,
                avgCostPerUrl: startValue / urlCount,
              }
            : null
        );
      }
    }
  }, [selectedDays, totalInvestment, avgOrderValue, urlCount, isAnalyzing]);

  return (
    <div className="synthetic-decay">
      <div className="synthetic-decay__header">
        <h1>🔬 Synthetic Decay TESTER from Sitemap</h1>
        <p className="synthetic-decay__description">
          Analyze your sitemap to identify potential content decay patterns and
          calculate investment risk.
        </p>
      </div>{" "}
      {/* Input Section */}
      <div className="synthetic-decay__input-section">
        <div className="synthetic-decay__input-group">
          <label htmlFor="domain-input" className="synthetic-decay__label">
            Domain Name
          </label>
          <input
            id="domain-input"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter your domain (e.g., example.com)"
            className="synthetic-decay__input"
            disabled={isAnalyzing}
          />
        </div>

        <div className="synthetic-decay__input-group">
          <label htmlFor="investment-input" className="synthetic-decay__label">
            Total Website Investment ($)
          </label>
          <input
            id="investment-input"
            type="number"
            value={totalInvestment}
            onChange={(e) => setTotalInvestment(e.target.value)}
            placeholder="Enter total investment amount"
            className="synthetic-decay__input"
            disabled={isAnalyzing}
            step="0.01"
            min="0"
          />
        </div>

        <div className="synthetic-decay__input-group">
          <label htmlFor="aov-input" className="synthetic-decay__label">
            Average Order Value ($) - Optional
          </label>
          <input
            id="aov-input"
            type="number"
            value={avgOrderValue}
            onChange={(e) => setAvgOrderValue(e.target.value)}
            placeholder="Average revenue per order (optional)"
            className="synthetic-decay__input"
            disabled={isAnalyzing}
            step="0.01"
            min="0"
          />{" "}
          <small className="synthetic-decay__input-help">
            If provided, start value = min(URL count × AOV, Total Investment).
            Otherwise uses total investment.
          </small>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !domain.trim() || !totalInvestment.trim()}
          className="synthetic-decay__button synthetic-decay__button--primary"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Content Decay"}
        </button>
      </div>
      {/* Days Slider Section */}
      {(results || urlCount > 0) && (
        <div className="synthetic-decay__slider-section">
          <label className="synthetic-decay__slider-label">
            Time Period: {selectedDays} days
          </label>
          <div className="synthetic-decay__slider-container">
            <input
              type="range"
              min="0"
              max={dayOptions.length - 1}
              value={dayOptions.indexOf(selectedDays)}
              onChange={(e) =>
                setSelectedDays(dayOptions[parseInt(e.target.value)])
              }
              className="synthetic-decay__slider"
              disabled={isAnalyzing}
            />
            <div className="synthetic-decay__slider-labels">
              {dayOptions.map((day, index) => (
                <span
                  key={day}
                  className={`synthetic-decay__slider-tick ${
                    selectedDays === day ? "active" : ""
                  }`}
                >
                  {day}d
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Error Display */}
      {error && (
        <div className="synthetic-decay__error">
          <span className="synthetic-decay__error-icon">⚠️</span>
          {error}
        </div>
      )}{" "}
      {/* Loading State */}
      {isAnalyzing && (
        <div className="synthetic-decay__loading">
          <Loader />
          <p>
            {analysisProgress || "Analyzing your sitemap for decay patterns..."}
          </p>
        </div>
      )}{" "}
      {/* Results Display */}
      {results && !isAnalyzing && (
        <div className="synthetic-decay__results">
          <h2>📊 Content Decay Analysis for {results.domain}</h2>

          {/* Key Metrics */}
          <div className="synthetic-decay__results-grid">
            <div className="synthetic-decay__result-card">
              <h3>Total Investment</h3>
              <div className="synthetic-decay__result-value">
                {formatCurrency(results.totalInvestment)}
              </div>
              <div className="synthetic-decay__result-description">
                Original investment in website content
              </div>
            </div>

            <div className="synthetic-decay__result-card">
              <h3>Current Content Value</h3>
              <div className="synthetic-decay__result-value">
                {formatCurrency(results.currentContentValue)}
              </div>
              <div className="synthetic-decay__result-description">
                Estimated current value after {results.selectedDays} days
              </div>
            </div>

            <div className="synthetic-decay__result-card">
              <h3>Content Decay</h3>
              <div className="synthetic-decay__result-value">
                {results.contentDecayPercent.toFixed(1)}%
              </div>
              <div className="synthetic-decay__result-description">
                Average decay across all models
              </div>
            </div>

            <div className="synthetic-decay__result-card">
              <h3>Financial Loss</h3>
              <div className="synthetic-decay__result-value">
                {formatCurrency(results.financialLoss)}
              </div>
              <div className="synthetic-decay__result-description">
                Estimated lost value from content decay
              </div>
            </div>
          </div>

          {/* Decay Models Breakdown */}
          <div className="synthetic-decay__models-section">
            <h3>🔬 Decay Model Analysis</h3>
            <div className="synthetic-decay__models-grid">
              <div className="synthetic-decay__model-card">
                <h4>Baseline Model</h4>
                <div className="synthetic-decay__model-value">
                  {formatCurrency(results.models.baseline)}
                </div>
                <div className="synthetic-decay__model-description">
                  Normal ranking fade over time
                </div>
                <div className="synthetic-decay__model-decay">
                  {(
                    (1 - results.models.baseline / results.startValue) *
                    100
                  ).toFixed(1)}
                  % decay
                </div>
              </div>

              <div className="synthetic-decay__model-card">
                <h4>Cannibalization</h4>
                <div className="synthetic-decay__model-value">
                  {formatCurrency(results.models.cannibal)}
                </div>
                <div className="synthetic-decay__model-description">
                  Competition between similar pages
                </div>
                <div className="synthetic-decay__model-decay">
                  {(
                    (1 - results.models.cannibal / results.startValue) *
                    100
                  ).toFixed(1)}
                  % decay
                </div>
              </div>

              <div className="synthetic-decay__model-card">
                <h4>DA vs KD Mismatch</h4>
                <div className="synthetic-decay__model-value">
                  {formatCurrency(results.models.daKdMismatch)}
                </div>
                <div className="synthetic-decay__model-description">
                  Domain authority vs keyword difficulty penalties
                </div>
                <div className="synthetic-decay__model-decay">
                  {(
                    (1 - results.models.daKdMismatch / results.startValue) *
                    100
                  ).toFixed(1)}
                  % decay
                </div>
              </div>

              <div className="synthetic-decay__model-card">
                <h4>Content Plateau</h4>
                <div className="synthetic-decay__model-value">
                  {formatCurrency(results.models.plateau)}
                </div>
                <div className="synthetic-decay__model-description">
                  Step-wise content degradation
                </div>
                <div className="synthetic-decay__model-decay">
                  {(
                    (1 - results.models.plateau / results.startValue) *
                    100
                  ).toFixed(1)}
                  % decay
                </div>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="synthetic-decay__summary-stats">
            <h3>📈 Summary Statistics</h3>
            <div className="synthetic-decay__stats-grid">
              <div className="synthetic-decay__stat-item">
                <span className="synthetic-decay__stat-label">Domain:</span>
                <span className="synthetic-decay__stat-value">
                  {results.domain}
                </span>
              </div>
              <div className="synthetic-decay__stat-item">
                <span className="synthetic-decay__stat-label">Total URLs:</span>
                <span className="synthetic-decay__stat-value">
                  {results.urlCount.toLocaleString()}
                </span>
              </div>
              <div className="synthetic-decay__stat-item">
                <span className="synthetic-decay__stat-label">
                  Analysis Period:
                </span>
                <span className="synthetic-decay__stat-value">
                  {results.selectedDays} days
                </span>
              </div>
              <div className="synthetic-decay__stat-item">
                <span className="synthetic-decay__stat-label">
                  Start Value:
                </span>
                <span className="synthetic-decay__stat-value">
                  {formatCurrency(results.startValue)}
                </span>
              </div>
              {results.avgOrderValue && (
                <div className="synthetic-decay__stat-item">
                  <span className="synthetic-decay__stat-label">
                    Avg Order Value:
                  </span>
                  <span className="synthetic-decay__stat-value">
                    {formatCurrency(results.avgOrderValue)}
                  </span>
                </div>
              )}
              <div className="synthetic-decay__stat-item">
                <span className="synthetic-decay__stat-label">
                  Cost per URL:
                </span>
                <span className="synthetic-decay__stat-value">
                  {formatCurrency(results.avgCostPerUrl)}
                </span>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="synthetic-decay__summary">
            <h3>💡 Analysis Summary</h3>
            <div className="synthetic-decay__summary-content">
              <p>
                <strong>Calculation Method:</strong> Uses four decay models
                (Baseline, Cannibalization, DA/KD Mismatch, Content Plateau)
                with a minimum retention floor of 15%.
              </p>
              <p>
                <strong>Start Value:</strong>{" "}
                {results.avgOrderValue
                  ? `Calculated as ${results.urlCount} URLs × ${formatCurrency(
                      results.avgOrderValue
                    )} AOV = ${formatCurrency(results.startValue)}`
                  : `Based on total investment of ${formatCurrency(
                      results.totalInvestment
                    )}`}
              </p>
              <p>
                <strong>Key Insight:</strong> After {results.selectedDays} days,
                your content retains approximately{" "}
                {(
                  (results.currentContentValue / results.startValue) *
                  100
                ).toFixed(1)}
                % of its original value.
              </p>
              <p>
                <strong>Recommendation:</strong> Use the time slider above to
                see how decay progresses over different periods and plan your
                content refresh strategy accordingly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyntheticDecay;
