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
      const encodedKeywords = encodeURIComponent(JSON.stringify(keywordData));
      const url = `https://ai.1upmedia.com:443/aiagent/keyword-classify?email=${email}&domain=${domain}&keywords=${encodedKeywords}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
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
    { key: "isBrand", label: "Brand Keyword" },
    { key: "isHighImpressionLowCTR", label: "High Impress Low CTR" },
    { key: "isOpportunity", label: "Opportunity" },
    { key: "isLongTail", label: "Long Tail" },
    { key: "difficulty", label: "Difficulty" },
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

  // 9) Render
  return (
    <div className="contentreview-content-review-container">
      <h1 className="contentreview-content-review-title">
        Keyword Review Page
      </h1>

      {!keywordData ||
        (keywordData.length == 0 && (
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
                {displayedData.map((row, idx) => (
                  <tr key={idx}>
                    {/* Row select */}
                    {/* <td>
                      <input
                        className="contentreview-checkbox"
                        type="checkbox"
                        checked={!!selectedRows[row.keyword]}
                        onChange={(e) =>
                          handleRowSelect(row.keyword, e.target.checked)
                        }
                      />
                    </td> */}

                    {/* Row columns */}
                    <td>{row.keyword}</td>
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

                    {/* Generate action */}
                    {/* <td>
                      <button
                        className="contentreview-generate-button"
                        onClick={() => handleGenerateForRow(row)}
                      >
                        Generate
                      </button>
                    </td> */}
                  </tr>
                ))}

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
    </div>
  );
};

export default ContentReview;
