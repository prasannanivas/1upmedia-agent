import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useSocialMedia } from "../../../context/SocialMediaContext"; // Import social media context
import { FaTimes } from "react-icons/fa"; // Import X icon
import ConnectGoogleModal from "./ConnectGoogleModal"; // Import modal
import "./StepKeywords.css"; // Import CSS

const StepKeywords = () => {
  const { onboardingData, setOnboardingData } = useOnboarding();
  const { googleProfiles } = useSocialMedia(); // Fetch Google accounts
  const [keyword, setKeyword] = useState("");
  const [keywordList, setKeywordList] = useState(onboardingData.keywords || []);
  const [relatedKeywords, setRelatedKeywords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [GSCdata, setGSCdata] = useState(
    onboardingData.searchConsoleData || {}
  );
  const navigate = useNavigate();

  const handleAddKeyword = () => {
    if (keyword.trim() && !keywordList.includes(keyword)) {
      setKeywordList((prev) => [...prev, keyword]);
      setKeyword("");
    }
  };

  const handleRemoveKeyword = (index) => {
    setKeywordList((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchRelatedKeywords = async () => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/get-keywords-and-target-audience`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: keyword,
            goal: "SEO",
            business_details: "Finding related Keywords for google search",
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to fetch related keywords");
      const data = await response.json();
      setRelatedKeywords(data.result.keywords.split(", ") || []);
    } catch (error) {
      console.error("Error fetching related keywords:", error);
    }
  };

  useEffect(() => {
    setOnboardingData((prev) => ({
      ...prev,
      searchConsoleData: GSCdata,
    }));
  }, [GSCdata]);

  const handleNext = () => {
    setOnboardingData((prev) => ({
      ...prev,
      keywords: keywordList,
    }));
    navigate("/onboarding/step-business-details");
  };

  return (
    <div className="step-keywords-container">
      <h2 className="step-keywords-title">Define Keywords</h2>
      <div className="step-keywords-input-group">
        <input
          type="text"
          placeholder="Enter a keyword"
          className="step-keywords-input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
        />
        <button
          onClick={handleAddKeyword}
          disabled={!keyword}
          className="step-keywords-add-btn"
        >
          Add
        </button>
      </div>

      {keyword && (
        <button
          onClick={fetchRelatedKeywords}
          className="step-keywords-related-btn"
        >
          Find Related Keywords
        </button>
      )}

      {keywordList.length > 0 && (
        <div className="step-keywords-list">
          <h3>Keywords:</h3>
          <ul>
            {keywordList.map((kw, index) => (
              <li key={index} className="step-keywords-item">
                {kw}
                <FaTimes
                  className="step-keywords-remove"
                  onClick={() => handleRemoveKeyword(index)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedKeywords.length > 0 && (
        <div className="step-keywords-related">
          <h3>Related Keywords:</h3>
          <ul>
            {relatedKeywords.map((related, index) => (
              <li key={index} className="step-keywords-related-item">
                {related}
                <button
                  className="step-keywords-add-related"
                  onClick={() => setKeywordList((prev) => [...prev, related])}
                >
                  +
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Connect Google Search Console Button */}
      <button
        className="step-keywords-google-btn"
        onClick={() => setIsModalOpen(true)}
      >
        Connect Google Search Console
      </button>

      {/* Google Accounts Modal */}
      <ConnectGoogleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onKeywordsSelected={setKeywordList}
        onGSCreceived={setGSCdata}
      />

      <button
        onClick={handleNext}
        disabled={keywordList.length === 0}
        className="step-keywords-next-btn"
      >
        Next
      </button>
    </div>
  );
};

export default StepKeywords;
