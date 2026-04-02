import { useEffect, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.jsx';
import { RightPanel } from '../components/RightPanel.jsx';
import { CreatePostModal } from '../components/CreatePostModal.jsx';
import { CreateCircleModal } from '../components/CreateCircleModal.jsx';
import { FeatureTips } from '../components/FeatureTips.jsx';
import { JoinByCodeModal } from '../components/JoinByCodeModal.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { NotificationBell } from '../components/NotificationBell.jsx';
import { OnboardingFlow } from '../components/OnboardingFlow.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import { ToastViewport } from '../components/ToastViewport.jsx';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { useTheme } from '../hooks/useTheme.js';
import { getSocket } from '../services/socket.js';
import { navigation } from '../data/navigation.js';

export function AppLayout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const token = useAuthStore((state) => state.token);
  const posts = useAppStore((state) => state.posts);
  const circles = useAppStore((state) => state.circles);
  const loadCircles = useAppStore((state) => state.loadCircles);
  const modalOpen = useAppStore((state) => state.modalOpen);
  const setModalOpen = useAppStore((state) => state.setModalOpen);
  const createPost = useAppStore((state) => state.createPost);
  const createCircle = useAppStore((state) => state.createCircle);
  const joinCircle = useAppStore((state) => state.joinCircle);
  const joinCircleByCode = useAppStore((state) => state.joinCircleByCode);
  const showToast = useAppStore((state) => state.showToast);
  const ingestRealtimePost = useAppStore((state) => state.ingestRealtimePost);
  const ingestRealtimeComment = useAppStore((state) => state.ingestRealtimeComment);
  const ingestRealtimeNotification = useAppStore((state) => state.ingestRealtimeNotification);
  const ingestRealtimeMessage = useAppStore((state) => state.ingestRealtimeMessage);
  const ingestRealtimeMessageStatus = useAppStore((state) => state.ingestRealtimeMessageStatus);
  const ingestRealtimeMessageReaction = useAppStore((state) => state.ingestRealtimeMessageReaction);
  const ingestTyping = useAppStore((state) => state.ingestTyping);
  const ingestRealtimePostUpdate = useAppStore((state) => state.ingestRealtimePostUpdate);
  const ingestRealtimePostDeletion = useAppStore((state) => state.ingestRealtimePostDeletion);
  const ingestRealtimeCommentUpdate = useAppStore((state) => state.ingestRealtimeCommentUpdate);
  const ingestRealtimeCommentDeletion = useAppStore((state) => state.ingestRealtimeCommentDeletion);
  const applyReactionSummary = useAppStore((state) => state.applyReactionSummary);
  const flushOfflineMessages = useAppStore((state) => state.flushOfflineMessages);
  const setSocketConnected = useAppStore((state) => state.setSocketConnected);
  const submitting = useAppStore((state) => state.submitting);
  const [circleModalOpen, setCircleModalOpen] = useState(false);
  const [joinCodeModalOpen, setJoinCodeModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket(token);
    if (!socket) return undefined;

    const handleNewPost = ({ post }) => ingestRealtimePost(post);
    const handleNewComment = ({ postId, comment }) => ingestRealtimeComment(postId, comment);
    const handleNewNotification = ({ notification }) => ingestRealtimeNotification(notification);
    const handleNewMention = ({ notification }) => ingestRealtimeNotification(notification);
    const handleNewMessage = (payload) => ingestRealtimeMessage(payload);
    const handleMessageStatus = (payload) => ingestRealtimeMessageStatus(payload);
    const handleMessageReaction = ({ message }) => ingestRealtimeMessageReaction(message);
    const handleMediaUpload = ({ message }) => {
      if (message) {
        ingestRealtimeMessage({ scope: message.chat_id ? 'direct' : 'circle', targetId: message.chat_id || message.circle_id, message });
      }
    };
    const handleTyping = (payload) => ingestTyping(payload);
    const handleReactionUpdated = ({ referenceType, referenceId, reactions }) => applyReactionSummary(referenceType, referenceId, reactions);
    const handlePostUpdated = ({ post }) => ingestRealtimePostUpdate(post);
    const handlePostDeleted = ({ postId }) => ingestRealtimePostDeletion(postId);
    const handleCommentUpdated = ({ postId, comment }) => ingestRealtimeCommentUpdate(postId, comment);
    const handleCommentDeleted = ({ postId, commentId }) => ingestRealtimeCommentDeletion(postId, commentId);

    const handleConnect = () => {
      setSocketConnected(true);
      flushOfflineMessages(user).catch(() => null);
    };
    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_post', handleNewPost);
    socket.on('new_comment', handleNewComment);
    socket.on('new_notification', handleNewNotification);
    socket.on('new_mention', handleNewMention);
    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleMessageStatus);
    socket.on('message_reaction', handleMessageReaction);
    socket.on('media_upload_notification', handleMediaUpload);
    socket.on('typing', handleTyping);
    socket.on('reaction_updated', handleReactionUpdated);
    socket.on('post_updated', handlePostUpdated);
    socket.on('post_deleted', handlePostDeleted);
    socket.on('comment_updated', handleCommentUpdated);
    socket.on('comment_deleted', handleCommentDeleted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_post', handleNewPost);
      socket.off('new_comment', handleNewComment);
      socket.off('new_notification', handleNewNotification);
      socket.off('new_mention', handleNewMention);
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleMessageStatus);
      socket.off('message_reaction', handleMessageReaction);
      socket.off('media_upload_notification', handleMediaUpload);
      socket.off('typing', handleTyping);
      socket.off('reaction_updated', handleReactionUpdated);
      socket.off('post_updated', handlePostUpdated);
      socket.off('post_deleted', handlePostDeleted);
      socket.off('comment_updated', handleCommentUpdated);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [token, user, ingestRealtimePost, ingestRealtimeComment, ingestRealtimeNotification, ingestRealtimeMessage, ingestRealtimeMessageStatus, ingestRealtimeMessageReaction, ingestTyping, ingestRealtimePostUpdate, ingestRealtimePostDeletion, ingestRealtimeCommentUpdate, ingestRealtimeCommentDeletion, applyReactionSummary, flushOfflineMessages, setSocketConnected]);

  useEffect(() => {
    const handleOnline = () => {
      flushOfflineMessages(user).catch(() => null);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushOfflineMessages, user]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-3 py-4 pb-24 sm:px-4 lg:flex-row lg:px-6 lg:py-6 lg:pb-6">
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
            <Button variant="secondary" className="h-12 w-12 rounded-full p-0" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
            </Button>
            <Button variant="ghost" className="h-12 w-12 rounded-full p-0" onClick={() => setMobileNavOpen((open) => !open)}>
              <Menu size={18} />
            </Button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="surface-card mb-5 space-y-3 p-4 xl:hidden">
            <div className="grid gap-2">
              {navigation.map(({ label, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  className="rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:bg-[rgb(var(--bg-soft))]"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
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

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar />
          <div className="flex items-center justify-end">
            <NotificationBell />
          </div>
        </div>

        <FeatureTips user={user} onCompose={() => setModalOpen(true)} />

        <div className="flex min-w-0 flex-col gap-6 2xl:flex-row">
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
      <BottomNav onCompose={() => setModalOpen(true)} />
      <OnboardingFlow
        user={user}
        circles={circles}
        joinedCirclesCount={circles.filter((circle) => circle.joined).length}
        myPostsCount={posts.filter((post) => post.author?.id === user?.id).length}
        joinCircle={joinCircle}
        createCircle={createCircle}
        createPost={createPost}
        setUser={setUser}
        onComplete={() => {
          loadCircles();
        }}
      />
    </div>
  );
}
