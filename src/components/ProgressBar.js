import React from "react";
import { usePoll } from "../context/PollContext";
import "./ProgressBar.css"; // Import the CSS file

export const ProgressBar = () => {
  const { progressPercentage, showProgressBar, closeProgressBar } = usePoll();

  if (!showProgressBar) return null;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <span className="progress-bar-title">Generating Content...</span>
        <button className="progress-bar-close" onClick={closeProgressBar}>
          &times;
        </button>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="progress-bar-percentage">{progressPercentage}%</p>
    </div>
  );
};
