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

const SEOAnalysisDashboard = ({ analysisData }) => {
  const [expandedDilution, setExpandedDilution] = useState(false);
  const [expandedCannibalization, setExpandedCannibalization] = useState(false);

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
  } = analysisData;

  console.log("SEO Analysis Data:", analysisData);

  // Calculate summary metrics with safety checks
  const totalWastedSpend = Array.isArray(contentCostWaste)
    ? contentCostWaste
        .reduce((sum, item) => sum + (item.wastedSpend || 0), 0)
        .toFixed(2)
    : "0.00";

  const totalMissedClicks = Array.isArray(keywordMismatch)
    ? keywordMismatch.reduce((sum, item) => sum + (item.missedClicks || 0), 0)
    : 0;

  const cannibalizedKeywords = Array.isArray(cannibalization)
    ? cannibalization.length
    : 0;

  const dilutedPages = Array.isArray(linkDilution)
    ? linkDilution.filter((item) => item && item.dilutionScore > 0.02).length
    : 0;

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
          </div>
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
      </div>

      {/* Content Cost Waste Table - Always Show, Awesome UI */}
      <div className="seo-dashboard-section">
        <h3 className="seo-dashboard-section-title">
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
        </div>
        <div className="seo-dashboard-table-container">
          <table className="seo-dashboard-data-table">
            <thead>
              <tr>
                <th>Page URL</th>
                <th>Content Cost</th>
                <th>Revenue</th>
                <th>ROI</th>
                <th>Wasted Spend</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {contentCostWaste.map((item, i) => {
                const roi =
                  (item.estimatedMonthlyRevenue || 0) - (item.contentCost || 0);
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
                      ${item.contentCost?.toFixed?.(2) ?? item.contentCost ?? 0}
                    </td>
                    <td style={{ fontWeight: 600, color: "#22c55e" }}>
                      $
                      {item.estimatedMonthlyRevenue?.toFixed?.(2) ??
                        item.estimatedMonthlyRevenue ??
                        0}
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
                      ${item.wastedSpend?.toFixed?.(2) ?? item.wastedSpend ?? 0}
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
      </div>

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
