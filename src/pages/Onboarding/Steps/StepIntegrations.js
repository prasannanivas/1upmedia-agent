import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";

const StepIntegrations = () => {
  const { setIntegrations } = useOnboarding();
  const [selectedIntegrations, setSelectedIntegrations] = useState([]);
  const navigate = useNavigate();

  const handleToggle = (integration) => {
    setSelectedIntegrations((prev) =>
      prev.includes(integration)
        ? prev.filter((item) => item !== integration)
        : [...prev, integration]
    );
  };

  const handleNext = () => {
    setIntegrations(selectedIntegrations);
    navigate("/onboarding/step-keywords");
  };

  return (
    <div>
      <h2>Integrations</h2>
      <label>
        <input type="checkbox" onChange={() => handleToggle("WordPress")} />
        WordPress
      </label>
      <label>
        <input
          type="checkbox"
          onChange={() => handleToggle("Google Analytics")}
        />
        Google Analytics
      </label>
      <label>
        <input
          type="checkbox"
          onChange={() => handleToggle("Search Console")}
        />
        Search Console
      </label>
      <button onClick={handleNext}>Next</button>
    </div>
  );
};

export default StepIntegrations;
