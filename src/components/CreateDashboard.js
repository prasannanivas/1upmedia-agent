import React, { useState } from "react";
import { useFinancialCalculations } from "../context/FinancialCalculations";
import { useDrop } from "react-dnd";
import { DndProvider, useDrag } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import "./CreateDashboard.css";

// List of available widgets/fields (expanded to match FinancialCalculations context)
const AVAILABLE_FIELDS = [
  {
    id: "gaDataInsightsSummary",
    label: "Google Analytics Data Insights Summary",
  },
  { id: "gaDataTopPerformers", label: "GA Data Top Performers" },
  { id: "gaDataProblemAreas", label: "GA Data Problem Areas" },
  { id: "categoriseIntoBuckets", label: "Categorise Into Buckets" },
  { id: "getRiskMetric", label: "Risk Metric" },
  { id: "getRevenueLeak", label: "Revenue Leak" },
  { id: "getContentDecay", label: "Content Decay" },
  { id: "getKeywordMismatch", label: "Keyword Mismatch" },
  { id: "getLinkDilution", label: "Link Dilution" },
  { id: "getPsychMismatch", label: "Psychological Mismatch" },
  { id: "getCannibalizationLoss", label: "Cannibalization Loss" },
  { id: "calculateTotalLoss", label: "Calculate Total Loss" },
  { id: "funnelGapIdentifier", label: "Funnel Gap Identifier" },
  {
    id: "getContentQualityDistribution",
    label: "Content Quality Distribution",
  },
  { id: "getMoodyCreditScore", label: "Moody Credit Score" },
  { id: "getROIRecoveryPotential", label: "ROI Recovery Potential" },
  { id: "getKeywordConflicts", label: "Keyword Conflicts" },
  { id: "getHighCTRLeak", label: "High CTR Leak" },
  { id: "getMismatchRisk", label: "Mismatch Risk" },
  { id: "getLinkDilutionRisk", label: "Link Dilution Risk" },
  { id: "getCannibalRisk", label: "Cannibal Risk" },
  { id: "getCrawlErrorPercentage", label: "Crawl Error Percentage" },
  { id: "getTotalWastedSpend", label: "Total Wasted Spend" },
  { id: "getContentWastePages", label: "Content Waste Pages" },
];

