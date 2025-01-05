// UserManagement.js
import React from "react";
import { useAuth } from "../context/AuthContext";
import "./UserManagement.css";

const UserManagement = () => {
  const { authState } = useAuth();

  const { name, profilePicture, accessToken } = authState;

  return (
    <div className="user-management-container">
      <div className="profile-card">
        <div className="profile-pic-container">
          <img
            src={profilePicture || "https://via.placeholder.com/150"}
            alt="Profile"
            className="profile-pic"
          />
        </div>
        <div className="profile-info">
          <h1 className="user-name">{name || "Anonymous User"}</h1>
          <p className="user-email">
            {accessToken ? "Logged In" : "Not Logged In"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
