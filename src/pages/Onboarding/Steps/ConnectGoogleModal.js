import React, { useState, useEffect, use } from "react";
import { useSocialMedia } from "../../../context/SocialMediaContext";
import "./ConnectGoogleModal.css";
import { useAuth } from "../../../context/AuthContext";

const ConnectGoogleModal = ({
  isOpen,
  onClose,
  onKeywordsSelected,
  onGSCreceived,
}) => {
  const { googleProfiles, storeSocialMediaToken } = useSocialMedia();
  const [googleSites, setGoogleSites] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [error, setError] = useState(null);
  const [updatedGoogleProfiles, setUpdatedGoogleProfiles] = useState(
    googleProfiles || []
  );

  const { authState, handleAuthorize } = useAuth();
  const { email } = authState;

  useEffect(() => {
    if (isOpen) {
      fetchGoogleSites();
    }
  }, [isOpen]);

  useEffect(() => {
    setUpdatedGoogleProfiles(googleProfiles);
  }, [googleProfiles]);

  const fetchGoogleSites = async () => {
    setLoadingPages(true);
    try {
      const allSites = [];
      const uniqueProfiles = [
        ...new Set(updatedGoogleProfiles.map((p) => p.account_name)),
      ];

      await Promise.all(
        uniqueProfiles.map(async (profileName) => {
          const profile = updatedGoogleProfiles.find(
            (p) => p.account_name === profileName
          );
          let accessToken = profile.access_token;

          for (let attempt = 0; attempt < 2; attempt++) {
            const response = await fetch(
              `https://ai.1upmedia.com:443/google/sites?accessToken=${accessToken}`
            );

            if (response.ok) {
              let data;
              try {
                data = await response.json();
              } catch (error) {
                data = [];
              }

              allSites.push(
                ...data.map((site) => ({
                  accountName: profile.account_name,
                  profilePicture: profile.profile_picture,
                  siteUrl: site.siteUrl,
                  permissionLevel: site.permissionLevel,
                  accessToken,
                }))
              );
              break;
            } else if (response.status === 401 && attempt === 0) {
              console.log(
                `Access token expired for ${profile.account_name}. Refreshing...`
              );

              try {
                const refreshResponse = await fetch(
                  "https://ai.1upmedia.com:443/google/fetch-new-access-token",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      refreshToken: profile.dynamic_fields?.refreshToken,
                    }),
                  }
                );

                if (refreshResponse.ok) {
                  const { access_token: newAccessToken } =
                    await refreshResponse.json();
                  accessToken = newAccessToken;

                  console.log(
                    `Access token refreshed for ${profile.account_name}`
                  );

                  await storeSocialMediaToken({
                    email,
                    social_media: {
                      social_media_name: profile.social_media_name,
                      account_name: profile.account_name,
                      profile_picture: profile.profile_picture,
                      access_token: newAccessToken,
                      ...(profile.dynamic_fields?.refreshToken && {
                        dynamic_fields: {
                          refreshToken: profile.dynamic_fields.refreshToken,
                        },
                      }),
                    },
                  });
                } else {
                  throw new Error("Failed to refresh access token");
                }
              } catch (error) {
                console.error(
                  `Error refreshing access token for ${profile.account_name}:`,
                  error.message
                );
                break; // Stop retrying for this profile
              }
            } else {
              console.error(
                `Failed to fetch sites for ${profile.account_name}`
              );
              break;
            }
          }
        })
      );

      setGoogleSites(allSites);
    } catch (error) {
      console.error("Error fetching Google sites:", error);
    } finally {
      setLoadingPages(false);
    }
  };

  // Fetch Site Analytics and Extract Keywords
  const fetchSiteAnalytics = async (siteUrl, accessToken) => {
    setLoadingPages(true);
    setError(null);
    // ✅ Generate dynamic dates
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    const startDate = lastYear.toISOString().split("T")[0]; // Last year's date
    const endDate = today.toISOString().split("T")[0]; // Today's date

    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/google/sites/${encodeURIComponent(
          siteUrl
        )}/analytics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate,
            accessToken,
            set_minimum: true,
          }),
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Unknown error occurred.");
        console.error(
          "Error fetching analytics:",
          errorResponse.error || "Unknown error occurred."
        );
        return;
      }

      const data = await response.json();
      console.log("Analytics Data:", data);

      if (data.length > 0) {
        // ✅ Extract only `keys[0]` from each object
        onGSCreceived(data);
        const allKeywords = data
          .map((item) => item.keys?.[0]) // Get only first keyword
          .filter(Boolean); // Remove undefined values

        // ✅ Remove duplicates
        const uniqueKeywords = [...new Set(allKeywords)];

        if (uniqueKeywords.length > 0) {
          onKeywordsSelected(uniqueKeywords); // ✅ Pass to parent
          onClose(); // ✅ Close modal
        } else {
          setError("No relevant keywords found.");
        }
      } else {
        setError("No keywords found.");
      }
    } catch (error) {
      console.error("Error fetching site analytics:", error.message);
      setError("Failed to fetch analytics. Please try again.");
    } finally {
      setLoadingPages(false);
    }
  };

  const handleGoogleLogin = (provider) => {
    handleAuthorize(provider); // ✅ Call the `handleAuthorize` function from the `useAuth` hook
    onClose(); // ✅ Close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Select a Google Search Console Account</h3>

        <button
          className="google-login-btn"
          onClick={() => handleGoogleLogin("google")}
        >
          Login with Google
        </button>

        {loadingPages ? (
          <p>Loading accounts...</p>
        ) : googleSites.length === 0 ? (
          <p>No sites found.</p>
        ) : (
          <ul className="google-sites-list">
            {googleSites.map((site, index) => (
              <li key={index} className="google-site-item">
                <img
                  src={site.profilePicture}
                  alt="Profile"
                  className="google-profile-img"
                />
                <span>{site.accountName}</span>
                <span className="google-site-url">{site.siteUrl}</span>
                <button
                  className="google-connect-btn"
                  onClick={() =>
                    fetchSiteAnalytics(site.siteUrl, site.accessToken)
                  }
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="error-message">❌ {error}</p>}

        <button className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ConnectGoogleModal;
