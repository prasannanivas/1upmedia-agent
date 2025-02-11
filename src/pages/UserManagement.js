import React, { useEffect, useState } from "react";
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
import shopifyLogo from "../assets/shopify-logo.png";
import webflowLogo from "../assets/webflow-logo.png";
import redditLogo from "../assets/reddit-logo.png";
import Loader from "../components/Loader";

const UserManagement = () => {
  const { authState, handleRemoveAccount, handleAuthorize } = useAuth();
  const { name, profilePicture, email } = authState;
  const { socialMediaProfiles, fetchSocialMediaProfiles, loadingPages } =
    useSocialMedia();
  const [shopifyShop, setShopifyShop] = useState("");

  useEffect(() => {
    if (email) {
      fetchSocialMediaProfiles(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]); // Only run when `email` changes

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
                        : account.social_media_name === "reddit"
                        ? redditLogo
                        : account.social_media_name === "twitter"
                        ? twitterLogo
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

        <div className="auth-platform">
          <img src={redditLogo} alt="Reddit" className="platform-logo" />

          <button
            className="auth-button reddit"
            onClick={() => handleAuthorize("reddit")}
          >
            Add
          </button>
        </div>

        <div className="auth-platform">
          <img src={shopifyLogo} alt="shopify" className="platform-logo" />

          <input
            type="text"
            className="shopify-shop-name"
            placeholder="shopify shop name"
            onChange={(e) => setShopifyShop(e.target.value)}
            value={shopifyShop}
          />
          <button
            className="auth-button shopify"
            onClick={() => handleAuthorize("shopify", shopifyShop)}
          >
            {shopifyShop && "Add"}
          </button>
        </div>

        <div className="auth-platform">
          <img src={webflowLogo} alt="webflow" className="platform-logo" />

          <button
            className="auth-button webflow"
            onClick={() => handleAuthorize("webflow")}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
