import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import "./SuggestionStep.css";
import { useAuth } from "../../../context/AuthContext";
import { Loader2Icon } from "lucide-react";

const SuggestionStep = () => {
  const { authState } = useAuth();
  const { email } = authState;
  const { onboardingData, setOnboardingData, loading } = useOnboarding();
  const [suggestions, setSuggestions] = useState({
    content_strategies: [],
    content_types: [],
    topic_clusters: [],
  });

  // Update suggestions when onboardingData changes
  useEffect(() => {
    setSuggestions({
      content_strategies:
        onboardingData.suggestionsFromAi?.content_strategies || [],
      content_types: onboardingData.suggestionsFromAi?.content_types || [],
      topic_clusters: onboardingData.suggestionsFromAi?.topic_clusters || [],
    });
  }, [onboardingData.suggestionsFromAi]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSuggest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/suggest-content-strategy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessDetails: onboardingData.businessDetails,
            keywords: onboardingData.keywords,
            domainAuthority:
              onboardingData.initialAnalysisState?.domainAuthority,
            pageAuthority: onboardingData.initialAnalysisState?.pageAuthority,
            trustFlow: onboardingData.initialAnalysisState?.trustFlow,
            citationFlow: onboardingData.initialAnalysisState?.citationFlow,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error fetching suggestions");
      }

      setSuggestions(data);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      alert("Failed to generate suggestions: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* Send suggestions data to RAG system */
  const sendSuggestionsToRAG = async () => {
    try {
      if (
        !suggestions ||
        Object.keys(suggestions).every((key) => !suggestions[key]?.length)
      ) {
        console.log("No suggestions to send to RAG");
        return false;
      }

      const fd = new FormData();
      fd.append("email", email);
      fd.append("engineType", "intent"); // Intent engine handles content strategies

      // Format suggestions into structured text
      let suggestionsText = "# Content Strategy Suggestions\n\n";

      // Add content strategies section
      if (suggestions.content_strategies?.length) {
        suggestionsText += "## Content Strategies\n\n";
        suggestions.content_strategies.forEach((strategy, i) => {
          suggestionsText += `### ${i + 1}. ${strategy.strategy_name}\n`;
          suggestionsText += `- **Primary Goal**: ${strategy.primary_goal}\n`;
          suggestionsText += `- **Secondary Goal**: ${strategy.secondary_goal}\n`;
          suggestionsText += `- **Approach**: ${strategy.approach}\n\n`;
        });
      }

      // Add content types section
      if (suggestions.content_types?.length) {
        suggestionsText += "## Content Types\n";
        suggestions.content_types.forEach((type) => {
          suggestionsText += `- ${type.replace(/_/g, " ")}\n`;
        });
        suggestionsText += "\n";
      }

      // Add topic clusters section
      if (suggestions.topic_clusters?.length) {
        suggestionsText += "## Topic Clusters\n";
        suggestions.topic_clusters.forEach((topic) => {
          suggestionsText += `- ${topic.replace(/_/g, " ")}\n`;
        });
      }

      // Add the formatted text content
      fd.append("templateData", suggestionsText);

      // Include domain if available
      if (onboardingData.domain) {
        fd.append("domain", onboardingData.domain);
      }

      // Send to RAG system
      const res = await fetch(
        "https://ai.1upmedia.com:443/RAG/analyzeStyleChunks",
        {
          method: "POST",
          body: fd,
        }
      );

      console.log("Content suggestions sent to RAG system");
      return res.ok;
    } catch (error) {
      console.error("Error sending suggestions to RAG:", error);
      return false;
    }
  };

  const handleNext = async () => {
    // Save suggestions in onboarding context for later use
    setOnboardingData((prev) => ({
      ...prev,
      suggestionsFromAi: suggestions,
    }));

    try {
      // Send suggestions to RAG system before proceeding
      sendSuggestionsToRAG();

      // Prepare suggestions object only with non-empty fields
      const filteredSuggestions = {};
      if (suggestions.content_strategies?.length) {
        filteredSuggestions.content_strategies = suggestions.content_strategies;
      }
      if (suggestions.content_types?.length) {
        filteredSuggestions.content_types = suggestions.content_types;
      }
      if (suggestions.topic_clusters?.length) {
        filteredSuggestions.topic_clusters = suggestions.topic_clusters;
      }

      // Only proceed if there's data to update
      if (Object.keys(filteredSuggestions).length === 0) {
        alert("No new suggestions to save.");
        return;
      }

      // Construct API payload
      const updatedData = {
        email, // Required for lookup
        siteData: {
          URL: onboardingData.domain,
          dynamic_fields: {
            suggestions: filteredSuggestions,
          },
        },
      };

      // Call the API to update only the suggestions
      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/updateBusinessdetails",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update business details");
      }

      alert("Suggestions saved successfully!");
      navigate("/onboarding/step-create-authors");
    } catch (error) {
      console.error("Error saving suggestions:", error);
      alert("Error saving suggestions. Please try again.");
    }
  };

  return (
    <>
      {loading ? (
        <Loader2Icon />
      ) : (
        <div className="suggestion-step-container">
          <h2>Content Strategy Suggestions</h2>
          <button
            className="suggestion-btn"
            onClick={handleSuggest}
            disabled={isLoading}
          >
            {isLoading
              ? "Generating Suggestions..."
              : "Suggest Content Strategy"}
          </button>
          {suggestions.content_strategies?.length > 0 && (
            <div className="suggestions-list">
              <div className="strategy-section">
                <h3>Content Strategies</h3>
                <div className="strategy-cards">
                  {suggestions.content_strategies.map((strategy, index) => (
                    <div key={index} className="strategy-card">
                      <h4>{strategy.strategy_name}</h4>
                      <div className="strategy-goals">
                        <p>
                          <strong>Primary Goal:</strong> {strategy.primary_goal}
                        </p>
                        <p>
                          <strong>Secondary Goal:</strong>{" "}
                          {strategy.secondary_goal}
                        </p>
                      </div>
                      <p>
                        <strong>Approach:</strong> {strategy.approach}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="strategy-section">
                <h3>Content Types</h3>
                <div className="content-types">
                  {suggestions.content_types.map((type, index) => (
                    <span key={index} className="content-type-tag">
                      {type.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="strategy-section">
                <h3>Topic Clusters</h3>
                <div className="topic-clusters">
                  {suggestions.topic_clusters.map((topic, index) => (
                    <span key={index} className="topic-cluster-tag">
                      {topic.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <button
            className="next-btn"
            onClick={handleNext}
            disabled={!suggestions.content_strategies?.length}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default SuggestionStep;
