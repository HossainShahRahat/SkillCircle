import { Suspense, lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';

const AppLayout = lazy(() => import('./layouts/AppLayout.jsx').then((module) => ({ default: module.AppLayout })));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx').then((module) => ({ default: module.AuthPage })));
const CirclesPage = lazy(() => import('./pages/CirclesPage.jsx').then((module) => ({ default: module.CirclesPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx').then((module) => ({ default: module.ProfilePage })));
const CirclePage = lazy(() => import('./pages/CirclePage.jsx').then((module) => ({ default: module.CirclePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx').then((module) => ({ default: module.SettingsPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage.jsx').then((module) => ({ default: module.InsightsPage })));
const DirectMessagesPage = lazy(() => import('./pages/DirectMessagesPage.jsx').then((module) => ({ default: module.DirectMessagesPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx').then((module) => ({ default: module.NotificationsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then((module) => ({ default: module.NotFoundPage })));

function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading SkillCircle...</div>;
}

function withSuspense(element) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>;
}

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const initializing = useAuthStore((state) => state.initializing);
  if (initializing) {
    return <LoadingScreen />;
  }
  return token ? <Outlet /> : <Navigate to="/auth" replace />;
}

function PublicRoute() {
  const token = useAuthStore((state) => state.token);
  const initializing = useAuthStore((state) => state.initializing);
  if (initializing) {
    return <LoadingScreen />;
  }
  return token ? <Navigate to="/" replace /> : withSuspense(<AuthPage />);
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <PublicRoute />,
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: withSuspense(<AppLayout />),
        children: [
          { index: true, element: withSuspense(<DashboardPage />) },
          { path: '/circles', element: withSuspense(<CirclesPage />) },
          { path: '/profile', element: withSuspense(<ProfilePage />) },
          { path: '/profile/:userId', element: withSuspense(<ProfilePage />) },
          { path: '/settings', element: withSuspense(<SettingsPage />) },
          { path: '/insights', element: withSuspense(<InsightsPage />) },
          { path: '/messages', element: withSuspense(<DirectMessagesPage />) },
          { path: '/notifications', element: withSuspense(<NotificationsPage />) },
          { path: '/circles/:circleId', element: withSuspense(<CirclePage />) },
          { path: '*', element: withSuspense(<NotFoundPage />) },
        ],
      },
    ],
  },
]);
