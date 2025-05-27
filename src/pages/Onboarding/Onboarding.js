import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import StepMainDomain from "./Steps/StepMainDomain";
import StepIntegrations from "./Steps/StepIntegrations";
import StepKeywords from "./Steps/StepKeywords";
import StepBusinessDetails from "./Steps/StepBusinessDetails";
import StepSocialIntegrations from "./Steps/StepSocialIntegrations";
import StepPersonas from "./Steps/StepPersonas";
import StepContentStrategy from "./Steps/StepContentStrategy";
import "./Onboarding.css";
import StepCreateAuthors from "./Steps/StepCreateAuthors";
import SuggestionStep from "./Steps/SuggestionStep";

const Onboarding = () => {
  const navigate = useNavigate();

  const handleSkip = () => {
    navigate("/dashboard"); // Skip onboarding and navigate to the dashboard
  };

  return (
    <div className="Onboarding">
      <h1>Strategic Visibility Briefing</h1>
      <Routes>
        <Route path="/" element={<Navigate to="step-main-domain" />} />
        <Route path="step-main-domain" element={<StepMainDomain />} />
        <Route path="step-integrations" element={<StepIntegrations />} />
        <Route path="step-keywords" element={<StepKeywords />} />
        <Route path="step-business-details" element={<StepBusinessDetails />} />
        <Route
          path="step-social-integrations"
          element={<StepSocialIntegrations />}
        />
        <Route path="step-personas" element={<StepPersonas />} />
        <Route path="step-suggestions" element={<SuggestionStep />} />
        <Route path="step-create-authors" element={<StepCreateAuthors />} />
        <Route path="step-content-strategy" element={<StepContentStrategy />} />
      </Routes>
      <button onClick={handleSkip}>Skip Onboarding</button>
    </div>
  );
};

export default Onboarding;
