import {
  Navigate,
  Outlet,
  createBrowserRouter,
} from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { CirclePage } from './pages/CirclePage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { DirectMessagesPage } from './pages/DirectMessagesPage.jsx';
import { useAuthStore } from './store/authStore.js';

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  return token ? <Outlet /> : <Navigate to="/auth" replace />;
}

function PublicRoute() {
  const token = useAuthStore((state) => state.token);
  return token ? <Navigate to="/" replace /> : <AuthPage />;
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <PublicRoute />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/profile/:userId', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/insights', element: <InsightsPage /> },
          { path: '/messages', element: <DirectMessagesPage /> },
          { path: '/circles/:circleId', element: <CirclePage /> },
        ],
      },
    ],
  },
]);
