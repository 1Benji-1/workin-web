import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./shared/context/AuthContext";
import { Navbar } from "./shared/components/Navbar";
import { RoleGuard } from "./shared/guards/RoleGuard";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { NotFoundPage } from "./features/errors/NotFoundPage";

import HomePage from "./features/home/HomePage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ProfilePage from "./features/profile/ProfilePage";
import CategoryPage from "./features/categories/CategoryPage";
import ServiceDetail from "./features/services/ServiceDetail";
import ServiceForm from "./features/services/ServiceForm";
import FreelancerDashboard from "./features/freelancer-panel/FreelancerDashboard";
import OrderRequestPage from "./features/orders/OrderRequestPage";
import OrderDetailPage from "./features/orders/OrderDetailPage";
import OrdersListPage from "./features/orders/OrdersListPage";
import DisputesQueuePage from "./features/disputes/DisputesQueuePage";
import MessagesPage from "./features/messaging/MessagesPage";
import { NotificationsPage } from "./features/notifications";
import { SupportGuard } from "./shared/guards/SupportGuard";
import {
  AdminDashboard,
  DisputesQueue,
  UserManagement,
  PaymentsOverview,
} from "./features/admin";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <div className="flex-1">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Marketplace: Categorías y Detalle de Servicio */}
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/services/:id" element={<ServiceDetail />} />

            {/* Rutas protegidas para usuarios autenticados */}
            <Route
              path="/profile"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <ProfilePage />
                </RoleGuard>
              }
            />

            {/* Rutas exclusivas para Freelancers (RoleGuard específico) */}
            <Route
              path="/services/new"
              element={
                <RoleGuard allowedRoles={["freelancer"]} redirectTo="/">
                  <ServiceForm />
                </RoleGuard>
              }
            />
            <Route
              path="/services/:id/edit"
              element={
                <RoleGuard allowedRoles={["freelancer"]} redirectTo="/">
                  <ServiceForm />
                </RoleGuard>
              }
            />
            <Route
              path="/freelancer/dashboard"
              element={
                <RoleGuard allowedRoles={["freelancer"]} redirectTo="/">
                  <FreelancerDashboard />
                </RoleGuard>
              }
            />

            {/* Rutas de Pedidos, Contratación y Acuerdos (Fase 3) */}
            <Route
              path="/services/:serviceId/order"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <OrderRequestPage />
                </RoleGuard>
              }
            />
            <Route
              path="/orders"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <OrdersListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <OrderDetailPage />
                </RoleGuard>
              }
            />
            <Route
              path="/disputes"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <DisputesQueuePage />
                </RoleGuard>
              }
            />
            {/* Mensajería y Chat en Tiempo Real (Fase 7) */}
            <Route
              path="/messages"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <MessagesPage />
                </RoleGuard>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <MessagesPage />
                </RoleGuard>
              }
            />
            {/* Centro de Notificaciones (Fase 8) */}
            <Route
              path="/notifications"
              element={
                <RoleGuard allowedRoles={["cliente", "freelancer", "admin", "soporte"]}>
                  <NotificationsPage />
                </RoleGuard>
              }
            />

            {/* Panel de Soporte y Backoffice (Fase 9) */}
            <Route
              path="/admin"
              element={
                <SupportGuard>
                  <AdminDashboard />
                </SupportGuard>
              }
            />
            <Route
              path="/admin/disputes"
              element={
                <SupportGuard>
                  <DisputesQueue />
                </SupportGuard>
              }
            />
            <Route
              path="/admin/users"
              element={
                <SupportGuard>
                  <UserManagement />
                </SupportGuard>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <SupportGuard>
                  <PaymentsOverview />
                </SupportGuard>
              }
            />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
    </ErrorBoundary>
  );
}
