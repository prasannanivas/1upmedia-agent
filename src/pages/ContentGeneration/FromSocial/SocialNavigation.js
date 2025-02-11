import React from "react";
import { useNavigate } from "react-router-dom";
import "./Choice.css";

const SocialNavigation = () => {
  const navigate = useNavigate();
  const cards = [
    { title: "From Youtube", route: "/agents/content-creation/from-youtube" },
    { title: "From Reddit", route: "/agents/content-creation/from-reddit" },
  ];

  return (
    <div className="content-creation-container">
      <h1 className="content-creation-title">
        Select a path to Create Content
      </h1>
      <div className="content-creation-grid">
        {cards.map((card, index) => (
          <div
            key={index}
            className="content-creation-card"
            onClick={() => navigate(card.route)}
          >
            <h2 className="content-creation-card-h2">{card.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialNavigation;
