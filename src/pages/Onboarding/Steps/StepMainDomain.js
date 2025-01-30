import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import "./StepMainDomain.css";

const StepMainDomain = () => {
  const { onboardingData, setOnboardingData, loading } = useOnboarding();
  const navigate = useNavigate();

  // Local state for inputs
  const [domain, setDomain] = useState(onboardingData.domain || "");
  const [location, setLocation] = useState(onboardingData.location || "");

  const handleNext = () => {
    // Save user input to onboarding context
    setOnboardingData((prev) => ({
      ...prev,
      domain,
      location,
    }));

    navigate("/onboarding/step-keywords");
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div>
      <h2>Main Domain Setup</h2>
      <label>
        <strong>Domain:</strong>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter your domain"
          className="step-main-domain-input"
        />
      </label>
      <label>
        <strong>Location:</strong>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter your location"
          className="step-main-domain-input"
        />
      </label>
      <button onClick={handleNext} disabled={!domain || !location}>
        Next
      </button>
    </div>
  );
};

export default StepMainDomain;
