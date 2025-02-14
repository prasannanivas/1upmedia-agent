import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./TemplateSelection.css";
import { templates } from "../Templates";

const TemplateSelection = () => {
  const [wordCount, setWordCount] = useState("templates_250"); // Default to 250
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExample, setShowExample] = useState(false);

  const currentTemplates = templates[wordCount];

  return (
    <div className="template-selection-container">
      {/* Word Count Dropdown */}
      <div className="template-selection-dropdown-container">
        <label>Select Word Count:</label>
        <select
          value={wordCount}
          onChange={(e) => {
            setWordCount(e.target.value);
            setCurrentIndex(0);
            setShowExample(false); // Reset example view
          }}
        >
          <option value="templates_250">250 Words</option>
          <option value="templates_500">500 Words</option>
          <option value="templates_1000">1000 Words</option>
        </select>
      </div>

      <div className="template-selection-action-buttons">
        <button
          className="template-selection-use-button"
          onClick={() => alert("Template Used!")}
        >
          Use This Template
        </button>
        <button
          className="template-selection-toggle-button"
          onClick={() => setShowExample(!showExample)}
        >
          {showExample ? "Show Structure" : "Show Example"}
        </button>
      </div>

      {/* Main Layout */}
      <div className="template-selection-main">
        {/* Previous Button */}
        <button
          className="template-selection-nav-button"
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === 0 ? currentTemplates.length - 1 : prev - 1
            )
          }
        >
          ◀ Prev
        </button>

        {/* Template Card */}
        <div className="template-selection-card-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={showExample ? "example" : "structure"}
              className="template-selection-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <h3>{currentTemplates[currentIndex].template_title}</h3>
              <div
                className="template-selection-content"
                dangerouslySetInnerHTML={{
                  __html: showExample
                    ? currentTemplates[currentIndex].example
                    : currentTemplates[currentIndex].template_structure,
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
        </div>

        {/* Next Button */}
        <button
          className="template-selection-nav-button"
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === currentTemplates.length - 1 ? 0 : prev + 1
            )
          }
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};

export default TemplateSelection;
