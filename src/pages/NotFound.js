import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link
        to="/"
        style={{
          textDecoration: "none",
          color: "#007bff",
          fontSize: "1.1em",
        }}
      >
        ← Go back to Home Page
      </Link>
    </div>
  );
};

export default NotFound;
