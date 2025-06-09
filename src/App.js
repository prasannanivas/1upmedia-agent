// App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import LeakDashboard from "./pages/Dashboard/Dashboard";
import RiskDashboard from "./pages/Dashboard/RiskDashboard";
import ContentLedgerDashboard from "./pages/Dashboard/ContentLedgerDashboard";
import CommandCenterDashboard from "./pages/Dashboard/CommandCenterDashboard";
import KeywordIntelDashboard from "./pages/Dashboard/KeywordIntelDashboard";
import PrivacyPolicy from "./PrivacyPolicy";
import Agents from "./pages/Agents";
import Boards from "./pages/Boards";
import Analytics from "./pages/Analytics/Analytics";
import SiteDetails from "./pages/Analytics/SiteDetails";
import SiteStats from "./pages/Analytics/SiteStats";
import KeywordsStats from "./pages/Analytics/KeywordsStats";
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
import { OnboardingProvider, useOnboarding } from "./context/OnboardingContext";
import Home from "./pages/Home";
import PreSetup from "./pages/PreSetup";
import Notifications from "./pages/Notifications";
import { NotificationProvider } from "./context/NotificationContext";
import NotFound from "./pages/NotFound";
import RAG from "./pages/RAG";
import TermsOfService from "./TermsOfService";
import PostAnalytics from "./pages/PostAnalytics";

const AppWrapper = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const { authState, loading } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(authState.isLoggedIn);

  useEffect(() => {
    console.log(authState);
    const token = authState.accessToken;
    const email = authState.email;

    if (token && email) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(authState.isLoggedIn && authState.email !== null);
    }
  }, [authState, loading]); // Add loading to dependencies

  const location = useLocation(); // Get the current location

  // Show a loading indicator while loading session data
  if (loading) {
    const token = localStorage.getItem("accessToken");
    const email = localStorage.getItem("email");

    if (token && email) {
      return <Loader />;
    }
    return <Navigate to="/login" replace />;
  }

  if (!isLoggedIn) {
    // Redirect to login if not logged in, preserving the current location
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route
          path="*"
          element={
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          }
        />
      </Routes>
    );
  }

  // Determine the main content width based on the menu state
  // Assuming the NavBar takes 250px when open
  const mainContentStyle = {
    marginLeft: isMenuOpen ? "25%" : "0",
    width: isMenuOpen ? "calc(100% - 25%)" : "100%",
    transition:
      "margin-left 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), width 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  };

  return (
    <div className="App">
      <div className="App-header">
        <NavBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      </div>
      <div className="MainContent" style={mainContentStyle}>
        {" "}
        <Routes>
          <Route path="/" element={<SmartHomeRoute />} />
          <Route path="/home" element={<SmartHomeRoute />} />
          <Route path="/setup" element={<Home />} />
          <Route path="/intro" element={<PreSetup />} />
          {/* <Route path="/login" element={<Home />} /> */}{" "}
          <Route path="/leakdashboard" element={<LeakDashboard />} />
          <Route path="/riskdashboard" element={<RiskDashboard />} />
          <Route
            path="/strategy-analysis"
            element={<StrategyAnalysis />}
          />{" "}
          <Route path="/contentledger" element={<ContentLedgerDashboard />} />
          <Route path="/commandcenter" element={<CommandCenterDashboard />} />
          <Route path="/keyword-intel" element={<KeywordIntelDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/site-details" element={<SiteDetails />} />
          <Route path="/site-analyser" element={<SiteAnalyser />} />
          <Route path="/site-stats" element={<SiteStats />} />
          <Route path="/keyword-stats" element={<KeywordsStats />} />
          <Route path="/post-details" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/edit-post/:postId" element={<EditPost />} />
          <Route path="/post-details/:postId" element={<PostDetails />} />
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
          <Route path="/RAG" element={<RAG />} />
          <Route path="/analytics/:postId" element={<PostAnalytics />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

// Helper function to check if onboarding data is empty
const isOnboardingEmpty = (onboardingData) => {
  if (!onboardingData) return true;

  // Check for essential data that indicates completed onboarding
  const hasDomain =
    onboardingData.domain && onboardingData.domain.trim() !== "";
  const hasBusinessDetails =
    onboardingData.businessDetails &&
    onboardingData.businessDetails.trim() !== "";
  const hasInvestmentData = onboardingData.domainCostDetails?.totalInvested > 0;

  // Consider onboarding "empty" if none of the essential data is present
  return !hasDomain || !hasBusinessDetails || !hasInvestmentData;
};

// Smart routing component that decides between PreSetup (intro) and Home (setup)
const SmartHomeRoute = () => {
  const { onboardingData, loading } = useOnboarding();

  if (loading) {
    return <Loader />;
  }

  // If onboarding is empty, show intro page (PreSetup)
  // If onboarding has some data, show setup page (Home)
  return isOnboardingEmpty(onboardingData) ? <PreSetup /> : <Home />;
};

// Show Login page if not logged in

function App() {
  return (
    <ToastProvider>
      <SocialMediaProvider>
        <AuthProvider>
          <NotificationProvider>
            <PollProvider>
              <ProgressBar />
              <OnboardingProvider>
                <AppWrapper />
              </OnboardingProvider>
            </PollProvider>
          </NotificationProvider>
        </AuthProvider>
      </SocialMediaProvider>
    </ToastProvider>
  );
}

export default App;
