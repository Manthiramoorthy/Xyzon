import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CertificateGenerator, SendPersonalizedMail } from "./pages";
import { Header } from "./components/Header";
import App from "./App.jsx";

export default function AppRouter() {
    return (
        <div>
            <Router>
                <Header />
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/certificate" element={<CertificateGenerator />} />
                    <Route path="/send-mail" element={<SendPersonalizedMail />} />
                </Routes>
            </Router>
        </div>
    );
}
