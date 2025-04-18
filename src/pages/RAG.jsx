import React, { useState, useEffect } from "react"; // Add useEffect
import { useAuth } from "../context/AuthContext";
import "./RAG.css";

function RAG() {
  const { authState } = useAuth();
  const { email } = authState;

  // Link & File states
  const [links, setLinks] = useState([""]);
  const [filesArray, setFilesArray] = useState([]); // Start empty

  // Loading / Error / Server
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Server responses
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [personaPrompt, setPersonaPrompt] = useState(null);

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
          {filesArray.map((_, i) => (
            <input
              key={i}
              className="rag-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => handleFilesChange(i, e.target.files)}
            />
          ))}
          <button
            type="button"
            onClick={handleAddFileInput}
            className="rag-button-secondary"
          >
            Add Another File(s)
          </button>

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

      {/* Show persona prompt */}
      {personaPrompt && (
        <div className="rag-persona">
          <h3>Persona Prompt:</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{personaPrompt}</pre>
        </div>
      )}
    </div>
  );
}

export default RAG;
