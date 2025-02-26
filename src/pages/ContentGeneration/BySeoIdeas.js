import React, { useState } from "react";
import axios from "axios";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import "./BySeoIdeas.css";
import { usePoll } from "../../context/PollContext";

const BySeoIdeas = () => {
  const { onboardingData } = useOnboarding();
  const { startPolling } = usePoll();
  const { authState } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentGenerationStatus, setContentGenerationStatus] = useState(null);

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
        "https://ai.1upmedia.com:443/aiagent/generate-seo-ideas",
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

      if (response.data?.success) {
        // Add an id and selected property to each idea
        const ideasWithMetadata = response.data.data.map((idea, index) => ({
          ...idea,
          id: index,
          selected: false,
        }));
        setIdeas(ideasWithMetadata);
        setSelectedIdeas([]);
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

  const toggleIdeaSelection = (ideaId) => {
    const idea = ideas.find((i) => i.id === ideaId);

    // Update the idea's selected status
    setIdeas(
      ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, selected: !idea.selected } : idea
      )
    );

    // Update the selectedIdeas array
    if (idea.selected) {
      // Remove from selected if already selected
      setSelectedIdeas(selectedIdeas.filter((id) => id !== ideaId));
    } else {
      // Add to selected if not already selected
      setSelectedIdeas([...selectedIdeas, ideaId]);
    }
  };

  const handleSelectAll = () => {
    // If all are selected, deselect all. Otherwise, select all.
    const allSelected = ideas.every((idea) => idea.selected);

    if (allSelected) {
      setIdeas(ideas.map((idea) => ({ ...idea, selected: false })));
      setSelectedIdeas([]);
    } else {
      setIdeas(ideas.map((idea) => ({ ...idea, selected: true })));
      setSelectedIdeas(ideas.map((idea) => idea.id));
    }
  };

  const handleGenerateContent = async () => {
    if (selectedIdeas.length === 0) {
      setContentGenerationStatus("Please select at least one idea first.");
      setTimeout(() => setContentGenerationStatus(null), 3000);
      return;
    }

    setGeneratingContent(true);
    setContentGenerationStatus(
      `Generating content for ${selectedIdeas.length} selected ideas...`
    );

    try {
      // Get the selected idea objects
      const selectedIdeaObjects = ideas.filter((idea) =>
        selectedIdeas.includes(idea.id)
      );

      startPolling();
      const response = await axios.post(
        "https://ai.1upmedia.com:443/aiagent/generateContentFromIdeas",
        {
          email: authState.email,
          ideas: selectedIdeaObjects,
          businessDetails: onboardingData.businessDetails,
          keywords: onboardingData.keywords,
          domain: onboardingData.domain,
        },
        {
          timeout: 120000, // 2 minute timeout
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.status === "success") {
        setContentGenerationStatus(
          `Successfully generated content for ${selectedIdeas.length} ideas!`
        );
        setTimeout(() => {
          setContentGenerationStatus(null);
          // Optional: reset selections after successful generation
          // setSelectedIdeas([]);
          // setIdeas(ideas.map(idea => ({ ...idea, selected: false })));
        }, 3000);
      } else {
        throw new Error(response.data.error || "Failed to generate content");
      }
    } catch (error) {
      let errorMessage = "Failed to generate content. ";
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage += "Request timed out. Please try again.";
        } else if (!error.response) {
          errorMessage += "Network error. Please check your connection.";
        } else {
          errorMessage += error.response?.data?.error || error.message;
        }
      } else {
        errorMessage += error.message;
      }
      setContentGenerationStatus(errorMessage);
      setTimeout(() => setContentGenerationStatus(null), 5000);
      console.error("Error generating content:", error);
    } finally {
      setGeneratingContent(false);
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

      {contentGenerationStatus && (
        <div
          className={
            contentGenerationStatus.includes("Failed")
              ? "error-message"
              : "status-message"
          }
        >
          {contentGenerationStatus}
        </div>
      )}

      {ideas.length > 0 && (
        <div className="ideas-section">
          <div className="ideas-header">
            <h2>Generated Content Ideas</h2>
            <div className="ideas-actions">
              <button className="select-all-button" onClick={handleSelectAll}>
                {ideas.every((idea) => idea.selected)
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <div className="selection-count">
                {selectedIdeas.length} of {ideas.length} selected
              </div>
            </div>
          </div>

          <div className="ideas-grid">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`idea-card ${
                  idea.selected ? "idea-card-selected" : ""
                }`}
                onClick={() => toggleIdeaSelection(idea.id)}
              >
                <div className="idea-checkbox">
                  <input
                    type="checkbox"
                    checked={idea.selected}
                    onChange={() => {}} // Controlled component
                    onClick={(e) => e.stopPropagation()} // Prevent double toggle
                  />
                </div>
                <h3>{idea.title}</h3>
                <p className="idea-description">{idea.idea}</p>
                <div className="idea-combination">
                  <strong>Strategy:</strong>
                  <p>{idea.combination}</p>
                </div>
              </div>
            ))}
          </div>

          {ideas.length > 0 && (
            <div className="generate-content-section">
              <button
                className="generate-content-button"
                onClick={handleGenerateContent}
                disabled={generatingContent || selectedIdeas.length === 0}
              >
                {generatingContent
                  ? "Generating Content..."
                  : `Generate Content (${selectedIdeas.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BySeoIdeas;
