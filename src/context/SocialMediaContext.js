import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastProvider";
// Create Context
const SocialMediaContext = createContext();

// Provider Component
export const SocialMediaProvider = ({ children }) => {
  const { authState } = useAuth();
  const { email } = authState;
  const [socialMediaProfiles, setSocialMediaProfiles] = useState([]);
  const [facebookPages, setFacebookPages] = useState([]);
  const [instagramProfiles, setInstagramProfiles] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const { PositiveToast, NegativeToast } = useToast();

  const fetchSocialMediaProfiles = async () => {
    setLoadingPages(true); // Show loading indicator
    try {
      const response = await fetch(
        `http://ai.1upmedia.com:3000/aiagent/getSocialMediaCreds?email=${email}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch social media data");
      }

      const data = await response.json();
      const mainAccounts = [];
      const connectedFacebookPages = [];
      const connectedInstagramProfiles = [];

      console.log(data);

      data.social_media.forEach((profile) => {
        mainAccounts.push(profile);
        // Separate main accounts and connected accounts
        if (
          ["linkedin", "facebook", "google", "twitter"].includes(
            profile.social_media_name.toLowerCase()
          )
        ) {
          // Add to main accounts
        } else if (profile.social_media_name === "Facebook - Connected") {
          connectedFacebookPages.push(profile);
        } else if (profile.social_media_name === "Instagram") {
          connectedInstagramProfiles.push(profile);
        }
      });

      // Update state for main accounts, Facebook pages, and Instagram profiles
      setSocialMediaProfiles(mainAccounts);

      // Update platform tokens for main accounts
      const updatedTokens = {};
      mainAccounts.forEach((account) => {
        updatedTokens[account.social_media_name.toLowerCase()] =
          account.access_token;
      });

      // Update Facebook pages and Instagram profiles
      setFacebookPages(connectedFacebookPages);
      setInstagramProfiles(connectedInstagramProfiles);
    } catch (error) {
      console.error("Error fetching social media profiles:", error.message);
    } finally {
      setLoadingPages(false); // Stop loading indicator
    }
  };

  const storeSocialMediaToken = async (data) => {
    try {
      const response = await fetch(
        "http://ai.1upmedia.com:3000/aiagent/store-social-media",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      console.log("Social media details stored successfully");
      PositiveToast("Social media details stored successfully");

      if (!response.ok) {
        NegativeToast("Failed to store social media details");
        throw new Error("Failed to store social media details");
      }

      await fetchSocialMediaProfiles(); // Refresh state
    } catch (error) {
      console.error("Error storing social media details:", error.message);
      NegativeToast("Error storing social media details:", error.message);
    }
  };

  return (
    <SocialMediaContext.Provider
      value={{
        socialMediaProfiles,
        setSocialMediaProfiles,
        fetchSocialMediaProfiles,
        facebookPages,
        instagramProfiles,
        loadingPages,
        storeSocialMediaToken,
        setLoadingPages,
        setFacebookPages,
        setInstagramProfiles,
      }}
    >
      {children}
    </SocialMediaContext.Provider>
  );
};

// Custom Hook
export const useSocialMedia = () => useContext(SocialMediaContext);
