import React from "react";
import { Link } from "react-router-dom";
import styles from "./ChildLinks.module.css";

const ChildLinks = ({ routes, title }) => {
  return (
    <div className={styles.childLinks_container}>
      <h1 className={styles.childLinks_title}>{title}</h1>
      <div className={styles.childLinks_navigation}>
        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className={styles.childLinks_link}
          >
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChildLinks;
