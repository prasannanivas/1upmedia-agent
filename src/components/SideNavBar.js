// SideNavBar.js
import React, { useState } from "react";
import DropdownMenu from "./DropdownMenu";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SideNavBar({ isMenuOpen, toggleMenu, navBarRef }) {
  const [dropdowns, setDropdowns] = useState({});

  const { logout } = useAuth();

  const toggleDropdown = (menu) => {
    setDropdowns((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleLinkClick = () => {
    toggleMenu(); // Close the side menu
  };

  return (
    <div
      ref={navBarRef}
      className={`NavBar ${isMenuOpen ? "NavBar-open" : ""}`}
      style={{ transition: "left 0.5s ease-in-out" }}
    >
      <ul>
        <li>
          <Link to="/" onClick={handleLinkClick}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/dashboard" onClick={handleLinkClick}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/onboarding" onClick={handleLinkClick}>
            Onboarding
          </Link>
        </li>
        <DropdownMenu
          title="Agents"
          isOpen={dropdowns.agents}
          toggle={() => toggleDropdown("agents")}
          handleLinkClick={handleLinkClick}
          links={[
            { path: "/agents/strategy", label: "Strategy & Analysis" },
            { path: "/agents/ideation", label: "Ideation" },
            { path: "/agents/content-creation", label: "Content Creation" },
            { path: "/agents/content-review", label: "Content Review" },
            { path: "/agents/publishing", label: "Publishing" },
            { path: "/agents/social-media", label: "Social Media" },
          ]}
        />
        <DropdownMenu
          title="Boards"
          isOpen={dropdowns.boards}
          toggle={() => toggleDropdown("boards")}
          handleLinkClick={handleLinkClick}
          links={[
            { path: "/boards/templated", label: "Templated" },
            { path: "/boards/custom", label: "Custom" },
          ]}
        />
        <li>
          <Link to="/analytics" onClick={handleLinkClick}>
            Analytics & Reports
          </Link>
        </li>
        <DropdownMenu
          title="Integrations & Connections"
          isOpen={dropdowns.integrations}
          handleLinkClick={handleLinkClick}
          toggle={() => toggleDropdown("integrations")}
          links={[
            { path: "/integrations/setup", label: "Setup Wizard" },
            { path: "/integrations/active", label: "Active Integrations" },
          ]}
        />
        <DropdownMenu
          title="Settings"
          isOpen={dropdowns.settings}
          toggle={() => toggleDropdown("settings")}
          handleLinkClick={handleLinkClick}
          links={[
            { path: "/settings/user-management", label: "User Management" },
          ]}
          nestedDropdown={{
            title: "Advanced Config",
            isOpen: dropdowns.advancedConfig,
            toggle: () => toggleDropdown("advancedConfig"),
            links: [
              {
                path: "/settings/advanced-config/security",
                label: "Security",
              },
            ],
          }}
        />
        <li>
          <Link to="/logout" onClick={logout}>
            Logout
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default SideNavBar;
