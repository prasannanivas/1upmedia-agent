import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bar, Line, HorizontalBar } from "react-chartjs-2";
import "chart.js/auto"; // Automatically registers required chart.js components

import "./SiteStats.css";
import Loader from "../../components/Loader";

function SiteStats() {
  const { state } = useLocation();
  const { siteDetails } = state;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSiteStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://ai.1upmedia.com:3000/google/compare-analytics`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              siteUrl: siteDetails.siteUrl,
              accessToken: siteDetails.accessToken,
              startDate1: "2024-01-01", // Example start date
              endDate1: "2024-06-30", // Example end date
              startDate2: "2024-07-01", // Example start date
              endDate2: "2024-12-30", // Example end date
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch site stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSiteStats();
  }, [siteDetails]);

  // Prepare data for charts
  const prepareChartData = () => {
    if (!stats || !stats.comparedData) return {};

    const queries = stats.comparedData.map((item) => item.query);
    const impressionsDiff = stats.comparedData.map(
      (item) => item.impressionsDiff || 0
    );
    const ctrRange1 = stats.comparedData.map((item) => item.range1?.ctr || 0);
    const ctrRange2 = stats.comparedData.map((item) => item.range2?.ctr || 0);
    const positionDiff = stats.comparedData.map(
      (item) => item.positionDiff || 0
    );

    return {
      queries,
      impressionsDiff,
      ctrRange1,
      ctrRange2,
      positionDiff,
    };
  };

  const chartData = prepareChartData();

  // Identify Best and Worst Performing Keywords
  const bestPerformingKeywords = stats?.comparedData
    ?.filter((item) => item.impressionsDiff > 0)
    ?.sort((a, b) => b.impressionsDiff - a.impressionsDiff)
    ?.slice(0, 5); // Top 5 by impressionsDiff

  const worstPerformingKeywords = stats?.comparedData
    ?.filter((item) => item.impressionsDiff < 0)
    ?.sort((a, b) => a.impressionsDiff - b.impressionsDiff)
    ?.slice(0, 5); // Bottom 5 by impressionsDiff

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Site Stats</h1>
      <h2>Site: {siteDetails.siteUrl}</h2>
      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : stats ? (
        <>
          {/* Top Performing Keywords */}
          <div style={{ marginBottom: "40px" }}>
            <h3>Top Performing Keywords (Impressions Difference)</h3>
            <Bar
              data={{
                labels: chartData.queries,
                datasets: [
                  {
                    label: "Impressions Difference",
                    data: chartData.impressionsDiff,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Impressions Difference for Keywords",
                  },
                },
              }}
            />
          </div>

          {/* CTR Comparison */}
          <div style={{ marginBottom: "40px" }}>
            <h3>CTR Comparison</h3>
            <Line
              data={{
                labels: chartData.queries,
                datasets: [
                  {
                    label: "CTR (Range 1)",
                    data: chartData.ctrRange1,
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderWidth: 2,
                  },
                  {
                    label: "CTR (Range 2)",
                    data: chartData.ctrRange2,
                    borderColor: "rgba(255, 99, 132, 1)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "CTR Comparison (Range 1 vs. Range 2)",
                  },
                },
              }}
            />
          </div>

          {/* Position Differences */}
          <div style={{ marginBottom: "40px" }}>
            <h3>Position Differences</h3>
            <Bar
              data={{
                labels: chartData.queries,
                datasets: [
                  {
                    label: "Position Difference",
                    data: chartData.positionDiff,
                    backgroundColor: "rgba(255, 206, 86, 0.6)",
                    borderColor: "rgba(255, 206, 86, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                indexAxis: "y", // Horizontal bar chart
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Position Differences for Keywords",
                  },
                },
              }}
            />
          </div>

          {/* Best Performing Keywords */}
          <div
            style={{
              marginTop: "40px",
              padding: "20px",
              backgroundColor: "#f0fdf4",
              borderRadius: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: "#16a34a", marginBottom: "20px" }}>
              🌟 Best Performing Keywords
            </h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {bestPerformingKeywords?.map((item, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <span
                    style={{
                      marginRight: "10px",
                      color: "#16a34a",
                      fontSize: "20px",
                    }}
                  >
                    ✅
                  </span>
                  <span style={{ flexGrow: 1 }}>
                    <strong style={{ color: "#16a34a" }}>{item.query}</strong>
                    <span style={{ marginLeft: "10px", color: "#4ade80" }}>
                      (+{item.impressionsDiff} impressions)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Worst Performing Keywords */}
          <div
            style={{
              marginTop: "40px",
              padding: "20px",
              backgroundColor: "#fef2f2",
              borderRadius: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: "#dc2626", marginBottom: "20px" }}>
              ⚠️ Worst Performing Keywords
            </h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {worstPerformingKeywords?.map((item, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <span
                    style={{
                      marginRight: "10px",
                      color: "#dc2626",
                      fontSize: "20px",
                    }}
                  >
                    ❌
                  </span>
                  <span style={{ flexGrow: 1 }}>
                    <strong style={{ color: "#dc2626" }}>{item.query}</strong>
                    <span style={{ marginLeft: "10px", color: "#f87171" }}>
                      ({item.impressionsDiff} fewer impressions)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p>No stats available.</p>
      )}
    </div>
  );
}

export default SiteStats;
