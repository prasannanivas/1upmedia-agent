import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastProvider";
import { useSocialMedia } from "./SocialMediaContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    const token = sessionStorage.getItem("accessToken");
    const name = sessionStorage.getItem("name");
    const profilePicture = sessionStorage.getItem("profilePicture");
    const email = sessionStorage.getItem("email");

    return {
      isLoggedIn: !!token && !!email,
      accessToken: token || null,
      name: name || null,
      profilePicture: profilePicture || null,
      email: email || null,
    };
  });
  const [loading, setLoading] = useState(true); // Add a loading state
  const [redirectPath, setRedirectPath] = useState(null); // To store redirect path

  const [isWordPressModalOpen, setIsWordPressModalOpen] = useState(false);
  const navigate = useNavigate();

  const {
    fetchSocialMediaProfiles,
    storeSocialMediaToken,
    setLoadingPages,
    setInstagramProfiles,
  } = useSocialMedia();

  useEffect(() => {
    if (authState.email) fetchSocialMediaProfiles(authState.email);
  }, [authState.email]);

  const { PositiveToast } = useToast();
  useEffect(() => {
    setLoading(false);
  }, []); // Empty dependency array since we only want this to run once

  const login = (token, name, profilePicture, email) => {
    console.log("login called");
    setAuthState({
      isLoggedIn: true,
      accessToken: token,
      name,
      profilePicture,
      email,
    });
    sessionStorage.setItem("accessToken", token);
    sessionStorage.setItem("name", name);
    sessionStorage.setItem("profilePicture", profilePicture);
    sessionStorage.setItem("email", email);

    console.log(sessionStorage.getItem("email"));

    // Redirect to the saved redirect path if it exists
    if (redirectPath) {
      navigate(redirectPath);
      setRedirectPath(null); // Clear the redirect path after use
    }
  };

  const logout = () => {
    console.log("logout called");
    setAuthState({
      isLoggedIn: false,
      accessToken: null,
      name: null,
      profilePicture: null,
      email: null,
    });
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profilePicture");
    sessionStorage.removeItem("email");
  };

  const getUserLoginDetails = () => {
    if (authState.isLoggedIn && authState?.email) {
      return {
        email: authState.email,
        name: authState.name,
        profilePicture: authState.profilePicture,
      };
    } else {
      // Save the current state or URL for redirection after login
      const currentPath = window.location.pathname + window.location.search;
      setRedirectPath(currentPath); // Save the current path in state or context

      // Redirect to login page
      navigate("/");
    }
  };

  const handleRemoveAccount = async (
    socialMediaName,
    accountName,
    accessToken
  ) => {
    // setLoadingPages(true);
    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/aiagent/remove-connected-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: authState.email,
            social_media_name: socialMediaName,
            account_name: accountName,
            access_token: accessToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove connected account");
      }

      console.log(
        `Account ${accountName} (${socialMediaName}) removed successfully.`
      );
      PositiveToast(
        `Account ${accountName} (${socialMediaName}) removed successfully.`
      );
    } catch (error) {
      console.error("Error removing connected account:", error.message);
    }
    await fetchSocialMediaProfiles(authState.email); // Refresh state
    //setLoadingPages(false);
  };

  const handleAuthorize = (platform, shop = null, credentials) => {
    console.log(platform);
    if (platform === "wordpress") {
      // Directly store WordPress credentials without opening a window
      storeSocialMediaToken({
        email: authState.email,
        social_media: {
          social_media_name: platform,
          account_name: credentials.siteUrl,
          access_token: credentials.appPassword,
          profile_picture: "", // WordPress doesn't provide this
          dynamic_fields: {
            siteUrl: credentials.siteUrl,
            username: credentials.username,
            // Don't store the actual app password in dynamic_fields for security
            userId: credentials.userData?.id,
            userRoles: credentials.userData?.roles,
          },
        },
      });
      return; // Exit early for WordPress
    }

    let authUrl = "";
    let eventType = "";

    switch (platform) {
      case "linkedin":
        authUrl = "https://ai.1upmedia.com:443/linkedin/auth";
        eventType = "linkedinAuthSuccess";
        break;
      case "facebook":
        authUrl = "https://ai.1upmedia.com:443/facebook/auth";
        eventType = "facebookAuthSuccess";
        break;
      case "twitter":
        authUrl = "https://ai.1upmedia.com:443/twitter/auth";
        eventType = "twitterAuthSuccess";
        break;
      case "google":
        authUrl = "https://ai.1upmedia.com:443/google/auth";
        eventType = "googleAuthSuccess";
        break;
      case "reddit":
        authUrl = "https://ai.1upmedia.com:443/reddit/auth";
        eventType = "redditAuthSuccess";
        break;
      case "shopify":
        authUrl = `https://ai.1upmedia.com:443/shopify/auth?shop=${shop}.myshopify.com`;
        eventType = "shopifyAuthSuccess";
        break;
      case "webflow":
        authUrl = "https://ai.1upmedia.com:443/webflow/auth";
        eventType = "webflowAuthSuccess";
        break;
      default:
        return;
    }

    const authWindow = window.open(
      authUrl,
      `${platform} Auth`,
      "width=600,height=400"
    );

    window.addEventListener("message", async function handleAuthEvent(event) {
      console.log(event.data);

      if (event.data.type === "twitterAuthSuccess") {
        const { accessToken, userProfile, refreshToken } = event.data;

        await storeSocialMediaToken({
          email: authState.email,
          social_media: {
            social_media_name: "twitter",
            account_name: userProfile?.data?.name,
            profile_picture: userProfile?.data?.profile_image_url || "",
            access_token: accessToken,
            dynamic_fields: {
              id: userProfile.data.id,
              username: userProfile.data.username,
              refreshToken,
            }, // Add dynamic_fields only if refreshToken exists
          },
        });
      } else if (event.data.type === "webflowAuthSuccess") {
        const { accessToken, userProfile } = event.data;

        console.log(event.data);

        await storeSocialMediaToken({
          email: authState.email,
          social_media: {
            social_media_name: "webflow",
            access_token: accessToken,
            account_name: userProfile?.account_name,
            dynamic_fields: {
              account_id: userProfile?.id,
            },
          },
        });
      } else if (event.data.type === "redditAuthSuccess") {
        const { accessToken, userProfile, refreshToken } = event.data;

        await storeSocialMediaToken({
          email: authState.email,
          social_media: {
            social_media_name: "reddit",
            account_name: userProfile?.name,
            profile_picture: userProfile?.icon_img || "",
            access_token: accessToken,
            dynamic_fields: { subreddit: userProfile?.subreddit, refreshToken }, // Add dynamic_fields only if refreshToken exists
          },
        });
      } else if (event.data.type === "shopifyAuthSuccess") {
        console.log(event.data);
        const { accessToken, shopInfo } = event.data;

        await storeSocialMediaToken({
          email: authState.email,
          social_media: {
            social_media_name: "shopify",
            account_name: shopInfo?.name,
            access_token: accessToken,
            dynamic_fields: {
              shopInfo,
            }, // Add dynamic_fields only if refreshToken exists
          },
        });
      } else if (event.data.type === eventType) {
        console.log(event.data);
        const { accessToken, profilePicture, name, refreshToken } = event.data;

        console.log(event.data);

        await storeSocialMediaToken({
          email: authState.email,
          social_media: {
            social_media_name: platform,
            account_name: name,
            profile_picture: profilePicture || "",
            access_token: accessToken,
            ...(refreshToken && { dynamic_fields: { refreshToken } }), // Add dynamic_fields only if refreshToken exists
          },
        });

        authWindow.close();
        window.removeEventListener("message", handleAuthEvent);
        if (platform === "facebook") {
          fetchFacebookPages(accessToken);
        }
      }
    });
  };

  const fetchFacebookPages = async (accessToken) => {
    // setLoadingPages(true);
    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/facebook/getFacebookPages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ access_token: accessToken }),
        }
      );

      const data = await response.json();
      const pages = data.pages || [];
      // setFacebookPages(pages);

      for (const page of pages) {
        await storeSocialMediaToken({
          email: authState.email,
          social_media: {
            social_media_name: "Facebook - Connected",
            profile_picture: page.pagePicture,
            access_token: page.pageAccessToken,
            account_name: page.pageName,
            dynamic_fields: {
              page_id: page.pageId,
              connected_instagram: page.pageInstaAccount || null,
            },
          },
        });
        if (page.pageInstaAccount) {
          fetchInstagramProfile(page.pageInstaAccount.id, page.pageAccessToken);
        }
      }
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchInstagramProfile = async (instagramAccountId, accessToken) => {
    try {
      const response = await fetch(
        "https://ai.1upmedia.com:443/facebook/getInstagramProfileInfo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ instagramAccountId, accessToken }),
        }
      );

      const data = await response.json();
      setInstagramProfiles((prev) => ({
        ...prev,
        [instagramAccountId]: data.profileInfo,
      }));
      await storeSocialMediaToken({
        email: authState.email,
        social_media: {
          social_media_name: "Instagram",
          profile_picture: data.profileInfo.profile_picture_url,
          access_token: accessToken,
          account_name: data.profileInfo.name,
          dynamic_fields: {
            page_id: data.profileInfo.id,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching Instagram profile:", error);
    }
  };

  const handleWordPressAuth = (credentials) => {
    // Close modal
    setIsWordPressModalOpen(false);

    // Call your existing handleAuthorize with the credentials
    handleAuthorize("wordpress", null, {
      siteUrl: credentials.siteUrl,
      username: credentials.username,
      appPassword: credentials.appPassword,
      userData: credentials.userData,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        loading,
        isWordPressModalOpen,
        setIsWordPressModalOpen,
        getUserLoginDetails,
        handleRemoveAccount,
        handleWordPressAuth,
        handleAuthorize,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
