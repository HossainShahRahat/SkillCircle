import {
  Navigate,
  Outlet,
  createBrowserRouter,
} from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { CirclesPage } from './pages/CirclesPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { CirclePage } from './pages/CirclePage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { DirectMessagesPage } from './pages/DirectMessagesPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { useAuthStore } from './store/authStore.js';

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const initializing = useAuthStore((state) => state.initializing);
  if (initializing) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading SkillCircle...</div>;
  }
  return token ? <Outlet /> : <Navigate to="/auth" replace />;
}

function PublicRoute() {
  const token = useAuthStore((state) => state.token);
  const initializing = useAuthStore((state) => state.initializing);
  if (initializing) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading SkillCircle...</div>;
  }
  return token ? <Navigate to="/" replace /> : <AuthPage />;
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <PublicRoute />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/circles', element: <CirclesPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/profile/:userId', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/insights', element: <InsightsPage /> },
          { path: '/messages', element: <DirectMessagesPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/circles/:circleId', element: <CirclePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
