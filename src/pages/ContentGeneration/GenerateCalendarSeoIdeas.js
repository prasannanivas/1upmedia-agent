import React, { useState } from "react";
import Calendar from "react-calendar";
import axios from "axios";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import "react-calendar/dist/Calendar.css";
import "./GenerateCalendarSeoIdeas.css";

const GenerateCalendarSeoIdeas = () => {
  const { onboardingData } = useOnboarding();
  const { authState } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [ideas, setIdeas] = useState([]); // Array of generated ideas with assigned dates
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Check if all required data is available
  const missingFields = [];
  if (!onboardingData.domain) missingFields.push("Domain");
  if (!onboardingData.location) missingFields.push("Location");
  if (!onboardingData.businessDetails) missingFields.push("Business Details");
  if (!onboardingData.initialAnalysisState?.domainAuthority)
    missingFields.push("Domain Analysis");
  if (!onboardingData.keywords?.length) missingFields.push("Keywords");
  if (!onboardingData.suggestionsFromAi?.content_strategies?.length)
    missingFields.push("Content Strategy");

  // When a date is clicked, open the modal and set the selected date
  const onDateClick = (date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  // Call the API with the chosen duration (num_articles) and assign ideas to consecutive dates
  const handleGenerateIdeas = async (days) => {
    setModalOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:3000/aiagent/generate-seo-ideas",
        {
          email: authState.email,
          url: onboardingData.domain,
          location: onboardingData.location,
          business_details: onboardingData.businessDetails,
          domainAuthority: onboardingData.initialAnalysisState?.domainAuthority,
          pageAuthority: onboardingData.initialAnalysisState?.pageAuthority,
          trustFlow: onboardingData.initialAnalysisState?.trustFlow,
          citationFlow: onboardingData.initialAnalysisState?.citationFlow,
          content_strategies:
            onboardingData.suggestionsFromAi?.content_strategies,
          content_types: onboardingData.suggestionsFromAi?.content_types,
          topic_clusters: onboardingData.suggestionsFromAi?.topic_clusters,
          keywords: onboardingData.keywords,
          search_analytics: onboardingData.searchConsoleData,
          num_articles: days,
        },
        {
          timeout: 30000, // 30 second timeout
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        // response.data.data should be an array of { title, idea, combination }
        const generatedIdeas = response.data.data;
        // Assign each idea to a date starting from selectedDate
        const assignedIdeas = generatedIdeas.map((idea, index) => {
          const assignedDate = new Date(selectedDate);
          assignedDate.setDate(assignedDate.getDate() + index);
          return { ...idea, date: assignedDate };
        });
        setIdeas(assignedIdeas);
      } else {
        throw new Error(response.data.error || "Failed to generate ideas");
      }
    } catch (error) {
      let errorMessage = "Failed to generate ideas. ";
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage += "Request timed out. Please try again.";
        } else if (!error.response) {
          errorMessage += "Network error. Please check your connection.";
        } else {
          errorMessage += error.response.data?.error || error.message;
        }
      } else {
        errorMessage += error.message;
      }
      setError(errorMessage);
      console.error("Error generating ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // For displaying ideas on the calendar tiles
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const ideaForDate = ideas.find(
        (idea) => new Date(idea.date).toDateString() === date.toDateString()
      );
      if (ideaForDate) {
        return (
          <div className="idea-tile">
            <strong>{ideaForDate.title}</strong>
            <p>{ideaForDate.idea}</p>
            <div className="idea-combination">
              <em>{ideaForDate.combination}</em>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="seo-ideas-container">
      <h1 className="seo-ideas-title">Generate SEO Content Ideas Calendar</h1>

      {missingFields.length > 0 ? (
        <div className="warning-section">
          <h3>⚠️ Complete Your Onboarding</h3>
          <p>
            For the best content ideas, please complete these onboarding steps:
          </p>
          <ul>
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p className="warning-note">
            You can still generate ideas, but they may not be as targeted.
          </p>
        </div>
      ) : (
        <div className="status-section">
          <p className="success-message">✅ All onboarding data is complete!</p>
        </div>
      )}

      <p>
        Click on a date in the calendar. Then select a duration (7, 14, or 30
        days) to generate content ideas for that period. The generated ideas
        will appear on the corresponding dates.
      </p>

      <div className="calendar-container">
        <Calendar onClickDay={onDateClick} tileContent={tileContent} />
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Select Duration</h2>
            <p>How many days of content ideas do you want to generate?</p>
            <div className="modal-buttons">
              <button onClick={() => handleGenerateIdeas(7)}>7 Days</button>
              <button onClick={() => handleGenerateIdeas(14)}>14 Days</button>
              <button onClick={() => handleGenerateIdeas(30)}>30 Days</button>
            </div>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <p>Generating Ideas...</p>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default GenerateCalendarSeoIdeas;
