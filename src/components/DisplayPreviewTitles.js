import React, { useState, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "framer-motion";
import CustomDragLayer from "./CustomDragLayer";
import "./PreviewTitlesAndTemplates.css";
import { templates } from "../Templates";

// Draggable item for added templates (from the draggable list)
const DraggableAddedTemplate = ({ templateItem }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "TEMPLATE",
      item: { templateName: templateItem.templateName },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [templateItem]
  );

  return (
    <div
      ref={drag}
      className="draggable-added-template"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {templateItem.templateName} - {templateItem.wordCount}
    </div>
  );
};
// Drop zone for each row in the preview titles table
const TemplateDropZone = ({ assigned, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "TEMPLATE",
    drop: (item) => onDrop(item.templateName),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));
  return (
    <div
      ref={drop}
      className={`template-drop-zone ${isOver && canDrop ? "hover" : ""}`}
    >
      {assigned || "Random"}
    </div>
  );
};

// Available Templates Section – similar to your previous TemplateSelection UI,
// but without draggable behavior. Instead, it has an "Add Template" button.
const AvailableTemplateSelection = ({ onAddTemplate }) => {
  const [wordCount, setWordCount] = useState("templates_250");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const currentTemplates = templates[wordCount];

  return (
    <div className="template-selection-container">
      <div className="template-selection-dropdown-container">
        <label>Select Word Count:</label>
        <select
          value={wordCount}
          onChange={(e) => {
            setWordCount(e.target.value);
            setCurrentIndex(0);
            setShowExample(false);
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
          onClick={() =>
            onAddTemplate(currentTemplates[currentIndex], wordCount)
          }
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

      <div className="template-selection-main">
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
        </div>

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

const DisplayPreviewTitles = ({
  previewTitles = [],
  onGenerateContent = () => {},
}) => {
  // Mapping from preview title index to assigned template name.
  const [assignedTemplates, setAssignedTemplates] = useState({});
  // Draggable templates (added by the user)
  const [draggableTemplates, setDraggableTemplates] = useState([]);
  // Refs for scrolling (if needed)
  const draggableRef = useRef(null);
  const previewRef = useRef(null);
  const availableRef = useRef(null);

  // (Optional) You can add scrolling logic here as needed.

  const handleDrop = (index, templateName) => {
    setAssignedTemplates((prev) => ({ ...prev, [index]: templateName }));
  };

  const handleGenerateContent = () => {
    const contentData = previewTitles.map((title, index) => ({
      previewTitle: title,
      assignedTemplate: assignedTemplates[index] || "Random",
    }));
    if (onGenerateContent) {
      onGenerateContent(contentData);
    } else {
      console.log("Generate content with:", contentData);
    }
  };

  // Add template from the available templates section to the draggable list.
  const addTemplate = (template, wordCount) => {
    const itemId = `${template.template_title}-${wordCount}`;
    if (draggableTemplates.some((item) => item.id === itemId)) {
      return;
    }
    const newItem = {
      id: itemId,
      templateName: template.template_title,
      wordCount,
    };
    setDraggableTemplates((prev) => [...prev, newItem]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer />
      <div className="preview-template-board-container">
        {/* Preview Titles Table */}
        <div className="preview-titles-table" ref={previewRef}>
          <h2 className="table-heading">Preview Titles</h2>
          <table className="preview-table">
            <thead>
              <tr>
                <th className="preview-title-column">Preview Title</th>
                <th className="template-column">Template</th>
              </tr>
            </thead>
            <tbody>
              {previewTitles.map((title, index) => (
                <tr key={index}>
                  <td className="preview-title-cell">{title}</td>
                  <td className="template-cell">
                    <TemplateDropZone
                      assigned={assignedTemplates[index]}
                      onDrop={(templateName) => handleDrop(index, templateName)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-actions">
            <button className="action-button" onClick={handleGenerateContent}>
              Generate Content Directly
            </button>
          </div>
        </div>
        {/* Draggable Templates List */}
        {draggableTemplates.length > 0 && (
          <div className="draggable-templates-container" ref={draggableRef}>
            <h2 className="draggable-templates-heading">
              Added Templates (Drag to assign)
            </h2>
            <div className="draggable-templates-list">
              {draggableTemplates.map((item) => (
                <DraggableAddedTemplate key={item.id} templateItem={item} />
              ))}
            </div>
          </div>
        )}
        {/* Available Templates Section */}
        <div className="available-templates-container" ref={availableRef}>
          <AvailableTemplateSelection onAddTemplate={addTemplate} />
        </div>
      </div>
    </DndProvider>
  );
};

export default DisplayPreviewTitles;
