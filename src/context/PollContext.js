import React, { createContext, useContext } from "react";
import { useToast } from "./ToastProvider";
import { useAuth } from "./AuthContext";

const PollContext = createContext();

export const PollProvider = ({ children }) => {
  const { PositiveToast, NegativeToast } = useToast();

  const { authState } = useAuth();
  const { email } = authState;

  const handleToast = (status, message) => {
    if (status === "positive") {
      PositiveToast(message);
    } else if (status === "negative") {
      NegativeToast(message);
    }
  };

  const pollProgress = async () => {
    console.log("polling started");
    try {
      const response = await fetch(
        `http://localhost:3000/aiagent/progress/${email}`
      );
      if (response.ok) {
        const data = await response.json();

        console.log(data.progress);
        // Handle toast for every progress update
        handleToast(
          "positive",
          `Progress Update: ${data.progress.messages.slice(-1)[0]}`
        );

        // Continue polling if status is not completed or failed

        pollProgress();
      }
    } catch (error) {
      console.error("Error polling progress:", error);
      // handleToast("negative", "Error polling progress. Retrying...");
      setTimeout(pollProgress, 3000); // Retry after 5 seconds
    }
  };

  return (
    <PollContext.Provider value={{ pollProgress }}>
      {children}
    </PollContext.Provider>
  );
};

export const usePoll = () => useContext(PollContext);
