// pages/Login.js
import React, { useState, useEffect } from "react";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect logged-in users
  useEffect(() => {
    if (authState.isLoggedIn) {
      const redirectPath =
        new URLSearchParams(location.search).get("redirect") || "/";
      navigate(redirectPath);
    }
  }, [authState.isLoggedIn, navigate, location.search]);

  // OAuth Login Handling
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
      console.log(event.data);
      if (event.data.type === eventType) {
        console.log(event.data);
        const { accessToken, name, profilePicture, email } = event.data;
        try {
          fetch("https://ai.1upmedia.com:443/aiagent/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              name,
              profile_picture: profilePicture,
              provider,
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

  // Handle Email & Password Login
  const handleEmailLogin = () => {
    if (email !== "test@1upmedia.com" || email === "adamtest@1upmedia.com") {
      setErrorMessage("Invalid email. Only 'test@1upmedia.com' is allowed.");
      return;
    }

    // Call login with hardcoded credentials
    login(
      "acesss",
      "test",
      "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png",
      email
    );

    // Redirect after login
    const redirectPath =
      new URLSearchParams(location.search).get("redirect") || "/";
    navigate(redirectPath);
  };

  return (
    <div className="Login">
      <div className="app-intro">
        <h1>Welcome to 1Up Media's AI Agent</h1>
        <h3>
          {" "}
          Your AI-powered assistant to streamline content, research, and
          strategy in one place.
        </h3>
        <h2>Learn More About 1UP AI</h2>
        <div className="video-wrapper-login">
          <iframe
            src="https://www.youtube.com/embed/SvbIsQ00laM"
            title="About 1UP AI"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <div className="Login-container">
        <div className="Login-logo">
          <img src={companyLogo} alt="Company Logo" />
        </div>
        <p>Please log in to continue</p>

        {/* Email & Password Login */}
        <div className="Login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="Login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="Login-input"
          />
          {errorMessage && <p className="Login-error">{errorMessage}</p>}
          <button onClick={handleEmailLogin} className="Login-button email">
            Login with Email
          </button>
        </div>

        {/* OAuth Login Buttons */}
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
      <footer className="Login-footer">
        <div className="footer-links">
          <a href="/#/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          <span className="separator">•</span>
          <a href="/#/terms/" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
        </div>
        <div className="footer-info">
          <p>
            &copy; {new Date().getFullYear()} 1Up Media. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
