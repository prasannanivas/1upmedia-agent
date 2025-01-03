// components/TopNavBar.js
import React from "react";
import logo from "../logo1.png";

function TopNavBar({ isMenuOpen, toggleMenu }) {
  return (
    <header className="TopNavBar">
      <div className="company-logo">
        <img src={logo} alt="Company Logo" />
      </div>
      <button className="NavBar-toggle" onClick={toggleMenu}>
        {isMenuOpen ? "X" : "☰"}
      </button>
    </header>
  );
}

export default TopNavBar;
