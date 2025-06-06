import React, { useState } from "react";
import {
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaMoneyBillWave,
  FaLink,
  FaSearch,
  FaExchangeAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./SEOAnalysisDashboard.css";
import {
  calculateContentWaste,
  calculateNotFoundImpact,
  calculateCannibalization,
  calculateLinkDilution,
  calculateContentDecay,
  calculateROI,
} from "../utils/financialCalculations";

/**
 * SEO Analysis Dashboard Component
 *
 * A comprehensive dashboard that displays SEO analysis results with interactive features
 * including filtering, sorting, expandable sections, and financial calculations.
 *
 * @param {Object} props - Component props
 * @param {Object} props.analysisData - SEO analysis data object
 * @param {boolean} props.analysisData.gscConnected - Google Search Console connection status
 * @param {boolean} props.analysisData.gaConnected - Google Analytics connection status
 * @param {Array} props.analysisData.keywordMismatch - Array of keyword mismatch data
 * @param {Array} props.analysisData.cannibalization - Array of keyword cannibalization data
 * @param {Array} props.analysisData.contentCostWaste - Array of content cost waste data
 * @param {Array} props.analysisData.linkDilution - Array of link dilution data
 * @param {Array} props.analysisData.contentDecay - Array of content decay data
 * @param {Array} props.analysisData.notFoundPages - Array of 404/error page data
 * @param {Object} props.onboardingData - Onboarding data containing domain cost details
 * @returns {JSX.Element} SEO Analysis Dashboard component
 */
const SEOAnalysisDashboard = ({ analysisData, onboardingData = {} }) => {
  const [expandedDilution, setExpandedDilution] = useState(false);
  const [expandedCannibalization, setExpandedCannibalization] = useState(false);
  const [expandedContentDecay, setExpandedContentDecay] = useState(false);
  const [expandedNotFoundPages, setExpandedNotFoundPages] = useState(false);
  const [expandedContentCostWaste, setExpandedContentCostWaste] =
    useState(false);

  // Sorting and filtering states
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterText, setFilterText] = useState("");
  const [activeSection, setActiveSection] = useState("all");

  if (!analysisData || Object.keys(analysisData).length === 0) {
    return (
      <div className="seo-dashboard-loading">Loading analysis data...</div>
    );
  }
  const {
    gscConnected = false,
    gaConnected = false,
    keywordMismatch = [],
    cannibalization = [],
    contentCostWaste = [],
    linkDilution = [],
    contentDecay = [], // <-- NEW
    notFoundPages = [], // (optional, for future use)
  } = analysisData;
  console.log("SEO Analysis Data:", analysisData);
  // Enhanced summary calculations with standardized financial metrics
  const totalWastedSpend = calculateContentWaste(
    { ...onboardingData, GSCAnalysisData: analysisData },
    contentCostWaste
  ).toFixed(2);

  const totalContentCost = Array.isArray(contentCostWaste)
    ? contentCostWaste
        .reduce((sum, item) => sum + (item.contentCost || 0), 0)
        .toFixed(2)
    : "0.00";

  const totalEstimatedRevenue = Array.isArray(contentCostWaste)
    ? contentCostWaste
        .reduce((sum, item) => sum + (item.estimatedMonthlyRevenue || 0), 0)
        .toFixed(2)
    : "0.00";

  const totalROI = calculateROI(
    parseFloat(totalEstimatedRevenue),
    parseFloat(totalContentCost)
  ).toFixed(2);

  const totalRevenueLoss = calculateContentDecay(
    { ...onboardingData, GSCAnalysisData: analysisData },
    contentDecay
  ).toFixed(2);

  const estimatedLossFromNotFound = calculateNotFoundImpact(
    { ...onboardingData, GSCAnalysisData: analysisData },
    notFoundPages
  ).toFixed(2); // Calculate additional financial impacts for display
  const cannibalizedImpact = calculateCannibalization(
    { ...onboardingData, GSCAnalysisData: analysisData },
    cannibalization
  ).toFixed(2);

  const linkDilutionImpact = calculateLinkDilution(
    { ...onboardingData, GSCAnalysisData: analysisData },
    linkDilution
  ).toFixed(2);

  const totalMissedClicks = Array.isArray(keywordMismatch)
    ? keywordMismatch.reduce((sum, item) => sum + (item.missedClicks || 0), 0)
    : 0;

  const cannibalizedKeywords = Array.isArray(cannibalization)
    ? cannibalization.length
    : 0;

  const dilutedPages = Array.isArray(linkDilution)
    ? linkDilution.filter((item) => item && item.dilutionScore > 0.02).length
    : 0; // --- Enhanced Helper Functions ---

  /**
   * Handles sorting configuration for table columns
   * @param {string} key - The property key to sort by
   */
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /**
   * Sorts array data by specified key and direction
   * @param {Array} data - Array of objects to sort
   * @param {string} key - Property key to sort by (supports nested keys with dot notation)
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted array
   */
  const sortData = (data, key, direction) => {
    if (!key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle nested properties (e.g., 'estimatedLoss.mid')
      if (key.includes(".")) {
        const keys = key.split(".");
        aValue = keys.reduce((obj, k) => obj?.[k], a);
        bValue = keys.reduce((obj, k) => obj?.[k], b);
      }

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  /**
   * Filters array data based on search text
   * @param {Array} data - Array of objects to filter
   * @param {string} searchText - Text to search for in object values
   * @returns {Array} Filtered array
   */
  const filterData = (data, searchText) => {
    if (!searchText) return data;

    return data.filter((item) => {
      const searchLower = searchText.toLowerCase();
      return Object.values(item).some(
        (value) => value && value.toString().toLowerCase().includes(searchLower)
      );
    });
  };

  /**
   * Formats a number as currency (USD)
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --- NEW: Animated Progress for Summary Cards ---
  // Calculate max for progress bars
  const maxWastedSpend = Math.max(
    ...contentCostWaste.map((i) => i.wastedSpend || 0),
    1
  );
  const maxMissedClicks = 100; // Placeholder, since keywordMismatch is empty in your data
  const maxCannibalized = 10; // Arbitrary, can be set dynamically
  const maxDiluted = linkDilution.length || 1;
  // --- NEW: Helper for animated progress bar ---
  /**
   * Renders an animated progress bar component
   * @param {Object} props - Component props
   * @param {number} props.value - Current progress value
   * @param {number} props.max - Maximum progress value
   * @param {string} props.color - Progress bar color
   * @param {string} props.label - Optional label for the progress bar
   * @returns {JSX.Element} Progress bar component
   */
  const ProgressBar = ({ value, max, color, label }) => (
    <div className="seo-dashboard-summary-progress">
      <div
        className="seo-dashboard-summary-progress-bar"
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          background: color,
        }}
      ></div>
      {label && (
        <span className="seo-dashboard-summary-progress-label">{label}</span>
      )}
    </div>
  );

  return (
    <div className="seo-dashboard-analysis-dashboard">
      <div className="seo-dashboard-header">
        <h2>SEO Analysis Results</h2>
        <div className="seo-dashboard-connection-status">
          <div
            className={`seo-dashboard-status-indicator ${
              gscConnected
                ? "seo-dashboard-connected"
                : "seo-dashboard-disconnected"
            }`}
          >
            <span className="seo-dashboard-status-dot"></span>
            Google Search Console: {gscConnected ? "Connected" : "Disconnected"}
          </div>
          <div
            className={`seo-dashboard-status-indicator ${
              gaConnected
                ? "seo-dashboard-connected"
                : "seo-dashboard-disconnected"
            }`}
          >
            <span className="seo-dashboard-status-dot"></span>
            Google Analytics: {gaConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>
      <div className="seo-dashboard-summary">
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-money-waste">
            <FaMoneyBillWave />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Content Cost Waste</h3>
            <p className="seo-dashboard-summary-value">
              ${totalWastedSpend}
              <span className="seo-dashboard-summary-unit">USD</span>
            </p>
            <ProgressBar
              value={parseFloat(totalWastedSpend)}
              max={maxWastedSpend}
              color="#ff6b6b"
              label={`Max: $${maxWastedSpend}`}
            />
            <p className="seo-dashboard-summary-description">
              <FaExclamationTriangle
                style={{ color: "#ff6b6b", marginRight: 4 }}
              />
              Total wasted content spend. Review underperforming pages to
              optimize ROI.
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-missed-clicks">
            <FaSearch />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Missed Clicks</h3>
            <p className="seo-dashboard-summary-value">
              {totalMissedClicks}
              <span className="seo-dashboard-summary-unit">Clicks</span>
            </p>
            <ProgressBar
              value={totalMissedClicks}
              max={maxMissedClicks}
              color="#4facfe"
              label={`Goal: ${maxMissedClicks}`}
            />
            <p className="seo-dashboard-summary-description">
              <FaArrowDown style={{ color: "#4facfe", marginRight: 4 }} />
              Potential traffic missed. Target these keywords for quick wins.
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-cannibalization">
            <FaExchangeAlt />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Cannibalization</h3>
            <p className="seo-dashboard-summary-value">
              {cannibalizedKeywords}
              <span className="seo-dashboard-summary-unit">Keywords</span>
            </p>
            <ProgressBar
              value={cannibalizedKeywords}
              max={maxCannibalized}
              color="#f093fb"
              label={`Max: ${maxCannibalized}`}
            />
            <p className="seo-dashboard-summary-description">
              <FaExchangeAlt style={{ color: "#f093fb", marginRight: 4 }} />
              Keywords with competing pages. Consolidate content to improve
              rankings.
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-dilution">
            <FaLink />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Link Dilution</h3>
            <p className="seo-dashboard-summary-value">
              {dilutedPages}
              <span className="seo-dashboard-summary-unit">Pages</span>
            </p>
            <ProgressBar
              value={dilutedPages}
              max={maxDiluted}
              color="#43e97b"
              label={`Total: ${maxDiluted}`}
            />
            <p className="seo-dashboard-summary-description">
              <FaLink style={{ color: "#43e97b", marginRight: 4 }} />
              Pages with diluted link equity. Improve internal linking
              structure.
            </p>
          </div>{" "}
        </div>
        {/* Additional Financial Summary Cards */}
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-revenue-loss">
            <FaChartLine />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Content Decay Loss</h3>
            <p className="seo-dashboard-summary-value">
              {formatCurrency(totalRevenueLoss)}
              <span className="seo-dashboard-summary-unit">USD</span>
            </p>
            <ProgressBar
              value={parseFloat(totalRevenueLoss)}
              max={1000}
              color="#f87171"
              label="Revenue Impact"
            />
            <p className="seo-dashboard-summary-description">
              <FaArrowDown style={{ color: "#f87171", marginRight: 4 }} />
              Revenue lost due to content performance decay.
            </p>
          </div>
        </div>
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-total-cost">
            <FaMoneyBillWave />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Total Content Investment</h3>
            <p className="seo-dashboard-summary-value">
              {formatCurrency(totalContentCost)}
              <span className="seo-dashboard-summary-unit">USD</span>
            </p>
            <ProgressBar
              value={parseFloat(totalContentCost)}
              max={Math.max(parseFloat(totalContentCost), 1000)}
              color="#fbbf24"
              label="Total Investment"
            />
            <p className="seo-dashboard-summary-description">
              <FaMoneyBillWave style={{ color: "#fbbf24", marginRight: 4 }} />
              Total content creation and optimization investment.
            </p>
          </div>
        </div>{" "}
        <div className="seo-dashboard-summary-card">
          <div className="seo-dashboard-summary-icon seo-dashboard-roi">
            <FaArrowUp />
          </div>
          <div className="seo-dashboard-summary-content">
            <h3>Overall ROI</h3>
            <p className="seo-dashboard-summary-value">
              {totalROI}%
              <span className="seo-dashboard-summary-unit">Return</span>
            </p>
            <ProgressBar
              value={Math.abs(parseFloat(totalROI))}
              max={100}
              color={parseFloat(totalROI) >= 0 ? "#22c55e" : "#f87171"}
              label={
                parseFloat(totalROI) >= 0 ? "Positive ROI" : "Negative ROI"
              }
            />
            <p className="seo-dashboard-summary-description">
              {parseFloat(totalROI) >= 0 ? (
                <FaArrowUp style={{ color: "#22c55e", marginRight: 4 }} />
              ) : (
                <FaArrowDown style={{ color: "#f87171", marginRight: 4 }} />
              )}
              Overall return on content investment.
            </p>
          </div>
        </div>
      </div>
      {/* Global Filter and Sort Controls */}
      <div className="seo-dashboard-controls">
        <div className="seo-dashboard-filter-controls">
          <input
            type="text"
            placeholder="Filter all tables..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="seo-dashboard-filter-input"
          />
          <div className="seo-dashboard-section-toggles">
            <button
              className={`seo-dashboard-toggle-btn ${
                activeSection === "all" ? "active" : ""
              }`}
              onClick={() => setActiveSection("all")}
            >
              Show All
            </button>
            <button
              className={`seo-dashboard-toggle-btn ${
                activeSection === "financial" ? "active" : ""
              }`}
              onClick={() => setActiveSection("financial")}
            >
              Financial Impact
            </button>
            <button
              className={`seo-dashboard-toggle-btn ${
                activeSection === "technical" ? "active" : ""
              }`}
              onClick={() => setActiveSection("technical")}
            >
              Technical Issues
            </button>
          </div>
        </div>
      </div>
      {/* Only render sections if data exists */}
      {keywordMismatch && keywordMismatch.length > 0 && (
        <div className="seo-dashboard-section">
          <h3 className="seo-dashboard-section-title">
            <FaSearch /> Keyword Opportunities
          </h3>
          <div className="seo-dashboard-table-container">
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Keyword</th>
                  <th>Difficulty</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>Missed</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {keywordMismatch.slice(0, 5).map((item, i) => (
                  <tr key={i}>
                    <td className="seo-dashboard-url-cell">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {new URL(item.url).pathname || "/"}
                      </a>
                    </td>
                    <td>{item.keyword}</td>
                    <td>
                      <div className="seo-dashboard-difficulty-meter">
                        <div
                          className="seo-dashboard-difficulty-fill"
                          style={{
                            width: `${item.keywordDifficulty}%`,
                            backgroundColor:
                              item.keywordDifficulty > 70
                                ? "#ff4d4d"
                                : item.keywordDifficulty > 40
                                ? "#ffaa4d"
                                : "#4daf7c",
                          }}
                        ></div>
                        <span>{item.keywordDifficulty}</span>
                      </div>
                    </td>
                    <td>{item.impressions}</td>
                    <td>{item.actualClicks}</td>
                    <td>{item.missedClicks}</td>
                    <td>
                      <span
                        className={`seo-dashboard-mismatch-type ${
                          item.mismatchType?.toLowerCase().replace("-", "") ||
                          ""
                        }`}
                      >
                        {item.mismatchType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {cannibalization && cannibalization.length > 0 && (
        <div className="seo-dashboard-section">
          <h3
            className="seo-dashboard-section-title"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              <FaExchangeAlt /> Content Cannibalization
              <span
                style={{
                  marginLeft: 12,
                  fontSize: "1rem",
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                ({cannibalization.length} Keywords)
              </span>
            </span>
            <button
              className="seo-dashboard-expand-btn"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                color: "#f093fb",
                marginLeft: 8,
                transition: "transform 0.2s",
                transform: expandedCannibalization
                  ? "rotate(90deg)"
                  : "rotate(0deg)",
              }}
              aria-label={expandedCannibalization ? "Collapse" : "Expand"}
              onClick={() => setExpandedCannibalization((prev) => !prev)}
            >
              {expandedCannibalization ? <FaArrowDown /> : <FaArrowUp />}
            </button>
          </h3>
          {expandedCannibalization ? (
            <div className="seo-dashboard-cannibalization-grid">
              {cannibalization.map((item, i) => (
                <div className="seo-dashboard-cannibalization-card" key={i}>
                  <div className="seo-dashboard-cannibalization-header">
                    <h4>
                      Keyword:{" "}
                      <span style={{ color: "#f093fb" }}>{item.keyword}</span>
                    </h4>
                    <span className="seo-dashboard-cannibalization-badge">
                      {item.competingUrls?.length || 0} competing pages
                    </span>
                  </div>

                  <div className="seo-dashboard-cannibalization-primary">
                    <div className="seo-dashboard-cannibalization-url">
                      <strong>Primary URL:</strong>
                      {item.primaryUrl && (
                        <a
                          href={item.primaryUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: "bold", color: "#3b82f6" }}
                        >
                          {new URL(item.primaryUrl.url).pathname || "/"}
                        </a>
                      )}
                    </div>
                    {item.primaryUrl && (
                      <div className="seo-dashboard-cannibalization-metrics">
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Position
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.position?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Clicks
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.clicks || 0}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Impressions
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.impressions || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="seo-dashboard-competing-urls">
                    {item.competingUrls &&
                      item.competingUrls.map((competing, j) => (
                        <div className="seo-dashboard-competing-url" key={j}>
                          <div className="seo-dashboard-competing-url-path">
                            <a
                              href={competing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#64748b", fontWeight: "bold" }}
                            >
                              {new URL(competing.url).pathname || "/"}
                            </a>
                          </div>
                          <div className="seo-dashboard-competing-metrics">
                            <div className="seo-dashboard-competing-metric">
                              <small>
                                Pos: {competing.position?.toFixed(1) || "N/A"}
                              </small>
                              {item.primaryUrl && (
                                <span
                                  className={
                                    competing.position <
                                    item.primaryUrl.position
                                      ? "seo-dashboard-metric-better"
                                      : "seo-dashboard-metric-worse"
                                  }
                                >
                                  {competing.position <
                                  item.primaryUrl.position ? (
                                    <FaArrowUp />
                                  ) : (
                                    <FaArrowDown />
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="seo-dashboard-competing-metric">
                              <small>Clicks: {competing.clicks || 0}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="seo-dashboard-cannibalization-grid">
              {cannibalization.slice(0, 4).map((item, i) => (
                <div className="seo-dashboard-cannibalization-card" key={i}>
                  <div className="seo-dashboard-cannibalization-header">
                    <h4>
                      Keyword:{" "}
                      <span style={{ color: "#f093fb" }}>{item.keyword}</span>
                    </h4>
                    <span className="seo-dashboard-cannibalization-badge">
                      {item.competingUrls?.length || 0} competing pages
                    </span>
                  </div>

                  <div className="seo-dashboard-cannibalization-primary">
                    <div className="seo-dashboard-cannibalization-url">
                      <strong>Primary URL:</strong>
                      {item.primaryUrl && (
                        <a
                          href={item.primaryUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: "bold", color: "#3b82f6" }}
                        >
                          {new URL(item.primaryUrl.url).pathname || "/"}
                        </a>
                      )}
                    </div>
                    {item.primaryUrl && (
                      <div className="seo-dashboard-cannibalization-metrics">
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Position
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.position?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Clicks
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.clicks || 0}
                          </span>
                        </div>
                        <div className="seo-dashboard-metric">
                          <span className="seo-dashboard-metric-label">
                            Impressions
                          </span>
                          <span className="seo-dashboard-metric-value">
                            {item.primaryUrl.impressions || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="seo-dashboard-competing-urls">
                    {item.competingUrls &&
                      item.competingUrls.map((competing, j) => (
                        <div className="seo-dashboard-competing-url" key={j}>
                          <div className="seo-dashboard-competing-url-path">
                            <a
                              href={competing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#64748b", fontWeight: "bold" }}
                            >
                              {new URL(competing.url).pathname || "/"}
                            </a>
                          </div>
                          <div className="seo-dashboard-competing-metrics">
                            <div className="seo-dashboard-competing-metric">
                              <small>
                                Pos: {competing.position?.toFixed(1) || "N/A"}
                              </small>
                              {item.primaryUrl && (
                                <span
                                  className={
                                    competing.position <
                                    item.primaryUrl.position
                                      ? "seo-dashboard-metric-better"
                                      : "seo-dashboard-metric-worse"
                                  }
                                >
                                  {competing.position <
                                  item.primaryUrl.position ? (
                                    <FaArrowUp />
                                  ) : (
                                    <FaArrowDown />
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="seo-dashboard-competing-metric">
                              <small>Clicks: {competing.clicks || 0}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Content ROI Analysis - Diff Visual */}
      {contentCostWaste && contentCostWaste.length > 0 && (
        <div className="seo-dashboard-section">
          <h3 className="seo-dashboard-section-title">
            <FaMoneyBillWave /> Content ROI Analysis
          </h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={contentCostWaste.slice(0, 12).map((item) => ({
                url: item.url ? new URL(item.url).pathname || "/" : "/",
                ROI:
                  (item.estimatedMonthlyRevenue || 0) - (item.contentCost || 0),
                Revenue: item.estimatedMonthlyRevenue || 0,
                Cost: item.contentCost || 0,
                Wasted: item.wastedSpend || 0,
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="url" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "ROI")
                    return [`$${value.toFixed(2)}`, "ROI (Revenue - Cost)"];
                  if (name === "Revenue")
                    return [`$${value.toFixed(2)}`, "Revenue"];
                  if (name === "Cost")
                    return [`$${value.toFixed(2)}`, "Content Cost"];
                  if (name === "Wasted")
                    return [`$${value.toFixed(2)}`, "Wasted Spend"];
                  return value;
                }}
              />
              <Legend />
              <Bar
                dataKey="ROI"
                name="ROI (Revenue - Cost)"
                fill="#22c55e"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Revenue"
                name="Revenue"
                fill="#60a5fa"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Cost"
                name="Content Cost"
                fill="#fbbf24"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Wasted"
                name="Wasted Spend"
                fill="#f87171"
                isAnimationActive
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div
            style={{
              marginTop: 18,
              textAlign: "center",
              color: "#64748b",
              fontSize: "1.05rem",
            }}
          >
            <FaChartLine style={{ color: "#22c55e", marginRight: 6 }} />
            <span>
              ROI = Revenue - Content Cost. Green bars show net gain/loss for
              each page. Hover for details.
            </span>
          </div>{" "}
        </div>
      )}
      {/* Link Dilution Section - Always Show with Expand/Collapse and Summary */}
      <div className="seo-dashboard-section">
        <h3
          className="seo-dashboard-section-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <FaLink /> Link Dilution
            <span
              style={{
                marginLeft: 12,
                fontSize: "1rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              ({linkDilution.length} Pages)
            </span>
          </span>
          <button
            className="seo-dashboard-expand-btn"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#43e97b",
              marginLeft: 8,
              transition: "transform 0.2s",
              transform: expandedDilution ? "rotate(90deg)" : "rotate(0deg)",
            }}
            aria-label={expandedDilution ? "Collapse" : "Expand"}
            onClick={() => setExpandedDilution((prev) => !prev)}
          >
            {expandedDilution ? <FaArrowDown /> : <FaArrowUp />}
          </button>
        </h3>
        {/* Summary Row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            margin: "12px 0 8px 0",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaExclamationTriangle
              style={{ color: "#f87171", marginRight: 4 }}
            />
            High Dilution:{" "}
            {linkDilution.filter((i) => i.dilutionScore > 0.02).length}
          </span>
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaCheck style={{ color: "#22c55e", marginRight: 4 }} />
            Low Dilution:{" "}
            {linkDilution.filter((i) => i.dilutionScore <= 0.02).length}
          </span>
        </div>
        {expandedDilution && linkDilution && linkDilution.length > 0 ? (
          <div className="seo-dashboard-table-container">
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Page Authority</th>
                  <th>External Links</th>
                  <th>Internal Links</th>
                  <th>Dilution Score</th>
                  <th>Improvement</th>
                  <th>Est. Loss</th>
                </tr>
              </thead>
              <tbody>
                {linkDilution.map((item, i) => (
                  <tr key={i}>
                    <td className="seo-dashboard-url-cell">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {new URL(item.url).pathname || "/"}
                      </a>
                    </td>
                    <td>{item.pageAuthority}</td>
                    <td>{item.externalLinks}</td>
                    <td>{item.internalLinks}</td>
                    <td
                      style={{
                        color:
                          item.dilutionScore > 0.02 ? "#f87171" : "#64748b",
                        fontWeight: item.dilutionScore > 0.02 ? 700 : 500,
                      }}
                    >
                      {item.dilutionScore.toFixed(4)}
                    </td>
                    <td
                      style={{
                        color:
                          item.improvementPotential === "High"
                            ? "#f87171"
                            : item.improvementPotential === "Mid"
                            ? "#fbbf24"
                            : "#22c55e",
                        fontWeight: 600,
                      }}
                    >
                      {item.improvementPotential || "-"}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {item.estimatedLoss
                        ? `L:${item.estimatedLoss.low} M:${item.estimatedLoss.mid} H:${item.estimatedLoss.high}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{ color: "#64748b", padding: "16px 0", textAlign: "center" }}
          >
            No link dilution issues detected.
          </div>
        )}
      </div>{" "}
      {/* Content Cost Waste Table - Always Show, Awesome UI */}
      <div className="seo-dashboard-section">
        <h3
          className="seo-dashboard-section-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            <FaMoneyBillWave /> Content Cost Waste
            <span
              style={{
                marginLeft: 12,
                fontSize: "1rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              ({contentCostWaste.length} Pages)
            </span>
          </span>
          <button
            className="seo-dashboard-expand-btn"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#fbbf24",
              marginLeft: 8,
              transition: "transform 0.2s",
              transform: expandedContentCostWaste
                ? "rotate(90deg)"
                : "rotate(0deg)",
            }}
            aria-label={expandedContentCostWaste ? "Collapse" : "Expand"}
            onClick={() => setExpandedContentCostWaste((prev) => !prev)}
          >
            {expandedContentCostWaste ? <FaArrowDown /> : <FaArrowUp />}
          </button>
        </h3>
        <div
          style={{
            display: "flex",
            gap: 24,
            margin: "12px 0 8px 0",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaExclamationTriangle
              style={{ color: "#f87171", marginRight: 4 }}
            />
            High Waste:{" "}
            {contentCostWaste.filter((i) => i.wastedSpend > 0).length}
          </span>
          <span style={{ color: "#64748b", fontWeight: 600 }}>
            <FaCheck style={{ color: "#22c55e", marginRight: 4 }} />
            Positive ROI:{" "}
            {
              contentCostWaste.filter(
                (i) =>
                  (i.estimatedMonthlyRevenue || 0) - (i.contentCost || 0) > 0
              ).length
            }
          </span>
        </div>{" "}
        {expandedContentCostWaste ? (
          <div className="seo-dashboard-table-container">
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Content Cost</th>
                  <th>Estimated Revenue</th>
                  <th>Actual Revenue</th>
                  <th>Estimated ROI</th>
                  <th>Wasted Spend</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Position</th>
                </tr>
              </thead>{" "}
              <tbody>
                {contentCostWaste.map((item, i) => {
                  const roi =
                    (item.estimatedMonthlyRevenue || 0) -
                    (item.contentCost || 0);
                  return (
                    <tr key={i}>
                      <td className="seo-dashboard-url-cell">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {new URL(item.url).pathname || "/"}
                        </a>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        $
                        {item.contentCost?.toFixed?.(2) ??
                          item.contentCost ??
                          0}
                      </td>
                      <td style={{ fontWeight: 600, color: "#22c55e" }}>
                        $
                        {item.estimatedMonthlyRevenue?.toFixed?.(2) ??
                          item.estimatedMonthlyRevenue ??
                          0}
                      </td>
                      <td className="seo-dashboard-actual-revenue-cell">
                        <button
                          className="seo-dashboard-crm-connect-btn"
                          onClick={() => {
                            // Placeholder for CRM connection logic
                            alert(
                              "Connect to CRM functionality will be implemented here"
                            );
                          }}
                        >
                          <FaLink size={12} />
                          Connect CRM
                        </button>
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: roi > 0 ? "#22c55e" : "#f87171",
                        }}
                      >
                        {roi > 0 ? (
                          <FaArrowUp style={{ marginRight: 3 }} />
                        ) : (
                          <FaArrowDown style={{ marginRight: 3 }} />
                        )}
                        ${roi.toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: item.wastedSpend > 0 ? "#f87171" : "#64748b",
                        }}
                      >
                        {item.wastedSpend > 0 ? (
                          <FaExclamationTriangle style={{ marginRight: 3 }} />
                        ) : null}
                        $
                        {item.wastedSpend?.toFixed?.(2) ??
                          item.wastedSpend ??
                          0}
                      </td>
                      <td>{item.impressions}</td>
                      <td>{item.clicks}</td>
                      <td>
                        {typeof item.ctr === "number"
                          ? (item.ctr * 100).toFixed(2) + "%"
                          : "-"}
                      </td>
                      <td>
                        {item.position?.toFixed?.(2) ?? item.position ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="seo-dashboard-table-container">
            {" "}
            <table className="seo-dashboard-data-table">
              <thead>
                <tr>
                  <th>Page URL</th>
                  <th>Content Cost</th>
                  <th>Revenue</th>
                  <th>Actual Revenue</th>
                  <th>ROI</th>
                  <th>Wasted Spend</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {contentCostWaste.slice(0, 5).map((item, i) => {
                  const roi =
                    (item.estimatedMonthlyRevenue || 0) -
                    (item.contentCost || 0);
                  return (
                    <tr key={i}>
                      <td className="seo-dashboard-url-cell">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {new URL(item.url).pathname || "/"}
                        </a>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        $
                        {item.contentCost?.toFixed?.(2) ??
                          item.contentCost ??
                          0}
                      </td>{" "}
                      <td style={{ fontWeight: 600, color: "#22c55e" }}>
                        $
                        {item.estimatedMonthlyRevenue?.toFixed?.(2) ??
                          item.estimatedMonthlyRevenue ??
                          0}
                      </td>{" "}
                      <td className="seo-dashboard-actual-revenue-cell">
                        <button
                          className="seo-dashboard-crm-connect-btn"
                          onClick={() => {
                            // Placeholder for CRM connection logic
                            alert(
                              "Connect to CRM functionality will be implemented here"
                            );
                          }}
                        >
                          <FaLink size={12} />
                          Connect CRM
                        </button>
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: roi > 0 ? "#22c55e" : "#f87171",
                        }}
                      >
                        {roi > 0 ? (
                          <FaArrowUp style={{ marginRight: 3 }} />
                        ) : (
                          <FaArrowDown style={{ marginRight: 3 }} />
                        )}
                        ${roi.toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: item.wastedSpend > 0 ? "#f87171" : "#64748b",
                        }}
                      >
                        {item.wastedSpend > 0 ? (
                          <FaExclamationTriangle style={{ marginRight: 3 }} />
                        ) : null}
                        $
                        {item.wastedSpend?.toFixed?.(2) ??
                          item.wastedSpend ??
                          0}
                      </td>
                      <td>{item.impressions}</td>
                      <td>{item.clicks}</td>
                      <td>
                        {typeof item.ctr === "number"
                          ? (item.ctr * 100).toFixed(2) + "%"
                          : "-"}
                      </td>
                      <td>
                        {item.position?.toFixed?.(2) ?? item.position ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {contentCostWaste.length > 5 && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  className="seo-dashboard-show-more-btn"
                  onClick={() => setExpandedContentCostWaste(true)}
                  style={{
                    padding: "12px 24px",
                    background:
                      "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Show All {contentCostWaste.length} Pages
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Enhanced Content Decay & Trends Section */}
      {contentDecay &&
        contentDecay.length > 0 &&
        (activeSection === "all" || activeSection === "financial") && (
          <div className="seo-dashboard-section">
            <h3
              className="seo-dashboard-section-title"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                <FaChartLine style={{ color: "#f87171", marginRight: 8 }} />
                Content Decay & Trends
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: "1rem",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  ({contentDecay.length} Pages •{" "}
                  {formatCurrency(totalRevenueLoss)} Total Loss)
                </span>
              </span>
              <button
                className="seo-dashboard-expand-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: "#f87171",
                  marginLeft: 8,
                  transition: "transform 0.2s",
                  transform: expandedContentDecay
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                }}
                aria-label={expandedContentDecay ? "Collapse" : "Expand"}
                onClick={() => setExpandedContentDecay((prev) => !prev)}
              >
                {expandedContentDecay ? <FaArrowDown /> : <FaArrowUp />}
              </button>
            </h3>

            {/* Summary Stats */}
            <div
              style={{
                display: "flex",
                gap: 24,
                margin: "12px 0 8px 0",
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaArrowDown style={{ color: "#f87171", marginRight: 4 }} />
                Declining Pages:{" "}
                {contentDecay.filter((i) => i.clickDiff < 0).length}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaArrowUp style={{ color: "#22c55e", marginRight: 4 }} />
                Improving Pages:{" "}
                {contentDecay.filter((i) => i.clickDiff > 0).length}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaMoneyBillWave style={{ color: "#f87171", marginRight: 4 }} />
                Total Revenue Impact: {formatCurrency(totalRevenueLoss)}
              </span>
            </div>

            {expandedContentDecay ? (
              <div className="seo-dashboard-table-container">
                <div className="seo-dashboard-table-controls">
                  <input
                    type="text"
                    placeholder="Search content decay data..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="seo-dashboard-filter-input"
                    style={{ marginBottom: "10px" }}
                  />
                </div>
                <table className="seo-dashboard-data-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("url")}
                        style={{ cursor: "pointer" }}
                      >
                        URL{" "}
                        {sortConfig.key === "url" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("currentClicks")}
                        style={{ cursor: "pointer" }}
                      >
                        Current Clicks{" "}
                        {sortConfig.key === "currentClicks" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("previousClicks")}
                        style={{ cursor: "pointer" }}
                      >
                        Previous Clicks{" "}
                        {sortConfig.key === "previousClicks" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("clickDiff")}
                        style={{ cursor: "pointer" }}
                      >
                        Change{" "}
                        {sortConfig.key === "clickDiff" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("clickChangePercent")}
                        style={{ cursor: "pointer" }}
                      >
                        % Change{" "}
                        {sortConfig.key === "clickChangePercent" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("estimatedRevenueLoss")}
                        style={{ cursor: "pointer" }}
                      >
                        Revenue Loss{" "}
                        {sortConfig.key === "estimatedRevenueLoss" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th>Status</th>
                      <th>Keywords</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(
                      filterData(contentDecay, filterText),
                      sortConfig.key,
                      sortConfig.direction
                    ).map((item, i) => (
                      <tr key={i}>
                        <td className="seo-dashboard-url-cell">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {new URL(item.url).pathname || "/"}
                          </a>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {item.currentClicks}
                        </td>
                        <td style={{ color: "#64748b" }}>
                          {item.previousClicks}
                        </td>
                        <td
                          style={{
                            color: item.clickDiff >= 0 ? "#22c55e" : "#f87171",
                            fontWeight: 600,
                          }}
                        >
                          {item.clickDiff >= 0 ? "+" : ""}
                          {item.clickDiff}
                        </td>
                        <td
                          style={{
                            color:
                              item.clickChangePercent >= 0
                                ? "#22c55e"
                                : "#f87171",
                            fontWeight: 600,
                          }}
                        >
                          {item.clickChangePercent > 0 ? "+" : ""}
                          {item.clickChangePercent.toFixed(1)}%
                        </td>
                        <td
                          style={{
                            color: "#f87171",
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(item.estimatedRevenueLoss || 0)}
                        </td>
                        <td>
                          <span
                            className={`seo-dashboard-status-badge ${
                              item.decayMetrics?.status?.toLowerCase() ||
                              "unknown"
                            }`}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color:
                                item.decayMetrics?.status === "Stable"
                                  ? "#22c55e"
                                  : item.decayMetrics?.status === "Declining"
                                  ? "#f87171"
                                  : "#64748b",
                              backgroundColor:
                                item.decayMetrics?.status === "Stable"
                                  ? "#dcfce7"
                                  : item.decayMetrics?.status === "Declining"
                                  ? "#fef2f2"
                                  : "#f1f5f9",
                            }}
                          >
                            {item.decayMetrics?.status || "N/A"}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.9rem", color: "#64748b" }}>
                          {item.topKeywords?.length || 0} keywords
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="seo-dashboard-content-decay-list">
                {filterData(contentDecay, filterText)
                  .slice(0, 3)
                  .map((item, i) => (
                    <div className="seo-dashboard-content-decay-card" key={i}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontWeight: 600,
                            color: "#3b82f6",
                            fontSize: "1.1rem",
                          }}
                        >
                          {new URL(item.url).pathname || "/"}
                        </a>
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Current Clicks: <b>{item.currentClicks}</b>
                        </span>
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Previous: <b>{item.previousClicks}</b>
                        </span>
                        <span
                          style={{
                            color: item.clickDiff >= 0 ? "#22c55e" : "#f87171",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {item.clickDiff >= 0 ? (
                            <FaArrowUp style={{ marginRight: 2 }} />
                          ) : (
                            <FaArrowDown style={{ marginRight: 2 }} />
                          )}
                          {item.clickDiff > 0 ? "+" : ""}
                          {item.clickDiff} (
                          {item.clickChangePercent > 0 ? "+" : ""}
                          {item.clickChangePercent.toFixed(1)}%)
                        </span>
                        {typeof item.estimatedRevenueLoss === "number" && (
                          <span style={{ color: "#f87171", fontWeight: 600 }}>
                            Est. Revenue Loss:{" "}
                            {formatCurrency(item.estimatedRevenueLoss)}
                          </span>
                        )}
                        <span style={{ color: "#64748b", fontWeight: 500 }}>
                          Status: <b>{item.decayMetrics?.status || "N/A"}</b>
                        </span>
                      </div>
                    </div>
                  ))}
                {contentDecay.length > 3 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "#64748b",
                    }}
                  >
                    <button
                      onClick={() => setExpandedContentDecay(true)}
                      className="seo-dashboard-show-more-btn"
                    >
                      Show All {contentDecay.length} Pages
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      {/* Enhanced Not Found Pages Section */}
      {notFoundPages &&
        notFoundPages.length > 0 &&
        (activeSection === "all" || activeSection === "technical") && (
          <div className="seo-dashboard-section">
            <h3
              className="seo-dashboard-section-title"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                <FaTimes style={{ color: "#f87171", marginRight: 8 }} />
                404 & Error Pages
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: "1rem",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  ({notFoundPages.length} Pages •{" "}
                  {formatCurrency(estimatedLossFromNotFound)} Est. Loss)
                </span>
              </span>
              <button
                className="seo-dashboard-expand-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: "#f87171",
                  marginLeft: 8,
                  transition: "transform 0.2s",
                  transform: expandedNotFoundPages
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                }}
                aria-label={expandedNotFoundPages ? "Collapse" : "Expand"}
                onClick={() => setExpandedNotFoundPages((prev) => !prev)}
              >
                {expandedNotFoundPages ? <FaArrowDown /> : <FaArrowUp />}
              </button>
            </h3>

            {/* Summary Stats */}
            <div
              style={{
                display: "flex",
                gap: 24,
                margin: "12px 0 8px 0",
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaTimes style={{ color: "#f87171", marginRight: 4 }} />
                404 Errors:{" "}
                {notFoundPages.filter((i) => i.errorType === "404").length}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaExclamationTriangle
                  style={{ color: "#fbbf24", marginRight: 4 }}
                />
                Timeouts:{" "}
                {notFoundPages.filter((i) => i.errorType === "timeout").length}
              </span>
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                <FaMoneyBillWave style={{ color: "#f87171", marginRight: 4 }} />
                Est. Revenue Loss: {formatCurrency(estimatedLossFromNotFound)}
              </span>
            </div>

            {expandedNotFoundPages ? (
              <div className="seo-dashboard-table-container">
                <div className="seo-dashboard-table-controls">
                  <input
                    type="text"
                    placeholder="Search error pages..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="seo-dashboard-filter-input"
                    style={{ marginBottom: "10px" }}
                  />
                </div>
                <table className="seo-dashboard-data-table">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("url")}
                        style={{ cursor: "pointer" }}
                      >
                        URL{" "}
                        {sortConfig.key === "url" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("errorType")}
                        style={{ cursor: "pointer" }}
                      >
                        Error Type{" "}
                        {sortConfig.key === "errorType" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("clicks")}
                        style={{ cursor: "pointer" }}
                      >
                        Clicks{" "}
                        {sortConfig.key === "clicks" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("impressions")}
                        style={{ cursor: "pointer" }}
                      >
                        Impressions{" "}
                        {sortConfig.key === "impressions" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("position")}
                        style={{ cursor: "pointer" }}
                      >
                        Position{" "}
                        {sortConfig.key === "position" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("estimatedLoss.mid")}
                        style={{ cursor: "pointer" }}
                      >
                        Est. Loss{" "}
                        {sortConfig.key === "estimatedLoss.mid" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(
                      filterData(notFoundPages, filterText),
                      sortConfig.key,
                      sortConfig.direction
                    ).map((item, i) => (
                      <tr key={i}>
                        <td className="seo-dashboard-url-cell">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#f87171" }}
                          >
                            {new URL(item.url).pathname || "/"}
                          </a>
                        </td>{" "}
                        <td>
                          <span
                            className={`seo-dashboard-error-badge`}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color:
                                item.errorType === "404"
                                  ? "#f87171"
                                  : "#fbbf24",
                              backgroundColor:
                                item.errorType === "404"
                                  ? "#fef2f2"
                                  : "#fefbeb",
                            }}
                          >
                            {item.errorType === "404"
                              ? "404 Not Found"
                              : "Timeout"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.clicks}</td>
                        <td style={{ color: "#64748b" }}>{item.impressions}</td>
                        <td style={{ color: "#64748b" }}>
                          {item.position?.toFixed(1) || "N/A"}
                        </td>
                        <td style={{ color: "#f87171", fontWeight: 600 }}>
                          {formatCurrency((item.estimatedLoss?.mid || 0) * 4.5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  color: "#64748b",
                  padding: "16px 0",
                  textAlign: "center",
                }}
              >
                Showing {Math.min(notFoundPages.length, 5)} of{" "}
                {notFoundPages.length} error pages.
                {notFoundPages.length > 5 && (
                  <button
                    onClick={() => setExpandedNotFoundPages(true)}
                    className="seo-dashboard-show-more-btn"
                    style={{ marginLeft: "10px" }}
                  >
                    Show All
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      <div className="seo-dashboard-actions">
        <button className="seo-dashboard-action-button seo-dashboard-primary">
          Generate Improvement Plan
        </button>
        <button className="seo-dashboard-action-button seo-dashboard-secondary">
          Export Report
        </button>
      </div>
    </div>
  );
};

export default SEOAnalysisDashboard;
