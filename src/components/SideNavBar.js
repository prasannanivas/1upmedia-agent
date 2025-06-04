// SideNavBar.js
import React, { useState } from "react";
import DropdownMenu from "./DropdownMenu";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiFileText,
  FiSettings,
  FiBox,
  FiActivity,
  FiBell,
  FiLogOut,
} from "react-icons/fi";

import {
  FiKey,
  FiEdit,
  FiDatabase,
  FiLayout,
  FiShield,
  FiTarget,
} from "react-icons/fi";

export const agentLinks = [
  { path: "/agents/ideation", label: "Keyword Strategy", icon: FiKey },
  { path: "/agents/content-review", label: "Keyword Review", icon: FiEdit },
  {
    path: "/agents/content-creation",
    label: "Content Creation",
    icon: FiFileText,
  },
  { path: "/RAG", label: "RAG", icon: FiDatabase },
];

export const boardLinks = [
  { path: "/boards/templated", label: "Templated", icon: FiLayout },
  { path: "/boards/custom", label: "Custom", icon: FiLayout },
];

export const integrationLinks = [
  { path: "/integrations/setup", label: "Wordpress", icon: FiFileText },
  //{ path: "/integrations/active", label: "Active Integrations", icon: FiFileText },
];

export const settingsLinks = [
  {
    path: "/settings/user-management",
    label: "User Management",
    icon: FiSettings,
  },
];

export const advancedConfigLinks = [
  {
    path: "/settings/advanced-config/security",
    label: "Security",
    icon: FiShield,
  },
];

function SideNavBar({ isMenuOpen, toggleMenu, navBarRef }) {
  const [dropdowns, setDropdowns] = useState({});
  const { unreadCount } = useNotification();
  const { logout } = useAuth();
  const location = useLocation();
  const menuItems = [
    { path: "/", label: "Dashboard", icon: FiHome },
    { path: "/commandcenter", label: "Command Center", icon: FiSettings },
    { path: "/keyword-intel", label: "Keyword Intel", icon: FiKey },
    { path: "/contentledger", label: "Content Ledger", icon: FiDatabase },
    { path: "/riskdashboard", label: "Risk Dashboard", icon: FiShield },
    { path: "/strategy-analysis", label: "Strategy Dashboard", icon: FiTarget },
    { path: "/dashboard", label: "Posts", icon: FiFileText },
    { path: "/onboarding", label: "Setup", icon: FiBox },
    { path: "/analytics", label: "Analytics", icon: FiActivity },
  ];

  const isActive = (path) => location.pathname === path;

  const menuVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -300, opacity: 0 },
  };

  const itemVariants = {
    open: (i) => ({
      opacity: 1,
      x: 0,
    }),
    closed: { opacity: 0, x: -20 },
  };

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
    <motion.div
      ref={navBarRef}
      className={`NavBar ${isMenuOpen ? "NavBar-open" : ""}`}
      initial="closed"
      animate={isMenuOpen ? "open" : "closed"}
      variants={menuVariants}
    >
      <div className="nav-header">
        <motion.div
          className="logo-container"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <h2 className="logo">AI Agent</h2>
        </motion.div>
      </div>

      <ul className="nav-items">
        <AnimatePresence>
          {menuItems.map((item, index) => (
            <motion.li
              key={item.path}
              custom={index}
              variants={itemVariants}
              initial="closed"
              animate="open"
              exit="closed"
              whileHover={{ scale: 1.02, x: 5 }}
            >
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>{" "}
                {isActive(item.path) && (
                  <motion.div
                    className="active-indicator"
                    layoutId="activeIndicator"
                  />
                )}
              </Link>
            </motion.li>
          ))}

          <DropdownMenu
            title="Agents"
            icon={<FiBox />}
            isOpen={dropdowns.agents}
            toggle={() => toggleDropdown("agents")}
            handleLinkClick={handleLinkClick}
            links={agentLinks}
          />

          <DropdownMenu
            title="Settings"
            icon={<FiSettings />}
            isOpen={dropdowns.settings}
            toggle={() => toggleDropdown("settings")}
            handleLinkClick={handleLinkClick}
            links={settingsLinks}
          />
          <DropdownMenu
            title="Integrations"
            icon={<FiSettings />}
            isOpen={dropdowns.integrations}
            toggle={() => toggleDropdown("integrations")}
            handleLinkClick={handleLinkClick}
            links={integrationLinks}
          />

          <motion.li whileHover={{ scale: 1.02, x: 5 }}>
            <Link to="/notifications" className="nav-link notification-link">
              <FiBell className="nav-icon" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <motion.span
                  className="notification-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </Link>
          </motion.li>

          <motion.li whileHover={{ scale: 1.02, x: 5 }} className="logout-item">
            <Link to="/login" onClick={logout} className="nav-link">
              <FiLogOut className="nav-icon" />
              <span>Logout</span>
            </Link>
          </motion.li>
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}

export default SideNavBar;
