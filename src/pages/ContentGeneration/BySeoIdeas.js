import React, { useState } from "react";
import axios from "axios";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import "./BySeoIdeas.css";

const BySeoIdeas = () => {
  const { onboardingData } = useOnboarding();
  const { authState } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if all required data is available
  const missingFields = [];
  if (!onboardingData.domain) missingFields.push("Domain");
  if (!onboardingData.location) missingFields.push("Location");
  if (!onboardingData.businessDetails) missingFields.push("Business Details");
  if (!onboardingData.initialAnalysisState?.domainAuthority)
    missingFields.push("Domain Analysis");
  if (!onboardingData.keywords?.length) missingFields.push("Keywords");
  if (!onboardingData.suggestionsFromAi?.content_strategies?.length)
    missingFields.push("Content Strategy");

  const handleGenerateIdeas = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use axios instead of fetch for better error handling
      const response = await axios.post(
        "http://localhost:3000/aiagent/generate-seo-ideas",
        {
          email: authState.email,
          url: onboardingData.domain,
          location: onboardingData.location,
          business_details: onboardingData.businessDetails,
          domainAuthority: onboardingData.initialAnalysisState?.domainAuthority,
          pageAuthority: onboardingData.initialAnalysisState?.pageAuthority,
          trustFlow: onboardingData.initialAnalysisState?.trustFlow,
          citationFlow: onboardingData.initialAnalysisState?.citationFlow,
          content_strategies:
            onboardingData.suggestionsFromAi?.content_strategies,
          content_types: onboardingData.suggestionsFromAi?.content_types,
          topic_clusters: onboardingData.suggestionsFromAi?.topic_clusters,
          keywords: onboardingData.keywords,
          search_analytics: onboardingData.searchConsoleData,
        },
        {
          timeout: 30000, // 30 second timeout
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        setIdeas(response.data.data);
      } else {
        throw new Error(response.data.error || "Failed to generate ideas");
      }
    } catch (error) {
      let errorMessage = "Failed to generate ideas. ";
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage += "Request timed out. Please try again.";
        } else if (!error.response) {
          errorMessage += "Network error. Please check your connection.";
        } else {
          errorMessage += error.response.data?.error || error.message;
        }
      } else {
        errorMessage += error.message;
      }
      setError(errorMessage);
      console.error("Error generating ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="seo-ideas-container">
      <h1 className="seo-ideas-title">Generate SEO Content Ideas</h1>

      {missingFields.length > 0 ? (
        <div className="warning-section">
          <h3>⚠️ Complete Your Onboarding</h3>
          <p>
            For the best content ideas, please complete these onboarding steps:
          </p>
          <ul>
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p className="warning-note">
            You can still generate ideas, but they may not be as targeted.
          </p>
        </div>
      ) : (
        <div className="status-section">
          <p className="success-message">✅ All onboarding data is complete!</p>
        </div>
      )}

      <button
        className="generate-button"
        onClick={handleGenerateIdeas}
        disabled={isLoading}
      >
        {isLoading ? "Generating Ideas..." : "Generate Content Ideas"}
      </button>

      {error && <div className="error-message">{error}</div>}

      {ideas.length > 0 && (
        <div className="ideas-section">
          <h2>Generated Content Ideas</h2>
          <div className="ideas-grid">
            {ideas.map((idea, index) => (
              <div key={index} className="idea-card">
                <h3>{idea.title}</h3>
                <p className="idea-description">{idea.idea}</p>
                <div className="idea-combination">
                  <strong>Strategy:</strong>
                  <p>{idea.combination}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BySeoIdeas;
