import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import "chart.js/auto";
import Loader from "../../components/Loader";
import "./SiteStats.css"; // Import the new CSS file

export default function SiteStats() {
  const { state } = useLocation();
  const { siteDetails } = state;

  const [decay, setDecay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "slopeI",
    direction: "desc",
  });

  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchDecay = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 600);

        const res = await fetch(
          "https://ai.1upmedia.com:443/google/weekly-decay",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              siteUrl: siteDetails.siteUrl,
              gscToken: siteDetails.accessToken,
              gaPropertyId: siteDetails.gaPropertyId,
              gaToken: siteDetails.gaToken,
              startDate: start.toISOString().slice(0, 10),
              endDate: today.toISOString().slice(0, 10),
            }),
          }
        );
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        setDecay(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDecay();
  }, [siteDetails]);

  /* ------------------------------------------------------------------ */
  const statusPalette = {
    Growing: "#86efac",
    Stable: "#38bdf8",
    "Early-Decay": "#facc15",
    "Deep-Decay": "#f87171",
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Growing":
        return "📈";
      case "Stable":
        return "🔄";
      case "Early-Decay":
        return "⚠️";
      case "Deep-Decay":
        return "🚨";
      default:
        return "❓";
    }
  };

  const statusCounts = () => {
    if (!decay) return {};
    return decay.results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
  };

  const getTotalStats = () => {
    if (!decay) return { impressions: 0, clicks: 0, pages: 0 };

    const totals = decay.results.reduce(
      (acc, page) => {
        const lastMonth = page.monthly[page.monthly.length - 1];
        acc.impressions += lastMonth ? lastMonth.impressions : 0;
        acc.clicks += lastMonth ? lastMonth.clicks : 0;
        return acc;
      },
      { impressions: 0, clicks: 0 }
    );

    return {
      ...totals,
      pages: decay.count,
      ctr:
        totals.impressions > 0
          ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
          : 0,
    };
  };

  const filteredResults = () => {
    if (!decay) return [];
    let results = [...decay.results];

    // Apply filtering
    if (activeFilter !== "all") {
      results = results.filter((r) => r.status === activeFilter);
    }

    // Apply sorting
    results.sort((a, b) => {
      if (sortConfig.key === "url") {
        return sortConfig.direction === "asc"
          ? a.url.localeCompare(b.url)
          : b.url.localeCompare(a.url);
      }

      return sortConfig.direction === "asc"
        ? a[sortConfig.key] - b[sortConfig.key]
        : b[sortConfig.key] - a[sortConfig.key];
    });

    return results;
  };

  const deepDecayList = () =>
    decay ? decay.results.filter((r) => r.status === "Deep-Decay") : [];

  const slopeData = () => {
    if (!decay) return { urls: [], slopes: [], statuses: [] };
    return {
      urls: decay.results.map((r) =>
        r.url.replace("https://", "").replace(/^www\./, "")
      ),
      slopes: decay.results.map((r) => r.slopeI),
      statuses: decay.results.map((r) => r.status),
    };
  };

  const monthlyChart = (r) => {
    const labels = r.monthly.map((m) => m.month);
    const impressions = r.monthly.map((m) => m.impressions);
    const clicks = r.monthly.map((m) => m.clicks);

    // Calculate moving averages for trend lines
    const movingAvgImpressions = calculateMovingAverage(impressions, 3);

    return (
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Impressions",
              data: impressions,
              backgroundColor: "rgba(53, 162, 235, 0.2)",
              borderColor: "rgba(53, 162, 235, 1)",
              tension: 0.2,
            },
            {
              label: "Trend (3-month avg)",
              data: movingAvgImpressions,
              borderColor: "rgba(75, 192, 192, 1)",
              borderDash: [5, 5],
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4,
              fill: false,
            },
            {
              label: "Clicks",
              data: clicks,
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "rgba(255, 99, 132, 1)",
              tension: 0.2,
              yAxisID: "y1",
            },
          ],
        }}
        options={{
          responsive: true,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: { position: "top" },
            tooltip: {
              callbacks: {
                footer: (tooltipItems) => {
                  if (tooltipItems.length > 1) {
                    const impressions = tooltipItems[0].raw;
                    const clicks = tooltipItems[2].raw;
                    const ctr =
                      impressions > 0
                        ? ((clicks / impressions) * 100).toFixed(2)
                        : 0;
                    return `CTR: ${ctr}%`;
                  }
                  return "";
                },
              },
            },
          },
          scales: {
            y: {
              title: {
                display: true,
                text: "Impressions",
              },
              beginAtZero: true,
            },
            y1: {
              position: "right",
              title: {
                display: true,
                text: "Clicks",
              },
              grid: {
                drawOnChartArea: false,
              },
              beginAtZero: true,
            },
          },
        }}
      />
    );
  };

  const calculateMovingAverage = (data, window) => {
    const result = [];

    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(null); // Not enough data points yet
      } else {
        let sum = 0;
        for (let j = 0; j < window; j++) {
          sum += data[i - j];
        }
        result.push(sum / window);
      }
    }

    return result;
  };

  const sortBy = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  /* ------------------------------------------------------------------ */
  if (loading) return <Loader />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!decay) return <p>No data yet…</p>;

  const totals = getTotalStats();

  return (
    <div className="site-stats-dashboard">
      <div className="site-stats-container">
        <div className="site-stats-header">
          <h1 className="site-stats-title">Content Health Dashboard</h1>
          <p className="site-stats-subtitle">{siteDetails.siteUrl}</p>
        </div>

        {/* Stats Summary Cards */}
        <div className="site-stats-metrics-grid">
          <div className="site-stats-metric-card">
            <p className="site-stats-metric-label">Pages Analyzed</p>
            <p className="site-stats-metric-value">{totals.pages}</p>
          </div>
          <div className="site-stats-metric-card">
            <p className="site-stats-metric-label">Monthly Impressions</p>
            <p className="site-stats-metric-value">
              {totals.impressions.toLocaleString()}
            </p>
          </div>
          <div className="site-stats-metric-card">
            <p className="site-stats-metric-label">Monthly Clicks</p>
            <p className="site-stats-metric-value">
              {totals.clicks.toLocaleString()}
            </p>
          </div>
          <div className="site-stats-metric-card">
            <p className="site-stats-metric-label">Average CTR</p>
            <p className="site-stats-metric-value">{totals.ctr}%</p>
          </div>
        </div>

        <div className="site-stats-chart-container">
          {/* Status doughnut */}
          <div className="site-stats-chart-card">
            <div className="site-stats-chart-header">
              <h2 className="site-stats-chart-title">
                Content Health Distribution
              </h2>
            </div>
            <div className="site-stats-chart-body" style={{ height: "300px" }}>
              <Doughnut
                data={{
                  labels: Object.keys(statusCounts()),
                  datasets: [
                    {
                      data: Object.values(statusCounts()),
                      backgroundColor: Object.keys(statusCounts()).map(
                        (s) => statusPalette[s]
                      ),
                      borderWidth: 1,
                      borderColor: "#fff",
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label;
                          const value = context.raw;
                          const total = Object.values(statusCounts()).reduce(
                            (a, b) => a + b,
                            0
                          );
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                  cutout: "65%",
                }}
              />
            </div>
            <div className="site-stats-status-grid">
              {Object.entries(statusCounts()).map(([status, count]) => (
                <div
                  key={status}
                  className={`site-stats-status-pill ${
                    activeFilter === status ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter(status)}
                >
                  <div
                    className={`site-stats-status-dot site-stats-status-${status
                      .toLowerCase()
                      .replace("-", "-")}`}
                  ></div>
                  <div>
                    <p className="site-stats-status-text">
                      {status} {getStatusIcon(status)}
                    </p>
                    <p className="site-stats-status-count">{count} pages</p>
                  </div>
                </div>
              ))}
              <div
                className={`site-stats-status-pill ${
                  activeFilter === "all" ? "active" : ""
                }`}
                onClick={() => setActiveFilter("all")}
              >
                <div
                  className="site-stats-status-dot"
                  style={{ backgroundColor: "#cbd5e1" }}
                ></div>
                <div>
                  <p className="site-stats-status-text">Show All</p>
                  <p className="site-stats-status-count">{decay.count} pages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Impression slope bar */}
          <div className="site-stats-chart-card">
            <div className="site-stats-chart-header">
              <h2 className="site-stats-chart-title">
                Top Content Performance
              </h2>
              <p className="site-stats-chart-subtitle">
                7-day impression slope trends
              </p>
            </div>
            <div className="site-stats-chart-body">
              <Bar
                data={{
                  labels: slopeData().urls.slice(0, 10),
                  datasets: [
                    {
                      label: "Trend",
                      data: slopeData().slopes.slice(0, 10),
                      backgroundColor: slopeData()
                        .slopes.slice(0, 10)
                        .map((v, i) => statusPalette[slopeData().statuses[i]]),
                      borderWidth: 1,
                      borderColor: "#fff",
                    },
                  ],
                }}
                options={{
                  indexAxis: "y",
                  scales: {
                    x: {
                      ticks: { callback: (v) => v.toFixed(1) },
                      title: {
                        display: true,
                        text: "Slope (Higher is better)",
                      },
                    },
                    y: {
                      ticks: {
                        callback: (value, index) => {
                          // Truncate long URLs in chart
                          const url = slopeData().urls[index];
                          return url.length > 30
                            ? url.substring(0, 30) + "..."
                            : url;
                        },
                      },
                    },
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        title: (items) => {
                          const index = items[0].dataIndex;
                          return "https://" + slopeData().urls[index];
                        },
                        label: (context) => {
                          const value = context.raw;
                          const status =
                            slopeData().statuses[context.dataIndex];
                          return [
                            `Slope: ${value.toFixed(3)}`,
                            `Status: ${status} ${getStatusIcon(status)}`,
                          ];
                        },
                      },
                    },
                  },
                  responsive: true,
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Table with filtering */}
        <div className="site-stats-table-container">
          <div className="site-stats-table-header">
            <div>
              <h2 className="site-stats-chart-title">Content Analysis</h2>
              <p className="site-stats-chart-subtitle">
                {activeFilter === "all"
                  ? "All content"
                  : `${activeFilter} content`}{" "}
                ({filteredResults().length} pages)
              </p>
            </div>
            <div className="site-stats-filter-container">
              <button
                className={`site-stats-filter-button ${
                  activeFilter === "all" ? "active" : ""
                }`}
                onClick={() => setActiveFilter("all")}
              >
                All
              </button>
              {Object.keys(statusCounts()).map((status) => (
                <button
                  key={status}
                  className={`site-stats-filter-button ${
                    activeFilter === status ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter(status)}
                >
                  <span
                    className="site-stats-status-icon"
                    style={{ backgroundColor: statusPalette[status] }}
                  ></span>
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="site-stats-content-table">
              <thead>
                <tr>
                  <th onClick={() => sortBy("url")}>
                    URL
                    {sortConfig.key === "url" && (
                      <span className="site-stats-sort-icon">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th onClick={() => sortBy("status")}>
                    Status
                    {sortConfig.key === "status" && (
                      <span className="site-stats-sort-icon">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th onClick={() => sortBy("slopeI")}>
                    Slope
                    {sortConfig.key === "slopeI" && (
                      <span className="site-stats-sort-icon">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th onClick={() => sortBy("dropRatio")}>
                    Drop %
                    {sortConfig.key === "dropRatio" && (
                      <span className="site-stats-sort-icon">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults().map((r) => (
                  <React.Fragment key={r.url}>
                    <tr>
                      <td>
                        <div className="site-stats-url-cell">
                          {r.url.replace("https://", "").replace(/^www\./, "")}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`site-stats-status-badge site-stats-status-badge-${r.status
                            .toLowerCase()
                            .replace("-", "-")}`}
                        >
                          {getStatusIcon(r.status)} {r.status}
                        </span>
                      </td>
                      <td>
                        <div
                          className={`site-stats-slope-value ${
                            r.slopeI < 0
                              ? "site-stats-slope-negative"
                              : "site-stats-slope-positive"
                          }`}
                        >
                          {r.slopeI.toFixed(3)}
                          <span className="site-stats-slope-icon">
                            {r.slopeI < 0 ? "↓" : "↑"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="site-stats-progress-bar-container">
                          <div
                            className={`site-stats-progress-bar ${
                              r.dropRatio > 0.5
                                ? "site-stats-progress-bar-danger"
                                : "site-stats-progress-bar-warning"
                            }`}
                            style={{ width: `${r.dropRatio * 100}%` }}
                          ></div>
                        </div>
                        <span className="site-stats-progress-label">
                          {(r.dropRatio * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <button
                          className="site-stats-action-button"
                          onClick={() =>
                            setSelectedUrl(selectedUrl === r.url ? null : r.url)
                          }
                        >
                          {selectedUrl === r.url ? "Hide" : "View"} trend
                        </button>
                      </td>
                    </tr>
                    {selectedUrl === r.url && (
                      <tr>
                        <td colSpan="5" className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="site-stats-inline-detail"
                          >
                            <div className="site-stats-inline-chart-container">
                              {monthlyChart(r)}
                            </div>
                            <div className="site-stats-inline-insights">
                              {(() => {
                                const lastMonth =
                                  r.monthly[r.monthly.length - 1];
                                const prevMonth =
                                  r.monthly[r.monthly.length - 2];
                                const monthlyChange =
                                  prevMonth && lastMonth
                                    ? ((lastMonth.impressions -
                                        prevMonth.impressions) /
                                        prevMonth.impressions) *
                                      100
                                    : 0;

                                return (
                                  <>
                                    <div className="site-stats-insight-item">
                                      <p className="site-stats-insight-label">
                                        Last Month Impressions
                                      </p>
                                      <p className="site-stats-insight-value">
                                        {lastMonth
                                          ? lastMonth.impressions.toLocaleString()
                                          : "N/A"}
                                      </p>
                                      {monthlyChange !== 0 && (
                                        <p
                                          className={`site-stats-change ${
                                            monthlyChange > 0
                                              ? "site-stats-change-positive"
                                              : "site-stats-change-negative"
                                          }`}
                                        >
                                          {monthlyChange > 0 ? "↑" : "↓"}{" "}
                                          {Math.abs(monthlyChange).toFixed(1)}%
                                        </p>
                                      )}
                                    </div>
                                    <div className="site-stats-insight-item">
                                      <p className="site-stats-insight-label">
                                        Last Month Clicks
                                      </p>
                                      <p className="site-stats-insight-value">
                                        {lastMonth
                                          ? lastMonth.clicks.toLocaleString()
                                          : "N/A"}
                                      </p>
                                      <p className="site-stats-insight-label">
                                        CTR:{" "}
                                        {lastMonth && lastMonth.impressions > 0
                                          ? (
                                              (lastMonth.clicks /
                                                lastMonth.impressions) *
                                              100
                                            ).toFixed(2)
                                          : 0}
                                        %
                                      </p>
                                    </div>
                                    <div className="site-stats-insight-item">
                                      <p className="site-stats-insight-label">
                                        Drop Ratio
                                      </p>
                                      <p className="site-stats-insight-value">
                                        {(r.dropRatio * 100).toFixed(1)}%
                                      </p>
                                      <p className="site-stats-insight-label">
                                        {r.halfLifePassed
                                          ? "50% threshold passed"
                                          : "Above 50% threshold"}
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
