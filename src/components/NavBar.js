// components/NavBar.js
import React, { useState, useEffect, useRef } from "react";
import TopNavBar from "./TopNavBar";
import SideNavBar from "./SideNavBar";
import "./NavBar.css";

function NavBar({ isMenuOpen, setIsMenuOpen }) {
  const navBarRef = useRef(null);

  const toggleMenu = (e) => {
    //e.stopPropagation();
    console.log("toggleMenu");
    setIsMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    event.stopPropagation();
    if (event.target.closest(".NavBar-toggle")) return;
    console.log(isMenuOpen);
    if (navBarRef.current && !navBarRef.current.contains(event.target)) {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
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
