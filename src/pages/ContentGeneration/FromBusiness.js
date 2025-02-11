import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import "./FromBusiness.css";

export default function FromBusiness() {
  const { onboardingData } = useOnboarding();
  // Destructure businessDetails and goal (if available) from onboardingData
  const { businessDetails, goal } = onboardingData;

  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState([]);
  const [selectedTitles, setSelectedTitles] = useState([]);

  // When business details exist, trigger the API call.
  useEffect(() => {
    if (businessDetails && businessDetails.trim() !== "") {
      setLoading(true);
      fetch(
        "https://ai.1upmedia.com:443/generate-preview-titles-from-business-details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goal: goal || "",
            business_details: businessDetails,
            num_articles: 10, // default count
          }),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          let parsedTitles = [];
          // Expecting data.titles as a string like:
          // "\"Title1\", \"Title2\", \"Title3\", ... "
          if (typeof data.titles === "string") {
            // Use a regex to match all occurrences of text between double quotes.
            // This works even if there's a numbering prefix like "1. " or "2. " before the quote.
            const matches = data.titles.match(/"([^"]+)"/g);
            if (matches) {
              parsedTitles = matches.map((title) =>
                title.replace(/^"|"$/g, "")
              );
            }
          } else if (Array.isArray(data.titles)) {
            parsedTitles = data.titles;
          }
          setTitles(parsedTitles);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching titles:", error);
          setLoading(false);
        });
    }
  }, [businessDetails, goal]);

  // Toggle selection of a title
  const handleSelectTitle = (title) => {
    if (selectedTitles.includes(title)) {
      setSelectedTitles(selectedTitles.filter((t) => t !== title));
    } else {
      setSelectedTitles([...selectedTitles, title]);
    }
  };

  // If business details are missing, show a message with a link to complete onboarding
  if (!businessDetails || businessDetails.trim() === "") {
    return (
      <div className="fb-container">
        <div className="fb-empty">
          <p>
            Your business details are empty. Please complete the onboarding.
          </p>
          <Link to="/onboarding" className="fb-link">
            Click here to complete onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-container">
      <h1 className="fb-title">Select Your Preview Titles</h1>
      {loading ? (
        <div className="fb-loading">
          <p>Loading preview titles...</p>
        </div>
      ) : (
        <div className="fb-titles-list">
          {titles.map((title, index) => (
            <div key={index} className="fb-title-item">
              <label>
                <input
                  type="checkbox"
                  value={title}
                  checked={selectedTitles.includes(title)}
                  onChange={() => handleSelectTitle(title)}
                />
                {title}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
