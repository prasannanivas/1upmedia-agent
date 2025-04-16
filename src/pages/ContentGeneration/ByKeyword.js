import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ByKeyword.css";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";

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

  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [error, setError] = useState(null);

  const [relatedKeywords, setRelatedKeywords] = useState([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState(
    onboardingData.keywords || []
  );
  const [loadingRelated, setLoadingRelated] = useState(false);

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

  // Generate Titles API Call
  const handleGenerateTitles = async () => {
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
        ].map((match) => match[1].trim());
        setGeneratedTitles(titlesArray);
      } else {
        setError("No titles generated. Please refine your inputs.");
      }
    } catch (error) {
      setError("Failed to fetch titles. Please try again.");
    }
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
              {dropdownOptions.content_strategies.map((strategy, index) => (
                <option key={index} value={strategy.value}>
                  {strategy.label}
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
          <div className="by-keyword__input-group">
            <label className="by-keyword__label">Content Type</label>
            <select
              className="by-keyword__select"
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
            >
              <option value="">Select Content Type</option>
              {dropdownOptions.content_templates.map((type, index) => (
                <option key={index} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        className="by-keyword__generate-button"
        onClick={handleGenerateTitles}
      >
        Generate Titles
      </button>

      {/* Error Message */}
      {error && <div className="by-keyword__error-message">{error}</div>}

      {/* Generated Titles */}
      {generatedTitles.length > 0 && (
        <div className="by-keyword__generated-titles">
          <h2 className="by-keyword__subheader">Generated Titles:</h2>
          <ul>
            {generatedTitles.map((title, index) => (
              <li key={index}>{title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ByKeyword;
