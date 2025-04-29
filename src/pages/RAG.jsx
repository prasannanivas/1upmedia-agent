import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../context/AuthContext";
import "./RAG.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function RAG() {
  const { authState } = useAuth();
  const { email } = authState;

  // Link & File states
  const [links, setLinks] = useState([""]);
  const [filesArray, setFilesArray] = useState([]); // Start empty
  const [uploadedFiles, setUploadedFiles] = useState([]); // Track uploaded files

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
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [wordCount, setWordCount] = useState(500); // Add this state
  const [isCustomWordCount, setIsCustomWordCount] = useState(false); // Add this state

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
    }
  }, [email]);

  const strengthChartData = {
    labels: ["Strength Score"],
    datasets: [
      {
        data: [
          strengthData?.strengthScore || 0,
          100 - (strengthData?.strengthScore || 0),
        ],
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)",
          "rgba(211, 211, 211, 0.3)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    cutout: "70%",
    plugins: {
      legend: {
        display: false,
      },
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
      setUploadedFiles([]);

      // Refresh strength data
      await handleCheckStrength();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────
     GET /RAG/summary?email=...
     ────────────────────────────────────────────────────────────────────── *

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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
      if (!res.ok) throw new Error(`Content generation error: ${res.status}`);
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
      {/* Strength Overview */}
      {strengthData && (
        <div className="rag-strength-overview">
          <div className="strength-chart">
            <div
              style={{ width: "200px", height: "200px", position: "relative" }}
            >
              <Doughnut data={strengthChartData} options={chartOptions} />
              <div className="chart-center-text">
                <strong>{strengthData.strengthScore}</strong>
                <span>/{100}</span>
              </div>
            </div>
            <div className="strength-level">
              <h3>{strengthData.strengthLevel}</h3>
              <button
                className="rag-button-secondary"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="strength-details">
              <div className="quality-description">
                <h4>Analysis</h4>
                <p>{strengthData.qualityDescription}</p>
              </div>

              <div className="recommendations">
                <h4>Recommendations</h4>
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
            <h1>Upload to RAG {isUploadExpanded ? "▼" : "▶"}</h1>
          </button>

          {isUploadExpanded && (
            <form className="rag-form" onSubmit={handleSubmit}>
              <p className="rag-welcome">
                Logged in as <strong>{email}</strong>
              </p>

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
        <h3>Generate Content to Test your RAG!</h3>
        <form
          onSubmit={
            !contentStrategy ? handleAnalyzeStrategy : handleGenerateContent
          }
        >
          <input
            type="text"
            className="rag-input"
            placeholder="Enter topic for content generation"
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
                "Analyze Strategy"
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
