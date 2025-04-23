// SideNavBar.js
import React, { useState } from "react";
import DropdownMenu from "./DropdownMenu";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export const agentLinks = [
  { path: "/agents/ideation", label: "Keyword Strategy" },
  { path: "/agents/content-review", label: "Keyword Review" },
  { path: "/agents/content-creation", label: "Content Creation" },
  { path: "/RAG", label: "RAG" },
];

export const boardLinks = [
  { path: "/boards/templated", label: "Templated" },
  { path: "/boards/custom", label: "Custom" },
];

export const integrationLinks = [
  { path: "/integrations/setup", label: "Setup Wizard" },
  { path: "/integrations/active", label: "Active Integrations" },
];

export const settingsLinks = [
  { path: "/settings/user-management", label: "User Management" },
];

export const advancedConfigLinks = [
  { path: "/settings/advanced-config/security", label: "Security" },
];

function SideNavBar({ isMenuOpen, toggleMenu, navBarRef }) {
  const [dropdowns, setDropdowns] = useState({});
  const { unreadCount } = useNotification();
  const { logout } = useAuth();

  const toggleDropdown = (menu) => {
    setDropdowns((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleLinkClick = () => {
    //toggleMenu(); // Close the side menu
  };

  return (
    <div
      ref={navBarRef}
      className={`NavBar ${isMenuOpen ? "NavBar-open" : ""}`}
      style={{ transition: "left 0.5s ease-in-out" }}
    >
      <ul>
        <li style={{ fontWeight: "900", marginLeft: 0 }}>
          <Link style={{ marginLeft: "15px" }} to="/" onClick={handleLinkClick}>
            Profile
          </Link>
        </li>
        <li>
          <Link to="/dashboard" onClick={handleLinkClick}>
            Posts
          </Link>
        </li>
        <li>
          <Link to="/notifications" onClick={handleLinkClick}>
            Notifications{" "}
            {unreadCount > 0 && (
              <span style={{ fontWeight: "bold" }}>{unreadCount}</span>
            )}
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
          links={agentLinks}
        />
        <DropdownMenu
          title="Boards"
          isOpen={dropdowns.boards}
          toggle={() => toggleDropdown("boards")}
          handleLinkClick={handleLinkClick}
          links={boardLinks}
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
          links={integrationLinks}
        />
        <DropdownMenu
          title="Settings"
          isOpen={dropdowns.settings}
          toggle={() => toggleDropdown("settings")}
          handleLinkClick={handleLinkClick}
          links={settingsLinks}
          nestedDropdown={{
            title: "Advanced Config",
            isOpen: dropdowns.advancedConfig,
            toggle: () => toggleDropdown("advancedConfig"),
            links: advancedConfigLinks,
          }}
        />
        <li>
          <Link to="/login" onClick={logout}>
            Logout
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default SideNavBar;
