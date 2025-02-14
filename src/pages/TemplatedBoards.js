import React, { useState } from "react";
import DisplayPreviewTitles from "../components/DisplayPreviewTitles";
import TemplateSelection from "./TemplateSelection";
import "./PreviewTemplatesContainer.css";

const PreviewTemplatesContainer = () => {
  // State to store preview titles that the user has selected
  const [selectedPreviewTitles, setSelectedPreviewTitles] = useState([]);
  // Controls whether the TemplateSelection component is shown
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);

  // Callback from DisplayPreviewTitles when "Preview Templates" is clicked
  const handlePreviewTemplates = (selectedTitles) => {
    // Save the selected preview titles if you need them later
    setSelectedPreviewTitles(selectedTitles);
    // Then, show the TemplateSelection component
    setShowTemplateSelection(true);
  };

  // (Optional) Callback when "Generate Content Directly" is clicked
  const handleGenerateContent = (selectedTitles) => {
    console.log("Generate content with:", selectedTitles);
    // ...implement your content generation logic here.
  };

  return (
    <div className="preview-templates-container">
      <DisplayPreviewTitles
        previewTitles={[
          "Hyderabad: Not Named After Hyder Ali",
          "The True Origin of Hyderabad's Name",
          "Hyderabad's Name: A Misconception Explained",
          "Unveiling the Name Origin of Hyderabad",
          "Is Hyderabad Linked to Hyder Ali? Fact vs. Fiction",
        ]}
        onGenerateContent={handleGenerateContent}
        onPreviewTemplates={handlePreviewTemplates}
      />

      {showTemplateSelection && (
        <div className="template-selection-wrapper">
          <TemplateSelection />
        </div>
      )}
    </div>
  );
};

export default PreviewTemplatesContainer;
