import React from "react";
import CompanyLogo from "../logo1.png";
import "./Loader.css";

const Loader = () => {
  return (
    <div className="logo-loader-container">
      <img
        src={CompanyLogo} // Replace with the correct path to your logo
        alt="Loading..."
        className="logo-loader"
      />
      <p className="loader-text">Loading, please wait...</p>
    </div>
  );
};

export default Loader;
