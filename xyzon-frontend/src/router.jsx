import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CertificateGenerator, SendPersonalizedMail } from "./pages";
import { Header } from "./components/Header";
import App from "./App.jsx";
import { AuthProvider } from './auth/AuthContext';
import { MenuProvider } from './context/MenuContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleProtectedRoute from './auth/RoleProtectedRoute';
import AdminPanel from './pages/AdminPanel';
import UserPanel from './pages/UserPanel';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';

export default function AppRouter() {
    return (
        <Router>
            <AuthProvider>
                <MenuProvider>
                    <Header />
                    <Routes>
                        <Route path="/" element={<App />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        {/* Legacy direct routes (optional) */}
                        <Route path="/certificate" element={<ProtectedRoute><CertificateGenerator /></ProtectedRoute>} />
                        <Route path="/send-mail" element={<ProtectedRoute><SendPersonalizedMail /></ProtectedRoute>} />
                        {/* Admin panel nested */}
                        <Route path="/admin" element={<RoleProtectedRoute role="admin"><AdminPanel /></RoleProtectedRoute>}>
                            <Route path="certificate" element={<CertificateGenerator />} />
                            <Route path="send-mail" element={<SendPersonalizedMail />} />
                        </Route>
                        {/* User panel */}
                        <Route path="/user" element={<ProtectedRoute><UserPanel /></ProtectedRoute>}>
                            <Route path="certificate" element={<CertificateGenerator />} />
                        </Route>
                    </Routes>
                </MenuProvider>
            </AuthProvider>
        </Router>
    );
}
