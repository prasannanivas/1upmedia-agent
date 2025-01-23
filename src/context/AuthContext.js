import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    accessToken: null,
    name: null,
    profilePicture: null,
    email: null,
  });
  const [loading, setLoading] = useState(true); // Add a loading state
  const [redirectPath, setRedirectPath] = useState(null); // To store redirect path
  const navigate = useNavigate();

  useEffect(() => {
    // Load stored session data on app load
    const token = sessionStorage.getItem("accessToken");
    const name = sessionStorage.getItem("name");
    const profilePicture = sessionStorage.getItem("profilePicture");
    const email = sessionStorage.getItem("email");
    if (token) {
      setAuthState({
        isLoggedIn: true,
        accessToken: token,
        name,
        profilePicture,
        email,
      });
    }
    setLoading(false); // Mark loading as complete
  }, []);

  const login = (token, name, profilePicture, email) => {
    console.log("login called");
    setAuthState({
      isLoggedIn: true,
      accessToken: token,
      name,
      profilePicture,
      email,
    });
    sessionStorage.setItem("accessToken", token);
    sessionStorage.setItem("name", name);
    sessionStorage.setItem("profilePicture", profilePicture);
    sessionStorage.setItem("email", email);

    console.log(sessionStorage.getItem("email"));

    // Redirect to the saved redirect path if it exists
    if (redirectPath) {
      navigate(redirectPath);
      setRedirectPath(null); // Clear the redirect path after use
    }
  };

  const logout = () => {
    setAuthState({
      isLoggedIn: false,
      accessToken: null,
      name: null,
      profilePicture: null,
      email: null,
    });
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profilePicture");
    sessionStorage.removeItem("email");
  };

  const getUserLoginDetails = () => {
    if (authState.isLoggedIn && authState.email) {
      return {
        email: authState.email,
        name: authState.name,
        profilePicture: authState.profilePicture,
      };
    } else {
      // Save the current state or URL for redirection after login
      const currentPath = window.location.pathname + window.location.search;
      setRedirectPath(currentPath); // Save the current path in state or context

      // Redirect to login page
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{ authState, login, logout, loading, getUserLoginDetails }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
