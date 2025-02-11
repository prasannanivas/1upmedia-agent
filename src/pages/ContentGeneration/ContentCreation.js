import React, { useState, useEffect } from "react";
import { useToast } from "../../context/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select"; // Import React-Select
import {
  goals,
  searchIntents,
  contentTypes,
  contentStrategies,
  languages,
} from "../../Constants";

import "./ContentCreation.css";
import { usePoll } from "../../context/PollContext";

function ContentGenerator() {
  const [loading, setLoading] = useState(false);
  const { getUserLoginDetails } = useAuth();
  const { email } = getUserLoginDetails();
  const [numArticles, setNumArticles] = useState(1);
  const [keywords, setKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("Daily"); // Default to Daily
  const [links, setLinks] = useState([]); // Manage links
  const [linkInput, setLinkInput] = useState({ url: "", keyword: "" }); // Link Input
  const [formData, setFormData] = useState({
    topic: "",
    word_count: { value: "250", label: "250" },
    tone: { value: "Informative", label: "Informative" },
    goal: { value: "Random", label: "Random" },
    search_intent: { value: "Random", label: "Random" },
    content_type: { value: "Random", label: "Random" },
    content_strategy: { value: "Random", label: "Random" },
    language: { value: "English", label: "English" },
  });
  const { PositiveToast, NegativeToast } = useToast();

  const handleToast = (status, message) => {
    if (status === "positive") {
      PositiveToast(message);
    } else if (status === "negative") {
      NegativeToast(message);
    }
  };

  // Handle changes in React-Select
  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;

    setFormData((prevData) => ({
      ...prevData,
      [name]: selectedOption,
      ...(name === "content_type" && {
        content_type_prompt_template: contentTypes[selectedOption.value] || "",
      }),
    }));
  };

  // Add link
  const addLink = () => {
    if (linkInput.url && linkInput.keyword) {
      setLinks((prevLinks) => [
        ...prevLinks,
        `<a href="${linkInput.url}">${linkInput.keyword}</a>`,
      ]);
      setLinkInput({ url: "", keyword: "" });
    }
  };

  // Remove link
  const removeLink = (index) => {
    setLinks((prevLinks) => prevLinks.filter((_, i) => i !== index));
  };

  const { pollProgress, startPolling, stopPolling } = usePoll();

  useEffect(() => {
    pollProgress();
  }, [email]);

  const generateContent = async () => {
    setLoading(true);

    try {
      // Start polling immediately
      startPolling();

      const response = await fetch(
        "http://ai.1upmedia.com:3000/aiagent/generate-content",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            num_articles: numArticles,
            schedule_start_date: scheduleStartDate || Date.now(),
            schedule_frequency: scheduleFrequency,
            links: links.join(", "),
            ...formData,
            title: formData.topic,
            word_count: formData.word_count.value,
            tone: formData.tone.value,
            keywords,
            target_audience: targetAudience,
            goal: formData.goal.value,
            search_intent: formData.search_intent.value,
            content_type: formData.content_type.value,
            content_strategy: formData.content_strategy.value,
            language: formData.language.value,
          }),
        }
      );

      if (!response.ok) {
        handleToast("negative", "Failed to initiate content generation.");
        stopPolling(); // Stop polling if request fails
      }
    } catch (error) {
      console.error("Error generating content:", error);
      handleToast("negative", "Error generating content.");
      stopPolling(); // Stop polling on error
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="content-generator-container">
      <h2 className="title">Content Generator</h2>
      <div className="form-grid">
        {/* Number of Articles */}
        <label className="form-label">
          Number of Articles:
          <input
            type="number"
            value={numArticles}
            onChange={(e) => setNumArticles(e.target.value)}
            min={1}
            className="form-input"
          />
        </label>

        {/* Schedule Start Date */}
        <label className="form-label">
          Schedule Start Date:
          <input
            type="date"
            value={scheduleStartDate}
            onChange={(e) => setScheduleStartDate(e.target.value)}
            className="form-input"
          />
        </label>

        {/* Schedule Frequency */}
        <label className="form-label">
          Schedule Frequency:
          <select
            value={scheduleFrequency}
            onChange={(e) => setScheduleFrequency(e.target.value)}
            className="form-input"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </label>

        {/* Topic */}
        <label className="form-label">
          Topic:
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, topic: e.target.value }))
            }
            placeholder="Enter your topic"
            className="form-input"
          />
        </label>
        <label className="form-label">
          Keywords:
          <input
            type="text"
            name="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter your topic"
            className="form-input"
          />
        </label>
        <label className="form-label">
          Target Audience:
          <input
            type="text"
            name="target_audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Enter your topic"
            className="form-input"
          />
        </label>
        <label className="form-label">
          Goal:
          <Select
            name="goal"
            options={[
              { value: "Random", label: "Random" },
              ...goals.map((goal) => ({ value: goal, label: goal })),
            ]}
            value={formData.goal}
            onChange={handleSelectChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </label>
        {/* Word Count */}
        <label className="form-label">
          Word Count:
          <Select
            name="word_count"
            options={[
              { value: "250", label: "250" },
              { value: "500", label: "500" },
              { value: "750", label: "750" },
              { value: "1000", label: "1000" },
            ]}
            value={formData.word_count}
            onChange={handleSelectChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </label>
        <label className="form-label">
          Search Intent:
          <Select
            name="search_intent"
            options={[{ value: "Random", label: "Random" }, ...searchIntents]}
            value={formData.search_intent}
            onChange={handleSelectChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </label>
        <label className="form-label">
          Content Type:
          <Select
            name="content_type"
            options={[
              { value: "Random", label: "Random" },
              ...Object.keys(contentTypes).map((type) => ({
                value: type,
                label: type,
              })),
            ]}
            value={formData.content_type}
            onChange={handleSelectChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </label>
        <label className="form-label">
          Content Strategy:
          <Select
            name="content_strategy"
            options={[{ value: "Random", label: "Random" }].concat(
              contentStrategies.flatMap((group) =>
                group.subgroups.map((subgroup) => ({
                  value: subgroup.value,
                  label: `${group.group} - ${subgroup.label}`,
                }))
              )
            )}
            value={formData.content_strategy}
            onChange={handleSelectChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </label>
        {/* Tone */}
        <label className="form-label">
          Tone:
          <Select
            name="tone"
            options={[
              { value: "Informative", label: "Informative" },
              { value: "Critical", label: "Critical" },
              { value: "Romantic", label: "Romantic" },
              { value: "Casual", label: "Casual" },
              { value: "Formal", label: "Formal" },
              { value: "Persuasive", label: "Persuasive" },
              { value: "Neutral", label: "Neutral" },
            ]}
            value={formData.tone}
            onChange={handleSelectChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </label>
        <label className="form-label">
          Language:
          <Select
            name="language"
            options={languages.map((lang) => ({ value: lang, label: lang }))}
            value={formData.language}
            onChange={handleSelectChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </label>
        {/* Links Section */}
        <label className="form-label">
          Links:
          <div className="link-input-group">
            <input
              type="text"
              placeholder="URL"
              value={linkInput.url}
              onChange={(e) =>
                setLinkInput((prev) => ({ ...prev, url: e.target.value }))
              }
              className="form-input"
            />
            <input
              type="text"
              placeholder="Keyword"
              value={linkInput.keyword}
              onChange={(e) =>
                setLinkInput((prev) => ({ ...prev, keyword: e.target.value }))
              }
              className="form-input"
            />
            <button onClick={addLink} className="add-link-button">
              Add
            </button>
          </div>
          {links.length > 0 && (
            <ul className="links-list">
              {links.map((link, index) => (
                <li key={index} className="link-item">
                  <span dangerouslySetInnerHTML={{ __html: link }} />
                  <button
                    onClick={() => removeLink(index)}
                    className="remove-link-button"
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
      </div>

      <button
        onClick={generateContent}
        disabled={loading}
        className="generate-button"
      >
        {loading ? "Generating..." : `Generate ${numArticles} Article(s)`}
      </button>
    </div>
  );
}

export default ContentGenerator;
