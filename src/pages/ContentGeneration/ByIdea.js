import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ByIdea.css";
import { useAuth } from "../../context/AuthContext";
import { useOnboarding } from "../../context/OnboardingContext"; // Add this import

// Add this helper function at the top of your component
const getRandomElement = (array) => {
  if (!array || array.length === 0) return "";
  return array[Math.floor(Math.random() * array.length)];
};

const ByIdea = () => {
  const [idea, setIdea] = useState("");
  const [keywords, setKeywords] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { authState } = useAuth();
  const { email } = authState;

  const { onboardingData } = useOnboarding(); // Add this

  console.log(onboardingData);

  const [allContentStrategy, setAllContentStrategy] = useState(
    onboardingData.suggestionsFromAi?.content_strategies || []
  );
  const [allContentTypes, setAllContentTypes] = useState(
    onboardingData.suggestionsFromAi?.content_types || []
  );
  const [allTopicClusters, setAllTopicClusters] = useState(
    onboardingData.suggestionsFromAi?.topic_clusters || []
  );

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

  // Advanced Fields
  const [contentStrategy, setContentStrategy] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedSearchIntent, setSelectedSearchIntent] = useState("");
  const [tone, setTone] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");

  const [dropdownOptions, setDropdownOptions] = useState({
    goals: [],
    search_intents: [],
    content_templates: [],
    content_strategies: [],
    languages: [],
  });

  const [ideas, setIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentGenerationStatus, setContentGenerationStatus] = useState(null);
  const [error, setError] = useState(null);
  const [editingIdea, setEditingIdea] = useState(null);

  const fetchDropdownOptions = async () => {
    try {
      const response = await axios.get(
        `https://ai.1upmedia.com/aiagent/pipeline-templates/${email}`
      );

      console.log(response);
      if (response.data?.templates) {
        const templates = response.data?.templates;

        // Parse content_templates (key-value pair -> dropdown array)
        const contentTemplates = Object.keys(templates.content_templates).map(
          (key) => ({
            value: key,
            label: key,
          })
        );

        // Parse content_strategies (grouped options -> flatten for dropdown)
        const contentStrategies = templates.content_strategies.flatMap(
          (group) =>
            group.subgroups.map((subgroup) => ({
              value: subgroup.value,
              label: `${group.group} - ${subgroup.label}`,
            }))
        );

        setDropdownOptions({
          goals: templates.goals,
          search_intents: templates.search_intents,
          content_templates: contentTemplates,
          content_strategies: contentStrategies,
          languages: templates.languages,
        });
      } else {
        setError("Failed to fetch dropdown options.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dropdown options. Please try again.");
    }
  };

  // Fetch Dropdown Options
  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  // Generate Ideas API Call
  const handleGenerateIdeas = async () => {
    let prompt = `Main title: ${idea}\n`;
    prompt += `Content Strategy: ${contentStrategy}\n`;
    prompt += `Goal: ${selectedGoal}\n`;
    prompt += `Target Audience: ${targetAudience}\n`;
    prompt += `Keywords: ${keywords}\n`;
    prompt += `Search Intent: ${selectedSearchIntent}\n`;
    prompt += `Tone: ${tone}\n`;
    prompt += `Content Type: ${selectedContentType}\n\n`;

    const apiUrl = "https://ai.1upmedia.com:443/get-preview-titles";
    const postData = { count: 10, prompt };

    try {
      const response = await axios.post(apiUrl, postData, {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      });

      const titlesData = response.data;
      if (titlesData?.titles) {
        const titlesArray = [
          ...titlesData.titles.matchAll(/\d+\.\s*"([^"]+)"/g),
        ]
          .map((match) => match[1].trim())
          .map((title, index) => {
            // Randomly select values for each field
            const randomStrategy = getRandomElement(allContentStrategy);
            const randomType = getRandomElement(allContentTypes);
            const randomIntent = getRandomElement(
              dropdownOptions.search_intents
            );
            const randomTone = getRandomElement([
              "Informative",
              "Critical",
              "Romantic",
              "Casual",
              "Formal",
              "Persuasive",
              "Neutral",
            ]);
            const randomGoal = getRandomElement(dropdownOptions.goals);

            return {
              id: index,
              title: title,
              selected: false,
              idea: "Keywords to include: " + keywords,
              dailyCombinationsJSON: {
                content_strategy:
                  randomStrategy?.strategy_name ||
                  randomStrategy ||
                  contentStrategy,
                content_type:
                  randomType?.type_name || randomType || selectedContentType,
                topic_cluster: idea,
                search_intent: randomIntent || selectedSearchIntent,
                tone: randomTone || tone,
                target_audience: targetAudience,
                goal: randomGoal || selectedGoal,
              },
            };
          });
        setIdeas(titlesArray);
      } else {
        setError("No ideas generated. Please refine your inputs.");
      }
    } catch (error) {
      setError("Failed to fetch ideas. Please try again.");
    }
  };

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
          keywords: keywords.split(",").map((k) => k.trim()),
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

  const handleModifyIdea = (e, idea) => {
    e.stopPropagation(); // Prevent the idea card from being selected
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

  return (
    <div className="by-idea-container">
      <h1>Generate Titles by Idea</h1>

      {/* Main Input */}
      <div className="input-group">
        <label>Enter Your Idea</label>
        <input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Type your idea here..."
        />
      </div>

      {/* Keywords Input */}
      <div className="input-group">
        <label>Keywords (Optional)</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Enter keywords..."
        />
      </div>

      {/* Advanced Button */}
      <button
        className="advanced-button"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "Hide Advanced Fields" : "Show Advanced Fields"}
      </button>

      {/* Advanced Fields */}
      {showAdvanced && (
        <div className="advanced-fields">
          <div className="input-group">
            <label>Content Strategy</label>
            <select
              value={contentStrategy}
              onChange={(e) => setContentStrategy(e.target.value)}
            >
              <option value="">Select Content Strategy</option>
              {allContentStrategy.map((strategy, index) => (
                <option key={index} value={strategy.strategy_name || strategy}>
                  {strategy.strategy_name || strategy}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Goal</label>
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
            >
              <option value="">Select Goal</option>
              {dropdownOptions.goals.map((goal, index) => (
                <option key={index} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Type your target audience..."
            />
          </div>
          <div className="input-group">
            <label>Search Intent</label>
            <select
              value={selectedSearchIntent}
              onChange={(e) => setSelectedSearchIntent(e.target.value)}
            >
              <option value="">Select Search Intent</option>
              {dropdownOptions.search_intents.map((intent, index) => (
                <option key={index} value={intent}>
                  {intent}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="">Select Tone</option>
              {[
                "Informative",
                "Critical",
                "Romantic",
                "Casual",
                "Formal",
                "Persuasive",
                "Neutral",
              ].map((toneOption, index) => (
                <option key={index} value={toneOption}>
                  {toneOption}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Content Type</label>
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
            >
              <option value="">Select Content Type</option>
              {allContentTypes.map((type, index) => (
                <option key={index} value={type.type_name || type}>
                  {type.type_name || type}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button className="generate-button" onClick={handleGenerateIdeas}>
        Generate Ideas
      </button>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Generated Ideas */}
      {ideas.length > 0 && (
        <div className="by-idea__generated-ideas">
          <div className="ideas-header">
            <h2 className="by-idea__subheader">Generated Ideas</h2>
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
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <h3>{idea.title}</h3>
                <div className="idea-details">
                  <p className="idea-keywords">{idea.idea}</p>
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
                              editingIdea.dailyCombinationsJSON.content_type ||
                              ""
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
                              <option key={idx} value={type.type_name || type}>
                                {type.type_name || type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="edit-field">
                          <label>Search Intent:</label>
                          <select
                            value={
                              editingIdea.dailyCombinationsJSON.search_intent ||
                              ""
                            }
                            onChange={(e) =>
                              setEditingIdea({
                                ...editingIdea,
                                dailyCombinationsJSON: {
                                  ...editingIdea.dailyCombinationsJSON,
                                  search_intent: e.target.value,
                                },
                              })
                            }
                          >
                            {dropdownOptions.search_intents.map(
                              (intent, idx) => (
                                <option key={idx} value={intent}>
                                  {intent}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <button
                          className="save-button"
                          onClick={(e) => handleSaveModification(e, idea.id)}
                        >
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <>
                        <p>
                          <strong>Content Strategy:</strong>{" "}
                          {idea.dailyCombinationsJSON.content_strategy}
                        </p>
                        <p>
                          <strong>Content Type:</strong>{" "}
                          {idea.dailyCombinationsJSON.content_type}
                        </p>
                        <p>
                          <strong>Search Intent:</strong>{" "}
                          {idea.dailyCombinationsJSON.search_intent}
                        </p>
                        <p>
                          <strong>Tone:</strong>{" "}
                          {idea.dailyCombinationsJSON.tone}
                        </p>
                        <p>
                          <strong>Target Audience:</strong>{" "}
                          {idea.dailyCombinationsJSON.target_audience}
                        </p>
                        <p>
                          <strong>Goal:</strong>{" "}
                          {idea.dailyCombinationsJSON.goal}
                        </p>
                      </>
                    )}
                  </div>

                  <button
                    className="modify-button"
                    onClick={(e) => handleModifyIdea(e, idea)}
                  >
                    Modify Idea
                  </button>
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
        </div>
      )}
    </div>
  );
};

export default ByIdea;
