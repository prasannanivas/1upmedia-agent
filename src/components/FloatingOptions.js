import React, { useState } from "react";
import Draggable from "react-draggable";
import {
  FaShareAlt,
  FaFacebookF,
  FaTwitter,
  FaRedditAlien,
  FaLinkedinIn,
  FaWordpress,
  FaInstagramSquare,
} from "react-icons/fa";
import { SiWebflow, SiShopify } from "react-icons/si";
import "./FloatingOptions.css";
import { useSocialMedia } from "../context/SocialMediaContext";
import WordPressShareModal from "../pages/WordpressShareModal";
import FacebookShareModal from "../pages/SocialShareModals/FacebookShareModal";
import InstagramShareModal from "../pages/SocialShareModals/InstagramShareModal";
import RedditShareModal from "../pages/SocialShareModals/RedditShareModal";
import LinkedInShareModal from "../pages/SocialShareModals/LinkedinShareModal";

const FloatingOptions = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const [isWPModalOpen, setIsWPModalOpen] = useState(false);
  const [isFBModalOpen, setIsFBModalOpen] = useState(false);
  const [isInstagramModalOpen, setInstagramModalOpen] = useState(false);
  const [isRedditModalOpen, setRedditModalOpen] = useState(false);
  const [isLinkedinModalOpen, setLinkedinModalOpen] = useState(false);
  const {
    wordpressProfiles,
    facebookPages,
    instagramProfiles,
    redditProfiles,
    linkedinProfiles,
  } = useSocialMedia();

  console.log(linkedinProfiles);
  const toggleOptions = () => {
    setExpanded((prev) => !prev);
  };

  const handleWordPressClick = () => {
    setIsWPModalOpen(true);
    setExpanded(false); // Close the floating menu
  };
  const handleFacebookClick = () => {
    setIsFBModalOpen(true);
    setExpanded(false); // Close the floating menu
  };

  const handleInstagramClick = () => {
    setInstagramModalOpen(true);
    setExpanded(false); // Close the floating menu
  };

  const handleRedditClick = () => {
    setRedditModalOpen(true);
    setExpanded(false); // Close the floating menu
  };

  const handleLinkedinClick = () => {
    setLinkedinModalOpen(true);
    setExpanded(false); // Close the floating menu
  };

  return (
    <>
      <Draggable>
        <div className="floating-options-container">
          {/* Main share icon */}
          <div className="options-icon" onClick={toggleOptions}>
            <FaShareAlt />
          </div>
          {/* Expanded menu with social icons */}
          {expanded && (
            <div className="options-menu">
              <div
                className="option-item"
                title="Share on Facebook"
                onClick={handleFacebookClick}
              >
                <FaFacebookF className="social-icon" />
              </div>
              <div
                className="option-item"
                title="Share on WordPress"
                onClick={handleInstagramClick}
              >
                <FaInstagramSquare className="social-icon" />
              </div>
              <div className="option-item" title="Share on Twitter">
                <FaTwitter className="social-icon" />
              </div>
              <div
                className="option-item"
                title="Share on Reddit"
                onClick={handleRedditClick}
              >
                <FaRedditAlien className="social-icon" />
              </div>
              <div
                className="option-item"
                title="Share on LinkedIn"
                onClick={handleLinkedinClick}
              >
                <FaLinkedinIn className="social-icon" />
              </div>
              <div className="option-item" title="Share on Webflow">
                <SiWebflow className="social-icon" />
              </div>
              <div
                className="option-item"
                title="Share on WordPress"
                onClick={handleWordPressClick}
              >
                <FaWordpress className="social-icon" />
              </div>
              <div className="option-item" title="Share on Shopify">
                <SiShopify className="social-icon" />
              </div>
            </div>
          )}
        </div>
      </Draggable>
      <WordPressShareModal
        isOpen={isWPModalOpen}
        onClose={() => setIsWPModalOpen(false)}
        post={post}
        wordpressProfiles={wordpressProfiles}
      />
      <FacebookShareModal
        isOpen={isFBModalOpen}
        onClose={() => setIsFBModalOpen(false)}
        post={post}
        facebookPages={facebookPages}
      />

      <InstagramShareModal
        isOpen={isInstagramModalOpen}
        onClose={() => setInstagramModalOpen(false)}
        post={post}
        instagramAccounts={instagramProfiles}
      />

      <RedditShareModal
        isOpen={isRedditModalOpen}
        onClose={() => setRedditModalOpen(false)}
        post={post}
        redditProfiles={redditProfiles}
      />
      <LinkedInShareModal
        isOpen={isLinkedinModalOpen}
        onClose={() => setLinkedinModalOpen(false)}
        post={post}
        linkedinProfiles={linkedinProfiles}
      />
    </>
  );
};

export default FloatingOptions;
