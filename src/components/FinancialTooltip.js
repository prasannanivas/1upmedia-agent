import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef(null);
  const iconRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate tooltip position when it becomes visible
  useEffect(() => {
    if (isVisible && iconRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      let top, left;

      switch (position) {
        case "top":
          top = iconRect.top + scrollY - 70; // Position above the icon
          left = iconRect.left + scrollX + iconRect.width / 2 - 150; // Center horizontally
          break;
        case "bottom":
          top = iconRect.bottom + scrollY + 10;
          left = iconRect.left + scrollX + iconRect.width / 2 - 150;
          break;
        case "left":
          top = iconRect.top + scrollY + iconRect.height / 2 - 40;
          left = iconRect.left + scrollX - 310; // 300px width + 10px spacing
          break;
        case "right":
          top = iconRect.top + scrollY + iconRect.height / 2 - 40;
          left = iconRect.right + scrollX + 10;
          break;
        default:
          top = iconRect.top + scrollY - 70;
          left = iconRect.left + scrollX + iconRect.width / 2 - 150;
      }

      // Ensure tooltip stays within viewport
      const maxLeft = window.innerWidth - 300 - 20; // 300px width + 20px margin
      const minLeft = 20;
      const maxTop = window.innerHeight + scrollY - 120; // Approximate tooltip height + margin
      const minTop = scrollY + 20;

      left = Math.max(minLeft, Math.min(left, maxLeft));
      top = Math.max(minTop, Math.min(top, maxTop));

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const renderTooltip = () => {
    if (!isVisible) return null;

    return createPortal(
      <div
        className="financial-tooltip financial-tooltip-portal"
        style={{
          position: "absolute",
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          zIndex: 1000002,
          backgroundColor: "#ffffff",
          color: "#334155",
          borderRadius: "6px",
          padding: "12px",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
          width: "300px",
          border: "1px solid #e2e8f0",
          fontSize: "0.875rem",
          animation: "tooltipFadeIn 0.2s ease-in-out",
          pointerEvents: "auto",
          whiteSpace: "normal",
          lineHeight: "1.4",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {title && (
          <h4
            style={{
              fontWeight: 600,
              margin: "0 0 8px 0",
              color: "#1e293b",
              fontSize: "0.9rem",
            }}
          >
            {title}
          </h4>
        )}
        <div style={{ lineHeight: 1.5, color: "#475569" }}>{content}</div>
      </div>,
      document.body
    );
  };

  return (
    <span className="financial-tooltip-container">
      <span
        ref={iconRef}
        className="financial-tooltip-icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FaInfoCircle />
      </span>
      {renderTooltip()}
    </span>
  );
};

export default FinancialTooltip;
