import React, { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import "./FinancialTooltip.css";

/**
 * Financial Tooltip Component
 *
 * Displays a tooltip with information about financial calculations
 * when hovering over an information icon.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Tooltip title
 * @param {string} props.content - Tooltip content/explanation
 * @param {string} props.position - Position of tooltip (top, bottom, left, right)
 * @returns {JSX.Element} FinancialTooltip component
 */
const FinancialTooltip = ({ title, content, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="financial-tooltip-container">
      <span
        className="financial-tooltip-icon"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <FaInfoCircle />
      </span>
      {isVisible && (
        <div className={`financial-tooltip financial-tooltip-${position}`}>
          {title && <h4 className="financial-tooltip-title">{title}</h4>}
          <div className="financial-tooltip-content">{content}</div>
        </div>
      )}
    </div>
  );
};

export default FinancialTooltip;
