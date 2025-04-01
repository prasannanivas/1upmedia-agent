// src/components/TopNavBar.js
import React, { useState, useRef, useEffect } from "react";
import logo from "../logo1.png";
import { useNavigate, Link, useLocation } from "react-router-dom";

const searchRoutes = (query) => {
  if (!query) return [];

  const allRoutes = [
    {
      path: "/",
      label: "Home",
      keywords: "homepage main landing dashboard start welcome home page index",
    },
    {
      path: "/dashboard",
      label: "Dashboard",
      keywords:
        "overview summary stats dashboard metrics analytics home main view visualization charts graphs",
    },
    {
      path: "/notifications",
      label: "Notifications",
      keywords:
        "alerts messages updates notifications inbox alerts system messages bell notifications center",
    },
    {
      path: "/agents",
      label: "Agents",
      keywords:
        "ai automation bots artificial intelligence virtual agents assistants chatbots automation tools",
    },
    {
      path: "/boards",
      label: "Boards",
      keywords:
        "kanban tasks management projects boards workflow task lists agile scrum sprint planning",
    },
    {
      path: "/analytics",
      label: "Analytics",
      keywords:
        "reports statistics metrics data insights analysis dashboard charts visualization tracking performance",
    },
    {
      path: "/site-details",
      label: "Site Details",
      keywords:
        "website information domain details configuration site setup website details domain info",
    },
    {
      path: "/site-analyser",
      label: "Site Analyser",
      keywords:
        "analysis scanning audit website checker seo performance speed test crawler scanner",
    },
    {
      path: "/site-stats",
      label: "Site Statistics",
      keywords:
        "metrics performance analytics traffic visitors pageviews bounce rate site statistics tracking",
    },
    {
      path: "/integrations",
      label: "Integrations",
      keywords:
        "connections apis plugins third party tools connectors webhooks integrations apps services",
    },
    {
      path: "/settings",
      label: "Settings",
      keywords:
        "configuration preferences options setup customize settings general preferences account",
    },
    {
      path: "/agents/strategy",
      label: "Strategy Analysis",
      keywords:
        "planning goals objectives strategy roadmap analysis plan strategic thinking marketing",
    },
    {
      path: "/agents/ideation",
      label: "Ideation",
      keywords:
        "brainstorming ideas concepts creativity innovation ideation generation mindmap thinking",
    },
    {
      path: "/agents/content-creation",
      label: "Content Creation",
      keywords:
        "writing articles posts content creation editor blogging copywriting writing tools generator",
    },
    {
      path: "/agents/content-review",
      label: "Content Review",
      keywords:
        "approval verification check review process content approval workflow moderation editing",
    },
    {
      path: "/agents/publishing",
      label: "Publishing",
      keywords:
        "schedule post deploy publishing content manager cms schedule calendar posting automation",
    },
    {
      path: "/agents/social-media",
      label: "Social Media",
      keywords:
        "social networks sharing facebook twitter linkedin instagram social media management posts",
    },
    {
      path: "/boards/templated",
      label: "Templated Boards",
      keywords:
        "templates preset boards predefined layouts kanban templates workflow templates task boards",
    },
    {
      path: "/boards/custom",
      label: "Custom Boards",
      keywords:
        "custom personalized boards create your own board customization personal workflow custom templates",
    },
    {
      path: "/integrations/setup",
      label: "Setup Wizard",
      keywords:
        "configuration initial setup wizard getting started guide installation setup process onboarding",
    },
    {
      path: "/integrations/active",
      label: "Active Integrations",
      keywords:
        "connected services active plugins running integrations current connections enabled apps tools",
    },
    {
      path: "/settings/user-management",
      label: "User Management",
      keywords:
        "users accounts permissions facebook login google login social login authentication oauth sso single sign on user roles admin access control",
    },
    {
      path: "/settings/advanced-config/security",
      label: "Security",
      keywords:
        "protection authentication access security settings encryption passwords 2fa two factor mfa multi factor ssl certificates",
    },
  ];

  return allRoutes.filter(
    (route) =>
      route.label.toLowerCase().includes(query.toLowerCase()) ||
      route.keywords.toLowerCase().includes(query.toLowerCase())
  );
};

function TopNavBar({ isMenuOpen, toggleMenu, style }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchResults(searchRoutes(query));
  };

  const handleSearchSelect = (path) => {
    setSearchQuery("");
    setSearchResults([]);
    navigate(path);
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchExpanded(false);
    }
  };

  return (
    <header className="TopNavBar" style={style}>
      {!isMenuOpen && (
        <div
          className={`overlay ${
            isMenuOpen ? "overlay--open" : "overlay--closed"
          }`}
          onClick={toggleMenu}
        >
          <span className="overlay__icon">&#x2190;</span>
        </div>
      )}
      <div className="company-logo">
        <img onClick={() => navigate("/")} src={logo} alt="Company Logo" />
      </div>
      <div
        className={`search-container-top ${isSearchExpanded ? "expanded" : ""}`}
      >
        {!isSearchExpanded ? (
          <button
            className="search-icon-button"
            onClick={handleSearchIconClick}
            aria-label="Open search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        ) : (
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={handleSearch}
            onBlur={handleSearchBlur}
            className="nav-search-input-top"
          />
        )}
        {searchQuery && searchResults.length > 0 && (
          <div className="search-results-top">
            {searchResults.map((result, index) => (
              <Link
                key={index}
                to={result.path}
                className={location.pathname === result.path ? "active" : ""}
                onClick={() => handleSearchSelect(result.path)}
              >
                {result.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <button className="NavBar-toggle" onClick={toggleMenu}>
        {isMenuOpen ? "X" : "☰"}
      </button>
    </header>
  );
}

export default TopNavBar;
