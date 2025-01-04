// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    accessToken: null,
    name: null,
    profilePicture: null,
  });

  useEffect(() => {
    // Load stored session data on app load
    const token = sessionStorage.getItem("accessToken");
    const name = sessionStorage.getItem("name");
    const profilePicture = sessionStorage.getItem("profilePicture");

    if (token) {
      setAuthState({
        isLoggedIn: true,
        accessToken: token,
        name,
        profilePicture,
      });
    }
  }, []);

  const login = (token, name, profilePicture) => {
    setAuthState({
      isLoggedIn: true,
      accessToken: token,
      name,
      profilePicture,
    });
    sessionStorage.setItem("accessToken", token);
    sessionStorage.setItem("name", name);
    sessionStorage.setItem("profilePicture", profilePicture);
  };

  const logout = () => {
    setAuthState({
      isLoggedIn: false,
      accessToken: null,
      name: null,
      profilePicture: null,
    });
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profilePicture");
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
