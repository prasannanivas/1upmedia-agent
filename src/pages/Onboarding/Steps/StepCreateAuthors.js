import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp, FaCheckCircle } from "react-icons/fa"; // Icons for expand/tick mark
import "./StepCreateAuthors.css";
import { useAuth } from "../../../context/AuthContext";
import { useOnboarding } from "../../../context/OnboardingContext";
import Loader from "../../../components/Loader";
import RAG from "../../RAG";

const StepCreateAuthors = () => {
  const [authorName, setAuthorName] = useState("");
  const { onboardingData, setOnboardingData, loading } = useOnboarding();
  const [authorsList, setAuthorsList] = useState(onboardingData.authors || []); // Fetch authors from API
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedPersona, setExpandedPersona] = useState(null);
  const [customPersona, setCustomPersona] = useState({
    persona: "",
    writing_style: "",
    tone: "",
    emotions: "",
    experience: "",
    expertise: "",
    authoritativeness: "",
    trustworthiness: "",
  });
  const { authState } = useAuth();
  const { email } = authState;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("automated"); // State to manage active tab

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await fetch(
          "https://ai.1upmedia.com:443/aiagent/default-personas"
        );
        if (!response.ok) throw new Error("Failed to fetch personas");
        const data = await response.json();
        setPersonas(data.personas);
      } catch (error) {
        console.error("Error fetching personas:", error);
      }
    };

    if (email) {
      fetchPersonas();
    }

    setAuthorsList(onboardingData.authors);
  }, [email, onboardingData]);

  console.log(onboardingData, authorsList);
  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona);
    setExpandedSection(null); // Close modal after selection
  };

  const handleCreatePersona = () => {
    if (!customPersona.persona.trim())
      return alert("Persona Name is required!");

    setPersonas((prev) => [...prev, customPersona]);
    setSelectedPersona(customPersona);
    setCustomPersona({
      persona: "",
      writing_style: "",
      tone: "",
      emotions: "",
      experience: "",
      expertise: "",
      authoritativeness: "",
      trustworthiness: "",
    });
    setExpandedSection(null);
  };

  const handleAddAuthor = () => {
    if (!authorName.trim() || !selectedPersona) return;

    const newAuthor = { name: authorName, persona: selectedPersona };

    setAuthorsList([...authorsList, newAuthor]);

    setAuthorName("");
    setSelectedPersona(null);
  };

  const handleNext = async () => {
    try {
      await fetch("https://ai.1upmedia.com:443/aiagent/updateAuthors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          authors: authorsList,
        }),
      });

      // Update onboarding data
      setOnboardingData((prev) => ({
        ...prev,
        authors: authorsList,
      }));

      // Navigate to dashboard instead of keywords
      navigate("/");
    } catch (error) {
      console.error("Error saving authors:", error);
      // Still navigate to dashboard even if save fails
      navigate("/");
    }
  };

  return (
    <div className="authors-container">
      {loading ? (
        <div className="tab-content">
          <Loader />
        </div>
      ) : (
        <div className="tab-content">
          {activeTab === "automated" ? (
            <div className="tab-pane">
              <RAG />
              {/* Moved Next button outside of tabs */}
              <button
                onClick={handleNext}
                className={`step-create-authors-next-btn ${
                  authorsList.length === 0 ? "disabled" : ""
                }`}
                disabled={authorsList.length === 0}
              >
                Launch Content Ledger →
              </button>
            </div>
          ) : (
            <div className="tab-pane">
              <div className="step-create-authors-container">
                <h2 className="step-create-authors-title">Create Authors</h2>

                <div className="step-create-authors-input-group">
                  <input
                    type="text"
                    placeholder="Enter Author's Name"
                    className="step-create-authors-input"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                </div>

                {selectedPersona && (
                  <div className="step-create-authors-selected-persona">
                    <FaCheckCircle className="step-create-authors-check-icon" />
                    <span>{selectedPersona.persona}</span>
                  </div>
                )}

                {/* Expandable Section: Create a New Persona */}
                <div className="step-create-authors-expand-card">
                  <div
                    className="step-create-authors-card-header"
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "create" ? null : "create"
                      )
                    }
                  >
                    <strong>Create a New Persona</strong>
                    {expandedSection === "create" ? (
                      <FaChevronUp className="step-create-authors-icon" />
                    ) : (
                      <FaChevronDown className="step-create-authors-icon" />
                    )}
                  </div>

                  {expandedSection === "create" && (
                    <div className="step-create-authors-card-body">
                      {Object.keys(customPersona).map((key) => (
                        <input
                          key={key}
                          type="text"
                          placeholder={`Enter ${key
                            .replace(/_/g, " ")
                            .toUpperCase()} (e.g., ${
                            key === "persona"
                              ? "Tech Enthusiast"
                              : key === "writing_style"
                              ? "Conversational, Storytelling"
                              : key === "tone"
                              ? "Formal, Friendly"
                              : key === "emotions"
                              ? "Excitement, Inspiration"
                              : key === "experience"
                              ? "5+ years in blogging"
                              : key === "expertise"
                              ? "Bachelor's degree in Journalism"
                              : key === "authoritativeness"
                              ? "Published in Forbes, TechCrunch"
                              : key === "trustworthiness"
                              ? "Verified Testimonials, Secure Platform"
                              : ""
                          })`}
                          className="step-create-authors-input"
                          value={customPersona[key]}
                          required
                          onChange={(e) =>
                            setCustomPersona({
                              ...customPersona,
                              [key]: e.target.value,
                            })
                          }
                        />
                      ))}
                      <button
                        className="step-create-authors-create-btn"
                        onClick={handleCreatePersona}
                      >
                        Save Persona
                      </button>
                    </div>
                  )}
                </div>

                {/* Expandable Section: Choose from Existing Personas */}
                <div className="step-create-authors-expand-card">
                  <div
                    className="step-create-authors-card-header"
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "existing" ? null : "existing"
                      )
                    }
                  >
                    <strong>Choose from Existing Personas</strong>
                    {expandedSection === "existing" ? (
                      <FaChevronUp className="step-create-authors-icon" />
                    ) : (
                      <FaChevronDown className="step-create-authors-icon" />
                    )}
                  </div>

                  {expandedSection === "existing" && (
                    <div className="step-create-authors-card-body scrollable">
                      {personas.map((persona, index) => (
                        <div
                          key={index}
                          className="step-create-authors-persona-container"
                        >
                          <div
                            className={`step-create-authors-persona-card ${
                              selectedPersona === persona ? "selected" : ""
                            }`}
                            onClick={() =>
                              setExpandedPersona(
                                expandedPersona === index ? null : index
                              )
                            }
                          >
                            <strong>{persona.persona}</strong>
                            {expandedPersona === index ? (
                              <FaChevronUp className="step-create-authors-icon" />
                            ) : (
                              <FaChevronDown className="step-create-authors-icon" />
                            )}
                          </div>

                          {expandedPersona === index && (
                            <div className="step-create-authors-persona-details">
                              <p>
                                <strong>Writing Style:</strong>{" "}
                                {persona.writing_style}
                              </p>
                              <p>
                                <strong>Tone:</strong> {persona.tone}
                              </p>
                              <p>
                                <strong>Emotions:</strong>{" "}
                                {persona.emotions.join(", ")}
                              </p>
                              <h4>E-E-A-T:</h4>
                              <p>
                                <strong>Experience:</strong>{" "}
                                {persona["E-E-A-T"].Experience}
                              </p>
                              <p>
                                <strong>Expertise:</strong>{" "}
                                {persona["E-E-A-T"].Expertise}
                              </p>
                              <p>
                                <strong>Authoritativeness:</strong>{" "}
                                {persona["E-E-A-T"].Authoritativeness}
                              </p>
                              <p>
                                <strong>Trustworthiness:</strong>{" "}
                                {persona["E-E-A-T"].Trustworthiness}
                              </p>
                              <button
                                className="step-create-authors-choose-btn"
                                onClick={() => handleSelectPersona(persona)}
                              >
                                Choose this Persona
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddAuthor}
                  className={`step-create-authors-add-btn ${
                    !authorName || !selectedPersona ? "disabled" : ""
                  }`}
                  disabled={!authorName || !selectedPersona}
                >
                  Add Author
                </button>

                {/* Display Added Authors */}
                {authorsList.length > 0 && (
                  <div className="step-create-authors-list">
                    <h3>Added Authors:</h3>
                    <ul>
                      {authorsList.map((author, index) => (
                        <li key={index} className="step-create-authors-item">
                          <strong>{author.name}</strong> -{" "}
                          {author.persona.persona}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepCreateAuthors;
