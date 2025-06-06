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
  // Add new states for confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSite, setPendingSite] = useState(null);
  const [gaProperties, setGaProperties] = useState([]);
  const [selectedGAProperty, setSelectedGAProperty] = useState(null);
  const [loadingGAProperties, setLoadingGAProperties] = useState(false);

  const { authState, handleAuthorize } = useAuth();
  const { email } = authState;

  // When modal opens, fetch connected sites and Google sites.
  useEffect(() => {
    if (isOpen) {
      fetchGoogleSites();
      fetchGAProperties();
    }
  }, [isOpen]);

  // Pre-select connected sites and GA properties when data is available
  useEffect(() => {
    if (
      connectedSites &&
      connectedSites.length > 0 &&
      gaProperties.length > 0
    ) {
      // Find and pre-select the connected GA property
      const connectedSite = connectedSites[0];
      if (connectedSite.google_analytics) {
        const matchingProperty = gaProperties.find(
          (property) =>
            property.propertyId === connectedSite.google_analytics.propertyId ||
            property.propertyName ===
              connectedSite.google_analytics.propertyName
        );
        if (matchingProperty) {
          setSelectedGAProperty(matchingProperty);
        }
      }
    }
  }, [connectedSites, gaProperties]);

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
  const storeOrUpdateSiteData = async (site, analyticsData, gaProperty) => {
    // Check if the site already exists among connected sites
    const exists = connectedSites.find((s) => s.siteUrl === site.siteUrl);
    console.log(site);
    const endpoint = exists
      ? `/aiagent/search-console/${email}/${encodeURIComponent(site.siteUrl)}`
      : `/aiagent/search-console`;
    const method = exists ? "PUT" : "POST";

    console.log("ForDomain", forDomain, endpoint, method, gaProperty);

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
          google_analytics: gaProperty,
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
    // Check if there are already connected sites
    if (connectedSites && connectedSites.length > 0) {
      // Store the site for later use and show confirmation dialog
      setPendingSite(site);
      setShowConfirmation(true);
      return;
    }

    // If no connected sites, proceed directly
    await connectSite(site, selectedGAProperty);
  };
  // Add new function to handle the actual connection after confirmation
  const connectSite = async (site, gaProperty) => {
    console.log("Fetching analytics for site:", site);
    let { siteUrl, accessToken, refreshToken } = site;
    setLoadingPages(true);
    setError(null);

    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    const startDate = lastYear.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    try {
      for (let attempt = 0; attempt < 2; attempt++) {
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

        if (response.ok) {
          const data = await response.json();
          console.log("Analytics Data:", data);

          if (data.length > 0) {
            onGSCreceived(data);
            const allKeywords = data
              .map((item) => item.keys?.[0])
              .filter(Boolean);
            const uniqueKeywords = [...new Set(allKeywords)];

            // Update site object with potentially new access token
            const updatedSite = { ...site, accessToken };

            // Store or update the site data based on its current status
            await storeOrUpdateSiteData(updatedSite, data, gaProperty);
            if (uniqueKeywords.length > 0) {
              onKeywordsSelected(uniqueKeywords);
              handleModalClose();
            } else {
              setError("No relevant keywords found.");
            }
          } else {
            setError("No keywords found.");
          }
          break; // Exit retry loop on success
        } else if (response.status === 401 && attempt === 0) {
          // Unauthorized, try refreshing the token
          console.log(
            `Access token expired for ${site.accountName}. Refreshing...`
          );
          try {
            const refreshResponse = await fetch(
              "https://ai.1upmedia.com:443/google/fetch-new-access-token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  refreshToken: refreshToken,
                }),
              }
            );

            if (refreshResponse.ok) {
              const { access_token: newAccessToken } =
                await refreshResponse.json();
              accessToken = newAccessToken; // Update the token
              console.log(`Access token refreshed for ${site.accountName}`);

              // Update the token in storage for the profile
              const profile = updatedGoogleProfiles.find(
                (p) => p.account_name === site.accountName
              );
              if (profile) {
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
              }
            } else {
              throw new Error("Failed to refresh access token");
            }
          } catch (error) {
            console.error(
              `Error refreshing access token for ${site.accountName}:`,
              error.message
            );
            setError("Failed to refresh access token. Please try again.");
            break; // Stop retrying
          }
        } else {
          // Non-401 error or failed refresh
          const errorResponse = await response.json();
          setError(errorResponse.error || "Unknown error occurred.");
          console.error(
            "Error fetching analytics:",
            errorResponse.error || "Unknown error occurred."
          );
          break; // Stop retrying
        }
      }
    } catch (error) {
      console.error("Error fetching site analytics:", error.message);
      setError("Failed to fetch analytics. Please try again.");
    } finally {
      setLoadingPages(false);
    }
  };

  // Add new function to handle the confirmation answer
  const handleConfirmation = async (confirmed) => {
    setShowConfirmation(false);

    if (confirmed && pendingSite) {
      // Delete all existing connected sites first
      try {
        await Promise.all(
          connectedSites.map((site) => deleteConnectedSite(site.siteUrl))
        );
        // Now connect the new site
        await connectSite(pendingSite, selectedGAProperty);
      } catch (error) {
        console.error("Error handling site replacement:", error);
        setError("Failed to replace connected site.");
      }
    }

    // Clear the pending site
    setPendingSite(null);
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
    handleModalClose();
  };

  // Enhanced close handler with GA property warning
  const handleModalClose = () => {
    // Check if any GA properties are available but none selected
    if (gaProperties.length > 0 && !selectedGAProperty) {
      const confirmClose = window.confirm(
        "You have Google Analytics properties available but haven't selected one. Are you sure you want to close without selecting a GA property? This will limit your analytics capabilities."
      );
      if (!confirmClose) {
        return; // Don't close the modal
      }
    }
    onClose();
  };
  // New function to fetch GA properties
  const fetchGAProperties = async () => {
    setLoadingGAProperties(true);

    const profile = updatedGoogleProfiles.find(
      (profile) => profile.social_media_name === "google"
    );

    if (!profile) {
      console.log("No Google profile found");
      setLoadingGAProperties(false);
      return;
    }

    let gaToken = profile.access_token;

    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(
          `https://ai.1upmedia.com:443/google/ga-properties?gaToken=${gaToken}`
        );

        if (response.ok) {
          const data = await response.json();
          setGaProperties(data.properties || []);
          break; // Exit retry loop on success
        } else if (response.status === 401 && attempt === 0) {
          // Unauthorized, try refreshing the token
          console.log(
            `Access token expired for ${profile.account_name}. Refreshing...`
          );
          try {
            const refreshResponse = await fetch(
              "https://ai.1upmedia.com:443/google/fetch-new-access-token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  refreshToken: profile.dynamic_fields?.refreshToken,
                }),
              }
            );

            if (refreshResponse.ok) {
              const { access_token: newAccessToken } =
                await refreshResponse.json();
              gaToken = newAccessToken; // Update the token
              console.log(`Access token refreshed for ${profile.account_name}`);

              // Call storeSocialMediaToken to update the token in storage
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
            break; // Stop retrying
          }
        } else {
          // Non-401 error or failed refresh, stop retrying
          console.error("Failed to fetch GA properties");
          break;
        }
      }
    } catch (error) {
      console.error("Error fetching GA properties:", error);
    } finally {
      setLoadingGAProperties(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Modal Header with Close Button */}
        <div className="modal-header">
          <button className="modal-close-btn-x" onClick={handleModalClose}>
            ×
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="modal-body">
          {/* Connected sites list (with delete buttons) */}
          {connectedSites.length > 0 && (
            <div className="connected-sites">
              <h4>Connected Sites</h4>
              <ul>
                {connectedSites.map((site) => (
                  <li key={site.siteUrl} className="connected-site-item">
                    <span>
                      {" "}
                      {"URL: "}
                      {site.siteUrl}
                    </span>
                    <span>
                      {"Property: "}
                      {site.google_analytics
                        ? site.google_analytics.accountName
                        : ""}{" "}
                    </span>
                    <button onClick={() => deleteConnectedSite(site.siteUrl)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}{" "}
          <h3 className="gsc-section-header">Google Search Console Accounts</h3>
          <button
            className="google-login-btn"
            onClick={() => handleGoogleLogin("google")}
          >
            Login with Google
          </button>
          {loadingPages && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading accounts...</p>
            </div>
          )}
          {googleSites.length === 0 ? (
            <p>No sites found.</p>
          ) : (
            <ul className="google-sites-list">
              {googleSites.map((site, index) => {
                const isConnected = connectedSites.some(
                  (connectedSite) => connectedSite.siteUrl === site.siteUrl
                );
                return (
                  <li key={index} className="google-site-item">
                    <img
                      src={site.profilePicture}
                      alt="Profile"
                      className="google-profile-img"
                    />
                    <span>{site.accountName}</span>
                    <span className="google-site-url">{site.siteUrl}</span>
                    <button
                      className={`google-connect-btn ${
                        isConnected ? "connected" : ""
                      }`}
                      onClick={() => fetchSiteAnalytics(site)}
                      disabled={isConnected}
                    >
                      {isConnected ? "Connected" : "Connect"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {error && <p className="error-message">❌ {error}</p>}
          <h3 className="ga-section-header">Google Analytics Properties</h3>
          {loadingGAProperties ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading GA properties...</p>
            </div>
          ) : gaProperties.length === 0 ? (
            <p>No GA properties found.</p>
          ) : (
            <ul className="ga-properties-list">
              {gaProperties.map((property) => {
                const isCurrentlyConnected = connectedSites.some(
                  (site) =>
                    site.google_analytics?.propertyId === property.propertyId
                );
                const isSelected =
                  selectedGAProperty?.propertyId === property.propertyId;

                return (
                  <li key={property.propertyId} className="ga-property-item">
                    <img
                      src="https://developers.google.com/analytics/images/terms/logo_lockup_analytics_icon_vertical_black_2x.png"
                      alt="Google Analytics"
                      className="ga-property-img"
                    />
                    <div className="ga-property-details">
                      <span className="ga-account-name">
                        {property.accountName}
                      </span>
                      <span className="ga-property-name">
                        {property.propertyName} (ID: {property.propertyId})
                      </span>
                      {property.streams && property.streams.length > 0 && (
                        <span className="ga-streams">
                          Streams:{" "}
                          {property.streams.map((s) => s.name).join(", ")}
                        </span>
                      )}
                      {isCurrentlyConnected && (
                        <span className="ga-connected-badge">
                          ✓ Currently Connected
                        </span>
                      )}
                    </div>
                    <button
                      className={`ga-select-btn ${
                        isSelected ? "selected" : ""
                      } ${isCurrentlyConnected ? "connected" : ""}`}
                      onClick={() => setSelectedGAProperty(property)}
                    >
                      {isCurrentlyConnected
                        ? "Connected"
                        : isSelected
                        ? "Selected"
                        : "Select"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Modal Footer with Close Button */}
        <div className="modal-footer">
          <button className="modal-close-btn" onClick={handleModalClose}>
            Close
          </button>
        </div>

        {/* Add confirmation dialog */}
        {showConfirmation && (
          <div className="confirmation-dialog">
            <div className="confirmation-content">
              <p>DELETE the existing connection?</p>
              <p>
                This action will remove your current site connection and connect
                the new one. Only one site can be connected at a time.
              </p>
              <div className="confirmation-buttons">
                <button onClick={() => handleConfirmation(true)}>
                  Yes, Replace It
                </button>
                <button onClick={() => handleConfirmation(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectGoogleModal;
