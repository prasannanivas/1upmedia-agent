import React, { useState } from "react";
import { X } from "lucide-react";
import "./CalculationParamsModal.css";

const CalculationParametersModal = ({ params, onClose, onApply }) => {
  const [editedParams, setEditedParams] = useState(
    JSON.parse(JSON.stringify(params))
  );

  const handleInputChange = (section, field, value) => {
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

  return (
    <div className="calculation-modal-overlay">
      <div className="calculation-modal">
        <div className="calculation-modal-header">
          <h2>Financial Calculation Parameters</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="calculation-modal-body">
          {/* Revenue Leak Parameters */}
          <div className="param-section">
            <h3>Revenue Leak Settings</h3>
            <div className="param-group">
              {Object.entries(editedParams.revenueLeak).map(
                ([field, value]) => (
                  <div className="param-field" key={`revenueLeak-${field}`}>
                    <label htmlFor={`revenueLeak-${field}`}>
                      {formatFieldLabel(field)}:
                    </label>
                    <input
                      id={`revenueLeak-${field}`}
                      type="number"
                      step={value < 1 ? 0.01 : 1}
                      value={value}
                      onChange={(e) =>
                        handleInputChange("revenueLeak", field, e.target.value)
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Content Decay Parameters */}
          <div className="param-section">
            <h3>Content Decay Settings</h3>
            <div className="param-group">
              {Object.entries(editedParams.contentDecay).map(
                ([field, value]) => (
                  <div className="param-field" key={`contentDecay-${field}`}>
                    <label htmlFor={`contentDecay-${field}`}>
                      {formatFieldLabel(field)}:
                    </label>
                    <input
                      id={`contentDecay-${field}`}
                      type="number"
                      step={value < 1 ? 0.01 : 1}
                      value={value}
                      onChange={(e) =>
                        handleInputChange("contentDecay", field, e.target.value)
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Keyword Mismatch Parameters */}
          <div className="param-section">
            <h3>Keyword Mismatch Settings</h3>
            <div className="param-group">
              {Object.entries(editedParams.keywordMismatch).map(
                ([field, value]) => (
                  <div className="param-field" key={`keywordMismatch-${field}`}>
                    <label htmlFor={`keywordMismatch-${field}`}>
                      {formatFieldLabel(field)}:
                    </label>
                    <input
                      id={`keywordMismatch-${field}`}
                      type="number"
                      step={value < 1 ? 0.01 : 1}
                      value={value}
                      onChange={(e) =>
                        handleInputChange(
                          "keywordMismatch",
                          field,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Link Dilution Parameters */}
          <div className="param-section">
            <h3>Link Dilution Settings</h3>
            <div className="param-group">
              {Object.entries(editedParams.linkDilution).map(
                ([field, value]) => (
                  <div className="param-field" key={`linkDilution-${field}`}>
                    <label htmlFor={`linkDilution-${field}`}>
                      {formatFieldLabel(field)}:
                    </label>
                    <input
                      id={`linkDilution-${field}`}
                      type="number"
                      step={value < 1 ? 0.01 : 1}
                      value={value}
                      onChange={(e) =>
                        handleInputChange("linkDilution", field, e.target.value)
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Psychological Mismatch Parameters */}
          <div className="param-section">
            <h3>Psychological Mismatch Settings</h3>
            <div className="param-group">
              {Object.entries(editedParams.psychMismatch).map(
                ([field, value]) => (
                  <div className="param-field" key={`psychMismatch-${field}`}>
                    <label htmlFor={`psychMismatch-${field}`}>
                      {formatFieldLabel(field)}:
                    </label>
                    <input
                      id={`psychMismatch-${field}`}
                      type="number"
                      step={value < 1 ? 0.01 : 1}
                      value={value}
                      onChange={(e) =>
                        handleInputChange(
                          "psychMismatch",
                          field,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Cannibalization Loss Parameters */}
          <div className="param-section">
            <h3>Cannibalization Loss Settings</h3>
            <div className="param-group">
              {Object.entries(editedParams.cannibalizationLoss).map(
                ([field, value]) => (
                  <div
                    className="param-field"
                    key={`cannibalizationLoss-${field}`}
                  >
                    <label htmlFor={`cannibalizationLoss-${field}`}>
                      {formatFieldLabel(field)}:
                    </label>
                    <input
                      id={`cannibalizationLoss-${field}`}
                      type="number"
                      step={value < 1 ? 0.01 : 1}
                      value={value}
                      onChange={(e) =>
                        handleInputChange(
                          "cannibalizationLoss",
                          field,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Bucket Categories Parameters */}
          <div className="param-section">
            <h3>Content Bucket Settings</h3>
            <div className="param-group">
              {Object.entries(editedParams.buckets).map(([field, value]) => (
                <div className="param-field" key={`buckets-${field}`}>
                  <label htmlFor={`buckets-${field}`}>
                    {formatFieldLabel(field)}:
                  </label>
                  <input
                    id={`buckets-${field}`}
                    type="number"
                    step={value < 1 ? 0.01 : 1}
                    value={value}
                    onChange={(e) =>
                      handleInputChange("buckets", field, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
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
