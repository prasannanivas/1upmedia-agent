import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ByKeyword.css";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";

// Add this helper function at the top of your component
const getRandomElement = (array) => {
  if (!array || array.length === 0) return "";
  return array[Math.floor(Math.random() * array.length)];
};

const ByKeyword = () => {
  const { authState } = useAuth();
  const { email } = authState;
  const { onboardingData } = useOnboarding(); // Get suggested keywords
  const [manualKeyword, setManualKeyword] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState({
    goals: [],
    search_intents: [],
    content_templates: [],
    content_strategies: [],
    languages: [],
  });

  // Advanced Fields
  const [contentStrategy, setContentStrategy] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedSearchIntent, setSelectedSearchIntent] = useState("");
  const [tone, setTone] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");

  const [ideas, setIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentGenerationStatus, setContentGenerationStatus] = useState(null);
  const [error, setError] = useState(null);

  const [relatedKeywords, setRelatedKeywords] = useState([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState(
    onboardingData.keywords || []
  );
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [allContentStrategy, setAllContentStrategy] = useState(
    onboardingData.suggestionsFromAi?.content_strategies || []
  );
  const [allContentTypes, setAllContentTypes] = useState(
    onboardingData.suggestionsFromAi?.content_types || []
  );
  const [allTopicClusters, setAllTopicClusters] = useState(
    onboardingData.suggestionsFromAi?.topic_clusters || []
  );

  const fetchRelatedKeywords = async () => {
    setLoadingRelated(true);
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/get-keywords-and-target-audience`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: manualKeyword,
            goal: "SEO",
            business_details: "Finding related Keywords for google search",
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to fetch related keywords");
      const data = await response.json();
      setRelatedKeywords(data.result.keywords.split(", ") || []);
    } catch (error) {
      console.error("Error fetching related keywords:", error);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Fetch Dropdown Options
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const response = await axios.get(
          `https://ai.1upmedia.com/aiagent/pipeline-templates/${email}`
        );
        if (response.data?.templates) {
          const templates = response.data.templates;

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

    fetchDropdownOptions();
  }, []);

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

  // Add a keyword manually
  const addManualKeyword = () => {
    if (
      manualKeyword.trim() !== "" &&
      !selectedKeywords.includes(manualKeyword.trim())
    ) {
      setSelectedKeywords([...selectedKeywords, manualKeyword.trim()]);
      setManualKeyword("");
    }
  };

  // Modify addSuggestedKeyword to remove from respective lists
  const addSuggestedKeyword = (keyword, source) => {
    if (!selectedKeywords.includes(keyword)) {
      setSelectedKeywords([...selectedKeywords, keyword]);

      // Remove from related keywords if it exists there
      if (source === "related") {
        setRelatedKeywords(relatedKeywords.filter((k) => k !== keyword));
      }
      // Remove from suggested keywords if it exists there
      else if (source === "suggested") {
        setSuggestedKeywords(suggestedKeywords.filter((k) => k !== keyword));
      }
    }
  };

  // Update addAllKeywords to work with suggestedKeywords state
  const addAllKeywords = () => {
    const newKeywords = [
      ...new Set([...selectedKeywords, ...suggestedKeywords]),
    ];
    setSelectedKeywords(newKeywords);
    setSuggestedKeywords([]); // Clear suggested keywords after adding all
  };

  // Remove a keyword
  const removeKeyword = (keyword) => {
    setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
  };

  // Generate Ideas API Call
  const handleGenerateIdeas = async () => {
    let prompt = `Keywords: ${selectedKeywords.join(", ")}\n`;
    prompt += `Content Strategy: ${contentStrategy}\n`;
    prompt += `Goal: ${selectedGoal}\n`;
    prompt += `Target Audience: ${targetAudience}\n`;
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
            // Randomly select values from onboarding data
            const randomStrategy = getRandomElement(allContentStrategy);
            const randomType = getRandomElement(allContentTypes);
            const randomCluster = getRandomElement(allTopicClusters);
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
              idea:
                "Use these keywords when creating content: " +
                selectedKeywords.join(", "),
              dailyCombinationsJSON: {
                content_strategy:
                  randomStrategy?.strategy_name ||
                  randomStrategy ||
                  contentStrategy,
                content_type:
                  randomType?.type_name || randomType || selectedContentType,
                topic_cluster:
                  randomCluster?.cluster_name ||
                  randomCluster ||
                  selectedKeywords[0] ||
                  "",
                search_intent: randomIntent || selectedSearchIntent,
                tone: randomTone || tone,
                target_audience:
                  targetAudience || onboardingData.targetAudience,
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
          businessDetails: onboardingData.businessDetails,
          keywords: selectedKeywords,
          domain: onboardingData.domain,
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

  return (
    <div className="by-keyword">
      <h1 className="by-keyword__header">Generate Titles by Keywords</h1>

      {/* Main Keyword Input */}
      <div className="by-keyword__input-group">
        <label className="by-keyword__label">Enter a Keyword</label>
        <input
          type="text"
          className="by-keyword__input"
          value={manualKeyword}
          onChange={(e) => setManualKeyword(e.target.value)}
          placeholder="Type a keyword..."
        />
        <button className="by-keyword__add-button" onClick={addManualKeyword}>
          Add
        </button>
        <button
          className="by-keyword__fetch-related"
          onClick={fetchRelatedKeywords}
          disabled={!manualKeyword || loadingRelated}
        >
          {loadingRelated ? "Loading..." : "Find Related"}
        </button>
      </div>

      {/* Related Keywords - Updated onClick handler */}
      {relatedKeywords.length > 0 && (
        <div className="by-keyword__related-keywords">
          <h3 className="by-keyword__subheader">Related Keywords</h3>
          <div className="by-keyword__keyword-list">
            {relatedKeywords.map((keyword, index) => (
              <button
                key={index}
                className="by-keyword__keyword-button"
                onClick={() => addSuggestedKeyword(keyword, "related")}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Keywords - Updated to use suggestedKeywords state */}
      <div className="by-keyword__suggested-keywords">
        <h3 className="by-keyword__subheader">Suggested Keywords</h3>
        <button className="by-keyword__add-all-button" onClick={addAllKeywords}>
          Add All
        </button>
        <div className="by-keyword__keyword-list">
          {suggestedKeywords.map((keyword, index) => (
            <button
              key={index}
              className="by-keyword__keyword-button"
              onClick={() => addSuggestedKeyword(keyword, "suggested")}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>

      {/* Display Selected Keywords */}
      {selectedKeywords.length > 0 && (
        <div className="by-keyword__selected-keywords">
          <h3 className="by-keyword__subheader">Selected Keywords</h3>
          <div className="by-keyword__keyword-list">
            {selectedKeywords.map((keyword, index) => (
              <span key={index} className="by-keyword__selected-keyword">
                {keyword}{" "}
                <button
                  className="by-keyword__remove-keyword"
                  onClick={() => removeKeyword(keyword)}
                >
                  ✖
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Fields Toggle */}
      <button
        className="by-keyword__advanced-button"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "Hide Advanced Fields" : "Show Advanced Fields"}
      </button>

      {/* Advanced Fields */}
      {showAdvanced && (
        <div className="by-keyword__advanced-fields">
          <div className="by-keyword__input-group">
            <label className="by-keyword__label">Content Strategy</label>
            <select
              className="by-keyword__select"
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

          <div className="by-keyword__input-group">
            <label className="by-keyword__label">Content Type</label>
            <select
              className="by-keyword__select"
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

          <div className="by-keyword__input-group">
            <label className="by-keyword__label">Goal</label>
            <select
              className="by-keyword__select"
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
          <div className="by-keyword__input-group">
            <label className="by-keyword__label">Target Audience</label>
            <input
              type="text"
              className="by-keyword__input"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Type your target audience..."
            />
          </div>
          <div className="by-keyword__input-group">
            <label className="by-keyword__label">Search Intent</label>
            <select
              className="by-keyword__select"
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
          <div className="by-keyword__input-group">
            <label className="by-keyword__label">Tone</label>
            <select
              className="by-keyword__select"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
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
        </div>
      )}

      {/* Generate Button */}
      <button
        className="by-keyword__generate-button"
        onClick={handleGenerateIdeas}
      >
        Generate Ideas
      </button>

      {/* Error Message */}
      {error && <div className="by-keyword__error-message">{error}</div>}

      {/* Generated Ideas */}
      {ideas.length > 0 && (
        <div className="by-keyword__generated-ideas">
          <div className="ideas-header">
            <h2 className="by-keyword__subheader">Generated Ideas</h2>
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

          {editingIdea && (
            <div className="edit-idea-modal">
              <h3>Edit Idea</h3>
              <div className="edit-fields">
                <div className="edit-field">
                  <label>Content Strategy</label>
                  <select
                    value={
                      editingIdea.dailyCombinationsJSON.content_strategy || ""
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
                    <option value="">Select Content Strategy</option>
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
                  <label>Content Type</label>
                  <select
                    value={editingIdea.dailyCombinationsJSON.content_type || ""}
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
                    <option value="">Select Content Type</option>
                    {allContentTypes.map((type, idx) => (
                      <option key={idx} value={type.type_name || type}>
                        {type.type_name || type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keep other fields as they are */}
              </div>
              <button
                className="save-modification-button"
                onClick={(e) => handleSaveModification(e, editingIdea.id)}
              >
                Save
              </button>
            </div>
          )}

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

export default ByKeyword;
