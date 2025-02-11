import React, { useEffect, useState } from "react";
import { useSocialMedia } from "../../../context/SocialMediaContext";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import "./FromYoutube.css";

function FromYoutube() {
  const { socialMediaProfiles, fetchSocialMediaProfiles } = useSocialMedia();
  const { authState } = useAuth();
  const { email } = authState;

  // For connected Google (YouTube) accounts (Card 2)
  const [googleSites, setGoogleSites] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [videos, setVideos] = useState([]);
  const [transcripts, setTranscripts] = useState({});
  const [loadingTranscripts, setLoadingTranscripts] = useState({});

  // Card 1: For pasting video URLs
  const [videoUrl, setVideoUrl] = useState("");
  // Array of video objects: { id, url, transcript, loadingTranscript, selected }
  const [videoUrlsList, setVideoUrlsList] = useState([]);
  // Group preview titles for selected video URLs
  const [groupPreviewTitlesUrls, setGroupPreviewTitlesUrls] = useState([]);

  // Fetch social media profiles & set the Google account (if any)
  useEffect(() => {
    const fetchProfiles = async () => {
      await fetchSocialMediaProfiles(email);
      const googleProfiles = socialMediaProfiles.filter(
        (profile) => profile.social_media_name.toLowerCase() === "google"
      );
      setGoogleSites(googleProfiles);
      if (googleProfiles.length > 0) {
        setAccessToken(googleProfiles[0]?.access_token);
      }
    };
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once accessToken is available, fetch the user's YouTube videos (Card 2)
  useEffect(() => {
    if (accessToken) {
      fetchYouTubeVideos();
    }
  }, [accessToken]);

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

  // Helper: Extract videoId from a YouTube URL
  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // =======================
  // Card 1: Paste Video URLs
  // =======================

  // Add a new video URL to the list (if valid)
  const handleAddVideoUrl = () => {
    const id = extractVideoId(videoUrl);
    if (!id) {
      alert("Invalid YouTube URL. Please enter a valid video link.");
      return;
    }
    // Avoid adding duplicates
    if (videoUrlsList.some((item) => item.id === id)) {
      alert("This video URL is already added.");
      return;
    }
    const newVideo = {
      id,
      url: videoUrl,
      transcript: null,
      loadingTranscript: false,
      selected: false,
    };
    setVideoUrlsList((prev) => [...prev, newVideo]);
    setVideoUrl(""); // clear input
  };

  // Toggle selection for a given video URL entry
  const toggleSelectUrl = (id) => {
    setVideoUrlsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Update a single video entry's transcript and loading state
  const updateVideoTranscript = (id, transcriptData) => {
    setVideoUrlsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, transcript: transcriptData } : item
      )
    );
  };

  const setVideoLoadingState = (id, isLoading) => {
    setVideoUrlsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, loadingTranscript: isLoading } : item
      )
    );
  };

  // Fetch transcript for a given video URL entry
  const fetchTranscriptForUrl = async (id) => {
    setVideoLoadingState(id, true);
    try {
      const response = await axios.get(
        "http://ai.1upmedia.com:3000/youtube/transcript",
        {
          params: { videoId: id },
        }
      );
      if (response.data && response.data.transcript) {
        updateVideoTranscript(id, {
          text: response.data.transcript,
          captionsUrl: response.data.captionsUrl,
        });
      } else {
        updateVideoTranscript(id, { text: "Transcript not available." });
      }
    } catch (error) {
      console.error("Error fetching transcript for video", id, error);
      updateVideoTranscript(id, { text: "Error fetching transcript." });
    }
    setVideoLoadingState(id, false);
  };

  // Select or deselect all video URLs in the list
  const handleSelectAllUrls = () => {
    if (videoUrlsList.every((item) => item.selected)) {
      setVideoUrlsList((prev) =>
        prev.map((item) => ({ ...item, selected: false }))
      );
    } else {
      setVideoUrlsList((prev) =>
        prev.map((item) => ({ ...item, selected: true }))
      );
    }
  };

  // Generate group preview titles for selected video URLs
  const handleGeneratePreviewsForUrls = async () => {
    const selectedVideos = videoUrlsList.filter((item) => item.selected);
    if (selectedVideos.length === 0) return;

    // Build a combined prompt. For each video, include its URL and transcript (if available)
    let prompt =
      "Generate preview titles for the following YouTube videos:\n\n";
    selectedVideos.forEach((video, idx) => {
      prompt += `Video ${idx + 1} URL: ${video.url}\n`;
      prompt += `Transcript: ${
        video.transcript ? video.transcript.text : "Transcript not available."
      }\n\n`;
    });

    const apiUrl = "https://ai.1upmedia.com:443/get-preview-titles";
    const postData = { count: 10, prompt };

    try {
      const response = await axios.post(apiUrl, postData);
      const titlesStr = response.data.titles;
      const matches = titlesStr.match(/"([^"]+)"/g);
      let titlesArray = matches
        ? matches.map((str) => str.replace(/"/g, ""))
        : titlesStr.split(",").map((s) => s.trim());
      setGroupPreviewTitlesUrls(titlesArray);
    } catch (error) {
      console.error("Error generating preview titles:", error);
    }
  };

  // =======================
  // Card 2: Connected YouTube Videos
  // =======================
  // (This card remains as before.)
  // Fetch transcript for a given video from the connected list
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
            captionsUrl: response.data.captionsUrl,
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
    <div className="from-youtube-container">
      <h1 className="from-youtube-title">From YouTube</h1>

      {/* Card 1: Paste Video URLs */}
      <div className="from-youtube-card">
        <h2 className="from-youtube-card-title">Paste Video URLs</h2>
        <div className="from-youtube-input-group">
          <input
            type="text"
            className="from-youtube-input"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Enter YouTube Video URL..."
          />
          <button className="from-youtube-button" onClick={handleAddVideoUrl}>
            Add URL
          </button>
        </div>

        {videoUrlsList.length > 0 && (
          <div className="from-youtube-url-list-container">
            <div className="from-youtube-url-list-header">
              <button
                className="from-youtube-button from-youtube-btn-select-all"
                onClick={handleSelectAllUrls}
              >
                {videoUrlsList.every((item) => item.selected)
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                className="from-youtube-button from-youtube-btn-generate"
                onClick={handleGeneratePreviewsForUrls}
                disabled={!videoUrlsList.some((item) => item.selected)}
              >
                Generate Preview Titles
              </button>
            </div>
            <ul className="from-youtube-url-list">
              {videoUrlsList.map((item) => (
                <li key={item.id} className="from-youtube-url-item">
                  <div className="from-youtube-url-header">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelectUrl(item.id)}
                    />
                    <span className="from-youtube-url-text">{item.url}</span>
                    <button
                      className="from-youtube-button from-youtube-small-button"
                      onClick={() => fetchTranscriptForUrl(item.id)}
                    >
                      Get Transcript
                    </button>
                  </div>
                  {item.loadingTranscript && (
                    <p className="from-youtube-loading">
                      Loading transcript...
                    </p>
                  )}
                  {item.transcript && (
                    <div className="from-youtube-transcript">
                      <p>{item.transcript.text}</p>
                      {item.transcript.captionsUrl && (
                        <a
                          className="from-youtube-link"
                          href={item.transcript.captionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Captions on YouTube
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {groupPreviewTitlesUrls.length > 0 && (
              <div className="from-youtube-group-previews">
                <h3>Group Preview Titles:</h3>
                <ul>
                  {groupPreviewTitlesUrls.map((title, idx) => (
                    <li key={idx}>{title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 2: Connected YouTube Videos */}
      <div className="from-youtube-card">
        <h2 className="from-youtube-card-title">Your YouTube Videos</h2>
        {accessToken ? (
          <>
            {videos.length > 0 ? (
              <ul className="from-youtube-video-list">
                {videos.map((video) => (
                  <li key={video.videoId} className="from-youtube-video-item">
                    <img
                      className="from-youtube-thumbnail"
                      src={video.thumbnail}
                      alt={video.title}
                    />
                    <div className="from-youtube-video-info">
                      <strong>{video.title}</strong>
                      <p>{video.publishedAt}</p>
                      <a
                        className="from-youtube-link"
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch Video
                      </a>
                      <button
                        className="from-youtube-button from-youtube-small-button"
                        onClick={() => fetchTranscriptForVideo(video.videoId)}
                      >
                        Get Transcript
                      </button>
                      {loadingTranscripts[video.videoId] && (
                        <p className="from-youtube-loading">
                          Loading transcript...
                        </p>
                      )}
                      {transcripts[video.videoId] && (
                        <div className="from-youtube-transcript">
                          <p>{transcripts[video.videoId].text}</p>
                          {transcripts[video.videoId].captionsUrl && (
                            <a
                              className="from-youtube-link"
                              href={transcripts[video.videoId].captionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Captions
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="from-youtube-no-videos">
                No YouTube videos found. Please connect your Google account with
                YouTube.
              </p>
            )}
          </>
        ) : (
          <p className="from-youtube-no-videos">
            Please login with a Google account that has YouTube videos.
          </p>
        )}
      </div>
    </div>
  );
}

export default FromYoutube;
