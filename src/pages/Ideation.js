import React, { useState } from "react";
import axios from "axios";
import { useOnboarding } from "../context/OnboardingContext";
import "./Ideation.css";

function Ideation() {
  const { onboardingData } = useOnboarding();
  const domainAuthority =
    onboardingData.initialAnalysisState?.domainAuthority || 0;

  console.log(domainAuthority);
  const keywords = onboardingData.keywords.slice(0, 10);

  // analysisResults: { [keyword]: { loading: boolean, data: array, difficulty: string, avgRating: number } }
  const [analysisResults, setAnalysisResults] = useState({});

  // Helper to compute average domain rating from response data
  const computeAverageRating = (data) => {
    if (!data.length) return 0;
    const total = data.reduce((sum, item) => sum + item.domain_rating, 0);
    return total / data.length;
  };

  // Determine difficulty based on average rating vs. domainAuthority with ±5 tolerance
  const getDifficulty = (avgRating, authority) => {
    if (avgRating <= authority - 15) return "Easy";
    if (avgRating >= authority + 15) return "Hard";
    return "Medium";
  };

  const handleAnalyse = async (keyword) => {
    // Set loading state for this keyword
    setAnalysisResults((prev) => ({
      ...prev,
      [keyword]: { loading: true, data: [], difficulty: "", avgRating: 0 },
    }));

    try {
      const response = await axios.get(
        `httpa://ai.1upmedia.com:443/aiagent/google-custom-search`,
        { params: { keyword } }
      );
      const data = response.data; // expecting an array of analysis objects
      const avgRating = computeAverageRating(data);
      const difficulty = getDifficulty(avgRating, domainAuthority);
      setAnalysisResults((prev) => ({
        ...prev,
        [keyword]: { loading: false, data, difficulty, avgRating },
      }));
    } catch (error) {
      console.error("Error fetching analysis for", keyword, error);
      setAnalysisResults((prev) => ({
        ...prev,
        [keyword]: { loading: false, data: [], difficulty: "", avgRating: 0 },
      }));
    }
  };

  // Trigger analysis for all keywords that haven't been analyzed yet
  const handleAnalyseAll = () => {
    keywords.forEach((keyword) => {
      if (!analysisResults[keyword]) {
        handleAnalyse(keyword);
      }
    });
  };

  // Compute overall average rating from all analyzed keywords
  const computeOverallAverage = () => {
    let sum = 0;
    let count = 0;
    keywords.forEach((keyword) => {
      const result = analysisResults[keyword];
      if (result && !result.loading && result.data.length > 0) {
        sum += result.avgRating;
        count += 1;
      }
    });
    return count > 0 ? sum / count : null;
  };

  const overallAvg = computeOverallAverage();
  const overallDifficulty =
    overallAvg !== null ? getDifficulty(overallAvg, domainAuthority) : null;

  return (
    <div className="ideation-container">
      <h2 className="ideation-header">Top 10 Keywords</h2>
      <div className="ideation-topButtons">
        <button
          className="ideation-analyseAllButton"
          onClick={handleAnalyseAll}
        >
          Analyse All
        </button>
      </div>
      {overallAvg !== null && (
        <div className="ideation-overall">
          <p>
            <strong>Overall Average Domain Rating:</strong>{" "}
            {overallAvg.toFixed(1)}
          </p>
          <p>
            <strong>Overall Difficulty:</strong>{" "}
            <span
              className={`ideation-difficulty-${overallDifficulty.toLowerCase()}`}
            >
              {overallDifficulty}
            </span>
          </p>
        </div>
      )}
      <ul className="ideation-keywordList">
        {keywords.map((keyword, index) => (
          <li key={index} className="ideation-keywordItem">
            <div className="ideation-keywordHeader">
              <span className="ideation-keywordText">{keyword}</span>
              <button
                className="ideation-analyseButton"
                onClick={() => handleAnalyse(keyword)}
                disabled={analysisResults[keyword]?.loading}
              >
                {analysisResults[keyword]?.loading ? "Loading..." : "Analyse"}
              </button>
            </div>
            {analysisResults[keyword] &&
              !analysisResults[keyword].loading &&
              analysisResults[keyword].data.length > 0 && (
                <div className="ideation-analysisResult">
                  <p className="ideation-difficulty">
                    <strong>Difficulty:</strong>{" "}
                    <span
                      className={`ideation-difficulty-${analysisResults[
                        keyword
                      ].difficulty.toLowerCase()}`}
                    >
                      {analysisResults[keyword].difficulty}
                    </span>
                    {" - Average Rating: "}
                    {analysisResults[keyword].avgRating.toFixed(1)}
                  </p>
                  {analysisResults[keyword].data.map((item, idx) => (
                    <div key={idx} className="ideation-analysisItem">
                      <p>
                        <strong>Keyword:</strong> {item.keyword}
                      </p>
                      <p>
                        <strong>Domain:</strong> {item.domain}
                      </p>
                      <p>
                        <strong>Domain Rating:</strong> {item.domain_rating}
                      </p>
                    </div>
                  ))}
                </div>
              )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Ideation;
