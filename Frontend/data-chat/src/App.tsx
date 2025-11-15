import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import KeyInsights from "./KeyInsights";
import "./App.css";
import DashboardBuilder from "./DashboardBuilder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report/:reportId" element={<KeyInsights />} />
        <Route path="/dashboard-builder" element={<DashboardBuilder/>}/>
      </Routes>
    </BrowserRouter>
  );
}
