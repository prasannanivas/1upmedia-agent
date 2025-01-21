import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastProvider";
import { useSocialMedia } from "../context/SocialMediaContext";
import "./UserManagement.css";
import linkedinLogo from "../assets/linkedin-logo.png";
import facebookLogo from "../assets/facebook-logo.png";
import twitterLogo from "../assets/twitter-logo.png";
import googleLogo from "../assets/google-logo.png";
import wordpressLogo from "../assets/wordpress-logo.png";
import instagramLogo from "../assets/instagram-logo.png";
import Loader from "../components/Loader";

const UserManagement = () => {
  const { authState } = useAuth();
  const { PositiveToast, NegativeToast } = useToast();
  const { name, profilePicture, email } = authState;
  const {
    socialMediaProfiles,
    fetchSocialMediaProfiles,
    setInstagramProfiles,
    setLoadingPages,
    loadingPages,
    storeSocialMediaToken,
  } = useSocialMedia();

  useEffect(() => {
    if (email) {
      fetchSocialMediaProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]); // Only run when `email` changes

  const handleRemoveAccount = async (
    socialMediaName,
    accountName,
    accessToken
  ) => {
    // setLoadingPages(true);
    try {
      const response = await fetch(
        "http://ai.1upmedia.com:3000/aiagent/remove-connected-account",
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
    await fetchSocialMediaProfiles(); // Refresh state
    //setLoadingPages(false);
  };

  const handleAuthorize = (platform) => {
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
      default:
        return;
    }

    const authWindow = window.open(
      authUrl,
      `${platform} Auth`,
      "width=600,height=400"
    );

    window.addEventListener("message", async function handleAuthEvent(event) {
      if (event.data.type === eventType) {
        console.log(event.data);
        const { accessToken, profilePicture, name, refreshToken } = event.data;

        await storeSocialMediaToken({
          email,
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
          email,
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
        email,
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

  return (
    <div className="user-management-container">
      <div className="profile-card">
        <div className="profile-pic-container">
          <img
            src={profilePicture || "https://via.placeholder.com/150"}
            alt="Profile"
            className="profile-pic"
          />
        </div>
        <div className="profile-info">
          <h1 className="user-name">{name || "Anonymous User"}</h1>
        </div>
      </div>

      {loadingPages ? (
        <Loader />
      ) : (
        socialMediaProfiles.length > 0 && (
          <div className="connected-accounts-section">
            <h2>Connected Accounts</h2>
            <ul className="connected-accounts-list">
              {socialMediaProfiles.map((account) => (
                <li
                  key={account.access_token + account.social_media_name}
                  className="connected-account-item"
                >
                  <img
                    src={
                      account.social_media_name === "facebook" ||
                      account.social_media_name === "Facebook - Connected"
                        ? facebookLogo
                        : account.social_media_name === "linkedin"
                        ? linkedinLogo
                        : account.social_media_name === "google"
                        ? googleLogo
                        : account.social_media_name === "Instagram"
                        ? instagramLogo
                        : account.social_media_name === "WordPress"
                        ? wordpressLogo
                        : "https://via.placeholder.com/50" // Default for unknown platforms
                    }
                    alt={account.social_media_name}
                    className="connected-platform-logo"
                  />
                  <img
                    src={
                      account.profile_picture ||
                      "https://via.placeholder.com/50"
                    }
                    alt={account.account_name}
                    className="connected-profile-pic"
                  />
                  <div className="connected-account-info">
                    <h3>{account.account_name}</h3>
                    <p>{account.social_media_name}</p>
                  </div>
                  <button
                    className="remove-button"
                    onClick={() =>
                      handleRemoveAccount(
                        account.social_media_name,
                        account.account_name,
                        account.access_token
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      <div className="authorization-section">
        <h2>Authorize Platforms</h2>
        <div className="auth-platform">
          <img src={linkedinLogo} alt="LinkedIn" className="platform-logo" />

          <button
            className="auth-button linkedin"
            onClick={() => handleAuthorize("linkedin")}
          >
            Add
          </button>
        </div>

        <div className="auth-platform">
          <img src={facebookLogo} alt="Facebook" className="platform-logo" />
          <button
            className="auth-button facebook"
            onClick={() => handleAuthorize("facebook")}
          >
            Add
          </button>
        </div>

        <div className="auth-platform">
          <img src={googleLogo} alt="Google" className="platform-logo" />
          <button
            className="auth-button google"
            onClick={() => handleAuthorize("google")}
          >
            Add
          </button>
        </div>

        <div className="auth-platform">
          <img src={twitterLogo} alt="Twitter" className="platform-logo" />

          <button
            className="auth-button twitter"
            onClick={() => handleAuthorize("twitter")}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
