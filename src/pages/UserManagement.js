// UserManagement.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./UserManagement.css";
import linkedinLogo from "../assets/linkedin-logo.png";
import facebookLogo from "../assets/facebook-logo.png";
import twitterLogo from "../assets/twitter-logo.png";
import checkIcon from "../assets/check-icon.png";

const UserManagement = () => {
  const { authState } = useAuth();
  const { name, profilePicture } = authState;

  const [platformTokens, setPlatformTokens] = useState({
    linkedin: null,
    facebook: null,
    twitter: null,
  });
  const [facebookPages, setFacebookPages] = useState([]);
  const [instagramProfiles, setInstagramProfiles] = useState({});
  const [loadingFacebookPages, setLoadingFacebookPages] = useState(false);

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
      default:
        return;
    }

    const authWindow = window.open(
      authUrl,
      `${platform} Auth`,
      "width=600,height=400"
    );

    window.addEventListener("message", function handleAuthEvent(event) {
      if (event.data.type === eventType) {
        const { accessToken } = event.data;
        setPlatformTokens((prev) => ({
          ...prev,
          [platform]: accessToken,
        }));
        authWindow.close();
        window.removeEventListener("message", handleAuthEvent);
        if (platform === "facebook") {
          fetchFacebookPages(accessToken);
        }
      }
    });
  };

  const fetchFacebookPages = async (accessToken) => {
    setLoadingFacebookPages(true);
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
      setFacebookPages(pages);

      // Fetch Instagram profiles if available
      for (const page of pages) {
        if (page.pageInstaAccount) {
          fetchInstagramProfile(page.pageInstaAccount.id, page.pageAccessToken);
        }
      }
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
    } finally {
      setLoadingFacebookPages(false);
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

      <div className="authorization-section">
        <h2>Authorize Platforms</h2>
        <div className="auth-platform">
          <img src={linkedinLogo} alt="LinkedIn" className="platform-logo" />
          {platformTokens.linkedin ? (
            <img src={checkIcon} alt="Authorized" className="auth-status" />
          ) : (
            <button
              className="auth-button linkedin"
              onClick={() => handleAuthorize("linkedin")}
            >
              Authorize
            </button>
          )}
        </div>

        <div className="auth-platform">
          <img src={facebookLogo} alt="Facebook" className="platform-logo" />
          {platformTokens.facebook ? (
            <img src={checkIcon} alt="Authorized" className="auth-status" />
          ) : (
            <button
              className="auth-button facebook"
              onClick={() => handleAuthorize("facebook")}
            >
              Authorize
            </button>
          )}
        </div>

        <div className="auth-platform">
          <img src={twitterLogo} alt="Twitter" className="platform-logo" />
          {platformTokens.twitter ? (
            <img src={checkIcon} alt="Authorized" className="auth-status" />
          ) : (
            <button
              className="auth-button twitter"
              onClick={() => handleAuthorize("twitter")}
            >
              Authorize
            </button>
          )}
        </div>
      </div>

      {loadingFacebookPages ? (
        <div className="loading">Loading Facebook pages...</div>
      ) : (
        facebookPages.length > 0 && (
          <div className="facebook-pages-section">
            <h2>Facebook Pages</h2>
            <ul className="facebook-pages-list">
              {facebookPages.map((page) => (
                <li key={page.pageId} className="facebook-page-item">
                  <img
                    src={page.pagePicture}
                    alt={page.pageName}
                    className="facebook-page-pic"
                  />
                  <div className="facebook-page-info">
                    <h3>{page.pageName}</h3>
                    {page.pageInstaAccount &&
                      instagramProfiles[page.pageInstaAccount.id] && (
                        <div className="instagram-profile">
                          <img
                            src={
                              instagramProfiles[page.pageInstaAccount.id]
                                .profile_picture_url
                            }
                            alt={
                              instagramProfiles[page.pageInstaAccount.id].name
                            }
                            className="instagram-profile-pic"
                          />
                          <p>
                            {instagramProfiles[page.pageInstaAccount.id].name}
                          </p>
                        </div>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
};

export default UserManagement;
