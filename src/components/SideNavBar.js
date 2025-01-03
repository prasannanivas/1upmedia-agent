// components/SideNavBar.js
import React, { useState } from "react";
import DropdownMenu from "./DropdownMenu";
import { Link } from "react-router-dom";

function SideNavBar({ isMenuOpen }) {
  const [dropdowns, setDropdowns] = useState({});

  const toggleDropdown = (menu) => {
    setDropdowns((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  return (
    <div
      className={`NavBar ${isMenuOpen ? "NavBar-open" : ""}`}
      style={{ transition: "left 0.5s ease-in-out" }}
    >
      <ul>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <DropdownMenu
          title="Agents"
          isOpen={dropdowns.agents}
          toggle={() => toggleDropdown("agents")}
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
          links={[
            { path: "/boards/templated", label: "Templated" },
            { path: "/boards/custom", label: "Custom" },
          ]}
        />
        <li>
          <Link to="/analytics">Analytics & Reports</Link>
        </li>
        <DropdownMenu
          title="Integrations & Connections"
          isOpen={dropdowns.integrations}
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
      </ul>
    </div>
  );
}

export default SideNavBar;
