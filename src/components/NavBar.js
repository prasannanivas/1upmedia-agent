// components/NavBar.js
import React, { useState, useEffect, useRef } from "react";
import TopNavBar from "./TopNavBar";
import SideNavBar from "./SideNavBar";
import BreadCrumb from "./BreadCrumb";
import "./NavBar.css";

function NavBar({ isMenuOpen, setIsMenuOpen }) {
  const navBarRef = useRef(null);

  const toggleMenu = (e) => {
    //e.stopPropagation();
    console.log("toggleMenu");
    setIsMenuOpen((prev) => !prev);
  };

  // const handleClickOutside = (event) => {
  //   event.stopPropagation();
  //   if (event.target.closest(".NavBar-toggle")) return;
  //   console.log(isMenuOpen);
  //   if (navBarRef.current && !navBarRef.current.contains(event.target)) {
  //     if (isMenuOpen) {
  //       setIsMenuOpen(false);
  //     }
  //   }
  // };

  // useEffect(() => {
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  const topNavbarStyle = {
    marginLeft: isMenuOpen ? "30%" : "0",
    width: isMenuOpen ? "calc(100% - 25%)" : "100%",
    transition:
      "margin-left 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), width 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  };

  return (
    <div className="NavBar-wrapper">
      <TopNavBar
        isMenuOpen={isMenuOpen}
        toggleMenu={toggleMenu}
        style={topNavbarStyle}
      />
      <BreadCrumb
        style={{ marginLeft: isMenuOpen ? "30%" : "0" }}
        isMenuOpen={isMenuOpen}
        toggleMenu={toggleMenu}
      />
      <SideNavBar
        navBarRef={navBarRef}
        isMenuOpen={isMenuOpen}
        toggleMenu={toggleMenu}
      />
    </div>
  );
}

export default NavBar;
