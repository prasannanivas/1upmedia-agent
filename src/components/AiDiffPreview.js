import React from "react";
import "./AiDiffPreview.css";

const AiDiffPreview = ({ originalText, newText, onAccept, onReject }) => {
  return (
    <div className="ai-diff-preview">
      <div className="diff-content">
        <div className="text-block removed">{originalText}</div>
        <div className="text-block added">{newText}</div>
      </div>
      <div className="diff-actions">
        <button className="reject-btn" onClick={onReject}>
          Reject
        </button>
        <button className="accept-btn" onClick={onAccept}>
          Accept
        </button>
      </div>
    </div>
  );
};

export default AiDiffPreview;
