import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useAuth } from "../../../context/AuthContext";
import "./StepMainDomain.css";

const StepMainDomain = () => {
  const { onboardingData, setOnboardingData, loading } = useOnboarding();
  const { authState } = useAuth();
  const { email } = authState;
  const navigate = useNavigate();

  // Local state for inputs
  const [domain, setDomain] = useState(onboardingData.domain || "");
  const [location, setLocation] = useState(onboardingData.location || "");
  const [analysisData, setAnalysisData] = useState(
    onboardingData.initialAnalysisState
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeDomain = async () => {
    if (!domain) return;

    setIsAnalyzing(true);
    try {
      // Call your backend endpoint
      const response = await fetch(
        "http://ai.1upmedia.com:3000/get-domain-authority",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ site_url: domain, include_majestic: true }),
        }
      );

      const { detail } = await response.json();
      const data = detail;
      if (!response.ok) {
        throw new Error(data.message);
      }

      setAnalysisData({
        domainAuthority: data.domain_authority,
        pageAuthority: data.page_authority,
        trustFlow: data.majestic?.majesticTF || 5,
        citationFlow: data.majestic?.majesticCF || 32,
      });

      onboardingData.initialAnalysisState = {
        ...onboardingData.initialAnalysisState,
        domainAuthority: data.domain_authority,
        pageAuthority: data.page_authority,
        trustFlow: data.majestic?.majesticTF || 5,
        citationFlow: data.majestic?.majesticCF || 32,
      };
    } catch (error) {
      console.error("Error analyzing domain:", error);
      // Add error handling UI
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    try {
      const filteredSiteData = {
        URL: domain,
        location,
        dynamic_fields: {
          ...analysisData,
        },
      };

      await fetch("http://localhost:3000/aiagent/updateBusinessdetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          siteData: filteredSiteData,
        }),
      });

      alert("Domain details saved successfully!");
    } catch (error) {
      console.error("Error saving domain details:", error);
      alert("Error saving domain details. Please try again.");
    }
  };

  const handleNext = () => {
    // Save user input to onboarding context
    setOnboardingData((prev) => ({
      ...prev,
      domain,
      location,
      siteAnalysis: analysisData,
    }));

    navigate("/onboarding/step-keywords");
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div>
      <h2>Main Domain Setup</h2>
      <div className="domain-input-section">
        <label>
          <strong>Domain:</strong>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter your domain"
            className="step-main-domain-input"
          />
        </label>
        <button
          onClick={handleAnalyzeDomain}
          disabled={!domain || isAnalyzing}
          className="analyze-button"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Domain"}
        </button>
      </div>

      {analysisData.domainAuthority && (
        <div className="analysis-results">
          <h3>Site Analysis Results</h3>
          <div className="analysis-inputs">
            <label>
              <strong>Domain Authority (DA):</strong>
              <input
                type="number"
                value={analysisData.domainAuthority}
                onChange={(e) =>
                  setAnalysisData((prev) => ({
                    ...prev,
                    domainAuthority: e.target.value,
                  }))
                }
                className="analysis-input"
              />
            </label>
            <label>
              <strong>Page Authority (PA):</strong>
              <input
                type="number"
                value={analysisData.pageAuthority}
                onChange={(e) =>
                  setAnalysisData((prev) => ({
                    ...prev,
                    pageAuthority: e.target.value,
                  }))
                }
                className="analysis-input"
              />
            </label>
            <label>
              <strong>Trust Flow:</strong>
              <input
                type="number"
                value={analysisData.trustFlow}
                onChange={(e) =>
                  setAnalysisData((prev) => ({
                    ...prev,
                    trustFlow: e.target.value,
                  }))
                }
                className="analysis-input"
              />
            </label>
            <label>
              <strong>Citation Flow:</strong>
              <input
                type="number"
                value={analysisData.citationFlow}
                onChange={(e) =>
                  setAnalysisData((prev) => ({
                    ...prev,
                    citationFlow: e.target.value,
                  }))
                }
                className="analysis-input"
              />
            </label>
          </div>
        </div>
      )}

      <label className="location-label">
        <strong>Location:</strong>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter your location"
          className="step-main-domain-input"
        />
      </label>

      <div className="button-group">
        <button
          onClick={handleSave}
          disabled={!domain || !location}
          className="save-button"
        >
          Save
        </button>
        <button
          onClick={handleNext}
          disabled={!domain || !location}
          className="next-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StepMainDomain;