function FieldItem({ field }) {
  const [{ isDragging }, drag] = useDrag({
    type: "FIELD",
    item: { id: field.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <div
      ref={drag}
      className={`field-item${isDragging ? " dragging" : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {field.label}
    </div>
  );
}

function DashboardDropArea({ widgets, onDrop, onRemove }) {
  const [{ isOver }, drop] = useDrop({
    accept: "FIELD",
    drop: (item) => onDrop(item.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  const context = useFinancialCalculations();

  // Chart color palette
  const COLORS = [
    "#1976d2",
    "#64b5f6",
    "#ffb300",
    "#e57373",
    "#43a047",
    "#8e24aa",
    "#f06292",
    "#00897b",
    "#fbc02d",
    "#d84315",
  ];

  // Render widget content based on field id
  const renderWidgetContent = (widget) => {
    if (!context) return <div>Loading...</div>;
    const value = context[widget.id];
    let result = value;
    if (typeof value === "function") {
      try {
        result = value();
      } catch (e) {
        return <div className="widget-error">Error: {e.message}</div>;
      }
    }

    // Helper: Pie chart for loss breakdowns
    const renderPieChart = (data, dataKey, nameKey = "name") => (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={70}
            label
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );

    // Helper: Bar chart for category counts
    const renderBarChart = (data, xKey, barKey, label) => (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <XAxis dataKey={xKey} />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Bar dataKey={barKey} fill="#1976d2" name={label} />
          <RechartsTooltip />
          <Legend />
        </BarChart>
      </ResponsiveContainer>
    );

    // Helper: Line chart for trends
    const renderLineChart = (data, xKey, lineKey, label) => (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <XAxis dataKey={xKey} />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey={lineKey}
            stroke="#1976d2"
            name={label}
          />
          <RechartsTooltip />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    );

    // Widget-specific chart logic
    switch (widget.id) {
      // Removed duplicate/old getRiskMetric case to resolve duplicate case label error
      case "gaDataProblemAreas": {
        // Custom table and charts for GA Problem Areas
        if (result && typeof result === "object") {
          // const highBounce = Array.isArray(result.highBounceRate)
          //   ? result.highBounceRate
          //   : [];
          const lowEngagement = Array.isArray(result.lowEngagement)
            ? result.lowEngagement
            : [];

          // Bar chart for top 5 low engagement pages
          const lowEngagementBarData = lowEngagement.slice(0, 5).map((row) => ({
            url: row.url,
            engagement: Math.round(row.engagementRate * 100),
            sessions: row.sessions,
          }));

          return (
            <div className="ga-problem-areas-widget">
              <div className="ga-problem-areas-charts">
                <div className="ga-problem-areas-chart">
                  <h4>Top 5 Low Engagement Pages</h4>
                  {renderBarChart(
                    lowEngagementBarData,
                    "url",
                    "engagement",
                    "Engagement %"
                  )}
                </div>
              </div>
              <div className="ga-problem-areas-table-container">
                <h4>Top 5 Low Engagement Pages</h4>
                <table className="ga-problem-areas-table">
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Sessions</th>
                      <th>Pageviews</th>
                      <th>Engagement Rate</th>
                      <th>Bounce Rate</th>
                      <th>Avg. Session Duration</th>
                      <th>Revenue</th>
                      <th>Issues</th>
                      <th>Opportunities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowEngagement.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="ga-url-cell">{row.url}</td>
                        <td>{row.sessions?.toLocaleString?.() ?? "-"}</td>
                        <td>{row.pageViews?.toLocaleString?.() ?? "-"}</td>
                        <td>
                          {typeof row.engagementRate === "number"
                            ? `${Math.round(row.engagementRate * 100)}%`
                            : "-"}
                        </td>
                        <td>
                          {typeof row.bounceRate === "number"
                            ? `${Math.round(row.bounceRate * 100)}%`
                            : "-"}
                        </td>
                        <td>
                          {row.avgSessionDuration
                            ? `${Math.round(row.avgSessionDuration)}s`
                            : "-"}
                        </td>
                        <td>
                          {row.estimatedRevenue
                            ? `$${row.estimatedRevenue.toLocaleString?.()}`
                            : "-"}
                        </td>
                        <td>
                          {Array.isArray(row.issues) &&
                          row.issues.length > 0 ? (
                            <ul className="ga-issues-list">
                              {row.issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          {Array.isArray(row.opportunities) &&
                          row.opportunities.length > 0 ? (
                            <ul className="ga-opps-list">
                              {row.opportunities.map((op, i) => (
                                <li key={i}>{op}</li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        break;
      }
      case "gaDataTopPerformers": {
        // Custom table and charts for GA Top Performers
        if (result && typeof result === "object") {
          const byTraffic = Array.isArray(result.byTraffic)
            ? result.byTraffic
            : [];
          const byEngagement = Array.isArray(result.byEngagement)
            ? result.byEngagement
            : [];

          // Bar chart data for top 5 by sessions
          const trafficBarData = byTraffic.slice(0, 5).map((row) => ({
            url: row.url,
            sessions: row.sessions,
            revenue: row.estimatedRevenue,
          }));
          // Bar chart data for top 5 by engagement
          const engagementBarData = byEngagement.slice(0, 5).map((row) => ({
            url: row.url,
            engagement: Math.round(row.engagementRate * 100),
            revenue: row.estimatedRevenue,
          }));

          return (
            <div className="ga-top-performers-widget">
              <div className="ga-top-performers-charts">
                <div className="ga-top-performers-chart">
                  <h4>Top 5 by Traffic (Sessions)</h4>
                  {renderBarChart(
                    trafficBarData,
                    "url",
                    "sessions",
                    "Sessions"
                  )}
                </div>
                <div className="ga-top-performers-chart">
                  <h4>Top 5 by Engagement Rate</h4>
                  {renderBarChart(
                    engagementBarData,
                    "url",
                    "engagement",
                    "Engagement %"
                  )}
                </div>
              </div>
              <div className="ga-top-performers-table-container">
                <h4>Top 5 Pages by Traffic</h4>
                <table className="ga-top-performers-table">
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Sessions</th>
                      <th>Pageviews</th>
                      <th>Engagement Rate</th>
                      <th>Bounce Rate</th>
                      <th>Avg. Session Duration</th>
                      <th>Revenue</th>
                      <th>Opportunities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byTraffic.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="ga-url-cell">{row.url}</td>
                        <td>{row.sessions?.toLocaleString?.() ?? "-"}</td>
                        <td>{row.pageViews?.toLocaleString?.() ?? "-"}</td>
                        <td>
                          {typeof row.engagementRate === "number"
                            ? `${Math.round(row.engagementRate * 100)}%`
                            : "-"}
                        </td>
                        <td>
                          {typeof row.bounceRate === "number"
                            ? `${Math.round(row.bounceRate * 100)}%`
                            : "-"}
                        </td>
                        <td>
                          {row.avgSessionDuration
                            ? `${Math.round(row.avgSessionDuration)}s`
                            : "-"}
                        </td>
                        <td>
                          {row.estimatedRevenue
                            ? `$${row.estimatedRevenue.toLocaleString?.()}`
                            : "-"}
                        </td>
                        <td>
                          {Array.isArray(row.opportunities) &&
                          row.opportunities.length > 0 ? (
                            <ul className="ga-opps-list">
                              {row.opportunities.map((op, i) => (
                                <li key={i}>{op}</li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ga-top-performers-table-container">
                <h4>Top 5 Pages by Engagement</h4>
                <table className="ga-top-performers-table">
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Sessions</th>
                      <th>Pageviews</th>
                      <th>Engagement Rate</th>
                      <th>Bounce Rate</th>
                      <th>Avg. Session Duration</th>
                      <th>Revenue</th>
                      <th>Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byEngagement.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="ga-url-cell">{row.url}</td>
                        <td>{row.sessions?.toLocaleString?.() ?? "-"}</td>
                        <td>{row.pageViews?.toLocaleString?.() ?? "-"}</td>
                        <td>
                          {typeof row.engagementRate === "number"
                            ? `${Math.round(row.engagementRate * 100)}%`
                            : "-"}
                        </td>
                        <td>
                          {typeof row.bounceRate === "number"
                            ? `${Math.round(row.bounceRate * 100)}%`
                            : "-"}
                        </td>
                        <td>
                          {row.avgSessionDuration
                            ? `${Math.round(row.avgSessionDuration)}s`
                            : "-"}
                        </td>
                        <td>
                          {row.estimatedRevenue
                            ? `$${row.estimatedRevenue.toLocaleString?.()}`
                            : "-"}
                        </td>
                        <td>
                          {Array.isArray(row.issues) &&
                          row.issues.length > 0 ? (
                            <ul className="ga-issues-list">
                              {row.issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        break;
      }
      case "gaDataInsightsSummary": {
        // Custom table and insights for GA summary
        if (result && typeof result === "object" && result.summary) {
          const s = result.summary;
          return (
            <div className="ga-summary-widget">
              <div className="ga-summary-table-container">
                <table className="ga-summary-table">
                  <tbody>
                    <tr>
                      <th>Total URLs</th>
                      <td>{s.totalUrls?.toLocaleString?.() ?? "-"}</td>
                    </tr>
                    <tr>
                      <th>Total Sessions</th>
                      <td>{s.totalSessions?.toLocaleString?.() ?? "-"}</td>
                    </tr>
                    <tr>
                      <th>Total Pageviews</th>
                      <td>{s.totalPageViews?.toLocaleString?.() ?? "-"}</td>
                    </tr>
                    <tr>
                      <th>Engagement Rate</th>
                      <td>
                        {typeof s.overallEngagementRate === "number"
                          ? `${Math.round(s.overallEngagementRate * 100)}%`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Avg. Bounce Rate</th>
                      <td>
                        {typeof s.avgBounceRate === "number"
                          ? `${Math.round(s.avgBounceRate * 100)}%`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Avg. Session Duration</th>
                      <td>
                        {s.avgSessionDuration
                          ? `${s.avgSessionDuration}s`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Est. Total Revenue</th>
                      <td>
                        {s.estimatedTotalRevenue
                          ? `$${s.estimatedTotalRevenue.toLocaleString?.()}`
                          : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {Array.isArray(result.insights) && result.insights.length > 0 && (
                <div className="ga-summary-insights">
                  <h4>Key Insights</h4>
                  <ul>
                    {result.insights.map((ins, idx) => (
                      <li key={idx}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(result.recommendations) &&
                result.recommendations.length > 0 && (
                  <div className="ga-summary-recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          );
        }
        break;
      }
      case "calculateTotalLoss": {
        // Pie chart for loss breakdown
        const summary = result?.summary;
        const rawLosses = result?.RollingUpTotal
          ? Object.entries(result.RollingUpTotal).filter(
              ([k]) => k !== "totalLoss"
            )
          : [];
        const pieData = rawLosses.map(([name, value]) => ({ name, value }));
        return pieData.length > 0 ? (
          <>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>
              Loss Breakdown
            </div>
            {renderPieChart(pieData, "value", "name")}
            <div className="widget-content" style={{ marginTop: 12 }}>
              Total Loss:{" "}
              <b>${summary?.totalRevenueLoss?.toLocaleString?.() ?? "-"}</b>
            </div>
          </>
        ) : (
          <pre className="widget-json">{JSON.stringify(result, null, 2)}</pre>
        );
      }
      case "getRevenueLeak": {
        // Custom visualization for Revenue Leak
        if (result && typeof result === "object") {
          const {
            totalUrls,
            zeroClicksCount,
            threshold,
            urlsBelowThreshold,
            estimatedRevenueLoss,
            averageOrderValue,
            contentCost,
            conversionRate,
            tooltip,
            details = {},
          } = result;

          // Pie chart for underperforming vs healthy URLs
          const pieData = [
            { name: "Underperforming URLs", value: urlsBelowThreshold || 0 },
            {
              name: "Healthy URLs",
              value: (totalUrls || 0) - (urlsBelowThreshold || 0),
            },
          ];

          return (
            <div className="revenue-leak-widget">
              <div className="revenue-leak-header">
                <h4>Recoverable Revenue Opportunity</h4>
                {tooltip && (
                  <span
                    className="revenue-leak-tooltip"
                    title={tooltip.content}
                  >
                    ℹ️
                  </span>
                )}
              </div>
              <div className="revenue-leak-pie">
                {renderPieChart(pieData, "value", "name")}
              </div>
              <div className="revenue-leak-summary">
                <div>
                  <b>Total URLs:</b> {totalUrls?.toLocaleString?.() ?? "-"}
                </div>
                <div>
                  <b>Underperforming URLs:</b>{" "}
                  {urlsBelowThreshold?.toLocaleString?.() ?? "-"}
                </div>
                <div>
                  <b>Zero Click URLs:</b>{" "}
                  {zeroClicksCount?.toLocaleString?.() ?? "-"}
                </div>
                <div>
                  <b>Break-even Threshold:</b> {threshold ?? "-"} clicks
                </div>
                <div>
                  <b>Estimated Recoverable Revenue:</b>{" "}
                  <span className="revenue-leak-amount">
                    ${estimatedRevenueLoss?.toLocaleString?.() ?? "-"}
                  </span>
                </div>
              </div>
              <div className="revenue-leak-details">
                <h5>Calculation Details</h5>
                <table className="revenue-leak-details-table">
                  <tbody>
                    <tr>
                      <th>Average Order Value</th>
                      <td>${averageOrderValue?.toLocaleString?.() ?? "-"}</td>
                    </tr>
                    <tr>
                      <th>Content Cost</th>
                      <td>${contentCost?.toLocaleString?.() ?? "-"}</td>
                    </tr>
                    <tr>
                      <th>Conversion Rate</th>
                      <td>
                        {typeof conversionRate === "number"
                          ? `${(conversionRate * 100).toFixed(2)}%`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Cost Per URL</th>
                      <td>${details.costPerUrl?.toLocaleString?.() ?? "-"}</td>
                    </tr>
                    <tr>
                      <th>Threshold Formula</th>
                      <td>
                        <code>{details.thresholdFormula ?? "-"}</code>
                      </td>
                    </tr>
                    <tr>
                      <th>ROI Calculation</th>
                      <td>
                        <code>{details.roiCalculation ?? "-"}</code>
                      </td>
                    </tr>
                    <tr>
                      <th>Recovery Formula</th>
                      <td>
                        <code>{details.recoveryFormula ?? "-"}</code>
                      </td>
                    </tr>
                    <tr>
                      <th>Discount Rate</th>
                      <td>
                        {details.discountRate != null
                          ? `${(details.discountRate * 100).toFixed(1)}%`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Recovery Rate</th>
                      <td>
                        {details.recoveryRate != null
                          ? `${(details.recoveryRate * 100).toFixed(1)}%`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Present Value Factor</th>
                      <td>
                        {details.presentValueFactor != null
                          ? details.presentValueFactor.toFixed(3)
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <th>Cap Applied</th>
                      <td>{details.capApplied ?? "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        break;
      }
      // (removed duplicate case for getRevenueLeak)
      case "getContentDecay": {
        // Bar chart for decay categories
        const decayDist = result?.decayDistribution;
        if (decayDist) {
          const barData = Object.entries(decayDist).map(([cat, val]) => ({
            category: cat,
            count: val.count,
          }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Decay Category Distribution
              </div>
              {renderBarChart(barData, "category", "count", "URLs")}
            </>
          );
        }
        break;
      }
      case "getKeywordMismatch": {
        // Bar chart for mismatch categories
        const mismatchDist = result?.mismatchDistribution;
        if (mismatchDist) {
          const barData = Object.entries(mismatchDist).map(([cat, val]) => ({
            category: cat,
            count: val.count,
          }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Mismatch Category Distribution
              </div>
              {renderBarChart(barData, "category", "count", "URLs")}
            </>
          );
        }
        break;
      }
      case "getLinkDilution": {
        // Bar chart for dilution categories
        const dilutionDist = result?.dilutionDistribution;
        if (dilutionDist) {
          const barData = Object.entries(dilutionDist).map(([cat, val]) => ({
            category: cat,
            count: val.count,
          }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Link Dilution Distribution
              </div>
              {renderBarChart(barData, "category", "count", "URLs")}
            </>
          );
        }
        break;
      }
      case "getPsychMismatch": {
        // Pie chart for severity distribution
        const severityDist = result?.severityDistribution;
        if (severityDist) {
          const pieData = Object.entries(severityDist).map(([cat, val]) => ({
            name: cat,
            value: val.count,
          }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Psychological Mismatch Severity
              </div>
              {renderPieChart(pieData, "value", "name")}
            </>
          );
        }
        break;
      }
      case "getCannibalizationLoss": {
        // Pie chart for cannibalization severity
        const severityDist = result?.severityDistribution;
        if (severityDist) {
          const pieData = Object.entries(severityDist).map(([cat, val]) => ({
            name: cat,
            value: val.count,
          }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Cannibalization Severity
              </div>
              {renderPieChart(pieData, "value", "name")}
            </>
          );
        }
        break;
      }
      case "getRiskMetric": {
        // Aggregated summary for risk metrics array
        if (Array.isArray(result) && result.length > 0) {
          // Aggregate by riskLevel and priority
          const riskLevelCounts = {};
          const priorityCounts = {};
          let avgCompositeRisk = 0;
          let total = 0;
          result.forEach((item) => {
            if (item.riskLevel) {
              riskLevelCounts[item.riskLevel] =
                (riskLevelCounts[item.riskLevel] || 0) + 1;
            }
            if (item.priority) {
              priorityCounts[item.priority] =
                (priorityCounts[item.priority] || 0) + 1;
            }
            if (
              item.riskMetrics &&
              typeof item.riskMetrics.compositeRiskScore === "number"
            ) {
              avgCompositeRisk += item.riskMetrics.compositeRiskScore;
              total++;
            }
          });
          const riskLevelPie = Object.entries(riskLevelCounts).map(
            ([name, value]) => ({ name, value })
          );
          const priorityPie = Object.entries(priorityCounts).map(
            ([name, value]) => ({ name, value })
          );
          const avgComposite = total > 0 ? avgCompositeRisk / total : null;

          // Top 5 highest risk URLs (by compositeRiskScore)
          const topRisk = [...result]
            .filter(
              (r) =>
                r.riskMetrics &&
                typeof r.riskMetrics.compositeRiskScore === "number"
            )
            .sort(
              (a, b) =>
                b.riskMetrics.compositeRiskScore -
                a.riskMetrics.compositeRiskScore
            )
            .slice(0, 5);

          return (
            <div className="risk-metric-widget">
              <div className="risk-metric-charts">
                <div className="risk-metric-chart">
                  <h4>Risk Level Distribution</h4>
                  {renderPieChart(riskLevelPie, "value", "name")}
                </div>
                <div className="risk-metric-chart">
                  <h4>Priority Distribution</h4>
                  {renderPieChart(priorityPie, "value", "name")}
                </div>
              </div>
              <div className="risk-metric-summary">
                <div>
                  <b>Total URLs:</b> {result.length}
                </div>
                {Object.entries(riskLevelCounts).map(([level, count]) => (
                  <div key={level}>
                    <b>{level} Risk:</b> {count}
                  </div>
                ))}
                {Object.entries(priorityCounts).map(([priority, count]) => (
                  <div key={priority}>
                    <b>{priority} Priority:</b> {count}
                  </div>
                ))}
                {avgComposite !== null && (
                  <div>
                    <b>Avg. Composite Risk Score:</b> {avgComposite.toFixed(2)}
                  </div>
                )}
              </div>
              {topRisk.length > 0 && (
                <div className="risk-metric-table-container">
                  <h4>Top 5 Highest Risk URLs</h4>
                  <table className="risk-metric-table">
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Risk Level</th>
                        <th>Priority</th>
                        <th>Composite Risk</th>
                        <th>Recommendations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRisk.map((row, idx) => (
                        <tr key={idx}>
                          <td className="risk-url-cell">{row.url}</td>
                          <td>{row.riskLevel}</td>
                          <td>{row.priority}</td>
                          <td>
                            {row.riskMetrics.compositeRiskScore.toFixed(2)}
                          </td>
                          <td>
                            {Array.isArray(row.recommendations) &&
                            row.recommendations.length > 0 ? (
                              <ul className="risk-recommendations-list">
                                {row.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        }
        break;
      }
      case "categoriseIntoBuckets": {
        // Pie chart for bucket sizes
        if (result && typeof result === "object") {
          const pieData = Object.entries(result).map(([name, arr]) => ({
            name,
            value: Array.isArray(arr) ? arr.length : 0,
          }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                URL Buckets
              </div>
              {renderPieChart(pieData, "value", "name")}
            </>
          );
        }
        break;
      }
      case "getHighCTRLeak": {
        // Bar chart for top 10 low CTR URLs
        const urlDetails = result?.urlDetails;
        if (Array.isArray(urlDetails) && urlDetails.length > 0) {
          const barData = urlDetails
            .slice(0, 10)
            .map((d) => ({ url: d.url, loss: d.estimatedRevenueLoss }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Top 10 Low CTR URLs (Loss)
              </div>
              {renderBarChart(barData, "url", "loss", "Loss ($)")}
            </>
          );
        }
        break;
      }
      case "getMismatchRisk": {
        // Bar chart for top 10 mismatch URLs
        const urlDetails = result?.urlDetails;
        if (Array.isArray(urlDetails) && urlDetails.length > 0) {
          const barData = urlDetails
            .slice(0, 10)
            .map((d) => ({ url: d.url, loss: d.estimatedRevenueLoss }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Top 10 Mismatch URLs (Loss)
              </div>
              {renderBarChart(barData, "url", "loss", "Loss ($)")}
            </>
          );
        }
        break;
      }
      case "getLinkDilutionRisk": {
        // Bar chart for top 10 dilution URLs
        const urlDetails = result?.urlDetails;
        if (Array.isArray(urlDetails) && urlDetails.length > 0) {
          const barData = urlDetails
            .slice(0, 10)
            .map((d) => ({ url: d.url, loss: d.estimatedRevenueLoss }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Top 10 Link Dilution URLs (Loss)
              </div>
              {renderBarChart(barData, "url", "loss", "Loss ($)")}
            </>
          );
        }
        break;
      }
      case "getCannibalRisk": {
        // Bar chart for top 10 cannibal conflicts
        const conflictDetails = result?.conflictDetails;
        if (Array.isArray(conflictDetails) && conflictDetails.length > 0) {
          const barData = conflictDetails
            .slice(0, 10)
            .map((d) => ({ keyword: d.keyword, loss: d.estimatedRevenueLoss }));
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Top 10 Cannibalization Conflicts (Loss)
              </div>
              {renderBarChart(barData, "keyword", "loss", "Loss ($)")}
            </>
          );
        }
        break;
      }
      case "getCrawlErrorPercentage": {
        // Pie chart for error vs non-error URLs
        const total = result?.totalUrls ?? 0;
        const error = result?.errorUrls ?? 0;
        if (total > 0) {
          const pieData = [
            { name: "Error URLs", value: error },
            { name: "Healthy URLs", value: total - error },
          ];
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Crawl Error Percentage
              </div>
              {renderPieChart(pieData, "value", "name")}
            </>
          );
        }
        break;
      }
      case "getTotalWastedSpend": {
        // Pie chart for waste vs non-waste
        const total = result?.totalUrls ?? 0;
        const waste = result?.wastePages ?? 0;
        if (total > 0) {
          const pieData = [
            { name: "Wasted Pages", value: waste },
            { name: "Healthy Pages", value: total - waste },
          ];
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Wasted Spend Pages
              </div>
              {renderPieChart(pieData, "value", "name")}
            </>
          );
        }
        break;
      }
      case "getContentWastePages": {
        // Pie chart for waste vs non-waste
        const total = result?.totalUrls ?? 0;
        const waste = result?.wastePages ?? 0;
        if (total > 0) {
          const pieData = [
            { name: "Waste Pages", value: waste },
            { name: "Healthy Pages", value: total - waste },
          ];
          return (
            <>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Content Waste Pages
              </div>
              {renderPieChart(pieData, "value", "name")}
            </>
          );
        }
        break;
      }
      default:
        // Fallback: show summary if available, else JSON
        if (result && typeof result === "object" && result.summary) {
          return (
            <>
              <div
                className="widget-content"
                style={{ marginBottom: 8, fontWeight: 600 }}
              >
                Summary
              </div>
              <pre className="widget-json">
                {JSON.stringify(result.summary, null, 2)}
              </pre>
            </>
          );
        }
        return (
          <pre className="widget-json">{JSON.stringify(result, null, 2)}</pre>
        );
    }
    // fallback
    return <pre className="widget-json">{JSON.stringify(result, null, 2)}</pre>;
  };

  return (
    <div
      ref={drop}
      className={`dashboard-drop-area${isOver ? " over" : ""}`}
      style={{
        minHeight:
          widgets.length === 0 ? 300 : Math.max(400, widgets.length * 220),
        transition: "min-height 0.3s cubic-bezier(.4,2,.6,1)",
        display: "grid",
        gridTemplateColumns:
          widgets.length > 1 ? "repeat(auto-fit, minmax(340px, 1fr))" : "1fr",
        gap: "32px",
        alignItems: "stretch",
        background: isOver ? "#e3f2fd" : undefined,
      }}
    >
      {widgets.length === 0 ? (
        <div className="dashboard-placeholder">Drag fields here</div>
      ) : (
        widgets.map((widget, idx) => (
          <div key={widget.id} className="dashboard-widget dynamic-widget">
            <div className="widget-header">
              <span className="widget-title">{widget.label}</span>
              <button
                className="remove-btn"
                onClick={() => onRemove(widget.id)}
              >
                ×
              </button>
            </div>
            <div className="widget-content-area">
              {renderWidgetContent(widget)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function CreateDashboard() {
  const [dashboardFields, setDashboardFields] = useState([]);

  const handleDrop = (fieldId) => {
    if (!dashboardFields.find((f) => f.id === fieldId)) {
      const field = AVAILABLE_FIELDS.find((f) => f.id === fieldId);
      if (field) setDashboardFields([...dashboardFields, field]);
    }
  };

  const handleRemove = (fieldId) => {
    setDashboardFields(dashboardFields.filter((f) => f.id !== fieldId));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="create-dashboard-container">
        <div className="sidebar">
          <h3>Available Fields</h3>
          {AVAILABLE_FIELDS.map((field) => (
            <FieldItem key={field.id} field={field} />
          ))}
        </div>
        <div className="dashboard-area awesome-dashboard">
          <h3 className="dashboard-title">Your Custom Dashboard</h3>
          <DashboardDropArea
            widgets={dashboardFields}
            onDrop={handleDrop}
            onRemove={handleRemove}
          />
        </div>
      </div>
    </DndProvider>
  );
}
