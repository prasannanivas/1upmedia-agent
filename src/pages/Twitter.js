import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TwitterAuth.css"; // Make sure this file is in the same folder

const TwitterAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [accessSecret, setAccessSecret] = useState(null); // New: store OAuth 1.0a access secret
  const [userProfile, setUserProfile] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [tweetText, setTweetText] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // Input for image URL
  const [popup, setPopup] = useState(null);

  // Listen for postMessage events from the OAuth popup
  useEffect(() => {
    const receiveMessage = (event) => {
      if (event.data && event.data.type === "twitterAuthSuccess") {
        setAccessToken(event.data.accessToken);
        setAccessSecret(event.data.accessSecret); // Store the access secret from callback
        setUserProfile(event.data.userProfile);
        if (popup) popup.close();
      }
    };
    window.addEventListener("message", receiveMessage, false);
    return () => window.removeEventListener("message", receiveMessage);
  }, [popup]);

  // Trigger OAuth login popup
  const handleLogin = () => {
    const popupWindow = window.open(
      "http://ai.1upmedia.com:3000/twitter/auth",
      "TwitterAuth",
      "width=600,height=600"
    );
    setPopup(popupWindow);
  };

  // Fetch user tweets (requires both accessToken and accessSecret)
  const fetchTweets = async () => {
    try {
      const response = await axios.get(
        "http://ai.1upmedia.com:3000/twitter/tweets",
        {
          params: { accessToken, accessSecret },
        }
      );
      // Twitter v2 endpoints usually return data inside a "data" property
      setTweets(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tweets:", error);
    }
  };

  // Post a tweet using both text and (optionally) an image URL
  const postTweet = async () => {
    try {
      await axios.post("http://ai.1upmedia.com:3000/twitter/posttweet", {
        accessToken,
        accessSecret, // Send the access secret along with the token
        tweetText,
        imageUrl, // Optional field; if provided, an image will be uploaded
      });
      setTweetText("");
      setImageUrl("");
      alert("Tweet posted successfully!");
      fetchTweets(); // Refresh tweets after posting
    } catch (error) {
      console.error("Error posting tweet:", error);
    }
  };

  return (
    <div className="container">
      {!accessToken ? (
        <button className="button" onClick={handleLogin}>
          Login with Twitter
        </button>
      ) : (
        <>
          <h2 className="heading">Welcome, {userProfile?.data?.username}</h2>
          <button className="button" onClick={fetchTweets}>
            Get My Tweets
          </button>

          {/* Post Tweet Section */}
          <div className="post-container">
            <textarea
              className="text-area"
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              placeholder="Write a tweet..."
            />
            <input
              className="input-box"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
            />
            <button className="button" onClick={postTweet}>
              Post Tweet
            </button>
          </div>

          {/* Display Tweets */}
          {tweets.length > 0 && (
            <div className="tweets-container">
              <h3>My Tweets</h3>
              <ul className="tweet-list">
                {tweets.map((tweet) => (
                  <li key={tweet.id} className="tweet-item">
                    <p>{tweet.text}</p>
                    {tweet.media_url && (
                      <img
                        src={tweet.media_url}
                        alt="Tweet media"
                        className="tweet-image"
                      />
                    )}
                    <a
                      href={`https://twitter.com/i/web/status/${tweet.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tweet-link"
                    >
                      View on Twitter
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TwitterAuth;
