// src/components/TopNavBar.js
import React from "react";
import logo from "../logo1.png";
import { useNavigate } from "react-router-dom";

function TopNavBar({ isMenuOpen, toggleMenu, style }) {
  const navigate = useNavigate();

  return (
    <header className="TopNavBar" style={style}>
      {!isMenuOpen && (
        <div
          className={`overlay ${
            isMenuOpen ? "overlay--open" : "overlay--closed"
          }`}
          onClick={toggleMenu}
        >
          <span className="overlay__icon">&#x2190;</span>
        </div>
      )}
      <div className="company-logo">
        <img onClick={() => navigate("/")} src={logo} alt="Company Logo" />
      </div>
      <button className="NavBar-toggle" onClick={toggleMenu}>
        {isMenuOpen ? "X" : "☰"}
      </button>
    </header>
  );
}

export default TopNavBar;
