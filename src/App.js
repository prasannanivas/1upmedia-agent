// App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Boards from "./pages/Boards";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import "./App.css";

function App() {
  return (
    <div className="App">
      <NavBar />
      <div className="MainContent">
        <Routes>
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/agents/*" element={<Agents />} />
          <Route path="/boards/*" element={<Boards />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/integrations/*" element={<Integrations />} />
          <Route path="/settings/*" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
