import React, { useState, useEffect } from "react"; // Add useEffect
import { useAuth } from "../context/AuthContext";
import "./RAG.css";

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
  const [summaryData, setSummaryData] = useState(null);
  const [personaPrompt, setPersonaPrompt] = useState(null);
  const [strengthData, setStrengthData] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentTopic, setContentTopic] = useState("");

  /* Add useEffect to load summary on mount */
  useEffect(() => {
    if (email) {
      handleCheckSummary();
    }
  }, [email]);

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
  const handleAddFileInput = () => setFilesArray([...filesArray, null]);
  const handleFilesChange = (idx, fileList) => {
    const newArr = [...filesArray];
    newArr[idx] = fileList;
    setFilesArray(newArr);
  };

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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────
     GET /RAG/summary?email=...
     ────────────────────────────────────────────────────────────────────── */
  const handleCheckSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://ai.1upmedia.com:443/RAG/summary?email=${encodeURIComponent(
          email
        )}`
      );
      if (!res.ok) throw new Error(`Summary error: ${res.status}`);
      const data = await res.json();
      setSummaryData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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

  /* ──────────────────────────────────────────────────────────────────────
     Render UI
     ────────────────────────────────────────────────────────────────────── */
  return (
    <div className="rag-container">
      {/* Show summary at the top if available */}
      {summaryData && (
        <div className="rag-summary">
          <h3>Your RAG Summary:</h3>
          <p>{summaryData.message}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rag-loader-wrap">
          <div className="rag-spinner"></div>
          <p className="rag-processing-text">System is processing...</p>
        </div>
      ) : (
        <form className="rag-form" onSubmit={handleSubmit}>
          <h1>Upload to RAG</h1>
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
          <label className="rag-label">Upload Files (PDF/Word/Images):</label>

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

          <button type="submit" className="rag-button-submit">
            Submit
          </button>
        </form>
      )}
      {/* Error message */}
      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}
      {/* Replace analysis JSON display with simple success message */}
      {analysisResponse && (
        <div className="rag-success">
          <p>✅ RAG processing successful!</p>
          <button
            type="button"
            onClick={handlePersonaPrompt}
            className="rag-button-secondary"
          >
            Get Persona Prompt
          </button>
        </div>
      )}
      {/* Add after the persona prompt section */}(
      <div className="rag-actions">
        <button
          type="button"
          onClick={handleCheckStrength}
          className="rag-button-secondary"
        >
          Analyze RAG Strength
        </button>
      </div>
      )
      {strengthData && (
        <div className="rag-strength">
          <h3>RAG Strength Analysis</h3>
          <div className="strength-score">
            <p>Strength Score: {strengthData.strengthScore}/100</p>
            <p>Level: {strengthData.strengthLevel}</p>
            <p>{strengthData.qualityDescription}</p>
          </div>
          <div className="strength-recommendations">
            <h4>Recommendations:</h4>
            <ul>
              {strengthData.recommendations.map((rec, index) => (
                <li key={index}>
                  <strong>{rec.aspect}</strong>: {rec.suggestion}
                  <br />
                  Current: {rec.current} → Target: {rec.target}
                  <br />
                  Priority: {rec.priority}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Show persona prompt */}
      {personaPrompt && (
        <div className="rag-persona">
          <h3>Persona Prompt:</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{personaPrompt}</pre>
        </div>
      )}
      {/* Show strength analysis */}
      {strengthData && (
        <div className="rag-strength">
          <h3>Strength Analysis:</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(strengthData, null, 2)}
          </pre>
        </div>
      )}
      {/* Content Generation Form */}
      <div className="rag-content-generation">
        <h3>Generate Content</h3>
        <form onSubmit={handleGenerateContent}>
          <input
            type="text"
            className="rag-input"
            placeholder="Enter topic for content generation"
            value={contentTopic}
            onChange={(e) => setContentTopic(e.target.value)}
          />
          <button type="submit" className="rag-button-submit">
            Generate Content
          </button>
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
