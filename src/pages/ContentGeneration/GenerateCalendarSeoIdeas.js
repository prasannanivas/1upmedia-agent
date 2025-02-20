import React, { useState } from "react";
import Calendar from "react-calendar";
import axios from "axios";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAuth } from "../../context/AuthContext";
import { usePoll } from "../../context/PollContext";
import { motion } from "framer-motion";
import format from "date-fns/format";
import "react-calendar/dist/Calendar.css";
import "./GenerateCalendarSeoIdeas.css";

// Add this new component for the detailed view modal
const IdeaDetailModal = ({ idea, onClose }) => {
  if (!idea) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="idea-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          ×
        </button>
        <div className="idea-detail-content">
          <h2 className="idea-detail-title">{idea.title}</h2>
          <div className="idea-detail-meta">
            <span className="idea-detail-date">
              Scheduled for: {format(new Date(idea.date), "MMMM dd, yyyy")}
            </span>
          </div>
          <div className="idea-detail-description">
            <h3>Content Idea</h3>
            <p>{idea.idea}</p>
          </div>
          <div className="idea-detail-tags">
            <h3>Strategy Combination</h3>
            <span className="tag large">{idea.combination}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// In your main component, add state for the selected idea modal:

const IdeaCard = ({ idea, isExpanded, onToggle, onSelect, onDragStart }) => {
  return (
    <div
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify(idea));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(idea);
        e.currentTarget.classList.add("dragging");
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove("dragging");
      }}
      className={`idea-card ${idea.selected ? "selected" : ""} ${
        isExpanded ? "expanded" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(idea.id);
      }}
    >
      <div className="idea-drag-handle">☰</div>
      <div className="idea-header">
        <div className="idea-title">{idea.title}</div>
        <div className="idea-checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={idea.selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(idea.id);
            }}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="idea-details">
          <p className="idea-description">{idea.idea}</p>
          <div className="idea-meta">
            <span className="tag">{idea.combination}</span>
            <span className="idea-date">
              {format(new Date(idea.date), "MMM dd")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const GenerateCalendarSeoIdeas = () => {
  const { onboardingData } = useOnboarding();
  const { authState } = useAuth();
  const { startPolling } = usePoll();
  const [selectedDate, setSelectedDate] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentGenerationStatus, setContentGenerationStatus] = useState(null);
  const [expandedIdeas, setExpandedIdeas] = useState(new Set());
  const [draggedIdea, setDraggedIdea] = useState(null);
  const [selectedIdeaForModal, setSelectedIdeaForModal] = useState(null);

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

  const handleIdeaClick = (e, idea) => {
    //console.log(e);
    //e?.stopPropagation();
    setSelectedIdeaForModal(idea);
  };

  const onDateClick = (date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleDragStart = (idea) => {
    setDraggedIdea(idea);
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    const droppedIdea = JSON.parse(e.dataTransfer.getData("application/json"));

    setIdeas((prevIdeas) =>
      prevIdeas.map((idea) =>
        idea.id === droppedIdea.id ? { ...idea, date: targetDate } : idea
      )
    );

    setDraggedIdea(null);
    e.currentTarget.classList.remove("drag-over");
  };

  const toggleIdeaExpansion = (ideaId) => {
    setExpandedIdeas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      return newSet;
    });
  };

  const toggleIdeaSelection = (ideaId) => {
    setIdeas((prevIdeas) =>
      prevIdeas.map((idea) =>
        idea.id === ideaId ? { ...idea, selected: !idea.selected } : idea
      )
    );

    setSelectedIdeas((prevSelected) => {
      const idea = ideas.find((idea) => idea.id === ideaId);
      return idea.selected
        ? prevSelected.filter((id) => id !== ideaId)
        : [...prevSelected, ideaId];
    });
  };

  const handleSelectAll = () => {
    const allSelected = ideas.every((idea) => idea.selected);
    setIdeas((prevIdeas) =>
      prevIdeas.map((idea) => ({ ...idea, selected: !allSelected }))
    );
    setSelectedIdeas(!allSelected ? ideas.map((idea) => idea.id) : []);
  };

  const handleGenerateIdeas = async (days) => {
    setModalOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://ai.1upmedia.com:3000/aiagent/generate-seo-ideas",
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
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        const generatedIdeas = response.data.data.map((idea, index) => ({
          ...idea,
          id: index,
          selected: false,
          date: new Date(selectedDate.getTime() + index * 24 * 60 * 60 * 1000),
        }));
        setIdeas(generatedIdeas);
        setSelectedIdeas([]);
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

  const handleGenerateContent = async () => {
    if (selectedIdeas.length === 0) {
      setContentGenerationStatus("Please select at least one idea first.");
      setTimeout(() => setContentGenerationStatus(null), 3000);
      return;
    }

    setGeneratingContent(true);
    setContentGenerationStatus(
      `Generating content for ${selectedIdeas.length} selected ideas...`
    );

    try {
      const selectedIdeaObjects = ideas.filter((idea) =>
        selectedIdeas.includes(idea.id)
      );

      startPolling();
      const response = await axios.post(
        "http://ai.1upmedia.com:3000/aiagent/generateContentFromIdeas",
        {
          email: authState.email,
          ideas: selectedIdeaObjects,
          businessDetails: onboardingData.businessDetails,
          keywords: onboardingData.keywords,
          domain: onboardingData.domain,
        },
        {
          timeout: 120000,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        setContentGenerationStatus(
          `Successfully generated content for ${selectedIdeas.length} ideas!`
        );
        setTimeout(() => setContentGenerationStatus(null), 3000);
      } else {
        throw new Error(response.data.error || "Failed to generate content");
      }
    } catch (error) {
      let errorMessage = "Failed to generate content. ";
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage += "Request timed out. Please try again.";
        } else if (!error.response) {
          errorMessage += "Network error. Please check your connection.";
        } else {
          errorMessage += error.response?.data?.error || error.message;
        }
      } else {
        errorMessage += error.message;
      }
      setContentGenerationStatus(errorMessage);
      setTimeout(() => setContentGenerationStatus(null), 5000);
      console.error("Error generating content:", error);
    } finally {
      setGeneratingContent(false);
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const ideasForDate = ideas.filter(
        (idea) => new Date(idea.date).toDateString() === date.toDateString()
      );

      return (
        <div
          className={`calendar-tile ${
            ideasForDate.length > 0 ? "has-ideas" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("drag-over");
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("drag-over");
          }}
          onDrop={(e) => handleDrop(e, date)}
        >
          <div className="ideas-container">
            {ideasForDate.map((idea, index) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isExpanded={expandedIdeas.has(idea.id)}
                onToggle={(e) => handleIdeaClick(e, idea)}
                onSelect={toggleIdeaSelection}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="seo-ideas-container">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="seo-ideas-title"
      >
        Content Calendar
      </motion.h1>

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

      <div className="calendar-controls">
        <p className="calendar-instructions">
          <span className="instruction-icon">📅</span>
          Click a date to generate ideas or drag existing ideas to reschedule
        </p>
        {ideas.length > 0 && (
          <div className="ideas-actions">
            <button className="select-all-button" onClick={handleSelectAll}>
              {ideas.every((idea) => idea.selected)
                ? "Deselect All"
                : "Select All"}
            </button>
            <div className="selection-count">
              {selectedIdeas.length} of {ideas.length} selected
            </div>
          </div>
        )}
      </div>

      <div className="calendar-container">
        <Calendar
          onClickDay={onDateClick}
          tileContent={tileContent}
          className="custom-calendar"
        />
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

      {isLoading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-spinner"></div>
            <p>Generating Ideas...</p>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {contentGenerationStatus && (
        <div
          className={`status-message ${
            contentGenerationStatus.includes("Failed") ? "error" : "success"
          }`}
        >
          {contentGenerationStatus}
        </div>
      )}

      {ideas.length > 0 && selectedIdeas.length > 0 && (
        <div className="generate-content-section">
          <button
            className="generate-content-button"
            onClick={handleGenerateContent}
            disabled={generatingContent || selectedIdeas.length === 0}
          >
            {generatingContent
              ? "Generating Content..."
              : `Generate Content (${selectedIdeas.length})`}
          </button>
        </div>
      )}

      {selectedIdeaForModal && (
        <IdeaDetailModal
          idea={selectedIdeaForModal}
          onClose={() => setSelectedIdeaForModal(null)}
        />
      )}
    </div>
  );
};

export default GenerateCalendarSeoIdeas;
