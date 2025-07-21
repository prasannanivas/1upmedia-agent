// DropdownMenu.js
import React from "react";
import { Link } from "react-router-dom";

function DropdownMenu({
  title,
  isOpen,
  toggle,
  links,
  icon,
  nestedDropdown,
  handleLinkClick,
  loadingItems = {},
}) {
  return (
    <li>
      <span
        onClick={toggle}
        className={`dropdown-header ${isOpen ? "active-menu" : ""}`}
      >
        {title} {isOpen ? "▼" : "▶"}
      </span>
      {isOpen && (
        <ul
          className="submenu"
          style={{ animation: "fadeIn 0.3s ease-in-out" }}
        >
          {links.map((link, index) => (
            <li className="submenu-item" key={index}>
              <Link
                to={link.path}
                state={{ fromNavBar: true, showLoading: true }}
                className={`${loadingItems[link.path] ? "loading-item" : ""}`}
                onClick={() =>
                  !loadingItems[link.path] && handleLinkClick(link.path)
                }
                style={{
                  pointerEvents: loadingItems[link.path] ? "none" : "auto",
                }}
              >
                {link.label}
                {loadingItems[link.path] && (
                  <span className="loading-spinner-small" />
                )}
              </Link>
            </li>
          ))}
          {nestedDropdown && (
            <DropdownMenu
              {...nestedDropdown} // Pass nested dropdown props
            />
          )}
        </ul>
      )}
    </li>
  );
}

export default DropdownMenu;
