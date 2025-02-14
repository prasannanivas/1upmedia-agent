import React, { useState } from "react";
import Draggable from "react-draggable";
import {
  FaShareAlt,
  FaFacebookF,
  FaTwitter,
  FaRedditAlien,
  FaLinkedinIn,
  FaWordpress,
} from "react-icons/fa";
import { SiWebflow, SiShopify } from "react-icons/si";
import "./FloatingOptions.css";

const FloatingOptions = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleOptions = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <Draggable>
      <div className="floating-options-container">
        {/* Main share icon */}
        <div className="options-icon" onClick={toggleOptions}>
          <FaShareAlt />
        </div>
        {/* Expanded menu with social icons */}
        {expanded && (
          <div className="options-menu">
            <div className="option-item" title="Share on Facebook">
              <FaFacebookF className="social-icon" />
            </div>
            <div className="option-item" title="Share on Twitter">
              <FaTwitter className="social-icon" />
            </div>
            <div className="option-item" title="Share on Reddit">
              <FaRedditAlien className="social-icon" />
            </div>
            <div className="option-item" title="Share on LinkedIn">
              <FaLinkedinIn className="social-icon" />
            </div>
            <div className="option-item" title="Share on Webflow">
              <SiWebflow className="social-icon" />
            </div>
            <div className="option-item" title="Share on Wordpress">
              <FaWordpress className="social-icon" />
            </div>
            <div className="option-item" title="Share on Shopify">
              <SiShopify className="social-icon" />
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default FloatingOptions;
