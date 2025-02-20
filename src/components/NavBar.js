// components/NavBar.js
import React, { useState, useEffect, useRef } from "react";
import TopNavBar from "./TopNavBar";
import SideNavBar from "./SideNavBar";
import "./NavBar.css";

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navBarRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (navBarRef.current && !navBarRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="NavBar-wrapper">
      <TopNavBar isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <SideNavBar
        navBarRef={navBarRef}
        isMenuOpen={isMenuOpen}
        toggleMenu={toggleMenu}
      />
    </div>
  );
}

export default NavBar;
