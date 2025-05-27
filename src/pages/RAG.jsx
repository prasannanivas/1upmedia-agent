import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../context/AuthContext";
import "./RAG.css";
import "./RAG-styling-additions.css";
import "./RAG-chart-styling.css";
import "./RAG-enterprise-styling.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function RAG() {
  const { authState } = useAuth();
  const { email } = authState;

  // Link & File states
  const [links, setLinks] = useState([""]);
  const [filesArray, setFilesArray] = useState([]); // Start empty
  const [uploadedFiles, setUploadedFiles] = useState([]); // Track uploaded files
  const [selectedEngine, setSelectedEngine] = useState("auto"); // Add selected engine state

  // Loading / Error / Server
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Server responses
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [personaPrompt, setPersonaPrompt] = useState(null);
  const [strengthData, setStrengthData] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentTopic, setContentTopic] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [contentStrategy, setContentStrategy] = useState(null);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  const [wordCount, setWordCount] = useState(500);
  const [isCustomWordCount, setIsCustomWordCount] = useState(false);
  const [sources, setSources] = useState([]);

  // Intelligence Engine State
  const [engines, setEngines] = useState({
    voice: { loadPercentage: 0, sourceCount: 0, recommendedSources: [] },
    positioning: { loadPercentage: 0, sourceCount: 0, recommendedSources: [] },
    signal: { loadPercentage: 0, sourceCount: 0, recommendedSources: [] },
    intent: { loadPercentage: 0, sourceCount: 0, recommendedSources: [] },
  });
  const [systemStatus, setSystemStatus] = useState({
    contentGenerationLocked: true,
    recommendationsLocked: true,
    keywordDifficultyValidated: false,
    domainAuthorityValidated: false,
    decayMappingResolved: false,
    cannibalizationMappingResolved: false,
    funnelStageAligned: false,
    psychographicPersonaAssigned: false,
  });
  const [activeEngine, setActiveEngine] = useState("voice");

  const [chunksData] = useState({
    totalChunks: 2,
    maxRecommendedChunks: 10,
  });

  const chunksChartData = {
    labels: ["Current Chunks", "Recommended More"],
    datasets: [
      {
        data: [
          chunksData.totalChunks,
          chunksData.maxRecommendedChunks - chunksData.totalChunks,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.8)",
          "rgba(211, 211, 211, 0.3)",
        ],
        borderWidth: 0,
      },
    ],
  };

  /* Add useEffect to load summary and strength on mount */
  useEffect(() => {
    if (email) {
      handleCheckStrength(); // Add strength check on mount
      fetchSources(); // Add sources fetch on mount
    }
  }, [email]);
  const strengthChartData = {
    labels: ["Strength", "Remaining"],
    datasets: [
      {
        data: [
          strengthData?.strengthScore || 0,
          100 - (strengthData?.strengthScore || 0),
        ],
        backgroundColor: [
          strengthData?.strengthScore > 75
            ? "rgba(16, 185, 129, 0.85)" // High score (green)
            : strengthData?.strengthScore > 50
            ? "rgba(59, 130, 246, 0.85)" // Medium score (blue)
            : "rgba(245, 158, 11, 0.85)", // Low score (amber)
          "rgba(226, 232, 240, 0.3)",
        ],
        borderWidth: 0,
        borderRadius: 6,
        hoverOffset: 4,
        hoverBorderWidth: 2,
        hoverBorderColor: "#ffffff",
      },
    ],
  };
  const chartOptions = {
    cutout: "75%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1e40af",
        bodyColor: "#334155",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        boxPadding: 8,
        cornerRadius: 8,
        displayColors: true,
        borderColor: "rgba(226, 232, 240, 0.7)",
        borderWidth: 1,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  /* ──────────────────────────────────────────────────────────────────────
     Handlers for link array
     ────────────────────────────────────────────────────────────────────── */
  const handleAddLink = () => setLinks([...links, ""]);
  const handleLinkChange = (idx, val) => {
    const newArr = [...links];
    newArr[idx] = val;
    setLinks(newArr);
  };

  /* ──────────────────────────────────────────────────────────────────────
     Handlers for file array
     ────────────────────────────────────────────────────────────────────── */

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    // Also remove from filesArray if needed
    setFilesArray((prev) => prev.filter((_, i) => i !== index));
  };

  /* ──────────────────────────────────────────────────────────────────────
     Submit: POST /RAG/analyzeStyleChunks
     ────────────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysisResponse(null);

    try {
      // 1) Build form data
      const fd = new FormData();
      fd.append("email", email);

      // Add selected engine (auto or specific engine)
      fd.append("engineType", selectedEngine);

      // Filter out blank links
      const nonEmptyLinks = links.filter((l) => l.trim());
      fd.append("links", JSON.stringify(nonEmptyLinks));

      // For each file input
      filesArray.forEach((fileList) => {
        if (fileList) {
          Array.from(fileList).forEach((f) => fd.append("files", f));
        }
      });

      // 2) Make the POST request
      const res = await fetch(
        "https://ai.1upmedia.com:443/RAG/analyzeStyleChunks",
        {
          method: "POST",
          body: fd,
        }
      );

      if (!res.ok) throw new Error(`Analyze error: ${res.status}`);
      const data = await res.json();
      setAnalysisResponse(data);

      // Clear uploads on success
      setLinks([""]);
      setFilesArray([]);
      setUploadedFiles([]); // Refresh strength data and sources (which will update engine statuses)
      await handleCheckStrength();
      await fetchSources();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────
     GET /RAG/summary?email=...
     ────────────────────────────────────────────────────────────────────── */ const fetchSources =
    async () => {
      try {
        const res = await fetch(
          `https://ai.1upmedia.com:443/RAG/summary?email=${encodeURIComponent(
            email
          )}`
        );
        if (!res.ok) throw new Error(`Sources fetch error: ${res.status}`);
        const data = await res.json();
        setSources(data.sources || []);

        // Update engines and system status if they exist
        if (data.engines) {
          setEngines(data.engines);
        }

        if (data.systemStatus) {
          setSystemStatus(data.systemStatus);
        }
      } catch (err) {
        setError(err.message);
      }
    };

  /* ──────────────────────────────────────────────────────────────────────
     GET /RAG/personaPrompt?email=...
     ────────────────────────────────────────────────────────────────────── */
  const handlePersonaPrompt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://ai.1upmedia.com:443/RAG/personaPrompt?email=${encodeURIComponent(
          email
        )}`
      );
      if (!res.ok) throw new Error(`Persona prompt error: ${res.status}`);
      const data = await res.json();
      if (data.prompt) {
        setPersonaPrompt(data.prompt);
      } else {
        throw new Error("No prompt returned.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  /* ──────────────────────────────────────────────────────────────────────
     GET /RAG/analyzeStrength?email=...
     ────────────────────────────────────────────────────────────────────── */
  const handleCheckStrength = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://ai.1upmedia.com:443/RAG/analyzeStrength?email=${encodeURIComponent(
          email
        )}`
      );
      if (!res.ok) throw new Error(`Strength analysis error: ${res.status}`);
      const data = await res.json();
      setStrengthData(data);

      // Update engines and system status if they exist in the response
      if (data.engines) {
        setEngines(data.engines);
      }

      if (data.systemStatus) {
        setSystemStatus(data.systemStatus);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────
     DELETE /RAG/deleteBySource
     ────────────────────────────────────────────────────────────────────── */
  const handleDeleteSource = async (sourceName) => {
    try {
      const res = await fetch(
        "https://ai.1upmedia.com:443/RAG/deleteBySource",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            sourceName,
          }),
        }
      );
      if (!res.ok) throw new Error(`Delete error: ${res.status}`);
      // Refresh sources list
      fetchSources();
      // Refresh strength data
      handleCheckStrength();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────
     POST /RAG/analyzeContentStrategy
     ────────────────────────────────────────────────────────────────────── */
  const handleAnalyzeStrategy = async (e) => {
    e.preventDefault();
    if (!contentTopic.trim()) {
      setError("Please enter a topic");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://ai.1upmedia.com:443/RAG/analyzeContentStrategy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            topic: contentTopic,
            contentPrompt: contentTopic,
          }),
        }
      );
      if (!res.ok) throw new Error(`Strategy analysis error: ${res.status}`);
      const data = await res.json();
      setContentStrategy({
        ...data.strategy,
        contributingChunks: data.contributingChunks, // Add contributingChunks to the strategy object
      });
      setIsEditingStrategy(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────
     POST /RAG/generateContent
     ────────────────────────────────────────────────────────────────────── */
  const handleGenerateContent = async (e) => {
    e.preventDefault();
    if (!contentTopic.trim()) {
      setError("Please enter a topic");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://ai.1upmedia.com:443/RAG/generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            topic: contentTopic,
            contentPrompt: contentTopic,
            wordCount: parseInt(wordCount), // Add this line
          }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Content generation error: ${res.status}`
        );
      }
      const data = await res.json();
      setGeneratedContent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function with your other handlers
  const clearStrategy = () => {
    setContentStrategy(null);
    setIsEditingStrategy(false);
    setGeneratedContent(null);
  };

  /* ──────────────────────────────────────────────────────────────────────
     Render UI
     ────────────────────────────────────────────────────────────────────── */
  return (
    <div className="rag-container">
      {/* Intelligence Engines Overview */}
      <div className="intelligence-engines-grid">
        <h2 className="intelligence-engines-title">Intelligence Engines</h2>

        {systemStatus && (
          <div className="system-status-alerts">
            {!systemStatus.contentGenerationLocked &&
              !systemStatus.recommendationsLocked && (
                <div className="status-alert success">
                  <span>✅ All Systems Ready</span>
                  <p>
                    Your content generation and recommendation systems are
                    unlocked.
                  </p>
                </div>
              )}
          </div>
        )}

        <div className="engines-grid">
          {/* Voice Engine */}
          <div
            className={`engine-card ${
              activeEngine === "voice" ? "active" : ""
            }`}
            onClick={() => setActiveEngine("voice")}
          >
            <div className="engine-header">
              <h3>🗣️ Voice Engine</h3>
              <div className="engine-progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${engines.voice.loadPercentage}%` }}
                ></div>
              </div>
              <span className="engine-percentage">
                {engines.voice.loadPercentage}% Loaded
              </span>
            </div>
            <div className="engine-content">
              <p>
                Keeps your brand voice consistent, recognizable, and trustworthy
                — across every URL, post, or page.
              </p>
              <h4>Ingested:</h4>
              <ul>
                <li>Writing style tags</li>
                <li>CTA structure</li>
                <li>Brand tone patterns</li>
              </ul>
              <h4>Needs:</h4>
              <p>
                High-value conversion page copy (e.g., landing pages, checkout
                CTAs)
              </p>
              {engines.voice.recommendedSources.length > 0 && (
                <div className="engine-recommendations">
                  <h4>Recommended Sources:</h4>
                  <ul>
                    {engines.voice.recommendedSources.map((source, index) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Positioning Engine */}
          <div
            className={`engine-card ${
              activeEngine === "positioning" ? "active" : ""
            }`}
            onClick={() => setActiveEngine("positioning")}
          >
            <div className="engine-header">
              <h3>⚔️ Positioning Engine</h3>
              <div className="engine-progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${engines.positioning.loadPercentage}%` }}
                ></div>
              </div>
              <span className="engine-percentage">
                {engines.positioning.loadPercentage}% Loaded
              </span>
            </div>
            <div className="engine-content">
              <p>
                Frames your messaging against competitors and highlights your
                advantages.
              </p>
              <h4>Ingested:</h4>
              <ul>
                <li>SERP keyword overlaps</li>
                <li>Offer/feature breakdowns</li>
                <li>Competitor tone and hooks</li>
              </ul>
              <h4>Needs:</h4>
              <p>Competitor landing pages, battlecard-type content</p>
              {engines.positioning.recommendedSources.length > 0 && (
                <div className="engine-recommendations">
                  <h4>Recommended Sources:</h4>
                  <ul>
                    {engines.positioning.recommendedSources.map(
                      (source, index) => (
                        <li key={index}>{source}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Signal Engine */}
          <div
            className={`engine-card ${
              activeEngine === "signal" ? "active" : ""
            }`}
            onClick={() => setActiveEngine("signal")}
          >
            <div className="engine-header">
              <h3>📊 Signal Engine</h3>
              <div className="engine-progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${engines.signal.loadPercentage}%` }}
                ></div>
              </div>
              <span className="engine-percentage">
                {engines.signal.loadPercentage}% Loaded
              </span>
            </div>
            <div className="engine-content">
              <p>
                Monitors trends, buzzwords, and macro themes in your industry to
                align your strategy with what's rising.
              </p>
              <h4>Ingested:</h4>
              <ul>
                <li>Topic clusters</li>
                <li>Trend terminology</li>
                <li>Macro industry pain points</li>
              </ul>
              <h4>Needs:</h4>
              <p>Fresh blogs, press releases, market commentary</p>
              {engines.signal.recommendedSources.length > 0 && (
                <div className="engine-recommendations">
                  <h4>Recommended Sources:</h4>
                  <ul>
                    {engines.signal.recommendedSources.map((source, index) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Intent Engine */}
          <div
            className={`engine-card ${
              activeEngine === "intent" ? "active" : ""
            }`}
            onClick={() => setActiveEngine("intent")}
          >
            <div className="engine-header">
              <h3>🧠 Intent Engine</h3>
              <div className="engine-progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${engines.intent.loadPercentage}%` }}
                ></div>
              </div>
              <span className="engine-percentage">
                {engines.intent.loadPercentage}% Loaded
              </span>
            </div>
            <div className="engine-content">
              <p>
                Aligns your content to buyer intent, funnel stage, and
                psychological drivers.
              </p>
              <h4>Ingested:</h4>
              <ul>
                <li>Funnel stage predictions</li>
                <li>Keyword intent classes</li>
                <li>Behavioral signals</li>
              </ul>
              <h4>Needs:</h4>
              <p>GA4 integration or personas with mapped user paths</p>
              {engines.intent.recommendedSources.length > 0 && (
                <div className="engine-recommendations">
                  <h4>Recommended Sources:</h4>
                  <ul>
                    {engines.intent.recommendedSources.map((source, index) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Strength Overview */}{" "}
      {strengthData && (
        <div className="rag-strength-overview">
          <div className="strength-chart-container">
            <div className="strength-chart">
              <div className="chart-wrapper">
                <div className="doughnut-glow"></div>
                <div
                  style={{
                    width: "220px",
                    height: "220px",
                    position: "relative",
                  }}
                >
                  <Doughnut data={strengthChartData} options={chartOptions} />
                  <div className="chart-center-text">
                    <strong className="animated-counter">
                      {strengthData.strengthScore}
                    </strong>
                    <span>/{100}</span>
                  </div>
                </div>
                <div className="chart-label">{strengthData.strengthLevel}</div>
                <div className="chart-subtitle">RAG System Strength Score</div>
              </div>
              <div className="strength-level">
                <button
                  className="rag-button-secondary"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
              </div>
            </div>

            <div className="sources-list">
              <h4>Current Sources</h4>
              {sources.map((source, index) => (
                <div key={index} className="source-item">
                  <span>{source}</span>
                  <button
                    onClick={() => handleDeleteSource(source)}
                    className="source-delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {sources.length === 0 && (
                <p style={{ textAlign: "center", color: "#666" }}>
                  No sources available
                </p>
              )}
            </div>
          </div>{" "}
          {showDetails && (
            <div className="strength-details">
              <div className="quality-description">
                <h4>Analysis</h4>
                <p>{strengthData.qualityDescription}</p>
              </div>

              <div className="recommendations">
                <h4>Recommendations for Improvement</h4>
                <div className="recommendation-cards">
                  {strengthData.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`rec-card priority-${rec.priority.toLowerCase()}`}
                    >
                      <h5>{rec.aspect}</h5>
                      <p>{rec.suggestion}</p>
                      <div className="rec-metrics">
                        <span>Current: {rec.current}</span>
                        <span>→</span>
                        <span>Target: {rec.target}</span>
                      </div>
                      <div className="priority-badge">{rec.priority}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Rest of the component */}
      {isLoading ? (
        <div className="rag-loader-wrap">
          <div className="rag-spinner"></div>
          <p className="rag-processing-text">System is processing...</p>
        </div>
      ) : (
        <div className="rag-upload-section-wrapper">
          <button
            className="rag-expand-button"
            onClick={() => setIsUploadExpanded(!isUploadExpanded)}
          >
            <h1>
              Upload to Intelligence Engines {isUploadExpanded ? "▼" : "▶"}
            </h1>
          </button>

          {isUploadExpanded && (
            <form className="rag-form" onSubmit={handleSubmit}>
              <p className="rag-welcome">
                Logged in as <strong>{email}</strong>
              </p>{" "}
              {/* Engine Selection */}
              <div className="engine-selection">
                <label className="rag-label">
                  Select Target Intelligence Engine:
                </label>
                <div className="engine-selection-grid">
                  <label
                    className={`engine-option ${
                      selectedEngine === "auto" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="engine"
                      value="auto"
                      checked={selectedEngine === "auto"}
                      onChange={() => setSelectedEngine("auto")}
                    />
                    <span className="engine-icon">🤖</span>
                    <span className="engine-name">Auto-Detect</span>
                  </label>
                  <label
                    className={`engine-option ${
                      selectedEngine === "voice" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="engine"
                      value="voice"
                      checked={selectedEngine === "voice"}
                      onChange={() => setSelectedEngine("voice")}
                    />
                    <span className="engine-icon">🗣️</span>
                    <span className="engine-name">Voice</span>
                  </label>
                  <label
                    className={`engine-option ${
                      selectedEngine === "positioning" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="engine"
                      value="positioning"
                      checked={selectedEngine === "positioning"}
                      onChange={() => setSelectedEngine("positioning")}
                    />
                    <span className="engine-icon">⚔️</span>
                    <span className="engine-name">Positioning</span>
                  </label>
                  <label
                    className={`engine-option ${
                      selectedEngine === "signal" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="engine"
                      value="signal"
                      checked={selectedEngine === "signal"}
                      onChange={() => setSelectedEngine("signal")}
                    />
                    <span className="engine-icon">📊</span>
                    <span className="engine-name">Signal</span>
                  </label>
                  <label
                    className={`engine-option ${
                      selectedEngine === "intent" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="engine"
                      value="intent"
                      checked={selectedEngine === "intent"}
                      onChange={() => setSelectedEngine("intent")}
                    />
                    <span className="engine-icon">🧠</span>
                    <span className="engine-name">Intent</span>
                  </label>
                </div>
              </div>
              {/* Links */}
              <label className="rag-label">Add Site Links:</label>
              {links.map((val, i) => (
                <input
                  key={i}
                  className="rag-input"
                  type="text"
                  placeholder="https://example.com"
                  value={val}
                  onChange={(e) => handleLinkChange(i, e.target.value)}
                />
              ))}
              <button
                type="button"
                onClick={handleAddLink}
                className="rag-button-secondary"
              >
                Add Another Link
              </button>
              {/* Files */}
              <label className="rag-label">
                Upload Files (PDF/Word/Images):
              </label>
              {/* Display uploaded files */}
              <div className="rag-files-list">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="rag-file-item">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="rag-file-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {/* Upload button or Add more */}
              <div className="rag-upload-section">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setUploadedFiles((prev) => [...prev, ...files]);
                    setFilesArray((prev) => [...prev, e.target.files]);
                  }}
                  style={{ display: "none" }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="rag-button-secondary">
                  {uploadedFiles.length === 0
                    ? "Upload Documents"
                    : "Add More Documents"}
                </label>
              </div>
              <button
                type="submit"
                className="rag-button-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    Processing<span className="button-spinner"></span>
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          )}
        </div>
      )}
      {/* Error message */}
      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}
      {/* Replace analysis JSON display with simple success message */}
      {analysisResponse && (
        <div className="rag-success">
          <p>✅ RAG processing successful!</p>
        </div>
      )}
      {/* Show persona prompt */}
      {personaPrompt && (
        <div className="rag-persona">
          <h3>Persona Prompt:</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{personaPrompt}</pre>
        </div>
      )}
      {/* Content Generation Form */}
      <div className="rag-content-generation">
        <h3>Generate Content to Fill Out Brief.</h3>
        <form
          onSubmit={
            !contentStrategy ? handleAnalyzeStrategy : handleGenerateContent
          }
        >
          <input
            type="text"
            className="rag-input"
            placeholder="Enter topic for brief generation"
            value={contentTopic}
            onChange={(e) => setContentTopic(e.target.value)}
          />

          {contentStrategy && isEditingStrategy && (
            <div className="content-strategy-editor">
              <h4>Content Strategy</h4>
              <div className="strategy-field">
                <label>Content Goal:</label>
                <input
                  type="text"
                  value={contentStrategy.contentGoal}
                  onChange={(e) =>
                    setContentStrategy({
                      ...contentStrategy,
                      contentGoal: e.target.value,
                    })
                  }
                />
              </div>
              <div className="strategy-field">
                <label>Target Audience:</label>
                <input
                  type="text"
                  value={contentStrategy.targetAudience}
                  onChange={(e) =>
                    setContentStrategy({
                      ...contentStrategy,
                      targetAudience: e.target.value,
                    })
                  }
                />
              </div>
              <div className="strategy-field">
                <label>Audience Needs:</label>
                <input
                  type="text"
                  value={contentStrategy.audienceNeeds}
                  onChange={(e) =>
                    setContentStrategy({
                      ...contentStrategy,
                      audienceNeeds: e.target.value,
                    })
                  }
                />
              </div>
              <div className="strategy-field">
                <label>Recommended Tone:</label>
                <input
                  type="text"
                  value={contentStrategy.recommendedTone}
                  onChange={(e) =>
                    setContentStrategy({
                      ...contentStrategy,
                      recommendedTone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="strategy-field">
                <label>Core Truth:</label>
                <input
                  type="text"
                  value={contentStrategy.coreTruth}
                  onChange={(e) =>
                    setContentStrategy({
                      ...contentStrategy,
                      coreTruth: e.target.value,
                    })
                  }
                />
              </div>
              <div className="strategy-field">
                <label>Call to Action:</label>
                <input
                  type="text"
                  value={contentStrategy.callToAction}
                  onChange={(e) =>
                    setContentStrategy({
                      ...contentStrategy,
                      callToAction: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {contentStrategy && (
            <div className="content-strategy-editor">
              {/* Contributing Chunks Section */}
              <div className="contributing-chunks">
                <h4>Top Contributors for Writing Style</h4>
                <div className="chunks-list">
                  {contentStrategy.contributingChunks
                    ?.sort(
                      (a, b) => b.similarityPercentage - a.similarityPercentage
                    )
                    .slice(0, 4) // Show only top 4 contributors
                    .map((chunk, index) => (
                      <div key={index} className="chunk-item">
                        <span className="chunk-name">{chunk.sourceName}</span>
                        <span className="chunk-percentage">
                          {chunk.similarityPercentage}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {contentStrategy && (
            <div className="word-count-selector">
              <label>Select Word Count:</label>
              <div className="word-count-options">
                {[500, 750, 1000, 2000].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`word-count-btn ${
                      wordCount === count ? "active" : ""
                    }`}
                    onClick={() => {
                      setWordCount(count);
                      setIsCustomWordCount(false);
                    }}
                  >
                    {count}
                  </button>
                ))}
                <button
                  type="button"
                  className={`word-count-btn ${
                    isCustomWordCount ? "active" : ""
                  }`}
                  onClick={() => setIsCustomWordCount(true)}
                >
                  Custom
                </button>
              </div>

              {isCustomWordCount && (
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={wordCount}
                  onChange={(e) =>
                    setWordCount(
                      Math.min(
                        10000,
                        Math.max(1, parseInt(e.target.value) || 0)
                      )
                    )
                  }
                  className="custom-word-count"
                  placeholder="Enter word count (max 10,000)"
                />
              )}
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              className="rag-button-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  {!contentStrategy ? "Analyzing" : "Generating"}
                  <span className="button-spinner"></span>
                </>
              ) : !contentStrategy ? (
                "Generate brief. "
              ) : (
                "Generate Content"
              )}
            </button>

            {contentStrategy && (
              <button
                type="button"
                className="rag-button-clear"
                onClick={clearStrategy}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
      {/* Show generated content */}
      {generatedContent && generatedContent?.post_id && (
        <div className="post-link success-message">
          <p>
            Post generated -{" "}
            <a
              href={`/1upmedia-agent#/post-details/${generatedContent.post_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="success-link"
            >
              View it here ✨
            </a>
          </p>
        </div>
      )}
      {generatedContent && (
        <div className="rag-generated-content">
          <h3>Generated Content</h3>
          <p>Word Count: {generatedContent.wordCount}</p>
          <div className="content-text">
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {generatedContent.content}
            </pre>
          </div>

          <div className="style-profile">
            <h4>Style Profile</h4>
            <p>Tone: {generatedContent.styleProfile.tone}</p>
            <p>Persona: {generatedContent.styleProfile.persona}</p>
            <p>
              Target Audience: {generatedContent.styleProfile.targetAudience}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RAG;
