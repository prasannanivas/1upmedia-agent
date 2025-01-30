import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; // Ensure correct import

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const { authState } = useAuth();
  const { email } = authState;
  const [loading, setLoading] = useState(true);

  const [onboardingData, setOnboardingData] = useState({
    domain: "",
    language: "",
    location: "",
    integrations: [],
    keywords: [],
    businessDetails: "",
    socialIntegrations: [],
    contentStrategy: {},
    authors: [],
  });

  useEffect(() => {
    const fetchOnboardingData = async () => {
      try {
        if (!email) return;

        // Fetch Business Details
        const businessResponse = await axios.get(
          "http://ai.1upmedia.com:3000/aiagent/getBusinessDetails",
          { params: { email } }
        );

        if (businessResponse.data && businessResponse.data.length > 0) {
          const firstSite = businessResponse.data[0];

          setOnboardingData((prev) => ({
            ...prev,
            domain: firstSite.URL || "",
            location: firstSite.location || "",
            keywords: firstSite.keywords || [],
            businessDetails: firstSite.business_details || "",
          }));
        }

        // Fetch Authors
        const authorsResponse = await fetch(
          `http://ai.1upmedia.com:3000/aiagent/getAuthors?email=${email}`
        );
        if (authorsResponse.ok) {
          const authorsData = await authorsResponse.json();
          setOnboardingData((prev) => ({
            ...prev,
            authors: authorsData || [],
          }));
        }
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchOnboardingData();
    }
  }, [email]);

  // ✅ Function to Calculate Profile Completion Percentage
  const getPercentageProfileCompletion = () => {
    const totalFields = 6; // Total expected fields for full completion
    let completedFields = 0;

    console.log(onboardingData);
    if (onboardingData.domain.trim()) completedFields++;
    if (onboardingData.location.trim()) completedFields++;
    if (onboardingData.keywords.length > 0) completedFields++;
    if (onboardingData.businessDetails.trim()) completedFields++;
    if (onboardingData.authors.length > 0) completedFields++;

    // If all fields are empty, return 0%
    if (completedFields === 0) return 0;

    return Math.round((completedFields / totalFields) * 100); // Return as percentage
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        setOnboardingData,
        loading,
        getPercentageProfileCompletion,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
