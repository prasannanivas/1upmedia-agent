import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./BreadCrumb.css";

const BreadCrumb = ({ style, isMenuOpen, toggleMenu }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <div className="breadcrumb" style={style}>
      <button onClick={toggleMenu}>
        {isMenuOpen ? "Close Sidebar" : "Open Sidebar"}
      </button>
      <Link to="/">Home</Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const displayName = name
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return (
          <React.Fragment key={routeTo}>
            <span> &gt; </span>
            <Link to={routeTo}>{displayName}</Link>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BreadCrumb;
