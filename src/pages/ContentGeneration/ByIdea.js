import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ByIdea.css";

const ByIdea = () => {
  const [idea, setIdea] = useState("");
  const [keywords, setKeywords] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [error, setError] = useState(null);

  // Fetch Dropdown Options
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const email = "test@1upmedia.com"; // Replace with dynamic email if needed
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
        setError("Failed to fetch dropdown options. Please try again.");
      }
    };

    fetchDropdownOptions();
  }, []);

  // Generate Titles API Call
  const handleGenerateTitles = async () => {
    let prompt = `Main title: ${idea}\n`;
    prompt += `Content Strategy: ${contentStrategy}\n`;
    prompt += `Goal: ${selectedGoal}\n`;
    prompt += `Target Audience: ${targetAudience}\n`;
    prompt += `Keywords: ${keywords}\n`;
    prompt += `Search Intent: ${selectedSearchIntent}\n`;
    prompt += `Tone: ${tone}\n`;
    prompt += `Content Type: ${selectedContentType}\n\n`;

    const apiUrl = "https://ai.1upmedia.com:443/get-preview-titles";
    const postData = {
      count: 10,
      prompt,
    };

    try {
      const response = await axios.post(apiUrl, postData, {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
      });

      const titlesData = response.data;
      if (titlesData?.titles) {
        const parseTitles = (titlesString) => {
          return [...titlesString.matchAll(/\d+\.\s*"([^"]+)"/g)].map((match) =>
            match[1].trim()
          );
        };

        const titlesArray = parseTitles(titlesData.titles);
        console.log(titlesArray);
        setGeneratedTitles(titlesArray);
      } else {
        setError("No titles generated. Please refine your inputs.");
      }
    } catch (error) {
      setError("Failed to fetch titles. Please try again.");
    }
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
              {dropdownOptions.content_strategies.map((strategy, index) => (
                <option key={index} value={strategy.value}>
                  {strategy.label}
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
              {dropdownOptions.content_templates.map((type, index) => (
                <option key={index} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button className="generate-button" onClick={handleGenerateTitles}>
        Generate Titles
      </button>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Generated Titles */}
      {generatedTitles.length > 0 && (
        <div className="generated-titles">
          <h2>Generated Titles:</h2>
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

export default ByIdea;
