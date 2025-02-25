import React, { useState, useEffect } from "react";
import "./StepContentStrategy.css"; // Import the custom CSS
import { useAuth } from "../../../context/AuthContext";
import "./StepBusinessDetails.css";

function TemplateManager() {
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedTemplates, setUpdatedTemplates] = useState(null);
  const [expandedSection, setExpandedSection] = useState(""); // Track expanded section
  const { getUserLoginDetails } = useAuth();
  const { email } = getUserLoginDetails();

  const [tempKeys, setTempKeys] = useState(
    Object.fromEntries(
      Object.entries(updatedTemplates?.content_templates || {})
    )
  );

  // Function to update the temp key state
  const handleTempKeyChange = (oldKey, newKey) => {
    setTempKeys((prev) => ({ ...prev, [oldKey]: newKey }));
  };

  // Function to commit changes when input loses focus
  const handleCommitKeyChange = (oldKey) => {
    updateContentType(
      oldKey,
      tempKeys[oldKey],
      updatedTemplates.content_templates[oldKey]
    );
  };

  // Fetch templates from the server
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(
          `https://ai.1upmedia.com:443/aiagent/pipeline-templates/${email}`
        );
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates);
          setUpdatedTemplates(JSON.parse(JSON.stringify(data.templates))); // Deep clone for editing
        } else {
          console.error("Failed to fetch templates.");
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [email]);

  // Toggle card expansion
  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? "" : section));
  };

  // Add, Remove, and Update Handlers
  const addToArray = (section) => {
    setUpdatedTemplates((prev) => ({
      ...prev,
      [section]: [...prev[section], ""],
    }));
  };

  const removeFromArray = (section, index) => {
    setUpdatedTemplates((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const updateArrayValue = (section, index, value) => {
    setUpdatedTemplates((prev) => {
      const updatedSection = [...prev[section]];
      updatedSection[index] = value;
      return { ...prev, [section]: updatedSection };
    });
  };

  const addContentType = () => {
    setUpdatedTemplates((prev) => ({
      ...prev,
      content_templates: { ...prev.content_templates, "": "" },
    }));
  };

  const updateContentType = (key, newKey, newValue) => {
    setUpdatedTemplates((prev) => {
      const updatedContentTemplates = { ...prev.content_templates };

      // Only update the value if the key remains unchanged
      if (key === newKey) {
        updatedContentTemplates[key] = newValue;
      } else {
        // Update the key and preserve the value
        updatedContentTemplates[newKey] = newValue;
        delete updatedContentTemplates[key];
      }

      return { ...prev, content_templates: updatedContentTemplates };
    });
  };

  const removeContentType = (key) => {
    setUpdatedTemplates((prev) => {
      const updatedContentTemplates = { ...prev.content_templates };
      delete updatedContentTemplates[key];
      return { ...prev, content_templates: updatedContentTemplates };
    });
  };

  const saveTemplates = async () => {
    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/pipeline-templates",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, templates: updatedTemplates }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
        alert("Templates updated successfully!");
      } else {
        console.error("Failed to save templates.");
      }
    } catch (error) {
      console.error("Error saving templates:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="step-content-strategy">
      <h1 className="step-content-strategy__title">Manage Your Templates</h1>

      {/* Goals Section */}
      <div className="step-content-strategy__card">
        <div
          className="step-content-strategy__card-header"
          onClick={() => toggleSection("goals")}
        >
          <h2>Goals</h2>
          <span>{expandedSection === "goals" ? "▲" : "▼"}</span>
        </div>
        {expandedSection === "goals" && (
          <div className="step-content-strategy__card-body">
            {updatedTemplates.goals.map((goal, index) => (
              <div key={index} className="step-content-strategy__item">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) =>
                    updateArrayValue("goals", index, e.target.value)
                  }
                  placeholder="Add a goal..."
                  className="step-content-strategy__input"
                />
                <button
                  onClick={() => removeFromArray("goals", index)}
                  className="step-content-strategy__remove-button"
                >
                  ✖
                </button>
              </div>
            ))}
            <button
              onClick={() => addToArray("goals")}
              className="step-content-strategy__add-button"
            >
              + Add Goal
            </button>
          </div>
        )}
      </div>

      {/* Search Intents Section */}
      <div className="step-content-strategy__card">
        <div
          className="step-content-strategy__card-header"
          onClick={() => toggleSection("search_intents")}
        >
          <h2>Search Intents</h2>
          <span>{expandedSection === "search_intents" ? "▲" : "▼"}</span>
        </div>
        {expandedSection === "search_intents" && (
          <div className="step-content-strategy__card-body">
            {updatedTemplates.search_intents.map((intent, index) => (
              <div key={index} className="step-content-strategy__item">
                <input
                  type="text"
                  value={intent}
                  onChange={(e) =>
                    updateArrayValue("search_intents", index, e.target.value)
                  }
                  placeholder="Add a search intent..."
                  className="step-content-strategy__input"
                />
                <button
                  onClick={() => removeFromArray("search_intents", index)}
                  className="step-content-strategy__remove-button"
                >
                  ✖
                </button>
              </div>
            ))}
            <button
              onClick={() => addToArray("search_intents")}
              className="step-content-strategy__add-button"
            >
              + Add Search Intent
            </button>
          </div>
        )}
      </div>

      {/* Content Types Section */}
      <div className="step-content-strategy__card">
        <div
          className="step-content-strategy__card-header"
          onClick={() => toggleSection("content_templates")}
        >
          <h2>Content Types</h2>
          <span>{expandedSection === "content_templates" ? "▲" : "▼"}</span>
        </div>
        {expandedSection === "content_templates" && (
          <div className="step-content-strategy__card-body">
            {Object.entries(updatedTemplates.content_templates).map(
              ([key, value]) => (
                <div
                  key={key} // Keep key unchanged to avoid re-rendering issues
                  className="step-content-strategy__item step-content-strategy__content-type"
                >
                  {/* Edit Key Input */}
                  <input
                    type="text"
                    value={tempKeys[key] || key} // Use tempKeys state
                    onChange={(e) => handleTempKeyChange(key, e.target.value)} // Update only in state
                    onBlur={() => handleCommitKeyChange(key)} // Commit only onBlur
                    placeholder="Key"
                    className="step-content-strategy__content-key-input"
                  />

                  {/* Edit Value Textarea */}
                  <textarea
                    defaultValue={value} // Use defaultValue to avoid frequent re-renders
                    onBlur={(e) =>
                      updateContentType(
                        tempKeys[key] || key,
                        tempKeys[key] || key,
                        e.target.value
                      )
                    } // Update only on blur
                    placeholder="Template"
                    className="step-content-strategy__content-value-textarea"
                  ></textarea>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeContentType(key)}
                    className="step-content-strategy__remove-button"
                  >
                    ✖
                  </button>
                </div>
              )
            )}

            <button
              onClick={addContentType}
              className="step-content-strategy__add-button"
            >
              + Add Content Type
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={saveTemplates}
        className="step-content-strategy__save-button"
      >
        Save Templates
      </button>
    </div>
  );
}

export default TemplateManager;
