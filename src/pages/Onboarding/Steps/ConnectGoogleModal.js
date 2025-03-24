import React, { useState, useEffect } from "react";
import { useSocialMedia } from "../../../context/SocialMediaContext";
import "./ConnectGoogleModal.css";
import { useAuth } from "../../../context/AuthContext";

const ConnectGoogleModal = ({
  isOpen,
  forDomain,
  onClose,
  onKeywordsSelected,
  onGSCreceived,
  connectedSites,
  setConnectedSites,
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

  // When modal opens, fetch connected sites and Google sites.
  useEffect(() => {
    if (isOpen) {
      fetchGoogleSites();
    }
  }, [isOpen]);

  useEffect(() => {
    setUpdatedGoogleProfiles(googleProfiles);
  }, [googleProfiles]);

  // Fetch connected sites from your backend (GET route)
  const fetchConnectedSites = async () => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/search-console/${email}`
      );
      if (response.ok) {
        const data = await response.json();
        setConnectedSites(data.data?.sites || []);
      }
    } catch (error) {
      console.error("Error fetching connected sites:", error);
    }
  };

  // Fetch Google sites from your API
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
                  refreshToken: profile?.dynamic_fields?.refreshToken,
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
                break;
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

  // Save or update the site data in your backend
  const storeOrUpdateSiteData = async (site, analyticsData) => {
    // Check if the site already exists among connected sites
    const exists = connectedSites.find((s) => s.siteUrl === site.siteUrl);
    console.log(site);
    const endpoint = exists
      ? `/aiagent/search-console/${email}/${encodeURIComponent(site.siteUrl)}`
      : `/aiagent/search-console`;
    const method = exists ? "PUT" : "POST";

    console.log("ForDomain", forDomain, endpoint, method);

    try {
      const response = await fetch(`https://ai.1upmedia.com:443${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          siteUrl: site.siteUrl,
          forDomain: forDomain,
          google_console: {
            siteUrl: site.siteUrl,
            accessToken: site.accessToken,
            refreshToken: site.refreshToken,
            searchConsoleData: analyticsData,
          },
        }),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Unknown error occurred.");
        throw new Error(errorResponse.error || "Unknown error occurred.");
      }
      // Refresh the connected sites list after successful store/update
      await fetchConnectedSites();
    } catch (error) {
      console.error(
        "Error storing/updating Google console data:",
        error.message
      );
      setError("Failed to store/update Google console data. Please try again.");
    }
  };

  // Fetch site analytics and then store/update the data
  const fetchSiteAnalytics = async (site) => {
    console.log("Fetching analytics for site:", site);
    const { siteUrl, accessToken } = site;
    setLoadingPages(true);
    setError(null);

    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    const startDate = lastYear.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

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
        onGSCreceived(data);
        const allKeywords = data.map((item) => item.keys?.[0]).filter(Boolean);
        const uniqueKeywords = [...new Set(allKeywords)];

        // Store or update the site data based on its current status
        await storeOrUpdateSiteData(site, data);

        if (uniqueKeywords.length > 0) {
          onKeywordsSelected(uniqueKeywords);
          onClose();
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

  // Delete a connected site by calling your DELETE route
  const deleteConnectedSite = async (siteUrl) => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/search-console/${email}/${encodeURIComponent(
          siteUrl
        )}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        await fetchConnectedSites();
      } else {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Unknown error occurred.");
      }
    } catch (error) {
      console.error("Error deleting connected site:", error);
      setError("Failed to delete connected site.");
    }
  };

  const handleGoogleLogin = (provider) => {
    handleAuthorize(provider);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Connected sites list (with delete buttons) */}
        {connectedSites.length > 0 && (
          <div className="connected-sites">
            <h4>Connected Sites</h4>
            <ul>
              {connectedSites.map((site) => (
                <li key={site.siteUrl} className="connected-site-item">
                  <span>{site.siteUrl}</span>
                  <button onClick={() => deleteConnectedSite(site.siteUrl)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

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
                  onClick={() => fetchSiteAnalytics(site)}
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
