import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocialMedia } from "../../context/SocialMediaContext";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";

function Analytics() {
  const {
    socialMediaProfiles,
    fetchSocialMediaProfiles,
    setLoadingPages,
    loadingPages,
    storeSocialMediaToken,
  } = useSocialMedia();
  const [googleSites, setGoogleSites] = useState([]);
  const navigate = useNavigate();
  const { getUserLoginDetails } = useAuth();
  const { email } = getUserLoginDetails();

  useEffect(() => {
    fetchSocialMediaProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchGoogleSites = async () => {
      const googleProfiles = socialMediaProfiles.filter(
        (profile) => profile.social_media_name.toLowerCase() === "google"
      );

      if (googleProfiles.length === 0) {
        console.log("No Google profiles found");
        return;
      }

      setLoadingPages(true);
      try {
        const allSites = [];

        const siteFetchPromises = googleProfiles.map(async (profile) => {
          let accessToken = profile.access_token;

          for (let attempt = 0; attempt < 2; attempt++) {
            const response = await fetch(
              `http://ai.1upmedia.com:3000/google/sites?accessToken=${accessToken}`
            );

            if (response.ok) {
              // Successfully fetched sites
              let data;
              try {
                data = await response.json();
              } catch (error) {
                data = [];
              }

              allSites.push(
                // eslint-disable-next-line no-loop-func
                ...data.map((site) => ({
                  accountName: profile.account_name,
                  profilePicture: profile.profile_picture,
                  siteUrl: site.siteUrl,
                  permissionLevel: site.permissionLevel,
                  accessToken,
                }))
              );
              break; // Exit retry loop on success
            } else if (response.status === 401 && attempt === 0) {
              // Unauthorized, try refreshing the token
              console.log(
                `Access token expired for ${profile.account_name}. Refreshing...`
              );
              try {
                const refreshResponse = await fetch(
                  "http://ai.1upmedia.com:3000/google/fetch-new-access-token",
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
                  accessToken = newAccessToken; // Update the token
                  console.log(
                    `Access token refreshed for ${profile.account_name}`
                  );

                  // Call storeSocialMediaToken to update the token in storage
                  console.log("saving", profile.account_name);
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
              // Non-401 error or failed refresh, stop retrying
              console.error(
                `Failed to fetch sites for ${profile.account_name}`
              );
              break;
            }
          }
        });

        await Promise.all(siteFetchPromises);
        setGoogleSites(allSites);
      } catch (error) {
        console.error("Error fetching Google sites:", error.message);
      } finally {
        setLoadingPages(false);
      }
    };

    fetchGoogleSites();
  }, [socialMediaProfiles]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Analytics</h1>
      {loadingPages ? (
        <Loader />
      ) : googleSites.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {googleSites.map((site, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                marginBottom: "15px",
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <img
                  src={site.profilePicture || "https://via.placeholder.com/50"}
                  alt={`${site.accountName}'s Profile`}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    marginRight: "15px",
                  }}
                />
                <div style={{ flexGrow: 1 }}>
                  <p style={{ margin: 0, fontWeight: "bold" }}>
                    Account: {site.accountName}
                  </p>
                  <p style={{ margin: "5px 0 0", color: "#1a73e8" }}>
                    Site URL: {site.siteUrl}
                  </p>
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontWeight: "bold",
                      color:
                        site.permissionLevel === "siteOwner"
                          ? "#0f9d58"
                          : site.permissionLevel === "siteFullUser"
                          ? "#fbbc05"
                          : "#ea4335",
                    }}
                  >
                    Permission Level: {site.permissionLevel}
                  </p>
                </div>
              </div>

              {/* Buttons for View Metrics and Stats */}
              <div style={{ display: "flex", marginTop: "15px", gap: "10px" }}>
                <button
                  onClick={() =>
                    navigate("/site-details", {
                      state: { siteDetails: site },
                    })
                  }
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#1a73e8",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  View Metrics
                </button>
                <button
                  onClick={() =>
                    navigate("/site-stats", {
                      state: { siteDetails: site },
                    })
                  }
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#34a853",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Stats
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No Google sites found.</p>
      )}
    </div>
  );
}

export default Analytics;
