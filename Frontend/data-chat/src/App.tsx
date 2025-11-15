import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import KeyInsights from "./KeyInsights";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report/:reportId" element={<KeyInsights />} />
      </Routes>
    </BrowserRouter>
  );
}
