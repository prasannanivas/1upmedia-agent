import React from "react";
import { useOnboarding } from "../context/OnboardingContext";
import "./OnboardingProgress.css";

const OnboardingProgress = () => {
  const { getPercentageProfileCompletion } = useOnboarding();
  const progress = getPercentageProfileCompletion();

  const sectionNames = {
    basicInfo: "Basic Information",
    domainAnalysis: "Domain Analysis",
    contentStrategy: "Content Strategy",
    team: "Team Setup",
    analytics: "Analytics Integration",
  };

  return (
    <div className="onboarding-progress">
      <div className="progress-header">
        <h3>Onboarding Progress</h3>
        <div className="total-progress">
          <div className="progress-circle">
            <div className="progress-value">{progress.total}%</div>
          </div>
          <span>Total Completion</span>
        </div>
      </div>

      <div className="section-progress">
        {progress.details.map((section) => (
          <div key={section.name} className="section">
            <div className="section-header">
              <h4>{sectionNames[section.name]}</h4>
              <span className="section-percentage">{section.percentage}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${section.percentage}%` }}
              />
            </div>
            <div className="section-details">
              <span>
                {section.completedFields}/{section.totalFields} completed
              </span>
              <span className="weight">Weight: {section.weight}%</span>
            </div>
          </div>
        ))}
      </div>

      {progress.total < 100 && (
        <div className="completion-tips">
          <h4>💡 Tips to complete your profile:</h4>
          <ul>
            {progress.details
              .map((section) => {
                if (section.percentage < 100) {
                  return (
                    <li key={section.name}>
                      Complete {sectionNames[section.name].toLowerCase()}(
                      {section.completedFields}/{section.totalFields} fields
                      completed)
                    </li>
                  );
                }
                return null;
              })
              .filter(Boolean)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OnboardingProgress;
