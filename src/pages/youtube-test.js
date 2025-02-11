import React, { useEffect, useState } from "react";
import { useSocialMedia } from "../../../context/SocialMediaContext";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";

function FromYoutube() {
  const { socialMediaProfiles, fetchSocialMediaProfiles } = useSocialMedia();
  const { authState } = useAuth();
  const { email } = authState;

  const [googleSites, setGoogleSites] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [videos, setVideos] = useState([]);
  const [transcripts, setTranscripts] = useState({});
  const [loadingTranscripts, setLoadingTranscripts] = useState({});
  const [videoUrl, setVideoUrl] = useState(""); // For manual input
  const [urlTranscript, setUrlTranscript] = useState(null);
  const [loadingUrlTranscript, setLoadingUrlTranscript] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      await fetchSocialMediaProfiles(email);
      const googleProfiles = socialMediaProfiles.filter(
        (profile) => profile.social_media_name.toLowerCase() === "google"
      );

      setGoogleSites(googleProfiles);
      if (googleProfiles.length > 0) {
        setAccessToken(googleProfiles[0]?.access_token);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchYouTubeVideos();
    }
  }, []);

  const fetchYouTubeVideos = async () => {
    try {
      const response = await axios.get(
        "http://ai.1upmedia.com:3000/youtube/videos",
        {
          params: { accessToken },
        }
      );
      setVideos(response.data.videos);
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
    }
  };

  // ✅ Extract videoId from YouTube URL
  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // ✅ Fetch transcript for manually entered URL
  const fetchTranscriptFromUrl = async () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      alert("Invalid YouTube URL. Please enter a valid video link.");
      return;
    }

    setLoadingUrlTranscript(true);
    try {
      const response = await axios.get(
        "http://ai.1upmedia.com:3000/youtube/transcript",
        {
          params: { videoId },
        }
      );

      if (response.data && response.data.transcript) {
        setUrlTranscript({
          text: response.data.transcript,
          captionsUrl: response.data.captionsUrl,
        });
      } else {
        setUrlTranscript({ text: "Transcript not available." });
      }
    } catch (error) {
      console.error("Error fetching transcript:", error);
      setUrlTranscript({ text: "Error fetching transcript." });
    }
    setLoadingUrlTranscript(false);
  };

  // ✅ Fetch transcript for videos in the list
  const fetchTranscriptForVideo = async (videoId) => {
    setLoadingTranscripts((prev) => ({ ...prev, [videoId]: true }));
    try {
      const response = await axios.get(
        "http://ai.1upmedia.com:3000/youtube/transcript",
        {
          params: { videoId },
        }
      );

      if (response.data && response.data.transcript) {
        setTranscripts((prev) => ({
          ...prev,
          [videoId]: {
            text: response.data.transcript,
            captionsUrl: response.data.captionsUrl, // ✅ Store the captions link
          },
        }));
      } else {
        setTranscripts((prev) => ({
          ...prev,
          [videoId]: { text: "Transcript not available." },
        }));
      }
    } catch (error) {
      console.error("Error fetching transcript for video", videoId, error);
      setTranscripts((prev) => ({
        ...prev,
        [videoId]: { text: "Error fetching transcript." },
      }));
    }
    setLoadingTranscripts((prev) => ({ ...prev, [videoId]: false }));
  };

  return (
    <div style={styles.container}>
      <h2>FromYoutube</h2>

      {/* ✅ NEW: Input for YouTube URL */}
      <div style={styles.urlInputContainer}>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter YouTube Video URL..."
          style={styles.input}
        />
        <button
          style={styles.transcriptButton}
          onClick={fetchTranscriptFromUrl}
        >
          Get Transcript from URL
        </button>
      </div>

      {/* ✅ Show transcript from URL */}
      {loadingUrlTranscript && <p>Loading transcript...</p>}
      {urlTranscript && (
        <div style={styles.transcriptContainer}>
          <h3>Transcript:</h3>
          <p>{urlTranscript.text}</p>
          {urlTranscript.captionsUrl && (
            <a
              href={urlTranscript.captionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Captions on YouTube
            </a>
          )}
        </div>
      )}

      {/* ✅ Show user's YouTube videos */}
      {videos.length > 0 && (
        <div style={styles.videoList}>
          <h3>Latest YouTube Videos</h3>
          <ul>
            {videos.map((video) => (
              <li key={video.videoId} style={styles.videoItem}>
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={styles.thumbnail}
                />
                <strong>{video.title}</strong>
                <p>{video.publishedAt}</p>
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch Video
                </a>
                <button
                  style={styles.transcriptButton}
                  onClick={() => fetchTranscriptForVideo(video.videoId)}
                >
                  Get Transcript
                </button>
                {loadingTranscripts[video.videoId] && (
                  <p>Loading transcript...</p>
                )}
                {transcripts[video.videoId] && (
                  <div>
                    <p>{transcripts[video.videoId].text}</p>
                    <a
                      href={transcripts[video.videoId].captionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Captions on YouTube
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FromYoutube;

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  urlInputContainer: {
    marginBottom: "20px",
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  transcriptButton: {
    padding: "10px",
    backgroundColor: "#FF0000",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  transcriptContainer: {
    marginTop: "10px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9",
  },
  videoList: {
    marginTop: "20px",
  },
  videoItem: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    marginBottom: "10px",
  },
  thumbnail: {
    width: "120px",
    height: "auto",
    borderRadius: "5px",
  },
};
