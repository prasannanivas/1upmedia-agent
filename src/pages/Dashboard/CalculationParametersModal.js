import React, { useState } from "react";
import { X } from "lucide-react";
import "./CalculationParamsModal.css";

const CalculationParametersModal = ({ params, onClose, onApply }) => {
  const [editedParams, setEditedParams] = useState(
    JSON.parse(JSON.stringify(params))
  );

  // Define which parameters are editable by the user
  const editableParams = {
    // Public parameters that can be modified by users
    public: ["conversionRate", "discountRate"],
    // Regulatory parameters that can be viewed and modified with restrictions
    regulatory: ["recoveryRate", "horizonDays", "defaultAvgContentCost"],
    // Proprietary parameters are hidden from the UI
  };

  // Check if a parameter should be editable
  const isEditable = (field) => {
    return (
      editableParams.public.includes(field) ||
      editableParams.regulatory.includes(field)
    );
  };

  const handleInputChange = (section, field, value) => {
    // Only allow editing of public and regulatory parameters
    if (!isEditable(field)) return;

    // Convert string input to float for numerical values
    const numValue = parseFloat(value);
    const newValue = isNaN(numValue) ? value : numValue;

    setEditedParams((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: newValue,
      },
    }));
  };

  const handleReset = () => {
    setEditedParams(JSON.parse(JSON.stringify(params)));
  };

  const handleSave = () => {
    onApply(editedParams);
  };

  // Helper function to format field label
  const formatFieldLabel = (field) => {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/Ctr/gi, "CTR")
      .replace(/Cpa/gi, "CPA")
      .replace(/Aov/gi, "AOV")
      .replace(/Capex/gi, "CapEx");
  };

  // Parameter descriptions for tooltips
  const paramDescriptions = {
    conversionRate:
      "The percentage of website visitors who complete a purchase (industry standard)",
    discountRate:
      "Standard capital discount rate for future value calculations",
    recoveryRate:
      "Estimated percentage of theoretical value recoverable through optimization",
    horizonDays: "Estimated content lifespan in days for ROI calculations",
    defaultAvgContentCost: "Average cost to produce a single piece of content",
  };

  return (
    <div className="calculation-modal-overlay">
      <div className="calculation-modal">
        <div className="calculation-modal-header">
          <h2>Financial Calculation Parameters</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="calculation-modal-info">
          <p>
            This panel allows you to adjust the key financial parameters used in
            calculations. Only industry-standard and non-proprietary parameters
            can be modified.
          </p>
        </div>

        <div className="calculation-modal-body">
          {/* Show parameters grouped by category */}
          <div className="param-category">
            <h3>Core Business Parameters</h3>
            <div className="param-group">
              {/* Conversion Rate - appears in multiple sections */}
              <div className="param-field editable">
                <label
                  htmlFor="global-conversionRate"
                  title={paramDescriptions.conversionRate}
                >
                  Conversion Rate:
                  <span className="param-badge public">Public</span>
                </label>
                <input
                  id="global-conversionRate"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={editedParams.revenueLeak.conversionRate}
                  onChange={(e) => {
                    // Update conversion rate across all sections
                    const newValue = parseFloat(e.target.value);
                    if (isNaN(newValue)) return;

                    Object.keys(editedParams).forEach((section) => {
                      if (editedParams[section].conversionRate !== undefined) {
                        setEditedParams((prev) => ({
                          ...prev,
                          [section]: {
                            ...prev[section],
                            conversionRate: newValue,
                          },
                        }));
                      }
                    });
                  }}
                />
              </div>

              {/* Discount Rate - appears in multiple sections */}
              <div className="param-field editable">
                <label
                  htmlFor="global-discountRate"
                  title={paramDescriptions.discountRate}
                >
                  Discount Rate:
                  <span className="param-badge public">Public</span>
                </label>
                <input
                  id="global-discountRate"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={editedParams.revenueLeak.discountRate}
                  onChange={(e) => {
                    // Update discount rate across all sections
                    const newValue = parseFloat(e.target.value);
                    if (isNaN(newValue)) return;

                    Object.keys(editedParams).forEach((section) => {
                      if (editedParams[section].discountRate !== undefined) {
                        setEditedParams((prev) => ({
                          ...prev,
                          [section]: {
                            ...prev[section],
                            discountRate: newValue,
                          },
                        }));
                      }
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="param-category">
            <h3>Content Investment Parameters</h3>
            <div className="param-group">
              {/* Default Content Cost */}
              <div className="param-field editable">
                <label
                  htmlFor="global-defaultAvgContentCost"
                  title={paramDescriptions.defaultAvgContentCost}
                >
                  Content Production Cost:
                  <span className="param-badge public">Public</span>
                </label>
                <input
                  id="global-defaultAvgContentCost"
                  type="number"
                  step={1}
                  min={0}
                  value={editedParams.contentDecay.defaultAvgContentCost}
                  onChange={(e) => {
                    // Update default content cost across all sections
                    const newValue = parseFloat(e.target.value);
                    if (isNaN(newValue)) return;

                    Object.keys(editedParams).forEach((section) => {
                      if (
                        editedParams[section].defaultAvgContentCost !==
                        undefined
                      ) {
                        setEditedParams((prev) => ({
                          ...prev,
                          [section]: {
                            ...prev[section],
                            defaultAvgContentCost: newValue,
                          },
                        }));
                      }
                    });
                  }}
                />
              </div>

              {/* Horizon Days */}
              <div className="param-field editable">
                <label
                  htmlFor="global-horizonDays"
                  title={paramDescriptions.horizonDays}
                >
                  Content Lifespan (days):
                  <span className="param-badge public">Public</span>
                </label>
                <input
                  id="global-horizonDays"
                  type="number"
                  step={1}
                  min={1}
                  value={editedParams.revenueLeak.horizonDays}
                  onChange={(e) => {
                    // Update horizon days across all sections
                    const newValue = parseFloat(e.target.value);
                    if (isNaN(newValue)) return;

                    Object.keys(editedParams).forEach((section) => {
                      if (editedParams[section].horizonDays !== undefined) {
                        setEditedParams((prev) => ({
                          ...prev,
                          [section]: {
                            ...prev[section],
                            horizonDays: newValue,
                          },
                        }));
                      }
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="param-category">
            <h3>Recovery Parameters</h3>
            <div className="param-group">
              {/* Recovery Rate - per section since it might have different values */}
              {Object.entries(editedParams).map(([section, sectionParams]) => {
                if (sectionParams.recoveryRate !== undefined) {
                  return (
                    <div
                      className="param-field editable"
                      key={`${section}-recoveryRate`}
                    >
                      <label
                        htmlFor={`${section}-recoveryRate`}
                        title={paramDescriptions.recoveryRate}
                      >
                        {formatFieldLabel(section)} Recovery Rate:
                        <span className="param-badge regulatory">
                          Regulatory
                        </span>
                      </label>
                      <input
                        id={`${section}-recoveryRate`}
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        value={sectionParams.recoveryRate}
                        onChange={(e) =>
                          handleInputChange(
                            section,
                            "recoveryRate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          <div className="param-category proprietary-note">
            <h3>Proprietary Model Parameters</h3>
            <p>
              Advanced calculation parameters and proprietary coefficients are
              not exposed for editing to protect intellectual property. These
              parameters are maintained by the system based on our proprietary
              algorithm.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="reset-button" onClick={handleReset}>
            Reset to Default
          </button>
          <button className="save-button" onClick={handleSave}>
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculationParametersModal;
