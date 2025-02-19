import React from "react";
import { useNavigate } from "react-router-dom";
import "./Choice.css";

const ContentCreationChoice = () => {
  const navigate = useNavigate();
  const cards = [
    { title: "Keywords", route: "/agents/content-creation/by-keyword" },
    { title: "Idea", route: "/agents/content-creation/by-idea" },
    {
      title: "Title + SubHeading",
      route: "/agents/content-creation/by-title-subheading",
    },
    { title: "From Business", route: "/agents/content-creation/from-business" },
    { title: "From Social", route: "/agents/content-creation/from-social" },
    { title: "Full Manual", route: "/agents/content-creation/fully-manual" },
    { title: "SEO Ideas", route: "/agents/content-creation/by-seo-ideas" },
    { title: "Calendar", route: "/agents/content-creation/by-calendar" },
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

export default ContentCreationChoice;
