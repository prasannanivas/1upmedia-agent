// App.js
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Boards from "./pages/Boards";
import Analytics from "./pages/Analytics/Analytics";
import SiteDetails from "./pages/Analytics/SiteDetails";
import SiteStats from "./pages/Analytics/SiteStats";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import StrategyAnalysis from "./pages/StrategyAnalysis";
import Ideation from "./pages/Ideation";
import ContentCreation from "./pages/ContentGeneration/ContentCreationNavigator";
import ContentReview from "./pages/ContentReview";
import Publishing from "./pages/Publishing";
import SocialMedia from "./pages/SocialMedia";
import SiteAnalyser from "./pages/SiteAnalyser";
import TemplatedBoards from "./pages/TemplatedBoards";
import { ToastProvider } from "./context/ToastProvider";
import CustomBoards from "./pages/CustomBoards";
import SetupWizard from "./pages/SetupWizard";
import ActiveIntegrations from "./pages/ActiveIntegrations";
import UserManagement from "./pages/UserManagement";
import Security from "./pages/Security";
import { SocialMediaProvider } from "./context/SocialMediaContext";
import "./App.css";
import { PollProvider } from "./context/PollContext";
import PostDetails from "./pages/PostDetails";
import EditPost from "./pages/Editpost";
import { ProgressBar } from "./components/ProgressBar";
import Onboarding from "./pages/Onboarding/Onboarding";
import Loader from "./components/Loader";
import { OnboardingProvider } from "./context/OnboardingContext";
import StepCreateAuthors from "./pages/Onboarding/Steps/StepCreateAuthors";
import Home from "./pages/Home";

const AppWrapper = () => {
  const { authState, loading } = useAuth();
  const location = useLocation(); // Get the current location

  // Show a loading indicator while loading session data
  if (loading) {
    return <Loader />;
  }

  if (!authState.isLoggedIn) {
    // Redirect to login if not logged in, preserving the current location
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={<Navigate to="/login" state={{ from: location }} />}
        />
      </Routes>
    );
  }

  // Render the app if logged in
  return (
    <div className="App">
      <NavBar />
      <div className="MainContent">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          {/* <Route path="/login" element={<Home />} /> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/site-details" element={<SiteDetails />} />
          <Route path="/site-analyser" element={<SiteAnalyser />} />
          <Route path="/site-stats" element={<SiteStats />} />
          <Route path="/post-details/:postId" element={<PostDetails />} />
          <Route path="/edit-post/:postId" element={<EditPost />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/agents/strategy" element={<StrategyAnalysis />} />
          <Route path="/agents/ideation" element={<Ideation />} />
          <Route path="/onboarding/*" element={<Onboarding />} />

          <Route
            path="/agents/content-creation/*"
            element={<ContentCreation />}
          />
          <Route path="/agents/content-review" element={<ContentReview />} />
          <Route path="/agents/publishing" element={<Publishing />} />
          <Route path="/agents/social-media" element={<SocialMedia />} />
          <Route path="/boards/templated" element={<TemplatedBoards />} />
          <Route path="/boards/custom" element={<CustomBoards />} />
          <Route path="/integrations/setup" element={<SetupWizard />} />
          <Route path="/integrations/active" element={<ActiveIntegrations />} />
          <Route
            path="/settings/user-management"
            element={<UserManagement />}
          />
          <Route
            path="/settings/advanced-config/security"
            element={<Security />}
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </div>
  );
};

// Show Login page if not logged in

function App() {
  return (
    <ToastProvider>
      <SocialMediaProvider>
        <AuthProvider>
          <PollProvider>
            <ProgressBar />
            <OnboardingProvider>
              <AppWrapper />
            </OnboardingProvider>
          </PollProvider>
        </AuthProvider>
      </SocialMediaProvider>
    </ToastProvider>
  );
}

export default App;
