import React, { createContext, useContext, useState, useRef } from "react";
import { useToast } from "./ToastProvider";
import { useAuth } from "./AuthContext";

const PollContext = createContext();

export const PollProvider = ({ children }) => {
  const { PositiveToast, NegativeToast } = useToast();
  const { authState } = useAuth();
  const { email } = authState;

  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const pollingInterval = useRef(null); // To manage setInterval

  const handleToast = (status, message) => {
    if (status === "positive") {
      PositiveToast(message);
    } else {
      NegativeToast(message);
    }
  };

  const pollProgress = async () => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/progress/${email}`
      );
      if (response.ok) {
        const data = await response.json();
        const { percentage, messages, status } = data.progress;

        setProgressPercentage(percentage);
        // setShowProgressBar(true);

        handleToast("positive", `Progress Update: ${messages.slice(-1)[0]}`);

        if (status === "completed") {
          stopPolling(); // Stop polling when complete
          setShowProgressBar(false);
        } else {
          pollProgress();
        }
      }
    } catch (error) {
      console.error("Error polling progress:", error);
    }
  };

  const startPolling = () => {
    if (pollingInterval.current) return; // Avoid duplicate intervals
    pollProgress(); // Initial call
    pollingInterval.current = setInterval(pollProgress, 3000); // Poll every 3 seconds
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const closeProgressBar = () => {
    setShowProgressBar(false);
    stopPolling(); // Stop polling when the user closes the bar
  };

  return (
    <PollContext.Provider
      value={{
        pollProgress,
        startPolling,
        stopPolling,
        progressPercentage,
        showProgressBar,
        closeProgressBar,
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export const usePoll = () => useContext(PollContext);
