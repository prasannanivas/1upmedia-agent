import React, { useState } from "react";
import "./SetupWizard.css";

const SetupWizard = () => {
  const [siteURL, setSiteURL] = useState("");
  const [siteAnalysis, setSiteAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeSite = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/aiagent/analyze-site",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: siteURL }),
        }
      );

      if (!response.ok) throw new Error("Failed to analyze site");
      const data = await response.json();
      console.log("Response Data:", data); // Debug response
      setSiteAnalysis(data);
    } catch (error) {
      console.error("Error analyzing site:", error);
      setSiteAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="setup-wizard">
      <h1 className="title">Site Analyzer</h1>
      <div className="form-container">
        <div className="form-group">
          <label htmlFor="siteURL">Enter Site URL:</label>
          <input
            type="text"
            id="siteURL"
            value={siteURL}
            onChange={(e) => setSiteURL(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <button onClick={analyzeSite} className="submit-button">
          Analyze
        </button>
      </div>

      {isLoading && (
        <p className="loading-message">Analyzing site, please wait...</p>
      )}

      {siteAnalysis && (
        <div className="result-section">
          <h2>SEO Analysis</h2>
          <p>
            <strong>Performance:</strong> {siteAnalysis.performance} / 100
          </p>
          <p>
            <strong>SEO:</strong> {siteAnalysis.seo} / 100
          </p>
          <p>
            <strong>Accessibility:</strong> {siteAnalysis.accessibility} / 100
          </p>
          <p>
            <strong>Best Practices:</strong> {siteAnalysis.bestPractices} / 100
          </p>
          <p>
            <strong>PWA:</strong> {siteAnalysis.pwa} / 100
          </p>

          <h3>Suggestions for Improvement</h3>
          {siteAnalysis.seoIssues?.length > 0 ? (
            <ul>
              {siteAnalysis.seoIssues.map((issue, index) => (
                <li key={index}>
                  <strong>{issue.title}</strong>: {issue.description}
                  {issue.suggestions?.length > 0 && (
                    <ul>
                      {issue.suggestions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No SEO issues found!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SetupWizard;
