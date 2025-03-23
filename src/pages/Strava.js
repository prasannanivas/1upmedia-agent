// src/Home.js
import React, { useState, useEffect } from "react";
import connectWithStravaButton from "../assets/btn_strava_connect_with_orange.png";
import poweredbyStravaButton from "../assets/api_logo_pwrdBy_strava_horiz_orange.png";
// You also have: import compatableWithStravaButton from "../assets/api_logo_cptblWith_strava_horiz_orange.png";
// Use it if you prefer “Compatible with Strava” instead of “Powered by Strava.”

function Home() {
  // 1) State to store Strava tokens, athlete info, clubs, etc.
  const [tokens, setTokens] = useState(null); // { accessToken, refreshToken, expiresAt, athlete }
  const [clubs, setClubs] = useState([]);

  // 2) State for the "post to club" form
  const [selectedClubId, setSelectedClubId] = useState("");
  const [message, setMessage] = useState("");

  // Opens the Strava OAuth popup
  const handleLogin = () => {
    window.open(
      "https://ai.1upmedia.com:443/strava/auth",
      "StravaAuthPopup",
      "width=600,height=600"
    );
  };

  // Listen for postMessage from the popup (OAuth success)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data) return;
      // (Optional) check event.origin === "https://ai.1upmedia.com:443" in production

      if (event.data.type === "stravaAuthSuccess") {
        const { accessToken, refreshToken, expiresAt, athlete } = event.data;
        setTokens({ accessToken, refreshToken, expiresAt, athlete });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Fetch clubs with a POST to our Node route /strava/clubs
  const fetchClubs = async () => {
    if (!tokens) {
      alert("Please log in first.");
      return;
    }

    try {
      const res = await fetch("https://ai.1upmedia.com:443/strava/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        }),
      });

      if (!res.ok) {
        throw new Error("Error fetching clubs");
      }

      const data = await res.json();
      if (data.error) {
        console.error("Server error:", data.error);
        return;
      }

      // data.clubs = array of clubs, data.tokens = possibly updated tokens
      setClubs(data.clubs || []);

      // If tokens were refreshed, update local state
      if (data.tokens) {
        setTokens({
          ...tokens, // keep athlete
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          expiresAt: data.tokens.expiresAt,
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch clubs. See console for details.");
    }
  };

  // Post to a club with the selected ID
  const postToClub = async () => {
    if (!tokens) {
      alert("Please log in first.");
      return;
    }
    if (!selectedClubId || !message.trim()) {
      alert("Please select a club and type a message first.");
      return;
    }

    try {
      // We'll do a POST to /strava/clubs/:clubId/post
      const res = await fetch(
        `https://ai.1upmedia.com:443/strava/clubs/${selectedClubId}/post`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.success === false) {
        console.error("Error posting to club:", data.error || data);
        alert("Failed to post to club. Check console for details.");
        return;
      }

      // If tokens were refreshed, update local state
      if (data.tokens) {
        setTokens({
          ...tokens,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          expiresAt: data.tokens.expiresAt,
        });
      }

      alert("Successfully posted to club!");
      setMessage("");
    } catch (err) {
      console.error(err);
      alert("Error posting to club. See console for details.");
    }
  };

  return (
    <div style={{ margin: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>AI Agents by 1UP Media</h1>

      {/* 1) "Powered by Strava" brand asset */}
      <div style={{ marginBottom: "1rem" }}>
        <img
          src={poweredbyStravaButton}
          alt="Powered by Strava"
          style={{ height: 40 }}
        />
      </div>

      {/* If not logged in, show the official "Connect with Strava" button */}
      {!tokens ? (
        <div style={{ marginBottom: "2rem" }}>
          <p>You are not logged in yet.</p>
          <div
            style={{ cursor: "pointer", display: "inline-block" }}
            onClick={handleLogin}
          >
            <img
              src={connectWithStravaButton}
              alt="Connect with Strava"
              style={{ height: 48 }}
            />
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "2rem" }}>
          <p>
            Logged in as{" "}
            <strong>
              {tokens.athlete?.firstname} {tokens.athlete?.lastname}
            </strong>{" "}
            (ID: {tokens.athlete?.id})
          </p>
          <button onClick={fetchClubs} style={{ padding: "0.5rem 1rem" }}>
            Get My Clubs
          </button>
        </div>
      )}

      <h2>Your Clubs</h2>
      {clubs.length > 0 ? (
        <div>
          <ul>
            {clubs.map((club) => (
              <li key={club.id}>
                {club.name} (ID: {club.id}){" "}
                {/* Provide a "View on Strava" link as per guidelines */}
                <a
                  href={`https://www.strava.com/clubs/${club.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: "0.5rem",
                    textDecoration: "underline",
                    color: "#FC5200",
                  }}
                >
                  View on Strava
                </a>
              </li>
            ))}
          </ul>

          {/* Let user pick one to post to: */}
          <div style={{ marginTop: "1rem" }}>
            <label>
              Select a Club ID:{" "}
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                style={{ marginRight: "1rem" }}
              >
                <option value="">-- Choose a Club --</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.id})
                  </option>
                ))}
              </select>
            </label>

            <div style={{ marginTop: "1rem" }}>
              <textarea
                placeholder="Type your message here"
                rows={4}
                cols={50}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button onClick={postToClub} style={{ marginTop: "1rem" }}>
              Post Message to Selected Club
            </button>
          </div>
        </div>
      ) : (
        <p>No clubs fetched yet.</p>
      )}
    </div>
  );
}

export default Home;
