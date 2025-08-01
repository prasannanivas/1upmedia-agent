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
  const [trelloProfile, setTrelloProfile] = useState(null); // Trello profile
  const [jiraProfile, setJiraProfile] = useState(null); // Jira profile
  const [shopifyProfiles, setShopifyProfiles] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const { PositiveToast, NegativeToast } = useToast();

  // First, let's create a function to reset all profiles
  const resetAllProfiles = () => {
    setSocialMediaProfiles([]);
    setFacebookPages([]);
    setInstagramProfiles([]);
    setRedditProfiles([]);
    setTwitterProfiles([]);
    setGoogleProfiles([]);
    setWordpressProfiles([]);
    setWebflowProfiles([]);
    setLinkedinProfiles([]);
    setShopifyProfiles([]);
    setTrelloProfile(null); // Reset Trello profile
  };
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

      resetAllProfiles();

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
          setTwitterProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "google") {
          setGoogleProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "wordpress") {
          setWordpressProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "linkedin") {
          setLinkedinProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "webflow") {
          setWebflowProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "shopify") {
          setShopifyProfiles((prev) => [...prev, profile]);
        } else if (profile.social_media_name === "trello") {
          setTrelloProfile(profile); // Assuming trelloProfile is a single profile
        } else if (profile.social_media_name === "jira") {
          setJiraProfile(profile); // Jira profile
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

  // Create Trello cards from a list of items
  const createTrelloCards = async ({
    listId,
    items,
    trelloAuth = trelloProfile,
  }) => {
    console.log("Creating Trello cards with items:", items, trelloAuth);
    if (!listId || !Array.isArray(items) || items.length === 0) {
      NegativeToast("Missing listId or items for Trello card creation");
      return;
    }
    if (
      !trelloAuth?.access_token ||
      !trelloAuth?.dynamic_fields?.accessTokenSecret ||
      !trelloAuth?.dynamic_fields?.board?.id
    ) {
      console.error(
        "Missing Trello authentication tokens",
        trelloAuth?.access_token,
        trelloAuth?.dynamic_fields?.accessTokenSecret,
        trelloAuth?.dynamic_fields?.board?.id
      );
      return;
    }

    // Fetch all cards in the board first
    let existingCardNames = [];
    try {
      const cardsRes = await fetch(
        `https://ai.1upmedia.com:443/trello/cards?boardId=${
          trelloAuth.dynamic_fields.board.id
        }&accessToken=${encodeURIComponent(
          trelloAuth.access_token
        )}&accessTokenSecret=${encodeURIComponent(
          trelloAuth.dynamic_fields.accessTokenSecret
        )}`
      );
      const cardsData = await cardsRes.json();
      if (cardsData.success && Array.isArray(cardsData.cards)) {
        existingCardNames = cardsData.cards.map((card) => card.name);
      }
    } catch (err) {
      console.error("Error fetching existing cards:", err.message);
      NegativeToast("Error fetching existing cards: " + err.message);
      // Continue, but will not filter out existing cards
    }

    try {
      for (const item of items) {
        const cardName = item.name || String(item);
        if (existingCardNames.includes(cardName)) {
          console.log(`Card '${cardName}' already exists, skipping.`);
          continue;
        }
        const res = await fetch("https://ai.1upmedia.com:443/trello/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: trelloAuth.access_token,
            accessTokenSecret: trelloAuth.dynamic_fields.accessTokenSecret,
            boardId: trelloAuth?.dynamic_fields?.board?.id,

            name: cardName,
            desc: item.desc || "",
          }),
        });
        const data = await res.json();
        if (data.success) {
          PositiveToast(`Card created: ${data.card.name}`);
        } else {
          NegativeToast(`Card creation failed: ${data.error}`);
        }
      }
    } catch (err) {
      NegativeToast("Error creating Trello cards: " + err.message);
    }
  };

  return (
    <SocialMediaContext.Provider
      value={{
        socialMediaProfiles,
        setSocialMediaProfiles,
        fetchSocialMediaProfiles,
        facebookPages,
        trelloProfile,
        jiraProfile,
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
        createTrelloCards,
      }}
    >
      {children}
    </SocialMediaContext.Provider>
  );
};

// Custom Hook
export const useSocialMedia = () => useContext(SocialMediaContext);
