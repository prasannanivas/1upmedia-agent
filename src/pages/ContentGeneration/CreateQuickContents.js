import React, { useState } from "react";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import OnboardingProgress from "../../components/OnboardingProgress";
import "./CreateQuickContents.css";

const CreateQuickContents = () => {
  const { onboardingData } = useOnboarding();
  const { authState } = useAuth();
  const { email } = authState;
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
      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/generate-seo-ideas",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            url: onboardingData.domain,
            location: onboardingData.location,
            business_details: onboardingData.businessDetails,
            domainAuthority:
              onboardingData.initialAnalysisState?.domainAuthority,
            pageAuthority: onboardingData.initialAnalysisState?.pageAuthority,
            trustFlow: onboardingData.initialAnalysisState?.trustFlow,
            citationFlow: onboardingData.initialAnalysisState?.citationFlow,
            content_strategies:
              onboardingData.suggestionsFromAi?.content_strategies,
            content_types: onboardingData.suggestionsFromAi?.content_types,
            topic_clusters: onboardingData.suggestionsFromAi?.topic_clusters,
            keywords: onboardingData.keywords,
            search_analytics: onboardingData.searchConsoleData,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to generate ideas");

      setIdeas(data.data);
    } catch (error) {
      setError(error.message);
      console.error("Error generating ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOkClick = () => {
    // TODO: Handle next steps after user clicks OK
    alert("Next steps will be implemented here");
  };

  return (
    <div className="quick-contents-container">
      <h2>Quick Content Ideas Generator</h2>
      <OnboardingProgress />
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
        className="generate-btn"
        onClick={handleGenerateIdeas}
        disabled={isLoading}
      >
        {isLoading ? "Generating Ideas..." : "Generate Content Ideas"}
      </button>

      {error && <div className="error-message">Error: {error}</div>}

      {ideas.length > 0 && (
        <div className="ideas-section">
          <h3>Generated Content Ideas</h3>
          <div className="ideas-grid">
            {ideas.map((idea, index) => (
              <div key={index} className="idea-card">
                <h4>{idea.title}</h4>
                <p className="idea-description">{idea.idea}</p>
                <div className="idea-combination">
                  <strong>Strategy Combination:</strong>
                  <p>{idea.combination}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="ok-btn" onClick={handleOkClick}>
            OK, Let's Create Content
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateQuickContents;
