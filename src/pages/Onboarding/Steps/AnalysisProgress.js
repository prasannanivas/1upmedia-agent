import { CircularProgress } from "@mui/material";

const AnalysisProgress = ({ steps }) => {
  const getIconByLabel = (label, isComplete) => {
    switch (label) {
      case "Domain Validation":
        return isComplete ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
          </svg>
        );
      case "Sitemap Analysis":
        return isComplete ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.6 12.5h-3.4V19h-2v-3.5H6.6v-2h3.4V10h2v3.5h3.4v2z"></path>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-4h4v-2h-4V7h-2v4H7v2h4z"></path>
          </svg>
        );
      case "Metrics Analysis":
        return isComplete ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-5h2v5zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2-14H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2-14H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path>
          </svg>
        );
      case "Location Detection":
        return isComplete ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
          </svg>
        );
      case "Business Details":
        return isComplete ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 16v-1H3.01v6H21v-6h-7v1h-4zm12-9h-6V4l-2-2-2 2v3H6V2H2v13h20V7z"></path>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6v8h-4V6h4m0-2h-4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm6 16H3V4h6v10h10v6z"></path>
          </svg>
        );
      default:
        return isComplete ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
          </svg>
        );
    }
  };

  return (
    <div className="step-main-domain__analysis-stepper">
      {steps.map((step, index) => (
        <div key={index} className="step-main-domain__step-container">
          {/* Step Icon with Status */}
          <div className={`step-main-domain__step-icon ${step.status}`}>
            {step.status === "completed" ? (
              getIconByLabel(step.label, true)
            ) : step.status === "loading" ? (
              <CircularProgress size={24} thickness={3} />
            ) : step.status === "error" ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-8h-2v6h-2V7h4v6h2v-6h2V9h-2V7h-2V5h4v2h2v2h-2v2h-2v2h2v2h-2v2h-2v-2z"></path>
              </svg>
            ) : (
              getIconByLabel(step.label, false)
            )}
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="step-main-domain__step-connector">
              <span
                className={`step-main-domain__connector-line ${
                  steps[index].status === "completed"
                    ? "completed"
                    : steps[index].status === "loading"
                    ? "active"
                    : ""
                }`}
              />
            </div>
          )}

          {/* Step Content */}
          <div className="step-main-domain__step-content">
            <span className={`step-main-domain__step-label ${step.status}`}>
              {step.label}
            </span>
            <span className="step-main-domain__step-message">
              {step.status === "completed" && step.successMessage}
              {step.status === "error" && (
                <span className="step-main-domain__error-message">
                  {step.errorMessage}
                </span>
              )}
              {step.status === "loading" && (
                <span className="step-main-domain__loading-message">
                  Processing<span className="step-main-domain__dots">...</span>
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalysisProgress;
