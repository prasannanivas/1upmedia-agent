import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ContentCreationChoice from "./Choice";
import ByKeyword from "./ByKeyword";
import ByIdea from "./ByIdea";
import BytitleAndSubheading from "./BytitleAndSubheading";
import ContentGenerator from "./ContentCreation";
import FromBusiness from "./FromBusiness";
import FromYoutube from "./FromSocial/FromYoutube";
import FromReddit from "./FromSocial/FromReddit";
import SocialNavigation from "./FromSocial/SocialNavigation";
import CreateQuickContents from "./CreateQuickContents";
import BySeoIdeas from "./BySeoIdeas";
import GenerateCalendarSeoIdeas from "./GenerateCalendarSeoIdeas";

const ContentGenerationNavigator = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to="choosepath" />} />
        <Route path="choosepath" element={<ContentCreationChoice />} />
        <Route path="by-keyword" element={<ByKeyword />} />
        <Route path="by-idea" element={<ByIdea />} />
        <Route path="by-title-subheading" element={<BytitleAndSubheading />} />
        <Route path="from-business" element={<FromBusiness />} />
        <Route path="fully-manual" element={<ContentGenerator />} />
        <Route path="from-social" element={<SocialNavigation />} />
        <Route path="from-youtube" element={<FromYoutube />} />
        <Route path="from-reddit" element={<FromReddit />} />
        <Route path="quick-contents" element={<CreateQuickContents />} />
        <Route path="by-seo-ideas" element={<BySeoIdeas />} />
        <Route path="by-calendar" element={<GenerateCalendarSeoIdeas />} />
      </Routes>
    </div>
  );
};

export default ContentGenerationNavigator;
