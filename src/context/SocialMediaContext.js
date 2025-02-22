import React, { createContext, useContext, useState } from "react";
import { useToast } from "./ToastProvider";
// Create Context
const SocialMediaContext = createContext();

// Provider Component
export const SocialMediaProvider = ({ children }) => {
  const [socialMediaProfiles, setSocialMediaProfiles] = useState([]);
  const [facebookPages, setFacebookPages] = useState([]);
  const [instagramProfiles, setInstagramProfiles] = useState([]);
  const [redditProfiles, setRedditProfiles] = useState([]);
  const [twitterProfiles, setTwitterProfiles] = useState([]);
  const [googleProfiles, setGoogleProfiles] = useState([]);
  const [wordpressProfiles, setWordpressProfiles] = useState([]);
  const [webflowProfiles, setWebflowProfiles] = useState([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState([]);
  const [shopifyProfiles, setShopifyProfiles] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const { PositiveToast, NegativeToast } = useToast();

  const fetchSocialMediaProfiles = async (email) => {
    setLoadingPages(true); // Show loading indicator
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/getSocialMediaCreds?email=${email}`
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
        }
        if (profile.social_media_name === "Facebook - Connected") {
          connectedFacebookPages.push(profile);
        } else if (profile.social_media_name === "Instagram") {
          connectedInstagramProfiles.push(profile);
        } else if (profile.social_media_name === "reddit") {
          setRedditProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "twitter") {
          twitterProfiles.push(profile);
        } else if (profile.social_media_name === "google") {
          setGoogleProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "wordpress") {
          wordpressProfiles.push(profile);
        } else if (profile.social_media_name === "linkedin") {
          linkedinProfiles.push(profile);
        } else if (profile.social_media_name === "webflow") {
          webflowProfiles.push(profile);
        } else if (profile.social_media_name === "shopify") {
          shopifyProfiles.push(profile);
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
        "https://ai.1upmedia.com:443/aiagent/store-social-media",
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

      await fetchSocialMediaProfiles(data.email); // Refresh state
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
        redditProfiles,
        twitterProfiles,
        linkedinProfiles,
        shopifyProfiles,
        webflowProfiles,
        googleProfiles,
        setGoogleProfiles,
        loadingPages,
        storeSocialMediaToken,
        wordpressProfiles,
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
