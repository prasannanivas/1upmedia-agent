import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import axios from "axios";
import "./FromBusiness.css";
import { useAuth } from "../../context/AuthContext";

// Add this helper function at the top, after the imports
const getRandomElement = (array) => {
  if (!array || array.length === 0) return "";
  return array[Math.floor(Math.random() * array.length)];
};

export default function FromBusiness() {
  const { authState } = useAuth();
  const { onboardingData } = useOnboarding();
  const { businessDetails, goal } = onboardingData;

  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentGenerationStatus, setContentGenerationStatus] = useState(null);

  // Inside the component, add these new state variables
  const [allContentStrategy, setAllContentStrategy] = useState(
    onboardingData.suggestionsFromAi?.content_strategies || []
  );
  const [allContentTypes, setAllContentTypes] = useState(
    onboardingData.suggestionsFromAi?.content_types || []
  );
  const [allTopicClusters, setAllTopicClusters] = useState(
    onboardingData.suggestionsFromAi?.topic_clusters || []
  );

  // Add this useEffect to update state when onboarding data changes
  useEffect(() => {
    setAllContentStrategy(
      onboardingData.suggestionsFromAi?.content_strategies || []
    );
    setAllContentTypes(onboardingData.suggestionsFromAi?.content_types || []);
    setAllTopicClusters(onboardingData.suggestionsFromAi?.topic_clusters || []);
  }, [
    onboardingData.suggestionsFromAi?.content_strategies,
    onboardingData.suggestionsFromAi?.content_types,
    onboardingData.suggestionsFromAi?.topic_clusters,
  ]);

  useEffect(() => {
    if (businessDetails && businessDetails.trim() !== "") {
      setLoading(true);
      fetch(
        "https://ai.1upmedia.com:443/generate-preview-titles-from-business-details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goal: goal || "",
            business_details: businessDetails,
            num_articles: 10,
          }),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          let parsedIdeas = [];
          if (typeof data.titles === "string") {
            const matches = data.titles.match(/"([^"]+)"/g);
            if (matches) {
              parsedIdeas = matches.map((title, index) => {
                // Randomly select values from onboarding data
                const randomStrategy = getRandomElement(allContentStrategy);
                const randomType = getRandomElement(allContentTypes);
                const randomCluster = getRandomElement(allTopicClusters);
                const randomIntent = getRandomElement([
                  "Informational",
                  "Navigational",
                  "Transactional",
                  "Commercial",
                ]);
                const randomTone = getRandomElement([
                  "Informative",
                  "Professional",
                  "Casual",
                  "Formal",
                  "Persuasive",
                  "Neutral",
                ]);

                return {
                  id: index,
                  title: title.replace(/^"|"$/g, ""),
                  selected: false,
                  idea: "Based on business details: " + businessDetails,
                  dailyCombinationsJSON: {
                    content_strategy:
                      randomStrategy?.strategy_name ||
                      randomStrategy ||
                      "Business Focus",
                    content_type:
                      randomType?.type_name || randomType || "Article",
                    topic_cluster:
                      randomCluster?.cluster_name ||
                      randomCluster ||
                      "Business",
                    search_intent: randomIntent,
                    tone: randomTone,
                    target_audience:
                      onboardingData.targetAudience || "Business Audience",
                    goal: goal || "Business Growth",
                  },
                };
              });
            }
          }
          setIdeas(parsedIdeas);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching ideas:", error);
          setLoading(false);
        });
    }
  }, [
    businessDetails,
    goal,
    allContentStrategy,
    allContentTypes,
    allTopicClusters,
  ]);

  const toggleIdeaSelection = (ideaId) => {
    setIdeas(
      ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, selected: !idea.selected } : idea
      )
    );
    setSelectedIdeas((current) =>
      ideas.find((i) => i.id === ideaId)?.selected
        ? current.filter((id) => id !== ideaId)
        : [...current, ideaId]
    );
  };

  const handleSelectAll = () => {
    const allSelected = ideas.every((idea) => idea.selected);
    const newIdeas = ideas.map((idea) => ({
      ...idea,
      selected: !allSelected,
    }));
    setIdeas(newIdeas);
    setSelectedIdeas(!allSelected ? ideas.map((idea) => idea.id) : []);
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
      const selectedIdeaObjects = ideas.filter((idea) =>
        selectedIdeas.includes(idea.id)
      );

      const response = await axios.post(
        "https://ai.1upmedia.com:443/aiagent/generateContentFromIdeas",
        {
          email: authState.email,
          ideas: selectedIdeaObjects,
          businessDetails: businessDetails,
        }
      );

      if (response.data.status === "success") {
        setContentGenerationStatus(
          `Successfully generated content for ${selectedIdeas.length} ideas!`
        );
        setTimeout(() => setContentGenerationStatus(null), 3000);
      } else {
        throw new Error(response.data.error || "Failed to generate content");
      }
    } catch (error) {
      setContentGenerationStatus(
        "Failed to generate content. Please try again."
      );
      setTimeout(() => setContentGenerationStatus(null), 5000);
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSelectIdea = (id) => {
    toggleIdeaSelection(id);
  };

  // Add editing functionality
  const [editingIdea, setEditingIdea] = useState(null);

  const handleModifyIdea = (e, idea) => {
    e.stopPropagation();
    setEditingIdea(idea);
  };

  const handleSaveModification = (e, ideaId) => {
    e.stopPropagation();
    setIdeas(
      ideas.map((idea) => {
        if (idea.id === ideaId) {
          return {
            ...idea,
            dailyCombinationsJSON: {
              ...idea.dailyCombinationsJSON,
              content_strategy:
                editingIdea.dailyCombinationsJSON.content_strategy,
              content_type: editingIdea.dailyCombinationsJSON.content_type,
              search_intent: editingIdea.dailyCombinationsJSON.search_intent,
              tone: editingIdea.dailyCombinationsJSON.tone,
              target_audience:
                editingIdea.dailyCombinationsJSON.target_audience,
              goal: editingIdea.dailyCombinationsJSON.goal,
            },
          };
        }
        return idea;
      })
    );
    setEditingIdea(null);
  };

  if (!businessDetails || businessDetails.trim() === "") {
    return (
      <div className="fb-container">
        <div className="fb-empty">
          <p>
            Your business details are empty. Please complete the onboarding.
          </p>
          <Link to="/onboarding" className="fb-link">
            Click here to complete onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-container">
      <h1 className="fb-title">Content Ideas from Business Details</h1>
      {loading ? (
        <div className="fb-loading">
          <p>Generating creative ideas for your business...</p>
        </div>
      ) : (
        <>
          <div className="fb-ideas-list">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`fb-idea-item ${idea.selected ? "selected" : ""}`}
                onClick={() => handleSelectIdea(idea.id)}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={idea.selected}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="idea-content">
                    <h3>{idea.title}</h3>
                    <div className="idea-details">
                      <div className="idea-combination">
                        {editingIdea?.id === idea.id ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="edit-combinations"
                          >
                            <div className="edit-field">
                              <label>Content Strategy:</label>
                              <select
                                value={
                                  editingIdea.dailyCombinationsJSON
                                    .content_strategy || ""
                                }
                                onChange={(e) =>
                                  setEditingIdea({
                                    ...editingIdea,
                                    dailyCombinationsJSON: {
                                      ...editingIdea.dailyCombinationsJSON,
                                      content_strategy: e.target.value,
                                    },
                                  })
                                }
                              >
                                {allContentStrategy.map((strategy, idx) => (
                                  <option
                                    key={idx}
                                    value={strategy.strategy_name || strategy}
                                  >
                                    {strategy.strategy_name || strategy}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="edit-field">
                              <label>Content Type:</label>
                              <select
                                value={
                                  editingIdea.dailyCombinationsJSON
                                    .content_type || ""
                                }
                                onChange={(e) =>
                                  setEditingIdea({
                                    ...editingIdea,
                                    dailyCombinationsJSON: {
                                      ...editingIdea.dailyCombinationsJSON,
                                      content_type: e.target.value,
                                    },
                                  })
                                }
                              >
                                {allContentTypes.map((type, idx) => (
                                  <option
                                    key={idx}
                                    value={type.type_name || type}
                                  >
                                    {type.type_name || type}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              className="save-button"
                              onClick={(e) =>
                                handleSaveModification(e, idea.id)
                              }
                            >
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <>
                            <p>
                              <strong>Strategy:</strong>{" "}
                              {idea.dailyCombinationsJSON.content_strategy}
                            </p>
                            <p>
                              <strong>Type:</strong>{" "}
                              {idea.dailyCombinationsJSON.content_type}
                            </p>
                            <p>
                              <strong>Intent:</strong>{" "}
                              {idea.dailyCombinationsJSON.search_intent}
                            </p>
                            <p>
                              <strong>Tone:</strong>{" "}
                              {idea.dailyCombinationsJSON.tone}
                            </p>
                            <button
                              className="modify-button"
                              onClick={(e) => handleModifyIdea(e, idea)}
                            >
                              Modify Idea
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
          <div className="actions-container">
            <button onClick={handleSelectAll} className="select-all-button">
              {ideas.every((idea) => idea.selected)
                ? "Deselect All"
                : "Select All"}
            </button>
            <button
              onClick={handleGenerateContent}
              disabled={generatingContent || selectedIdeas.length === 0}
              className="generate-button"
            >
              {generatingContent ? (
                <span className="loading-text">Generating Content...</span>
              ) : (
                `Generate Content (${selectedIdeas.length})`
              )}
            </button>
          </div>
          {contentGenerationStatus && (
            <div
              className={`status-message ${
                contentGenerationStatus.includes("Failed")
                  ? "error-message"
                  : "success-message"
              }`}
            >
              {contentGenerationStatus}
            </div>
          )}
        </>
      )}
    </div>
  );
}
