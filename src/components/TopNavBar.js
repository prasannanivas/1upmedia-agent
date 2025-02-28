// components/TopNavBar.js
import React from "react";
import logo from "../logo1.png";
import { useNavigate } from "react-router-dom";

function TopNavBar({ isMenuOpen, toggleMenu }) {
  const navigate = useNavigate();

  return (
    <header className="TopNavBar">
      <div className="company-logo">
        <img onClick={() => navigate("/")} src={logo} alt="Company Logo" />
      </div>
      <button className="NavBar-toggle" onClick={(e) => toggleMenu(e)}>
        {isMenuOpen ? "X" : "☰"}
      </button>
    </header>
  );
}

export default TopNavBar;
