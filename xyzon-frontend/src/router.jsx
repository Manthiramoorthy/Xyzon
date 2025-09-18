import React, { Suspense } from "react";
const AdminPayments = React.lazy(() => import('./pages/AdminPayments'));
const AdminEnquiries = React.lazy(() => import('./pages/AdminEnquiries'));
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CertificateGenerator, SendPersonalizedMail } from "./pages";
import { Header } from "./components/Header";
import App from "./App.jsx";
import { AuthProvider } from './auth/AuthContext';
import { MenuProvider } from './context/MenuContext.jsx';
import { EventProvider } from './context/EventContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleProtectedRoute from './auth/RoleProtectedRoute';
import AdminPanel from './pages/AdminPanel';
import UserPanel from './pages/UserPanel';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';

// Event Management Components
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import EventForm from './pages/EventForm';
import AdminEventList from './pages/AdminEventList';
import UserRegistrations from './pages/UserRegistrations';
import UserCertificates from './pages/UserCertificates';
import UserPayments from './pages/UserPayments';
import UserProfile from './pages/UserProfile';
import UserManagement from './pages/UserManagement';
import EventStats from './pages/EventStats';
import AdminEventSummary from './pages/AdminEventSummary';
import EventRegistrations from './pages/EventRegistrations';
import EventCertificates from './pages/EventCertificates';
import EventRegister from './pages/EventRegister';
import CertificateView from './pages/CertificateView';
import CertificateVerification from './pages/CertificateVerification';
import CertificateTemplateManager from './components/CertificateTemplateManager';
import AdminCoupons from './pages/AdminCoupons';
import ToastDemo from './components/ToastDemo';

export default function AppRouter() {
    return (
        <Router>
            <ToastProvider>
                <AuthProvider>
                    <EventProvider>
                        <MenuProvider>
                            <Header />
                            <Routes>
                                <Route path="/" element={<App />} />
                                <Route path="/toast-demo" element={<ToastDemo />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                                {/* Public Event Routes */}
                                <Route path="/events" element={<EventList />} />
                                <Route path="/events/:id" element={<EventDetails />} />
                                <Route path="/events/:id/register" element={<EventRegister />} />

                                {/* Certificate Verification Routes */}
                                <Route path="/certificates/:certificateId" element={<CertificateView />} />
                                <Route path="/certificates/verify/:verificationCode" element={<CertificateVerification />} />

                                {/* Legacy direct routes (optional) */}
                                <Route path="/certificate" element={<ProtectedRoute><CertificateGenerator /></ProtectedRoute>} />
                                <Route path="/send-mail" element={<ProtectedRoute><SendPersonalizedMail /></ProtectedRoute>} />

                                {/* Admin Event Management */}
                                <Route path="/admin" element={<RoleProtectedRoute role="admin"><AdminPanel /></RoleProtectedRoute>}>
                                    <Route index element={<AdminEventList />} />
                                    <Route path="certificate" element={<CertificateGenerator />} />
                                    <Route path="send-mail" element={<SendPersonalizedMail />} />
                                    <Route path="events" element={<AdminEventList />} />
                                    <Route path="summary" element={<AdminEventSummary />} />
                                    <Route path="events/create" element={<EventForm />} />
                                    <Route path="events/:id/edit" element={<EventForm />} />
                                    <Route path="events/:id/stats" element={<EventStats />} />
                                    <Route path="events/:id/registrations" element={<EventRegistrations />} />
                                    <Route path="events/:id/certificates" element={<EventCertificates />} />
                                    <Route path="certificate-templates" element={<CertificateTemplateManager />} />
                                    <Route path="users" element={<UserManagement />} />
                                    <Route path="payments" element={
                                        <Suspense fallback={<div>Loading...</div>}>
                                            <AdminPayments />
                                        </Suspense>
                                    } />
                                    <Route path="coupons" element={<AdminCoupons />} />
                                    <Route path="enquiries" element={
                                        <Suspense fallback={<div>Loading...</div>}>
                                            <AdminEnquiries />
                                        </Suspense>
                                    } />
                                </Route>                            {/* User panel */}
                                <Route path="/user" element={<ProtectedRoute><UserPanel /></ProtectedRoute>}>
                                    <Route path="profile" element={<UserProfile />} />
                                    <Route path="certificate" element={<CertificateGenerator />} />
                                    <Route path="registrations" element={<UserRegistrations />} />
                                    <Route path="payments" element={<UserPayments />} />
                                    <Route path="certificates" element={<UserCertificates />} />
                                </Route>
                            </Routes>
                            <ToastContainer />
                        </MenuProvider>
                    </EventProvider>
                </AuthProvider>
            </ToastProvider>
        </Router>
    );
}
