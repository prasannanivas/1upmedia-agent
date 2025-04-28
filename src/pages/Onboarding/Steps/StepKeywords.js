import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useSocialMedia } from "../../../context/SocialMediaContext";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import ConnectGoogleModal from "./ConnectGoogleModal";
import "./StepKeywords.css";
import Loader from "../../../components/Loader";
import { useAuth } from "../../../context/AuthContext";

const StepKeywords = () => {
  const {
    onboardingData,
    setOnboardingData,
    loading,
    connectedSites,
    setConnectedSites,
  } = useOnboarding();
  const { googleProfiles } = useSocialMedia();
  const { authState } = useAuth();
  const { email } = authState;
  const [siteURL, setSiteURL] = useState(onboardingData.domain || "");
  const [location, setLocation] = useState(onboardingData.location || "");
  const [keyword, setKeyword] = useState("");
  const [keywordList, setKeywordList] = useState(onboardingData.keywords || []);
  const [relatedKeywords, setRelatedKeywords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState(
    onboardingData.initialAnalysisState || {}
  );
  const [GSCdata, setGSCdata] = useState(
    onboardingData.searchConsoleData || {}
  );
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingBusinessKeywords, setLoadingBusinessKeywords] = useState(false);
  const navigate = useNavigate();

  const handleAddKeyword = () => {
    const trimmed = keyword.trim();
    if (trimmed && !keywordList.includes(trimmed)) {
      setKeywordList((prev) => [...prev, trimmed]);
      setKeyword("");
      setRelatedKeywords((prev) => prev.filter((k) => k !== trimmed));
    }
  };

  const handleAddRelatedKeyword = (relatedKeyword) => {
    if (!keywordList.includes(relatedKeyword)) {
      setKeywordList((prev) => [...prev, relatedKeyword]);
      setRelatedKeywords((prev) => prev.filter((k) => k !== relatedKeyword));
    }
  };

  const handleRemoveKeyword = (index) => {
    setKeywordList((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchRelatedKeywords = async () => {
    setLoadingRelated(true);
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
    } finally {
      setLoadingRelated(false);
    }
  };

  const fetchBusinessKeywords = async () => {
    if (!siteURL) {
      alert("Please enter a site URL first");
      return;
    }

    setLoadingBusinessKeywords(true);
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/get-business-keywords?url=${encodeURIComponent(
          siteURL
        )}`
      );
      if (!response.ok) throw new Error("Failed to fetch business keywords");
      const data = await response.json();

      // Add suggested keywords to related keywords list
      if (data.keywords && Array.isArray(data.keywords)) {
        setRelatedKeywords((prev) => [...new Set([...prev, ...data.keywords])]);
      }
    } catch (error) {
      console.error("Error fetching business keywords:", error);
      alert("Error fetching business keywords. Please try again.");
    } finally {
      setLoadingBusinessKeywords(false);
    }
  };

  useEffect(() => {
    setSiteURL(onboardingData.domain || "");
    setLocation(onboardingData.location || "");
    setAnalysisData(onboardingData.initialAnalysisState || {});
    setKeywordList(onboardingData.keywords || []);
    setGSCdata(onboardingData.searchConsoleData || {});
  }, [onboardingData]);

  useEffect(() => {
    setOnboardingData((prev) => ({
      ...prev,
      searchConsoleData: GSCdata,
    }));
  }, [GSCdata]);

  const handleSave = async () => {
    try {
      const filteredSiteData = {
        ...(siteURL && { URL: siteURL }),
        ...(location && { location }),
        ...(keywordList && { keywordList }),
        ...(GSCdata && { search_analytics: GSCdata }),
        dynamic_fields: {
          ...analysisData,
          ...(onboardingData.suggestionsFromAi && {
            suggestions: {
              ...onboardingData.suggestionsFromAi,
            },
          }),
        },
      };

      if (Object.keys(filteredSiteData.dynamic_fields).length === 0) {
        delete filteredSiteData.dynamic_fields;
      }

      await fetch("https://ai.1upmedia.com:443/aiagent/updateBusinessdetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          siteData: filteredSiteData,
        }),
      });

      alert("Business details saved successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving business details:", error);
      alert("Error saving business details. Please try again.");
    }
    navigate("/onboarding/step-suggestions");
  };
  const handleNext = async () => {
    setOnboardingData((prev) => ({
      ...prev,
      keywords: keywordList,
    }));
    await handleSave();
    navigate("/onboarding/step-business-details");
  };

  return (
    <div className="step-keywords">
      <div className="step-keywords__container">
        <h2 className="step-keywords__title">Define Keywords</h2>
        {loading ? (
          <Loader />
        ) : (
          <>
            {
              <div>
                <button
                  className="step-keywords__google-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  {connectedSites.length > 0
                    ? `${connectedSites.length} site/s connected`
                    : "Connect Google Search Console"}
                </button>

                {connectedSites.map((site) => (
                  <div className="connected-sites" key={site._id}>
                    <h3>{site.siteUrl}</h3>
                    <p>{site.forDomain}</p>
                  </div>
                ))}
              </div>
            }

            <div className="step-keywords__input-section">
              <div className="step-keywords__input-group">
                <input
                  type="text"
                  placeholder="Enter a keyword"
                  className="step-keywords__input"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                />
                <button onClick={handleAddKeyword} disabled={!keyword}>
                  Add
                </button>
              </div>
              {keyword && (
                <button
                  onClick={fetchRelatedKeywords}
                  className="step-keywords__related-btn"
                  disabled={loadingRelated}
                >
                  {loadingRelated ? (
                    "Loading..."
                  ) : (
                    <>
                      <FaSearch /> Find Related Keywords
                    </>
                  )}
                </button>
              )}
              {siteURL && (
                <button
                  onClick={fetchBusinessKeywords}
                  className="step-keywords__business-btn"
                  disabled={loadingBusinessKeywords}
                >
                  {loadingBusinessKeywords
                    ? "Loading..."
                    : "Fetch Business Keywords"}
                </button>
              )}
            </div>
            {relatedKeywords.length > 0 && (
              <div className="step-keywords__related-section">
                <h3 className="step-keywords__subtitle">
                  Related Keywords ({relatedKeywords.length})
                </h3>
                <div className="step-keywords__related-tags">
                  {relatedKeywords.map((related, index) => (
                    <div key={index} className="step-keywords__related-tag">
                      <span>{related}</span>
                      <div
                        className="step-keywords__tag-add"
                        onClick={() => handleAddRelatedKeyword(related)}
                      >
                        +
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="step-keywords__content">
              <div className="step-keywords__main-list">
                {keywordList.length > 0 && (
                  <div className="step-keywords__section">
                    <h3 className="step-keywords__subtitle">
                      Selected Keywords ({keywordList.length})
                    </h3>
                    <div className="step-keywords__tags">
                      {keywordList.map((kw, index) => (
                        <div key={index} className="step-keywords__tag">
                          <span>{kw}</span>
                          <div
                            className="step-keywords__tag-remove"
                            onClick={() => handleRemoveKeyword(index)}
                          >
                            X
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="step-keywords__actions">
              <button
                onClick={handleNext}
                disabled={keywordList.length === 0}
                className="step-keywords__next-btn"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
      <ConnectGoogleModal
        connectedSites={connectedSites}
        setConnectedSites={setConnectedSites}
        isOpen={isModalOpen}
        forDomain={siteURL}
        onClose={() => setIsModalOpen(false)}
        onKeywordsSelected={setKeywordList}
        onGSCreceived={setGSCdata}
      />
    </div>
  );
};

export default StepKeywords;
