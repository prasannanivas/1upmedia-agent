import React, { useState } from "react";
import "./BytitleAndSubheading.css";

function BytitleAndSubheadings() {
  const [mainTitle, setMainTitle] = useState("");
  const [subHeadings, setSubHeadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  // Replace with your actual API key or retrieve it from a secure place.
  const apiKey = "YOUR_API_KEY_HERE";

  // Add a new subheading block (default expanded)
  const handleAddSubheading = () => {
    setSubHeadings([
      ...subHeadings,
      {
        id: Date.now(),
        subheading: "",
        wordCount: 100,
        includeImage: false,
        images: [],
        prompt: "",
        expanded: true,
      },
    ]);
  };

  // Remove a subheading block by id
  const handleRemoveSubheading = (id) => {
    setSubHeadings(subHeadings.filter((sub) => sub.id !== id));
  };

  // Toggle a subheading block's expanded/collapsed state
  const handleToggleSubheading = (id) => {
    setSubHeadings(
      subHeadings.map((sub) =>
        sub.id === id ? { ...sub, expanded: !sub.expanded } : sub
      )
    );
  };

  // Generic update handler for subheading fields
  const handleSubheadingChange = (e, id, field) => {
    const value = field === "includeImage" ? e.target.checked : e.target.value;
    setSubHeadings(
      subHeadings.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              [field]: field === "wordCount" ? parseInt(value, 10) || 0 : value,
            }
          : sub
      )
    );
  };

  // Update image URL for a specific image input
  const handleImageUrlChange = (e, id, index) => {
    const value = e.target.value;
    setSubHeadings(
      subHeadings.map((sub) => {
        if (sub.id === id) {
          const newImages = [...sub.images];
          newImages[index] = value;
          return { ...sub, images: newImages };
        }
        return sub;
      })
    );
  };

  // Add an empty image URL field for a subheading
  const handleAddImage = (id) => {
    setSubHeadings(
      subHeadings.map((sub) => {
        if (sub.id === id) {
          return { ...sub, images: [...sub.images, ""] };
        }
        return sub;
      })
    );
  };

  // Build the prompt from the UI fields
  const buildPrompt = () => {
    let prompt = `Generate content based on the following details:\n\nMain Title: ${mainTitle}\n\n`;
    subHeadings.forEach((sub, index) => {
      prompt += `Subheading ${index + 1}: ${sub.subheading || "N/A"}\n`;
      prompt += `Word Count: ${sub.wordCount}\n`;
      if (sub.includeImage) {
        prompt += `Image URLs: ${
          sub.images && sub.images.length > 0 ? sub.images.join(", ") : "None"
        }\n`;
      }
      if (sub.prompt && sub.prompt.trim() !== "") {
        prompt += `Additional Prompt: ${sub.prompt}\n`;
      }
      prompt += "\n";
    });
    return prompt;
  };

  // When "Generate" is clicked, build prompt, set loading state, and fetch generated content.
  const handleGenerate = async () => {
    const uiPrompt = buildPrompt();

    // Prepend extra instructions for HTML output.
    const extraInstruction =
      "Generate it in HTML format without any extra introductory texts so that I can directly display it. ";
    const finalPrompt = extraInstruction + uiPrompt;

    setLoading(true);
    setGeneratedContent(""); // Clear previous content (if any)

    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/generate-content-by-subheadings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: finalPrompt, apiKey }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to generate content");
      }
      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (error) {
      console.error("Error generating content: ", error);
      alert("Error generating content: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="btas-container">
      <h1 className="btas-main-title">Content Generator</h1>

      {/* Main Title Input */}
      <div className="btas-form-group">
        <label htmlFor="btas-mainTitle" className="btas-label">
          Enter the main title
        </label>
        <input
          id="btas-mainTitle"
          type="text"
          value={mainTitle}
          onChange={(e) => setMainTitle(e.target.value)}
          placeholder="Enter the main title"
          className="btas-input"
        />
      </div>

      {/* Subheadings Section */}
      <div className="btas-subheading-section">
        <h2 className="btas-section-title">Sub Headings</h2>
        {subHeadings.map((sub, index) => (
          <div
            key={sub.id}
            className={`btas-subheading-block btas-subheading-block-${
              index % 3
            }`}
          >
            <div className="btas-subheading-header">
              <span className="btas-subheading-title">
                {sub.subheading ? sub.subheading : "New Subheading"}
              </span>
              <button
                type="button"
                onClick={() => handleToggleSubheading(sub.id)}
                className="btas-toggle-btn"
              >
                {sub.expanded ? "Collapse" : "Expand"}
              </button>
            </div>

            {sub.expanded && (
              <div className="btas-subheading-content">
                <div className="btas-form-group">
                  <label className="btas-label">Sub Heading</label>
                  <input
                    type="text"
                    value={sub.subheading}
                    onChange={(e) =>
                      handleSubheadingChange(e, sub.id, "subheading")
                    }
                    placeholder="Enter subheading"
                    className="btas-input"
                  />
                </div>

                <div className="btas-form-group">
                  <label className="btas-label">Word Count</label>
                  <input
                    type="number"
                    value={sub.wordCount}
                    onChange={(e) =>
                      handleSubheadingChange(e, sub.id, "wordCount")
                    }
                    className="btas-input"
                  />
                </div>

                <div className="btas-form-group btas-checkbox-group">
                  <input
                    type="checkbox"
                    checked={sub.includeImage}
                    onChange={(e) =>
                      handleSubheadingChange(e, sub.id, "includeImage")
                    }
                    className="btas-checkbox"
                    id={`btas-includeImage-${sub.id}`}
                  />
                  <label
                    htmlFor={`btas-includeImage-${sub.id}`}
                    className="btas-label"
                  >
                    Include Image
                  </label>
                </div>

                {/* Image URLs Section */}
                {sub.includeImage && (
                  <div className="btas-images-section">
                    <label className="btas-label">Image URLs:</label>
                    {sub.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="btas-form-group btas-image-group"
                      >
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => handleImageUrlChange(e, sub.id, idx)}
                          placeholder="Enter image URL"
                          className="btas-input"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddImage(sub.id)}
                      className="btas-add-image-btn"
                    >
                      + Add Image URL
                    </button>
                  </div>
                )}

                <div className="btas-form-group">
                  <label className="btas-label">Optional Prompt</label>
                  <textarea
                    value={sub.prompt}
                    onChange={(e) =>
                      handleSubheadingChange(e, sub.id, "prompt")
                    }
                    placeholder="Enter optional prompt"
                    className="btas-textarea"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSubheading(sub.id)}
                  className="btas-remove-btn"
                >
                  Remove Subheading
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddSubheading}
          className="btas-add-subheading-btn"
        >
          + Add Subheading
        </button>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        className="btas-generate-btn"
        disabled={loading}
      >
        {loading ? "Loading..." : "Generate"}
      </button>

      {/* Display generated content (if any) */}
      {generatedContent && (
        <div className="btas-generated-content">
          <h2 className="btas-section-title">Generated Content</h2>
          <div
            className="btas-content-display"
            dangerouslySetInnerHTML={{ __html: generatedContent }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default BytitleAndSubheadings;
