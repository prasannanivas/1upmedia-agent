// App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Boards from "./pages/Boards";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import StrategyAnalysis from "./pages/StrategyAnalysis";
import Ideation from "./pages/Ideation";
import ContentCreation from "./pages/ContentCreation";
import ContentReview from "./pages/ContentReview";
import Publishing from "./pages/Publishing";
import SocialMedia from "./pages/SocialMedia";
import TemplatedBoards from "./pages/TemplatedBoards";
import CustomBoards from "./pages/CustomBoards";
import SetupWizard from "./pages/SetupWizard";
import ActiveIntegrations from "./pages/ActiveIntegrations";
import UserManagement from "./pages/UserManagement";
import Security from "./pages/Security";
import "./App.css";

const AppWrapper = () => {
  const { authState } = useAuth();

  if (authState.isLoggedIn) {
    return (
      <div className="App">
        <NavBar />
        <div className="MainContent">
          <Routes>
            {/* Main Pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/boards" element={<Boards />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />

            {/* Submenu Pages */}
            <Route path="/agents/strategy" element={<StrategyAnalysis />} />
            <Route path="/agents/ideation" element={<Ideation />} />
            <Route
              path="/agents/content-creation"
              element={<ContentCreation />}
            />
            <Route path="/agents/content-review" element={<ContentReview />} />
            <Route path="/agents/publishing" element={<Publishing />} />
            <Route path="/agents/social-media" element={<SocialMedia />} />
            <Route path="/boards/templated" element={<TemplatedBoards />} />
            <Route path="/boards/custom" element={<CustomBoards />} />
            <Route path="/integrations/setup" element={<SetupWizard />} />
            <Route
              path="/integrations/active"
              element={<ActiveIntegrations />}
            />
            <Route
              path="/settings/user-management"
              element={<UserManagement />}
            />
            <Route
              path="/settings/advanced-config/security"
              element={<Security />}
            />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Show Login page if not logged in
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

export default App;
