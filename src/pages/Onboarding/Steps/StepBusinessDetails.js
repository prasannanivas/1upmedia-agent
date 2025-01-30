import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../../context/AuthContext";
import "./StepBusinessDetails.css";

const StepBusinessDetails = () => {
  const { onboardingData, setOnboardingData } = useOnboarding();
  const { authState } = useAuth();
  const { email } = authState;
  const [siteURL] = useState(onboardingData.domain || "");
  const [location] = useState(onboardingData.location || "");
  const [keywords] = useState(onboardingData.keywords || []);
  const [businessDetails, setBusinessDetails] = useState(
    typeof onboardingData.businessDetails === "string"
      ? onboardingData.businessDetails
      : JSON.stringify(onboardingData?.businessDetails || "")
  );
  const [isLoading, setIsLoading] = useState(!businessDetails);
  const navigate = useNavigate();

  useEffect(() => {
    if (businessDetails) {
      // Skip API call if businessDetails are already present
      setIsLoading(false);
      return;
    }

    const fetchBusinessDetails = async () => {
      try {
        const response = await fetch(
          "https://ai.1upmedia.com:443/get-business-details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: siteURL,
              location,
              keyword: keywords[0], // Use the first keyword
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to fetch business details");
        const businessData = await response.json();
        const details =
          typeof businessData.detail === "string"
            ? businessData.detail
            : JSON.stringify(businessData.detail || "");
        setBusinessDetails(details);
        setOnboardingData((prev) => ({
          ...prev,
          businessDetails: details,
        }));
      } catch (error) {
        console.error("Error fetching business details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [businessDetails, keywords, location, siteURL, setOnboardingData]);

  const handleDetailsChange = (e) => {
    setBusinessDetails(e.target.value);
    setOnboardingData((prev) => ({
      ...prev,
      businessDetails: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      await fetch("https://ai.1upmedia.com:443/aiagent/updateBusinessdetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          siteData: {
            URL: siteURL,
            location,
            keywords,
            business_details: businessDetails,
          },
        }),
      });
      alert("Business details saved successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving business details:", error);
    }
    navigate("/onboarding/step-create-authors");
  };

  if (isLoading) {
    return <h3>Loading business details...</h3>;
  }

  return (
    <div className="step-business-details">
      <div className="step-business-details__result-section">
        <h2 className="step-business-details__title">
          Business Details (Editable)
        </h2>
        <textarea
          value={businessDetails}
          onChange={handleDetailsChange}
          className="step-business-details__textarea"
        />
        <ReactMarkdown className="step-business-details__markdown-preview">
          {businessDetails || ""}
        </ReactMarkdown>
        <button
          onClick={handleSave}
          className="step-business-details__save-button"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default StepBusinessDetails;
