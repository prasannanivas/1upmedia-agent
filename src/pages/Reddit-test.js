import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RedditAuth.css"; // Import the Apple-style CSS

const FromReddit = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [popup, setPopup] = useState(null);
  const [subreddit, setSubreddit] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [responseMessage, setResponseMessage] = useState(null);
  const [subreddits, setSubreddits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [flairs, setFlairs] = useState([]); // Store subreddit flairs
  const [selectedFlair, setSelectedFlair] = useState(""); // Selected flair
  const [flairRestricted, setFlairRestricted] = useState(false); // New state to track restriction

  useEffect(() => {
    const receiveMessage = (event) => {
      if (event.data && event.data.type === "redditAuthSuccess") {
        setAccessToken(event.data.accessToken);
        setUserProfile(event.data.userProfile);
        if (popup) {
          popup.close();
        }
      }
    };

    window.addEventListener("message", receiveMessage, false);
    return () => window.removeEventListener("message", receiveMessage);
  }, [popup]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await axios.get(
        "http://ai.1upmedia.com:3000/reddit/search-subreddits",
        {
          params: { accessToken, query: searchQuery },
        }
      );
      setSearchResults(response.data.subreddits);
    } catch (error) {
      console.error("Error searching subreddits:", error);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    axios
      .get("http://ai.1upmedia.com:3000/reddit/subreddits", {
        params: { accessToken },
      })
      .then((response) => setSubreddits(response.data.subreddits))
      .catch((error) => console.error("Error fetching subreddits:", error));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !subreddit) return;

    axios
      .get("http://ai.1upmedia.com:3000/reddit/flairs", {
        params: { accessToken, subreddit },
      })
      .then((response) => {
        setFlairs(response.data.flairs);
        setFlairRestricted(response.data.flairRestricted); // Update state if flair is restricted
      })
      .catch((error) => console.error("Error fetching flairs:", error));
  }, [subreddit]);

  const handleLogin = () => {
    const authUrl = "http://ai.1upmedia.com:3000/reddit/auth";
    const popupWindow = window.open(
      authUrl,
      "RedditAuth",
      "width=600,height=600"
    );
    setPopup(popupWindow);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      setResponseMessage("Access token is missing. Please log in.");
      return;
    }

    try {
      const response = await axios.post(
        "http://ai.1upmedia.com:3000/reddit/post",
        {
          accessToken,
          subreddit,
          title,
          text,
          flairId: flairRestricted ? null : selectedFlair,
        }
      );
      setResponseMessage(`Post submitted successfully! 🎉`);
    } catch (error) {
      console.error("Error posting:", error);
      setResponseMessage("❌ Error submitting post.");
    }
  };

  const fetchPosts = async () => {
    if (!accessToken) return;
    try {
      const response = await axios.get(
        "http://ai.1upmedia.com:3000/reddit/posts",
        {
          params: { accessToken },
        }
      );
      setPosts(response.data.data?.children || []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Ai Agents - Reddit Auth</h1>

      {!accessToken ? (
        <button className="btn-login" onClick={handleLogin}>
          Login with Reddit
        </button>
      ) : (
        <div className="profile">
          <h2>Welcome, {userProfile?.name}</h2>
          {userProfile?.icon_img && (
            <img
              className="profile-img"
              src={userProfile.icon_img}
              alt="Profile"
            />
          )}
          <button className="btn-fetch" onClick={fetchPosts}>
            Get My Posts
          </button>

          {posts.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <h3>Your Posts:</h3>
              <ul>
                {posts.map((postWrapper, index) => {
                  const post = postWrapper.data;
                  return (
                    <li key={index} style={{ marginBottom: "1rem" }}>
                      <strong>{post.title}</strong>
                      <p>{post.selftext.substring(0, 100)}...</p>
                      <a
                        href={`https://reddit.com${post.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Reddit
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      <form className="post-form" onSubmit={handleSubmit}>
        <h2>Submit a Post</h2>

        <input
          className="input-box"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a subreddit..."
        />
        <button className="btn-search" type="button" onClick={handleSearch}>
          🔍 Search
        </button>

        {searchResults.length > 0 && (
          <ul className="dropdown">
            {searchResults.map((sub, index) => (
              <li key={index} onClick={() => setSubreddit(sub.name)}>
                {sub.name}
              </li>
            ))}
          </ul>
        )}

        <select
          className="input-box"
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
        >
          <option value="">-- Select a Subreddit --</option>
          {subreddits.map((sub, index) => (
            <option key={index} value={sub.name}>
              {sub.name}
            </option>
          ))}
        </select>

        {!flairRestricted && flairs.length > 0 && (
          <select
            className="input-box"
            value={selectedFlair}
            onChange={(e) => setSelectedFlair(e.target.value)}
          >
            <option value="">-- Select Flair --</option>
            {flairs.map((flair, index) => (
              <option key={index} value={flair.id}>
                {flair.text}
              </option>
            ))}
          </select>
        )}

        {flairRestricted && (
          <p className="flair-warning">
            ⚠️ Flair selection is restricted in this subreddit.
          </p>
        )}

        <input
          className="input-box"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post Title"
          required
        />

        <textarea
          className="input-box"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your post content here..."
        />

        <button className="btn-submit" type="submit">
          Submit Post
        </button>
      </form>

      {responseMessage && <p className="message">{responseMessage}</p>}
    </div>
  );
};

export default FromReddit;
