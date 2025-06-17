import React, { useState } from "react";
import Loader from "../components/Loader";
import "./SyntheticDecay.css";

// Global constants
const MIN_RETAIN = 0.15; // 15% minimum retention

// Helper function to fetch individual sitemap XML links with metadata
const fetchSitemapLinks = async (xmlUrl) => {
  try {
    const response = await fetch(
      `https://ai.1upmedia.com:443/sitemap/all-links?xml=${encodeURIComponent(
        xmlUrl
      )}&includeMetadata=true`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${xmlUrl}`);
    }

    const data = await response.json();
    return data.links || [];
  } catch (error) {
    console.error(`Error fetching sitemap ${xmlUrl}:`, error);
    return [];
  }
};

// Helper function to analyze content freshness based on last modified dates
const analyzeContentFreshness = (links) => {
  const now = new Date();
  const analysis = {
    total: links.length,
    last7Days: 0,
    last30Days: 0,
    last90Days: 0,
    last180Days: 0,
    last365Days: 0,
    over1Year: 0,
    over2Years: 0,
    never: 0,
    averageAge: 0,
    oldestContent: null,
    newestContent: null,
  };

  let totalAge = 0;
  let validDates = 0;
  let oldestDate = null;
  let newestDate = null;

  links.forEach((link) => {
    if (!link.lastmod) {
      analysis.never++;
      return;
    }

    const lastModified = new Date(link.lastmod);
    const daysSinceModified = Math.floor(
      (now - lastModified) / (1000 * 60 * 60 * 24)
    );

    // Track oldest and newest content
    if (!oldestDate || lastModified < oldestDate) {
      oldestDate = lastModified;
      analysis.oldestContent = {
        url: link.loc,
        date: link.lastmod,
        daysAgo: daysSinceModified,
      };
    }
    if (!newestDate || lastModified > newestDate) {
      newestDate = lastModified;
      analysis.newestContent = {
        url: link.loc,
        date: link.lastmod,
        daysAgo: daysSinceModified,
      };
    }

    // Categorize by age
    if (daysSinceModified <= 7) {
      analysis.last7Days++;
    } else if (daysSinceModified <= 30) {
      analysis.last30Days++;
    } else if (daysSinceModified <= 90) {
      analysis.last90Days++;
    } else if (daysSinceModified <= 180) {
      analysis.last180Days++;
    } else if (daysSinceModified <= 365) {
      analysis.last365Days++;
    } else if (daysSinceModified <= 730) {
      // 2 years
      analysis.over1Year++;
    } else {
      analysis.over2Years++;
    }

    totalAge += daysSinceModified;
    validDates++;
  });

  analysis.averageAge = validDates > 0 ? Math.round(totalAge / validDates) : 0;

  // Update the over1Year to include 2+ years for display compatibility
  analysis.over1Year += analysis.over2Years;

  return analysis;
};

// Helper function to calculate domain-specific decay factors
const calculateDomainFactors = (
  domainName,
  urlCount,
  avgOrderVal,
  totalInvest
) => {
  // Domain age factor (estimated from TLD and domain structure)
  const isNewTLD = /\.(io|co|app|dev|xyz|tech)$/.test(domainName);
  const hasSubdomains = domainName.split(".").length > 2;
  const domainAgeFactor = isNewTLD ? 1.2 : hasSubdomains ? 0.9 : 1.0;

  // Content density factor (based on URL count relative to investment)
  const avgCostPerUrl = totalInvest / urlCount;
  const contentDensityFactor =
    avgCostPerUrl > 500 ? 0.8 : avgCostPerUrl < 50 ? 1.3 : 1.0;

  // Business model factor (ecommerce vs content)
  const isEcommerce = avgOrderVal > 0;
  const businessModelFactor = isEcommerce ? 0.85 : 1.1; // Ecommerce tends to retain value better

  // Site scale factor (larger sites have different decay patterns)
  const siteScaleFactor = urlCount > 10000 ? 0.9 : urlCount < 100 ? 1.2 : 1.0;

  // Competition factor (estimated from domain characteristics)
  const isHighCompetition =
    /\b(shop|store|buy|sale|deal|discount|cheap)\b/.test(domainName);
  const competitionFactor = isHighCompetition ? 1.3 : 1.0;

  return {
    domainAge: domainAgeFactor,
    contentDensity: contentDensityFactor,
    businessModel: businessModelFactor,
    siteScale: siteScaleFactor,
    competition: competitionFactor,
    overall:
      (domainAgeFactor +
        contentDensityFactor +
        businessModelFactor +
        siteScaleFactor +
        competitionFactor) /
      5,
  };
};

// Enhanced decay calculation functions with domain-specific factors
const calculateDecayModels = (
  startValue,
  days,
  domainName,
  urlCount,
  avgOrderVal,
  totalInvest
) => {
  const MIN_VAL = MIN_RETAIN * startValue;
  const factors = calculateDomainFactors(
    domainName,
    urlCount,
    avgOrderVal,
    totalInvest
  );

  // Add some randomization based on domain hash for consistency
  const domainHash = domainName.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  const randomSeed = (Math.abs(domainHash) % 100) / 1000; // 0-0.099 range

  // Baseline model: adjusted by domain factors
  const baselineDecayRate = (0.0035 + randomSeed) * factors.overall;
  const baseline = Math.max(
    startValue * Math.exp(-baselineDecayRate * days),
    MIN_VAL
  );

  // Cannibalization model: affected by content density and site scale
  const cannibalDecayRate =
    (0.0042 + randomSeed * 0.5) * factors.contentDensity * factors.siteScale;
  const cannibal = Math.max(
    startValue * Math.exp(-cannibalDecayRate * days),
    MIN_VAL
  );

  // DA vs KD mismatch model: affected by competition and domain age
  const dakdBaseRate =
    (0.003 + randomSeed * 0.3) * factors.competition * factors.domainAge;
  const dakdAccelRate = (0.006 + randomSeed * 0.2) * factors.competition;

  let dakd;
  if (days <= 60) {
    dakd = startValue * Math.exp(-dakdBaseRate * days);
  } else {
    dakd =
      startValue *
      Math.exp(-dakdBaseRate * 60) *
      Math.exp(-dakdAccelRate * (days - 60));
  }
  dakd = Math.max(dakd, MIN_VAL);

  // Content-waste plateau model: adjusted by business model and content density
  const plateauAdjustment = factors.businessModel * factors.contentDensity;
  let plateauMultiplier;
  if (days <= 7) plateauMultiplier = 1.0;
  else if (days <= 30)
    plateauMultiplier = Math.max(0.85 * plateauAdjustment, 0.7);
  else if (days <= 60)
    plateauMultiplier = Math.max(0.65 * plateauAdjustment, 0.5);
  else if (days <= 90)
    plateauMultiplier = Math.max(0.4 * plateauAdjustment, 0.25);
  else if (days <= 180)
    plateauMultiplier = Math.max(0.2 * plateauAdjustment, 0.15);
  else plateauMultiplier = Math.max(0.15 * plateauAdjustment, 0.1);

  const plateau = Math.max(startValue * plateauMultiplier, MIN_VAL);

  // Calculate weighted aggregate (some models may be more relevant for certain domains)
  const weights = {
    baseline: factors.businessModel > 1 ? 0.3 : 0.25, // Content sites weight baseline more
    cannibal: factors.siteScale < 1 ? 0.2 : 0.3, // Larger sites have more cannibalization
    dakd: factors.competition > 1 ? 0.3 : 0.2, // High competition sites affected more by DA/KD
    plateau: factors.contentDensity > 1 ? 0.3 : 0.25, // Low content density sites plateau faster
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const currentContentValue =
    (baseline * weights.baseline +
      cannibal * weights.cannibal +
      dakd * weights.dakd +
      plateau * weights.plateau) /
    totalWeight;

  const contentDecayPercent = (1 - currentContentValue / startValue) * 100;

  return {
    models: {
      baseline,
      cannibal,
      daKdMismatch: dakd,
      plateau,
    },
    factors,
    weights,
    currentContentValue,
    contentDecayPercent,
    startValue,
  };
};

// Helper: Calculate a decay modifier based on content freshness analysis
const getFreshnessDecayModifier = (freshness) => {
  if (!freshness || freshness.total === 0) return 1.0;
  // Assign weights: fresh = 0.9, moderately fresh = 1.0, stale = 1.15, missing = 1.05
  const freshPct =
    (freshness.last30Days + freshness.last90Days) / freshness.total;
  const stalePct = freshness.over1Year / freshness.total;
  const missingPct = freshness.never / freshness.total;
  // The more fresh content, the lower the modifier; more stale, the higher
  let modifier = 1.0;
  modifier -= freshPct * 0.15; // up to -0.15 for very fresh
  modifier += stalePct * 0.15; // up to +0.15 for very stale
  modifier += missingPct * 0.05; // up to +0.05 for lots of missing
  // Clamp between 0.85 and 1.2
  modifier = Math.max(0.85, Math.min(1.2, modifier));
  return modifier;
};

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
  const [urlMetadata, setUrlMetadata] = useState([]);
  const [contentFreshnessAnalysis, setContentFreshnessAnalysis] = useState({
    total: 0,
    last30Days: 0,
    last90Days: 0,
    last180Days: 0,
    last365Days: 0,
    over1Year: 0,
    never: 0,
    averageAge: 0,
  });

  // Available day options for the slider
  const dayOptions = [7, 30, 60, 180, 365, 547];
  // Global constants
  const MIN_RETAIN = 0.15; // 15% minimum retention
  // Helper function to calculate domain-specific decay factors
  const calculateDomainFactors = (
    domainName,
    urlCount,
    avgOrderVal,
    totalInvest
  ) => {
    // Domain age factor (estimated from TLD and domain structure)
    const isNewTLD = /\.(io|co|app|dev|xyz|tech)$/.test(domainName);
    const hasSubdomains = domainName.split(".").length > 2;
    const domainAgeFactor = isNewTLD ? 1.2 : hasSubdomains ? 0.9 : 1.0;

    // Content density factor (based on URL count relative to investment)
    const avgCostPerUrl = totalInvest / urlCount;
    const contentDensityFactor =
      avgCostPerUrl > 500 ? 0.8 : avgCostPerUrl < 50 ? 1.3 : 1.0;

    // Business model factor (ecommerce vs content)
    const isEcommerce = avgOrderVal > 0;
    const businessModelFactor = isEcommerce ? 0.85 : 1.1; // Ecommerce tends to retain value better

    // Site scale factor (larger sites have different decay patterns)
    const siteScaleFactor = urlCount > 10000 ? 0.9 : urlCount < 100 ? 1.2 : 1.0;

    // Competition factor (estimated from domain characteristics)
    const isHighCompetition =
      /\b(shop|store|buy|sale|deal|discount|cheap)\b/.test(domainName);
    const competitionFactor = isHighCompetition ? 1.3 : 1.0;

    return {
      domainAge: domainAgeFactor,
      contentDensity: contentDensityFactor,
      businessModel: businessModelFactor,
      siteScale: siteScaleFactor,
      competition: competitionFactor,
      overall:
        (domainAgeFactor +
          contentDensityFactor +
          businessModelFactor +
          siteScaleFactor +
          competitionFactor) /
        5,
    };
  };

  // Enhanced decay calculation functions with domain-specific factors
  const calculateDecayModels = (
    startValue,
    days,
    domainName,
    urlCount,
    avgOrderVal,
    totalInvest
  ) => {
    const MIN_VAL = MIN_RETAIN * startValue;
    const factors = calculateDomainFactors(
      domainName,
      urlCount,
      avgOrderVal,
      totalInvest
    );

    // Add some randomization based on domain hash for consistency
    const domainHash = domainName.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const randomSeed = (Math.abs(domainHash) % 100) / 1000; // 0-0.099 range

    // Baseline model: adjusted by domain factors
    const baselineDecayRate = (0.0035 + randomSeed) * factors.overall;
    const baseline = Math.max(
      startValue * Math.exp(-baselineDecayRate * days),
      MIN_VAL
    );

    // Cannibalization model: affected by content density and site scale
    const cannibalDecayRate =
      (0.0042 + randomSeed * 0.5) * factors.contentDensity * factors.siteScale;
    const cannibal = Math.max(
      startValue * Math.exp(-cannibalDecayRate * days),
      MIN_VAL
    );

    // DA vs KD mismatch model: affected by competition and domain age
    const dakdBaseRate =
      (0.003 + randomSeed * 0.3) * factors.competition * factors.domainAge;
    const dakdAccelRate = (0.006 + randomSeed * 0.2) * factors.competition;

    let dakd;
    if (days <= 60) {
      dakd = startValue * Math.exp(-dakdBaseRate * days);
    } else {
      dakd =
        startValue *
        Math.exp(-dakdBaseRate * 60) *
        Math.exp(-dakdAccelRate * (days - 60));
    }
    dakd = Math.max(dakd, MIN_VAL);

    // Content-waste plateau model: adjusted by business model and content density
    const plateauAdjustment = factors.businessModel * factors.contentDensity;
    let plateauMultiplier;
    if (days <= 7) plateauMultiplier = 1.0;
    else if (days <= 30)
      plateauMultiplier = Math.max(0.85 * plateauAdjustment, 0.7);
    else if (days <= 60)
      plateauMultiplier = Math.max(0.65 * plateauAdjustment, 0.5);
    else if (days <= 90)
      plateauMultiplier = Math.max(0.4 * plateauAdjustment, 0.25);
    else if (days <= 180)
      plateauMultiplier = Math.max(0.2 * plateauAdjustment, 0.15);
    else plateauMultiplier = Math.max(0.15 * plateauAdjustment, 0.1);

    const plateau = Math.max(startValue * plateauMultiplier, MIN_VAL);

    // Calculate weighted aggregate (some models may be more relevant for certain domains)
    const weights = {
      baseline: factors.businessModel > 1 ? 0.3 : 0.25, // Content sites weight baseline more
      cannibal: factors.siteScale < 1 ? 0.2 : 0.3, // Larger sites have more cannibalization
      dakd: factors.competition > 1 ? 0.3 : 0.2, // High competition sites affected more by DA/KD
      plateau: factors.contentDensity > 1 ? 0.3 : 0.25, // Low content density sites plateau faster
    };

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const currentContentValue =
      (baseline * weights.baseline +
        cannibal * weights.cannibal +
        dakd * weights.dakd +
        plateau * weights.plateau) /
      totalWeight;

    const contentDecayPercent = (1 - currentContentValue / startValue) * 100;

    return {
      models: {
        baseline,
        cannibal,
        daKdMismatch: dakd,
        plateau,
      },
      factors,
      weights,
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
  }; // Helper function to fetch sitemap URLs using the API with enhanced metadata
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

      // Get XML sitemaps for detailed analysis
      const xmlList = [
        ...(sitemapData.data.mainXML || []),
        ...(sitemapData.data.blindXML || []),
      ];

      if (xmlList.length === 0) {
        // Fallback to basic URL list if no XML sitemaps
        if (
          sitemapData.data &&
          sitemapData.data.sites &&
          Array.isArray(sitemapData.data.sites)
        ) {
          return sitemapData.data.sites;
        }
        return [];
      }

      // Process individual XML sitemaps to get detailed metadata
      const allLinks = [];
      for (const xmlUrl of xmlList) {
        setAnalysisProgress(`Processing sitemap: ${xmlUrl}`);
        const links = await fetchSitemapLinks(xmlUrl);
        allLinks.push(...links);
      }

      // Remove duplicates based on URL
      const uniqueLinks = allLinks.filter(
        (link, index, self) =>
          index === self.findIndex((l) => l.loc === link.loc)
      );

      // Store metadata for analysis
      setUrlMetadata(uniqueLinks);

      // Analyze content freshness
      const freshnessAnalysis = analyzeContentFreshness(uniqueLinks);
      setContentFreshnessAnalysis(freshnessAnalysis);

      // Return just the URLs for compatibility
      return uniqueLinks.map((link) => link.loc);
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
      } // Calculate decay using the comprehensive model
      const decayResults = calculateDecayModels(
        startValue,
        selectedDays,
        normalizedDomain,
        finalUrlCount,
        avgOrderVal,
        totalInvest
      );

      // --- Apply content freshness decay modifier ---
      const freshnessModifier = getFreshnessDecayModifier(
        contentFreshnessAnalysis
      );
      const adjustedCurrentContentValue =
        decayResults.currentContentValue * (1 / freshnessModifier);
      const adjustedContentDecayPercent =
        (1 - adjustedCurrentContentValue / startValue) * 100;
      const financialLoss = startValue - adjustedCurrentContentValue;

      setResults({
        domain: normalizedDomain,
        urlCount: finalUrlCount,
        totalInvestment: totalInvest,
        avgOrderValue: avgOrderVal,
        selectedDays,
        startValue,
        ...decayResults,
        currentContentValue: adjustedCurrentContentValue,
        contentDecayPercent: adjustedContentDecayPercent,
        financialLoss,
        // Legacy compatibility fields
        totalUrls: finalUrlCount,
        decayPercentage: adjustedContentDecayPercent,
        totalLoss: financialLoss,
        avgCostPerUrl: startValue / finalUrlCount,
        freshnessModifier,
      });
    } catch (err) {
      console.error("Error during analysis:", err);
      setError(err.message || "An error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  }; // Effect to recalculate when slider changes
  React.useEffect(() => {
    if (urlCount > 0 && totalInvestment && !isAnalyzing && results) {
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
        const decayResults = calculateDecayModels(
          startValue,
          selectedDays,
          results.domain,
          urlCount,
          avgOrderVal,
          totalInvest
        );
        // --- Apply content freshness decay modifier in effect as well ---
        const freshnessModifier = getFreshnessDecayModifier(
          contentFreshnessAnalysis
        );
        const adjustedCurrentContentValue =
          decayResults.currentContentValue * (1 / freshnessModifier);
        const adjustedContentDecayPercent =
          (1 - adjustedCurrentContentValue / startValue) * 100;
        const financialLoss = startValue - adjustedCurrentContentValue;

        setResults((prev) =>
          prev
            ? {
                ...prev,
                selectedDays,
                startValue,
                ...decayResults,
                currentContentValue: adjustedCurrentContentValue,
                contentDecayPercent: adjustedContentDecayPercent,
                financialLoss,
                decayPercentage: adjustedContentDecayPercent,
                totalLoss: financialLoss,
                avgCostPerUrl: startValue / urlCount,
                freshnessModifier,
              }
            : null
        );
      }
    }
  }, [
    selectedDays,
    totalInvestment,
    avgOrderValue,
    urlCount,
    isAnalyzing,
    results,
    calculateDecayModels,
    contentFreshnessAnalysis,
  ]);

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
        </div>{" "}
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
          </div>{" "}
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
          </div>{" "}
          {/* Domain-Specific Factors */}
          {results.factors && (
            <div className="synthetic-decay__factors-section">
              <h3>🎯 Domain-Specific Risk Factors</h3>
              <div className="synthetic-decay__factors-grid">
                <div className="synthetic-decay__factor-card">
                  <h4>Domain Age Factor</h4>
                  <div className="synthetic-decay__factor-value">
                    {results.factors.domainAge.toFixed(2)}x
                  </div>
                  <div className="synthetic-decay__factor-description">
                    {results.factors.domainAge > 1
                      ? "Higher risk"
                      : results.factors.domainAge < 1
                      ? "Lower risk"
                      : "Neutral"}{" "}
                    - Based on TLD and domain structure
                  </div>
                </div>

                <div className="synthetic-decay__factor-card">
                  <h4>Content Density</h4>
                  <div className="synthetic-decay__factor-value">
                    {results.factors.contentDensity.toFixed(2)}x
                  </div>
                  <div className="synthetic-decay__factor-description">
                    {results.factors.contentDensity > 1
                      ? "Thin content risk"
                      : "Quality content protection"}{" "}
                    - Based on investment per URL
                  </div>
                </div>

                <div className="synthetic-decay__factor-card">
                  <h4>Business Model</h4>
                  <div className="synthetic-decay__factor-value">
                    {results.factors.businessModel.toFixed(2)}x
                  </div>
                  <div className="synthetic-decay__factor-description">
                    {results.avgOrderValue
                      ? "E-commerce site"
                      : "Content/Lead gen site"}{" "}
                    - Different decay patterns
                  </div>
                </div>

                <div className="synthetic-decay__factor-card">
                  <h4>Site Scale</h4>
                  <div className="synthetic-decay__factor-value">
                    {results.factors.siteScale.toFixed(2)}x
                  </div>
                  <div className="synthetic-decay__factor-description">
                    {results.urlCount > 10000
                      ? "Large site benefits"
                      : results.urlCount < 100
                      ? "Small site risks"
                      : "Medium scale"}{" "}
                    - Size-based decay adjustment
                  </div>
                </div>

                <div className="synthetic-decay__factor-card">
                  <h4>Competition Level</h4>
                  <div className="synthetic-decay__factor-value">
                    {results.factors.competition.toFixed(2)}x
                  </div>
                  <div className="synthetic-decay__factor-description">
                    {results.factors.competition > 1
                      ? "High competition detected"
                      : "Standard competition"}{" "}
                    - Based on domain keywords
                  </div>
                </div>

                <div className="synthetic-decay__factor-card">
                  <h4>Overall Risk Score</h4>
                  <div className="synthetic-decay__factor-value">
                    {results.factors.overall.toFixed(2)}x
                  </div>
                  <div className="synthetic-decay__factor-description">
                    {results.factors.overall > 1.1
                      ? "High decay risk"
                      : results.factors.overall < 0.9
                      ? "Low decay risk"
                      : "Average decay risk"}{" "}
                    - Combined risk multiplier
                  </div>
                </div>
              </div>
            </div>
          )}{" "}
          {/* Content Freshness Analysis */}
          {contentFreshnessAnalysis.total > 0 && (
            <div className="synthetic-decay__freshness-section">
              <h3>📅 Content Freshness Analysis</h3>
              <div className="synthetic-decay__freshness-grid">
                <div className="synthetic-decay__freshness-summary">
                  <h4>📊 Content Freshness Summary</h4>
                  <div className="synthetic-decay__freshness-stats">
                    <div className="synthetic-decay__freshness-stat">
                      <span className="synthetic-decay__freshness-label">
                        Total URLs Analyzed:
                      </span>
                      <span className="synthetic-decay__freshness-value">
                        {contentFreshnessAnalysis.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="synthetic-decay__freshness-stat">
                      <span className="synthetic-decay__freshness-label">
                        Average Content Age:
                      </span>
                      <span className="synthetic-decay__freshness-value">
                        {contentFreshnessAnalysis.averageAge > 365
                          ? `${Math.round(
                              contentFreshnessAnalysis.averageAge / 365
                            )} years`
                          : `${contentFreshnessAnalysis.averageAge} days`}
                      </span>
                    </div>
                    <div className="synthetic-decay__freshness-stat">
                      <span className="synthetic-decay__freshness-label">
                        Fresh Content Rate:
                      </span>
                      <span className="synthetic-decay__freshness-value">
                        {(
                          ((contentFreshnessAnalysis.last30Days +
                            contentFreshnessAnalysis.last90Days) /
                            contentFreshnessAnalysis.total) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="synthetic-decay__freshness-card">
                  <div className="synthetic-decay__freshness-header">
                    <span className="synthetic-decay__freshness-icon">🟢</span>
                    <h4>Recently Updated (Last 30 Days)</h4>
                  </div>
                  <div className="synthetic-decay__freshness-count">
                    {contentFreshnessAnalysis.last30Days}
                  </div>
                  <div className="synthetic-decay__freshness-percentage">
                    {(
                      (contentFreshnessAnalysis.last30Days /
                        contentFreshnessAnalysis.total) *
                      100
                    ).toFixed(1)}
                    % of all content
                  </div>
                </div>

                <div className="synthetic-decay__freshness-card">
                  <div className="synthetic-decay__freshness-header">
                    <span className="synthetic-decay__freshness-icon">🟡</span>
                    <h4>Moderately Fresh (31-90 Days)</h4>
                  </div>
                  <div className="synthetic-decay__freshness-count">
                    {contentFreshnessAnalysis.last90Days}
                  </div>
                  <div className="synthetic-decay__freshness-percentage">
                    {(
                      (contentFreshnessAnalysis.last90Days /
                        contentFreshnessAnalysis.total) *
                      100
                    ).toFixed(1)}
                    % of all content
                  </div>
                </div>

                <div className="synthetic-decay__freshness-card">
                  <div className="synthetic-decay__freshness-header">
                    <span className="synthetic-decay__freshness-icon">🟠</span>
                    <h4>Getting Stale (3-12 Months)</h4>
                  </div>
                  <div className="synthetic-decay__freshness-count">
                    {contentFreshnessAnalysis.last180Days +
                      contentFreshnessAnalysis.last365Days}
                  </div>
                  <div className="synthetic-decay__freshness-percentage">
                    {(
                      ((contentFreshnessAnalysis.last180Days +
                        contentFreshnessAnalysis.last365Days) /
                        contentFreshnessAnalysis.total) *
                      100
                    ).toFixed(1)}
                    % of all content
                  </div>
                </div>

                <div className="synthetic-decay__freshness-card">
                  <div className="synthetic-decay__freshness-header">
                    <span className="synthetic-decay__freshness-icon">🔴</span>
                    <h4>Stale Content (Over 1 Year)</h4>
                  </div>
                  <div className="synthetic-decay__freshness-count">
                    {contentFreshnessAnalysis.over1Year}
                  </div>
                  <div className="synthetic-decay__freshness-percentage">
                    {(
                      (contentFreshnessAnalysis.over1Year /
                        contentFreshnessAnalysis.total) *
                      100
                    ).toFixed(1)}
                    % needs updating
                  </div>
                </div>

                <div className="synthetic-decay__freshness-card">
                  <div className="synthetic-decay__freshness-header">
                    <span className="synthetic-decay__freshness-icon">❓</span>
                    <h4>Missing Date Information</h4>
                  </div>
                  <div className="synthetic-decay__freshness-count">
                    {contentFreshnessAnalysis.never}
                  </div>
                  <div className="synthetic-decay__freshness-percentage">
                    {(
                      (contentFreshnessAnalysis.never /
                        contentFreshnessAnalysis.total) *
                      100
                    ).toFixed(1)}
                    % lack metadata
                  </div>
                </div>
              </div>

              <div className="synthetic-decay__freshness-insights">
                <h4>💡 Content Maintenance Insights & Recommendations</h4>
                <div className="synthetic-decay__insight-list">
                  {contentFreshnessAnalysis.last30Days > 0 && (
                    <div className="synthetic-decay__insight-item synthetic-decay__insight-positive">
                      <span className="synthetic-decay__insight-icon">✅</span>
                      <span>
                        <strong>Good content maintenance detected!</strong>{" "}
                        {contentFreshnessAnalysis.last30Days} pages have been
                        updated in the last 30 days. This helps maintain search
                        rankings and user experience.
                      </span>
                    </div>
                  )}

                  {contentFreshnessAnalysis.over1Year >
                    contentFreshnessAnalysis.total * 0.3 && (
                    <div className="synthetic-decay__insight-item synthetic-decay__insight-warning">
                      <span className="synthetic-decay__insight-icon">⚠️</span>
                      <span>
                        <strong>Content refresh needed:</strong>{" "}
                        {contentFreshnessAnalysis.over1Year} pages (
                        {Math.round(
                          (contentFreshnessAnalysis.over1Year /
                            contentFreshnessAnalysis.total) *
                            100
                        )}
                        %) haven't been updated in over a year. Consider
                        prioritizing these for content refresh to improve SEO
                        performance.
                      </span>
                    </div>
                  )}

                  {contentFreshnessAnalysis.never >
                    contentFreshnessAnalysis.total * 0.2 && (
                    <div className="synthetic-decay__insight-item synthetic-decay__insight-info">
                      <span className="synthetic-decay__insight-icon">ℹ️</span>
                      <span>
                        <strong>Missing metadata:</strong>{" "}
                        {contentFreshnessAnalysis.never} pages (
                        {Math.round(
                          (contentFreshnessAnalysis.never /
                            contentFreshnessAnalysis.total) *
                            100
                        )}
                        %) lack last-modified dates. Adding these dates helps
                        search engines understand content freshness.
                      </span>
                    </div>
                  )}

                  {contentFreshnessAnalysis.averageAge > 365 && (
                    <div className="synthetic-decay__insight-item synthetic-decay__insight-warning">
                      <span className="synthetic-decay__insight-icon">📅</span>
                      <span>
                        <strong>High average content age:</strong> Your content
                        averages{" "}
                        {contentFreshnessAnalysis.averageAge > 365
                          ? `${Math.round(
                              contentFreshnessAnalysis.averageAge / 365
                            )} years`
                          : `${contentFreshnessAnalysis.averageAge} days`}{" "}
                        old. Consider implementing a content refresh strategy to
                        maintain competitive search rankings.
                      </span>
                    </div>
                  )}

                  {(contentFreshnessAnalysis.last30Days +
                    contentFreshnessAnalysis.last90Days) /
                    contentFreshnessAnalysis.total <
                    0.2 && (
                    <div className="synthetic-decay__insight-item synthetic-decay__insight-warning">
                      <span className="synthetic-decay__insight-icon">🚨</span>
                      <span>
                        <strong>Low fresh content rate:</strong> Only{" "}
                        {(
                          ((contentFreshnessAnalysis.last30Days +
                            contentFreshnessAnalysis.last90Days) /
                            contentFreshnessAnalysis.total) *
                          100
                        ).toFixed(1)}
                        % of your content has been updated in the last 90 days.
                        This may negatively impact search rankings and user
                        engagement.
                      </span>
                    </div>
                  )}

                  <div className="synthetic-decay__insight-item synthetic-decay__insight-info">
                    <span className="synthetic-decay__insight-icon">📈</span>
                    <span>
                      <strong>Content strategy recommendation:</strong> Based on
                      your content age distribution, focus on updating the{" "}
                      {contentFreshnessAnalysis.over1Year} oldest pages first,
                      then establish a regular update schedule for your most
                      important content.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          </div>{" "}
          {/* Analysis Summary */}
          <div className="synthetic-decay__summary">
            <h3>💡 Analysis Summary</h3>
            <div className="synthetic-decay__summary-content">
              <p>
                <strong>Calculation Method:</strong> Uses four decay models
                (Baseline, Cannibalization, DA/KD Mismatch, Content Plateau)
                adjusted by domain-specific factors with a minimum retention
                floor of 15%.
              </p>
              <p>
                <strong>Domain-Specific Adjustments:</strong> Decay rates are
                customized based on your domain's TLD, content density, business
                model, site scale, and competition level. Overall risk
                multiplier: {results.factors?.overall.toFixed(2)}x
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
                % of its original value. This is{" "}
                {results.factors?.overall > 1.1
                  ? "worse than"
                  : results.factors?.overall < 0.9
                  ? "better than"
                  : "similar to"}{" "}
                average decay patterns.
              </p>
              <p>
                <strong>Recommendation:</strong> Use the time slider above to
                see how decay progresses over different periods and plan your
                content refresh strategy accordingly. Consider the risk factors
                identified for your specific domain.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyntheticDecay;
