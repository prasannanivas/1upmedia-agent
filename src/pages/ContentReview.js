// pages/ContentReview.js
import React, { useEffect, useState, useMemo } from "react";
import { useOnboarding } from "../context/OnboardingContext";
import "./ContentReview.css";
import { useAuth } from "../context/AuthContext";

const ContentReview = () => {
  const { onboardingData } = useOnboarding();
  const { authState } = useAuth();
  const { email } = authState;

  // States
  const [keywordData, setKeywordData] = useState([]);
  const [domain, setDomain] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);

  // Add state for modal control
  const [modalData, setModalData] = useState(null);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Row selection
  const [selectedRows, setSelectedRows] = useState({});

  // Filter states (now using dropdown for booleans & difficulty)
  const [filters, setFilters] = useState({
    keyword: "", // text
    isBrand: "all", // all|true|false
    isHighImpressionLowCTR: "all",
    isOpportunity: "all",
    isLongTail: "all",
    difficulty: "all", // all|Easy|Medium|Hard
  });

  // 1) Load data from context
  useEffect(() => {
    setKeywordData(onboardingData.searchConsoleData || []);
    setDomain(onboardingData.domain || "");
  }, [onboardingData]);

  // 2) Fetch classification once domain + keywords are ready
  useEffect(() => {
    if (domain && keywordData.length > 0) {
      const url = `https://ai.1upmedia.com:443/aiagent/keyword-classify`;

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywords: keywordData,
          domain,
          email,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `${res.details} Server returned status ${res.status}`
            );
          }
          return res.json();
        })
        .then((data) => {
          setResponseData(data);
          setError(null);
          setSelectedRows({});
        })
        .catch((err) => {
          console.error("Error fetching classification:", err.message);
          setError(err.message || "Error occurred while fetching data");
        });
    }
  }, [domain, keywordData]);

  // 3) Sorting logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // 4) Filter logic
  const applyFilters = (row) => {
    // 4.1) Keyword partial match
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      if (!row.keyword.toLowerCase().includes(kw)) return false;
    }

    // 4.2) For booleans, only show rows that match the selected value
    // "all" => no filter, "true" => must be true, "false" => must be false

    // isBrand
    if (filters.isBrand !== "all") {
      const brandVal = row.isBrand ? "true" : "false";
      if (brandVal !== filters.isBrand) return false;
    }

    // isHighImpressionLowCTR
    if (filters.isHighImpressionLowCTR !== "all") {
      const val = row.isHighImpressionLowCTR ? "true" : "false";
      if (val !== filters.isHighImpressionLowCTR) return false;
    }

    // isOpportunity
    if (filters.isOpportunity !== "all") {
      const val = row.isOpportunity ? "true" : "false";
      if (val !== filters.isOpportunity) return false;
    }

    // isLongTail
    if (filters.isLongTail !== "all") {
      const val = row.isLongTail ? "true" : "false";
      if (val !== filters.isLongTail) return false;
    }

    // 4.3) Difficulty
    // "all" => no filter, "Easy", "Medium", "Hard" => must match exactly
    if (filters.difficulty !== "all" && row.difficulty) {
      if (row.difficulty.toLowerCase() !== filters.difficulty.toLowerCase()) {
        return false;
      }
    }

    return true;
  };

  // 5) Combine filter + sort
  const displayedData = useMemo(() => {
    if (!responseData?.classifiedData) return [];
    // Filter
    let filtered = responseData.classifiedData.filter(applyFilters);

    // Sort
    const { key, direction } = sortConfig;
    if (key) {
      filtered.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        // booleans => true first
        if (typeof aVal === "boolean" && typeof bVal === "boolean") {
          return aVal === bVal ? 0 : aVal ? -1 : 1;
        }
        // fallback string
        return String(aVal).localeCompare(String(bVal));
      });
      if (direction === "desc") {
        filtered.reverse();
      }
    }
    return filtered;
  }, [responseData, filters, sortConfig]);

  // 6) Define columns
  const columns = [
    { key: "keyword", label: "Keyword" },
    { key: "url", label: "URL" },
    { key: "isBrand", label: "Brand Keyword" },
    { key: "isHighImpressionLowCTR", label: "High Impress Low CTR" },
    { key: "isOpportunity", label: "Opportunity" },
    { key: "isLongTail", label: "Long Tail" },
    { key: "difficulty", label: "Difficulty" },
    { key: "mozDifficulty", label: "MOZ Difficulty" },
  ];

  const getBrandTooltip = (row) => {
    // row.isBrand is true if it references brand
    if (!row.isBrand) return "";
    return `The keyword "${row.keyword}" is recognized as referencing your brand or brand owner name.`;
  };

  const getHighImpTooltip = (row) => {
    if (!row.isHighImpressionLowCTR) return "";
    // row.impressions, row.ctr
    return `The keyword "${row.keyword}" has ${
      row.impressions
    } impressions but only ${(row.ctr * 100).toFixed(
      2
    )}% CTR. There's an opportunity to improve clicks.`;
  };

  const getOpportunityTooltip = (row) => {
    if (!row.isOpportunity) return "";
    // row.position
    return `The keyword "${
      row.keyword
    }" is at average position ${row.position.toFixed(
      2
    )}, so we can push it into the top 10.`;
  };

  const getLongTailTooltip = (row) => {
    if (!row.isLongTail) return "";
    const wordCount = row.keyword.trim().split(/\s+/).length;
    return `The keyword "${row.keyword}" has ${wordCount} words, making it a more specific (long-tail) query.`;
  };

  const getDifficultyTooltip = (row) => row.difficulty_reason || ""; // or fallback

  // 7) Row selection
  const handleRowSelect = (keyword, checked) => {
    setSelectedRows((prev) => ({ ...prev, [keyword]: checked }));
  };

  const allSelected = useMemo(() => {
    if (!displayedData.length) return false;
    return displayedData.every((row) => selectedRows[row.keyword]);
  }, [displayedData, selectedRows]);

  const handleSelectAll = (checked) => {
    const newState = { ...selectedRows };
    displayedData.forEach((row) => {
      newState[row.keyword] = checked;
    });
    setSelectedRows(newState);
  };

  // 8) Generate content logic
  const handleGenerateForRow = (row) => {
    alert(
      `Generating content for keyword: ${row.keyword}\nDifficulty: ${row.difficulty}`
    );
  };

  const handleGenerateSelected = () => {
    const selected = displayedData.filter((item) => selectedRows[item.keyword]);
    if (!selected.length) {
      alert("No rows selected!");
      return;
    }
    alert(`Generating content for ${selected.length} selected keywords.`);
  };

  // Add this state for tracking loading states for each keyword
  const [loadingStates, setLoadingStates] = useState({});
  // Add this state for tracking error states for each keyword
  const [errorStates, setErrorStates] = useState({});

  // Function to create a unique identifier for each row
  const getRowKey = (keyword, url) => {
    return `${keyword}::${url}`;
  };

  // Function to handle fetching MOZ difficulty for a keyword
  const fetchMozDifficulty = (keyword, url) => {
    const link = `https://ai.1upmedia.com:443/aiagent/keyword-classify/moz-difficulty`;
    const rowKey = getRowKey(keyword, url);

    // Set loading state for this keyword-url combination
    setLoadingStates((prev) => ({ ...prev, [rowKey]: true }));
    // Clear any previous errors
    setErrorStates((prev) => ({ ...prev, [rowKey]: null }));

    fetch(link, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyword,
        url,
        email,
        domain,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorDetails = await res.json();

          throw new Error(`Keyword not found ${errorDetails.details}`);
        }
        return res.json();
      })
      .then((data) => {
        // Update the responseData with the new MOZ difficulty
        setResponseData((prevData) => {
          const updatedClassifiedData = prevData.classifiedData.map((item) => {
            if (item.keyword === keyword && item.url === url) {
              // Store the entire data object which now includes top_suggested_keywords
              // and all_suggested_keywords directly in the response
              return {
                ...item,
                mozDifficulty: data, // Store the complete response data
              };
            }
            return item;
          });
          return { ...prevData, classifiedData: updatedClassifiedData };
        });
        // Clear loading state
        setLoadingStates((prev) => ({ ...prev, [rowKey]: false }));
      })
      .catch((err) => {
        console.error(
          `Error fetching MOZ difficulty for ${keyword}:`,
          err.message
        );
        // Set error state
        setErrorStates((prev) => ({
          ...prev,
          [rowKey]: err.message || "Failed to fetch data",
        }));
        // Clear loading state
        setLoadingStates((prev) => ({ ...prev, [rowKey]: false }));
      });
  };

  // MOZ icon for the difficulty column
  const MozIcon = ({ keyword, url }) => (
    <span
      className="moz-icon"
      onClick={(e) => {
        e.stopPropagation();
        fetchMozDifficulty(keyword, url);
      }}
      style={{
        cursor: "pointer",
        color: "#1A73E8",
        fontWeight: "bold",
      }}
      title={`Click to fetch MOZ difficulty for "${keyword}"`}
    >
      MOZ
    </span>
  );

  // New compact MOZ display component showing just the traffic light
  const MozTrafficLight = ({
    mozData,
    onClick,
    isLoading,
    error,
    keyword,
    url,
  }) => {
    // If there's an error, show error state
    if (error) {
      return (
        <div
          className="moz-traffic-pill moz-error-pill"
          onClick={(e) => {
            e.stopPropagation();
            fetchMozDifficulty(keyword, url);
          }}
          title={`Error: ${error}. Click to retry.`}
        >
          <span className="moz-error-icon">!</span>
          <span className="moz-error-text">Error {error}</span>
        </div>
      );
    }

    // If it's loading, show loading state
    if (isLoading) {
      return (
        <div
          className="moz-traffic-pill moz-loading-pill"
          title="Loading MOZ data..."
        >
          <div className="moz-loading-spinner"></div>
          <span className="moz-loading-text">Loading</span>
        </div>
      );
    }

    // If no data yet, don't render anything (the MozIcon will be shown instead)
    if (!mozData) return null;

    console.log("MOZ Data:", mozData);

    // Parse the data if it's a string and appears to be JSON format
    let data;
    try {
      // First check if the data is a string and looks like it could be JSON
      if (typeof mozData === "string") {
        // Skip parsing for known non-JSON values like "N/A"
        if (mozData === "N/A" || !mozData.trim().startsWith("{")) {
          // For non-JSON values, create a placeholder object
          data = {
            moz_difficulty: "N/A",
            traffic_light: "UNKNOWN",
          };
        } else {
          // If it looks like JSON, try to parse it
          data = JSON.parse(mozData);
        }
      } else {
        // If it's not a string, use it directly
        data = mozData;
      }

      // Check if the data is in the new format with a result object
      if (data.result) {
        data = data.result;
      }
    } catch (error) {
      console.error("Error parsing MOZ data:", error, "Raw data:", mozData);
      // Provide fallback data instead of returning null
      data = {
        moz_difficulty: "Error",
        traffic_light: "ERROR",
      };
    }

    // Get traffic light color
    const getTrafficLightColor = (light) => {
      if (!light) return "#777";
      if (light.includes("GREEN")) return "#28a745";
      if (light.includes("YELLOW")) return "#ffc107";
      if (light.includes("RED")) return "#dc3545";
      return "#777";
    };

    const difficulty =
      typeof data.moz_difficulty === "number"
        ? data.moz_difficulty.toFixed(1)
        : data.metrics && typeof data.metrics.difficulty === "number"
        ? data.metrics.difficulty.toFixed(1)
        : data.moz_difficulty || "N/A";

    return (
      <div className="moz-traffic-container">
        <div
          className="moz-traffic-pill"
          onClick={onClick}
          title="Click to view all MOZ data"
        >
          <span className="moz-difficulty-number">{difficulty}</span>
          <span
            className="moz-traffic-indicator"
            style={{
              backgroundColor: getTrafficLightColor(data.traffic_light),
            }}
          >
            {data.traffic_light ? data.traffic_light.split(" ")[0] : "N/A"}
          </span>
        </div>
        <span
          className="moz-refresh-icon"
          onClick={(e) => {
            e.stopPropagation();
            // Make sure we explicitly use the keyword and url props passed to this component
            fetchMozDifficulty(keyword, url);
          }}
          title="Refresh MOZ data"
        >
          ⟳
        </span>
      </div>
    );
  };

  // Modal component for detailed MOZ data
  const MozDetailModal = ({ mozData, onClose }) => {
    if (!mozData) return null;

    // Parse the data if it's a string
    let data;
    try {
      if (typeof mozData === "string") {
        // Skip parsing for known non-JSON values like "N/A"
        if (mozData === "N/A" || !mozData.trim().startsWith("{")) {
          throw new Error(`Invalid MOZ data format: ${mozData}`);
        } else {
          data = JSON.parse(mozData);
        }
      } else {
        data = mozData;
      }

      // Check if the data is in the new format with a result object
      if (data.result) {
        data = data.result;
      }
    } catch (error) {
      console.error("Error parsing MOZ data:", error);
      return (
        <div className="moz-modal-overlay" onClick={onClose}>
          <div
            className="moz-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="moz-modal-header">
              <h3>Error Parsing MOZ Data</h3>
              <span className="moz-modal-close" onClick={onClose}>
                &times;
              </span>
            </div>
            <div className="moz-modal-body">
              <p>There was an error parsing the MOZ data: {error.message}</p>
              <p>
                Raw data:{" "}
                {typeof mozData === "string"
                  ? mozData
                  : JSON.stringify(mozData)}
              </p>
              {/* Only show retry button if we have keyword and url */}
              {mozData &&
                typeof mozData === "object" &&
                mozData.keyword &&
                mozData.url && (
                  <button
                    onClick={() =>
                      fetchMozDifficulty(mozData.keyword, mozData.url)
                    }
                    className="moz-retry-button"
                  >
                    Retry
                  </button>
                )}
            </div>
          </div>
        </div>
      );
    }

    // Format numbers to 1 decimal place
    const formatNumber = (num) => {
      return typeof num === "number" ? num.toFixed(1) : "N/A";
    };

    // Get traffic light color
    const getTrafficLightColor = (light) => {
      if (!light) return "#777";
      if (light.includes("GREEN")) return "#28a745";
      if (light.includes("YELLOW")) return "#ffc107";
      if (light.includes("RED")) return "#dc3545";
      return "#777";
    };

    // Extract intent data if available
    const intentData = data.intent_analysis || {};
    const metrics = data.metrics || {};

    // Extract suggested keywords directly from the data object
    const topSuggestedKeywords = data.top_suggested_keywords || [];
    const allSuggestedKeywords = data.all_suggested_keywords || [];

    return (
      <div className="moz-modal-overlay" onClick={onClose}>
        <div className="moz-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="moz-modal-header">
            <h3>MOZ Difficulty Analysis</h3>
            <span className="moz-modal-close" onClick={onClose}>
              &times;
            </span>
          </div>

          <div className="moz-modal-body">
            <div className="moz-card moz-summary-card">
              <div className="moz-card-content">
                <div className="moz-stat-large">
                  <span className="moz-stat-label">MOZ Difficulty Score</span>
                  <span className="moz-stat-value">
                    {formatNumber(data.moz_difficulty || metrics.difficulty)}
                  </span>
                </div>

                <div className="moz-stat-large">
                  <span className="moz-stat-label">Adjusted Difficulty</span>
                  <span className="moz-stat-value">
                    {formatNumber(data.adjusted_difficulty)}
                  </span>
                </div>

                <div
                  className="moz-verdict"
                  style={{
                    backgroundColor: getTrafficLightColor(data.traffic_light),
                  }}
                >
                  {data.traffic_light || "Not Available"}
                </div>

                {data.summary && (
                  <div className="moz-summary-text">{data.summary}</div>
                )}
              </div>
            </div>

            <div className="moz-stats-grid">
              <div className="moz-stat-box">
                <span className="moz-stat-title">Domain Authority</span>
                <span className="moz-stat-number">
                  {data.domain_authority || metrics.domain_authority || "N/A"}
                </span>
              </div>
              <div className="moz-stat-box">
                <span className="moz-stat-title">Page Authority</span>
                <span className="moz-stat-number">
                  {data.page_authority || metrics.page_authority || "N/A"}
                </span>
              </div>
              <div className="moz-stat-box">
                <span className="moz-stat-title">Buffer Factor</span>
                <span className="moz-stat-number">
                  {formatNumber(data.buffer_factor)}
                </span>
              </div>
              <div className="moz-stat-box">
                <span className="moz-stat-title">Success Probability</span>
                <span className="moz-stat-number">
                  {data.success_probability
                    ? `${(data.success_probability * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="moz-comparison-box">
              <div className="moz-comparison-title">Competition Analysis</div>
              <div className="moz-comparison-grid">
                <div className="moz-comparison-item">
                  <span className="moz-comparison-label">Allowed KD</span>
                  <span className="moz-comparison-value">
                    {formatNumber(data.allowed_kd)}
                  </span>
                </div>
                <div className="moz-comparison-item">
                  <span className="moz-comparison-label">
                    Buffered Allowed KD
                  </span>
                  <span className="moz-comparison-value">
                    {formatNumber(data.buffered_allowed_kd)}
                  </span>
                </div>
                <div className="moz-comparison-item">
                  <span className="moz-comparison-label">Delta</span>
                  <span
                    className="moz-comparison-value"
                    style={{
                      color:
                        (data.delta || metrics.delta) < 0
                          ? "#28a745"
                          : "#dc3545",
                    }}
                  >
                    {formatNumber(data.delta || metrics.delta)}
                  </span>
                </div>
                <div className="moz-comparison-item">
                  <span className="moz-comparison-label">Normalized Delta</span>
                  <span
                    className="moz-comparison-value"
                    style={{
                      color:
                        (data.delta_norm || metrics.delta_normalized) < 0
                          ? "#28a745"
                          : "#dc3545",
                    }}
                  >
                    {formatNumber(data.delta_norm || metrics.delta_normalized)}
                  </span>
                </div>
              </div>
            </div>

            {/* New Intent Analysis Section */}
            {intentData && (
              <div className="moz-intent-box">
                <div className="moz-intent-title">Intent Analysis</div>
                <div className="moz-intent-grid">
                  <div className="moz-intent-item">
                    <span className="moz-intent-label">Primary Intent</span>
                    <span className="moz-intent-value">
                      {intentData.primary_intent ||
                        data.keyword_intent ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="moz-intent-item">
                    <span className="moz-intent-label">
                      Buyer Journey Stage
                    </span>
                    <span className="moz-intent-value">
                      {intentData.buyer_journey_stage ||
                        data.buyer_stage ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="moz-intent-item">
                    <span className="moz-intent-label">Opportunity Score</span>
                    <span className="moz-intent-value">
                      {formatNumber(data.opportunity_score || 0)}
                    </span>
                  </div>
                </div>

                {/* Intent Score Bars if available */}
                {intentData.intent_scores && (
                  <div className="moz-intent-scores">
                    <div className="moz-intent-score-title">
                      Intent Distribution
                    </div>
                    <div className="moz-intent-score-bars">
                      {Object.entries(intentData.intent_scores).map(
                        ([intent, score]) => (
                          <div className="moz-intent-score-item" key={intent}>
                            <div className="moz-intent-score-label">
                              {intent}
                            </div>
                            <div className="moz-intent-score-bar-container">
                              <div
                                className="moz-intent-score-bar"
                                style={{ width: `${score * 100}%` }}
                              ></div>
                            </div>
                            <div className="moz-intent-score-value">
                              {(score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* New section for suggested keywords */}
            {topSuggestedKeywords && topSuggestedKeywords.length > 0 && (
              <div className="moz-suggested-keywords-section">
                <h4>Top Suggested Keywords</h4>
                <div className="moz-suggested-keywords-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Keyword</th>
                        <th>Relevance</th>
                        <th>Difficulty</th>
                        <th>Traffic Light</th>
                        <th>Success Probability</th>
                        <th>Opportunity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSuggestedKeywords.map((kw, idx) => (
                        <tr key={idx}>
                          <td>{kw.keyword}</td>
                          <td>{formatNumber(kw.relevance * 100)}%</td>
                          <td>{kw.difficulty || "N/A"}</td>
                          <td>
                            <span
                              className="moz-traffic-pill-small"
                              style={{
                                backgroundColor: getTrafficLightColor(
                                  kw.traffic_light
                                ),
                              }}
                            >
                              {kw.traffic_light
                                ? kw.traffic_light.split(" ")[0]
                                : "N/A"}
                            </span>
                          </td>
                          <td>
                            {kw.success_probability
                              ? `${(kw.success_probability * 100).toFixed(1)}%`
                              : "N/A"}
                          </td>
                          <td>{formatNumber(kw.opportunity_score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {allSuggestedKeywords && allSuggestedKeywords.length > 0 && (
              <div className="moz-all-keywords-section">
                <h4>All Suggested Keywords</h4>
                <div className="moz-all-keywords-container">
                  {allSuggestedKeywords.map((kw, idx) => (
                    <div key={idx} className="moz-keyword-chip">
                      <span className="moz-keyword-text">{kw.keyword}</span>
                      <span className="moz-keyword-relevance">
                        {formatNumber(kw.relevance * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.url && (
              <div className="moz-url-box">
                <span className="moz-url-label">URL Analyzed:</span>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="moz-url-value"
                >
                  {data.url}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 9) Render
  return (
    <div className="contentreview-content-review-container">
      <h1 className="contentreview-content-review-title">
        Keyword Review Page
      </h1>

      {!keywordData ||
        (keywordData.length === 0 && (
          <p>
            No keyword data available. Please connect to Google search Console
            and Try again
          </p>
        ))}
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}

      {!responseData ? (
        <p style={{ marginTop: "1rem" }}>Loading keyword analysis...</p>
      ) : (
        <>
          {/* FILTER ROW */}
          <div className="contentreview-filter-row">
            {/* Keyword text filter */}
            <div className="contentreview-filter-group">
              <label>Keyword Contains:</label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keyword: e.target.value }))
                }
              />
            </div>

            {/* isBrand dropdown */}
            <div className="contentreview-filter-group">
              <label>Brand Keyword:</label>
              <select
                value={filters.isBrand}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, isBrand: e.target.value }))
                }
              >
                <option value="all">All</option>
                <option value="true">Yes (Brand)</option>
                <option value="false">No (Non-Brand)</option>
              </select>
            </div>

            {/* isHighImpressionLowCTR dropdown */}
            <div className="contentreview-filter-group">
              <label>HighImp LowCTR:</label>
              <select
                value={filters.isHighImpressionLowCTR}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    isHighImpressionLowCTR: e.target.value,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* isOpportunity dropdown */}
            <div className="contentreview-filter-group">
              <label>Opportunity:</label>
              <select
                value={filters.isOpportunity}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    isOpportunity: e.target.value,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* isLongTail dropdown */}
            <div className="contentreview-filter-group">
              <label>Long Tail:</label>
              <select
                value={filters.isLongTail}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    isLongTail: e.target.value,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* difficulty dropdown */}
            <div className="contentreview-filter-group">
              <label>Difficulty:</label>
              <select
                value={filters.difficulty}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    difficulty: e.target.value,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Bulk generate button */}
            <div className="contentreview-filter-group">
              <label style={{ visibility: "hidden" }}>GenerateHidden</label>
              <button
                className="contentreview-generate-button"
                onClick={handleGenerateSelected}
              >
                Generate (Selected)
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="contentreview-table-container">
            <table className="contentreview-table">
              <thead>
                <tr>
                  {/* Select All */}
                  {/* <th>
                    <input
                      className="contentreview-checkbox"
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th> */}

                  {columns.map((col) => {
                    let indicator = "";
                    if (sortConfig.key === col.key) {
                      indicator = sortConfig.direction === "asc" ? "▲" : "▼";
                    }
                    return (
                      <th key={col.key} onClick={() => handleSort(col.key)}>
                        {col.label}
                        {indicator && (
                          <span className="contentreview-sort-indicator">
                            {indicator}
                          </span>
                        )}
                      </th>
                    );
                  })}
                  {/* <th>Action</th> */}
                </tr>
              </thead>

              <tbody>
                {displayedData.map((row, idx) => {
                  const rowKey = getRowKey(row.keyword, row.url);
                  return (
                    <tr key={idx}>
                      {/* Row columns */}
                      <td>{row.keyword}</td>
                      <td>{row.url}</td>
                      <td title={getBrandTooltip(row)}>
                        {row.isBrand ? "Brand Keyword" : ""}
                      </td>
                      <td title={getHighImpTooltip(row)}>
                        {row.isHighImpressionLowCTR ? "HighImp LowCTR" : ""}
                      </td>
                      <td title={getOpportunityTooltip(row)}>
                        {row.isOpportunity ? "Opportunity" : ""}
                      </td>
                      <td title={getLongTailTooltip(row)}>
                        {row.isLongTail ? "Long Tail" : ""}
                      </td>
                      <td title={getDifficultyTooltip(row)}>
                        {row.difficulty || ""}
                      </td>
                      <td>
                        {loadingStates[rowKey] ? (
                          <MozTrafficLight isLoading={true} />
                        ) : errorStates[rowKey] ? (
                          <MozTrafficLight
                            error={errorStates[rowKey]}
                            keyword={row.keyword}
                            url={row.url}
                          />
                        ) : row.mozDifficulty ? (
                          <MozTrafficLight
                            mozData={row.mozDifficulty}
                            onClick={() => setModalData(row.mozDifficulty)}
                            keyword={row.keyword}
                            url={row.url}
                          />
                        ) : (
                          <MozIcon keyword={row.keyword} url={row.url} />
                        )}
                      </td>
                    </tr>
                  );
                })}

                {displayedData.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 2}
                      style={{ textAlign: "center" }}
                    >
                      <em>No matching records found.</em>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalData && (
        <MozDetailModal
          mozData={modalData}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  );
};

export default ContentReview;
