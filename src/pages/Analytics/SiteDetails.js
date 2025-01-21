import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./SiteDetails.css";

function SiteDetails() {
  const { state } = useLocation();
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State to store error message
  const [selectedRange, setSelectedRange] = useState("1M"); // Track the selected range
  const { siteUrl, accessToken } = state.siteDetails;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customDates, setCustomDates] = useState(false);

  const fetchSiteAnalytics = async (start, end) => {
    setLoading(true);
    setError(null); // Clear previous errors
    setAnalyticsData([]); // Clear previous data
    try {
      const response = await fetch(
        `http://ai.1upmedia.com:3000/google/sites/${encodeURIComponent(
          siteUrl
        )}/analytics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: start,
            endDate: end,
            accessToken,
          }),
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json(); // Parse the error response
        const errorMessage = errorResponse.error || "Unknown error occurred.";
        const errorDetails = errorResponse.details || [];

        setError({
          message: errorMessage,
          details: errorDetails,
        });

        throw new Error(errorMessage); // Re-throw for logging
      }

      const data = await response.json();
      console.log(data);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching site analytics:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRange = (range) => {
    const now = new Date();
    let start, end;

    setSelectedRange(range); // Highlight the clicked button

    switch (range) {
      case "1D":
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        break;
      case "1M":
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case "1Y":
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "5Y":
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 5);
        break;
      default:
        return;
    }

    end = now.toISOString().split("T")[0];
    start = start.toISOString().split("T")[0];
    setStartDate(start);
    setEndDate(end);
    fetchSiteAnalytics(start, end);
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      setSelectedRange(""); // Deselect predefined ranges
      fetchSiteAnalytics(startDate, endDate);
    }
  };

  useEffect(() => {
    // Default: Fetch last 1 month analytics on load
    handleDateRange("1M");
  }, []);

  return (
    <div className="site-analytics-container">
      <h1>Site Analytics</h1>
      <h2>Site: {siteUrl}</h2>

      {/* Date Range Buttons */}
      <div className="date-range-buttons">
        <button
          className={selectedRange === "1D" ? "active-button" : ""}
          onClick={() => handleDateRange("1D")}
        >
          1D
        </button>
        <button
          className={selectedRange === "1M" ? "active-button" : ""}
          onClick={() => handleDateRange("1M")}
        >
          1M
        </button>
        <button
          className={selectedRange === "1Y" ? "active-button" : ""}
          onClick={() => handleDateRange("1Y")}
        >
          1Y
        </button>
        <button
          className={selectedRange === "5Y" ? "active-button" : ""}
          onClick={() => handleDateRange("5Y")}
        >
          5Y
        </button>
        <button
          className={customDates ? "active-button" : ""}
          onClick={() => setCustomDates((prev) => !prev)}
        >
          Custom Dates
        </button>
      </div>

      {/* Custom Date Picker */}
      {customDates && (
        <form className="custom-date-form" onSubmit={handleCustomDateSubmit}>
          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button type="submit">Fetch Data</button>
        </form>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <h3>{error.message}</h3>
        </div>
      )}

      {/* Analytics Table */}
      {loading ? (
        <p className="no-data">Loading Analytics...</p>
      ) : analyticsData.length > 0 ? (
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Query Key</th>
                <th>URL</th>
                <th>Device</th>
                <th>Country</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>CTR (%)</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.map((item, index) => (
                <tr key={index}>
                  <td className="query-key">{item.keys[0]}</td>
                  <td className="query-key">{item.keys[1]}</td>
                  <td className="query-key">{item.keys[2]}</td>
                  <td className="query-key">{item.keys[3]?.toUpperCase()}</td>
                  <td className="clicks">{item.clicks}</td>
                  <td className="impressions">{item.impressions}</td>
                  <td className="ctr">{(item.ctr * 100).toFixed(2)}%</td>
                  <td className="position">{item.position.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <p className="no-data">
            No analytics data available for the selected dates.
          </p>
        )
      )}
    </div>
  );
}

export default SiteDetails;
