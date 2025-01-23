import React, { useState, useEffect } from "react";
import "./Ideation.css"; // Import the custom CSS
import { useAuth } from "../context/AuthContext";

function TemplateManager() {
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedTemplates, setUpdatedTemplates] = useState(null);
  const [expandedSection, setExpandedSection] = useState(""); // Track expanded section
  const { getUserLoginDetails } = useAuth();
  const { email } = getUserLoginDetails();

  // Fetch templates from the server
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/aiagent/pipeline-templates/${email}`
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
        "http://localhost:3000/aiagent/pipeline-templates",
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
    <div className="template-manager-container">
      <h1 className="template-title">Manage Your Templates</h1>

      {/* Goals Section */}
      <div className="template-card">
        <div
          className="template-card-header"
          onClick={() => toggleSection("goals")}
        >
          <h2>Goals</h2>
          <span>{expandedSection === "goals" ? "▲" : "▼"}</span>
        </div>
        {expandedSection === "goals" && (
          <div className="template-card-body">
            {updatedTemplates.goals.map((goal, index) => (
              <div key={index} className="template-item">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) =>
                    updateArrayValue("goals", index, e.target.value)
                  }
                  placeholder="Add a goal..."
                  className="template-input"
                />
                <button
                  onClick={() => removeFromArray("goals", index)}
                  className="remove-button"
                >
                  ✖
                </button>
              </div>
            ))}
            <button onClick={() => addToArray("goals")} className="add-button">
              + Add Goal
            </button>
          </div>
        )}
      </div>

      {/* Search Intents Section */}
      <div className="template-card">
        <div
          className="template-card-header"
          onClick={() => toggleSection("search_intents")}
        >
          <h2>Search Intents</h2>
          <span>{expandedSection === "search_intents" ? "▲" : "▼"}</span>
        </div>
        {expandedSection === "search_intents" && (
          <div className="template-card-body">
            {updatedTemplates.search_intents.map((intent, index) => (
              <div key={index} className="template-item">
                <input
                  type="text"
                  value={intent}
                  onChange={(e) =>
                    updateArrayValue("search_intents", index, e.target.value)
                  }
                  placeholder="Add a search intent..."
                  className="template-input"
                />
                <button
                  onClick={() => removeFromArray("search_intents", index)}
                  className="remove-button"
                >
                  ✖
                </button>
              </div>
            ))}
            <button
              onClick={() => addToArray("search_intents")}
              className="add-button"
            >
              + Add Search Intent
            </button>
          </div>
        )}
      </div>

      {/* Content Types Section */}
      <div className="template-card">
        <div
          className="template-card-header"
          onClick={() => toggleSection("content_templates")}
        >
          <h2>Content Types</h2>
          <span>{expandedSection === "content_templates" ? "▲" : "▼"}</span>
        </div>
        {expandedSection === "content_templates" && (
          <div className="template-card-body">
            {Object.entries(updatedTemplates.content_templates).map(
              ([key, value]) => (
                <div key={key} className="template-item content-type-item">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) =>
                      updateContentType(key, e.target.value, value)
                    }
                    placeholder="Key"
                    className="content-key-input"
                  />
                  <textarea
                    value={value}
                    onChange={(e) =>
                      updateContentType(key, key, e.target.value)
                    }
                    placeholder="Template"
                    className="content-value-textarea"
                  ></textarea>
                  <button
                    onClick={() => removeContentType(key)}
                    className="remove-button"
                  >
                    ✖
                  </button>
                </div>
              )
            )}
            <button onClick={addContentType} className="add-button">
              + Add Content Type
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button onClick={saveTemplates} className="save-button">
        Save Templates
      </button>
    </div>
  );
}

export default TemplateManager;
