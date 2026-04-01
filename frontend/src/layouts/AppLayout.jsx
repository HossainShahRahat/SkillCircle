import { useEffect, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.jsx';
import { RightPanel } from '../components/RightPanel.jsx';
import { CreatePostModal } from '../components/CreatePostModal.jsx';
import { CreateCircleModal } from '../components/CreateCircleModal.jsx';
import { JoinByCodeModal } from '../components/JoinByCodeModal.jsx';
import { ToastViewport } from '../components/ToastViewport.jsx';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { useTheme } from '../hooks/useTheme.js';

export function AppLayout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const circles = useAppStore((state) => state.circles);
  const loadCircles = useAppStore((state) => state.loadCircles);
  const modalOpen = useAppStore((state) => state.modalOpen);
  const setModalOpen = useAppStore((state) => state.setModalOpen);
  const createPost = useAppStore((state) => state.createPost);
  const createCircle = useAppStore((state) => state.createCircle);
  const joinCircle = useAppStore((state) => state.joinCircle);
  const joinCircleByCode = useAppStore((state) => state.joinCircleByCode);
  const showToast = useAppStore((state) => state.showToast);
  const submitting = useAppStore((state) => state.submitting);
  const [circleModalOpen, setCircleModalOpen] = useState(false);
  const [joinCodeModalOpen, setJoinCodeModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    refreshUser();
    loadCircles();
  }, [refreshUser, loadCircles]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
      <Sidebar
        user={user}
        circles={circles}
        onCompose={() => setModalOpen(true)}
        onToggleTheme={toggleTheme}
        theme={theme}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="glass-panel mb-5 flex items-center justify-between rounded-[28px] px-4 py-3 xl:hidden">
          <div>
            <p className="font-display text-2xl">SkillCircle</p>
            <p className="muted-copy">Build consistency out loud.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-11 w-11 rounded-full p-0" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
            </Button>
            <Button variant="ghost" className="h-11 w-11 rounded-full p-0" onClick={() => setMobileNavOpen((open) => !open)}>
              <Menu size={18} />
            </Button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="surface-card mb-5 space-y-3 p-4 xl:hidden">
            {circles.slice(0, 4).map((circle) => (
              <button
                key={circle.id}
                className="w-full rounded-2xl border px-4 py-3 text-left transition hover:bg-[rgb(var(--bg-soft))]"
                onClick={() => {
                  navigate(`/circles/${circle.id}`);
                  setMobileNavOpen(false);
                }}
              >
                <p className="font-semibold">{circle.name}</p>
                <p className="muted-copy">{circle.membersCount} members</p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex min-w-0 gap-6">
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
          <RightPanel
            circles={circles}
            onCreateCircle={() => setCircleModalOpen(true)}
            onOpenJoinByCode={() => setJoinCodeModalOpen(true)}
            onJoinPublic={(circleId) => {
              joinCircle(circleId).catch((error) => showToast(error.message, 'error'));
            }}
          />
        </div>
      </div>

      <CreatePostModal
        open={modalOpen}
        circles={circles.filter((circle) => circle.joined)}
        onClose={() => setModalOpen(false)}
        onSubmit={createPost}
        submitting={submitting}
      />

      <CreateCircleModal
        open={circleModalOpen}
        onClose={(circle) => {
          setCircleModalOpen(false);
          if (circle?.id) navigate(`/circles/${circle.id}`);
        }}
        onSubmit={createCircle}
        submitting={submitting}
      />

      <JoinByCodeModal
        open={joinCodeModalOpen}
        onClose={() => setJoinCodeModalOpen(false)}
        onSubmit={async (code) => {
          try {
            const circle = await joinCircleByCode(code);
            navigate(`/circles/${circle.id}`);
          } catch (error) {
            showToast(error.message || 'Invalid invite code.', 'error');
            throw error;
          }
        }}
        submitting={submitting}
      />

      <ToastViewport />
    </div>
  );
}
