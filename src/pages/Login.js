// pages/Login.js
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import googleLogo from "../assets/google-logo.png";
import facebookLogo from "../assets/facebook-logo.png";
import linkedinLogo from "../assets/linkedin-logo.png";
import companyLogo from "../logo1.png";
import "./Login.css";

const Login = () => {
  const { authState, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect logged-in users
  useEffect(() => {
    if (authState.isLoggedIn) {
      const redirectPath =
        new URLSearchParams(location.search).get("redirect") || "/";
      navigate(redirectPath); // Redirect to the original page or home if no redirect is specified
    }
  }, [authState.isLoggedIn, navigate, location.search]);

  const handleAuth = (provider) => {
    let authUrl = "";
    let eventType = "";

    switch (provider) {
      case "google":
        authUrl = "https://ai.1upmedia.com:443/google/auth";
        eventType = "googleAuthSuccess";
        break;
      case "facebook":
        authUrl = "https://ai.1upmedia.com:443/facebook/auth";
        eventType = "facebookAuthSuccess";
        break;
      case "linkedin":
        authUrl = "https://ai.1upmedia.com:443/linkedin/auth";
        eventType = "linkedinAuthSuccess";
        break;
      default:
        return;
    }

    const authWindow = window.open(
      authUrl,
      `${provider} Auth`,
      "width=600,height=400"
    );

    window.addEventListener("message", async function handleAuthEvent(event) {
      if (event.data.type === eventType) {
        console.log(event.data);
        const { accessToken, name, profilePicture, email } = event.data;
        try {
          fetch("http://ai.1upmedia.com:3000/aiagent/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              name,
              profile_picture: profilePicture,
              provider, // Pass provider name to backend
            }),
          });

          login(accessToken, name, profilePicture, email);

          const redirectPath =
            new URLSearchParams(location.search).get("redirect") || "/";
          navigate(redirectPath);

          authWindow.close();
          window.removeEventListener("message", handleAuthEvent);
        } catch (error) {
          console.error("Error storing user information:", error.message);
          authWindow.close();
          window.removeEventListener("message", handleAuthEvent);
        }
      }
    });
  };

  return (
    <div className="Login">
      <div className="Login-container">
        <div className="Login-logo">
          <img src={companyLogo} alt="Company Logo" />
        </div>
        <p>Please log in to continue</p>
        <div className="Login-buttons">
          <button
            className="Login-button google"
            onClick={() => handleAuth("google")}
          >
            <img src={googleLogo} alt="Google Logo" />
            Login with Google
          </button>
          <button
            className="Login-button facebook"
            onClick={() => handleAuth("facebook")}
          >
            <img src={facebookLogo} alt="Facebook Logo" />
            Login with Facebook
          </button>
          <button
            className="Login-button linkedin"
            onClick={() => handleAuth("linkedin")}
          >
            <img src={linkedinLogo} alt="LinkedIn Logo" />
            Login with LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
