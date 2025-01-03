// components/NavBar.js
import React, { useState } from "react";
import TopNavBar from "./TopNavBar";
import SideNavBar from "./SideNavBar";
import "./NavBar.css";

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div className="NavBar-wrapper">
      <TopNavBar isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <SideNavBar isMenuOpen={isMenuOpen} />
    </div>
  );
}

export default NavBar;
