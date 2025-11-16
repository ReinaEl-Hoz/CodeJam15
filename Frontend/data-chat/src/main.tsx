import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import KeyInsights from "./KeyInsights";
import "./App.css";
import DashboardBuilder from "./DashboardBuilder";
import LandingPage from "./components/LandingPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/query-data" element={<Home />} />
        <Route path="/report/:reportId" element={<KeyInsights />} />
        <Route path="/dashboard-builder" element={<DashboardBuilder/>}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
