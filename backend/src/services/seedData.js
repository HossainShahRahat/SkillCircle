export const demoUsers = [
  {
    id: 'u_demo_1',
    name: 'Maya Chen',
    email: 'maya@skillcircle.dev',
    password_hash: '$2a$10$O2DF9NDeUr7R.LYcOUfiX.MUtgTok2VqP3D4xzhKP2noKYxB4E1aG',
    bio: 'Frontend engineer documenting a careful climb into motion design.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    skills: ['React', 'Motion', 'Design Systems'],
    total_posts: 1,
    total_reactions: 2,
    created_at: '2026-03-20T09:00:00.000Z',
  },
  {
    id: 'u_demo_2',
    name: 'Aarav Patel',
    email: 'aarav@skillcircle.dev',
    password_hash: '$2a$10$O2DF9NDeUr7R.LYcOUfiX.MUtgTok2VqP3D4xzhKP2noKYxB4E1aG',
    bio: 'Backend builder learning distributed systems one sketch at a time.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    skills: ['Node.js', 'Postgres', 'Architecture'],
    total_posts: 1,
    total_reactions: 2,
    created_at: '2026-03-18T11:00:00.000Z',
  },
];

export const demoCircles = [
  {
    id: 'c_demo_1',
    name: 'React Sprint',
    description: 'Daily build logs, concept breakdowns, and feedback loops for shipping React faster.',
    is_private: false,
    is_premium: false,
    premium_badge: 'core',
    invite_code: null,
    created_by: 'u_demo_1',
    created_at: '2026-03-21T10:00:00.000Z',
  },
  {
    id: 'c_demo_2',
    name: 'System Design Notes',
    description: 'A practical circle for whiteboarding backend architecture and reflecting on tradeoffs.',
    is_private: true,
    is_premium: true,
    premium_badge: 'plus',
    invite_code: 'SYS246',
    created_by: 'u_demo_2',
    created_at: '2026-03-22T15:00:00.000Z',
  },
];

export const demoCircleMembers = [
  { id: 'cm_demo_1', user_id: 'u_demo_1', circle_id: 'c_demo_1', role: 'admin', created_at: '2026-03-21T10:05:00.000Z' },
  { id: 'cm_demo_2', user_id: 'u_demo_2', circle_id: 'c_demo_2', role: 'admin', created_at: '2026-03-22T15:05:00.000Z' },
  { id: 'cm_demo_3', user_id: 'u_demo_2', circle_id: 'c_demo_1', role: 'member', created_at: '2026-03-23T09:30:00.000Z' },
];

export const demoInviteHint = {
  privateCircleCode: 'SYS246',
};


export const demoPosts = [
  {
    id: 'p_demo_1',
    user_id: 'u_demo_1',
    circle_id: 'c_demo_1',
    content: 'Day 5 of rebuilding my component library. Today I replaced one-off spacing hacks with a token scale and the UI finally feels breathable.',
    image_url: '',
    updated_at: '2026-03-31T12:30:00.000Z',
    deleted_at: null,
    created_at: '2026-03-31T12:30:00.000Z',
  },
  {
    id: 'p_demo_2',
    user_id: 'u_demo_2',
    circle_id: 'c_demo_2',
    content: 'Mapped a caching strategy for a feed service tonight. The biggest unlock was treating freshness as a product choice, not just an engineering one.',
    image_url: '',
    updated_at: '2026-03-31T18:00:00.000Z',
    deleted_at: null,
    created_at: '2026-03-31T18:00:00.000Z',
  },
];

export const demoComments = [
  {
    id: 'co_demo_1',
    user_id: 'u_demo_2',
    post_id: 'p_demo_1',
    content: 'The token-scale insight is real, @MayaChen. That usually makes everything else snap into place.',
    mentioned_users: ['u_demo_1'],
    updated_at: '2026-03-31T13:00:00.000Z',
    deleted_at: null,
    created_at: '2026-03-31T13:00:00.000Z',
  },
];

export const demoLikes = [
  { id: 'l_demo_1', user_id: 'u_demo_2', post_id: 'p_demo_1', created_at: '2026-03-31T13:05:00.000Z' },
  { id: 'l_demo_2', user_id: 'u_demo_1', post_id: 'p_demo_2', created_at: '2026-03-31T19:00:00.000Z' },
];

export const demoNotifications = [
  {
    id: 'n_demo_1',
    user_id: 'u_demo_1',
    type: 'like',
    reference_id: 'p_demo_1',
    triggered_by: 'u_demo_2',
    is_read: false,
    created_at: '2026-03-31T13:05:00.000Z',
  },
  {
    id: 'n_demo_2',
    user_id: 'u_demo_1',
    type: 'mention',
    reference_id: 'p_demo_1',
    triggered_by: 'u_demo_2',
    is_read: false,
    created_at: '2026-03-31T13:00:00.000Z',
  },
];

export const demoMessages = [
  {
    id: 'm_demo_1',
    circle_id: 'c_demo_1',
    user_id: 'u_demo_1',
    content: 'Kicking off a component refactor thread here so feedback does not get lost in the feed.',
    created_at: '2026-03-31T10:00:00.000Z',
  },
  {
    id: 'm_demo_2',
    circle_id: 'c_demo_1',
    user_id: 'u_demo_2',
    content: 'Love that. Share the spacing tokens when you have them.',
    created_at: '2026-03-31T10:04:00.000Z',
  },
];

export const demoReactions = [
  {
    id: 'r_demo_1',
    user_id: 'u_demo_2',
    reference_type: 'post',
    reference_id: 'p_demo_1',
    type: 'heart',
    created_at: '2026-03-31T13:06:00.000Z',
  },
  {
    id: 'r_demo_2',
    user_id: 'u_demo_1',
    reference_type: 'comment',
    reference_id: 'co_demo_1',
    type: 'celebrate',
    created_at: '2026-03-31T13:10:00.000Z',
  },
];

export const demoStreaks = [
  {
    user_id: 'u_demo_1',
    current_streak: 4,
    last_posted_at: '2026-03-31T12:30:00.000Z',
  },
  {
    user_id: 'u_demo_2',
    current_streak: 6,
    last_posted_at: '2026-03-31T18:00:00.000Z',
  },
];

export const demoUserSettings = [
  {
    user_id: 'u_demo_1',
    post_visibility: 'public',
    notify_likes: true,
    notify_comments: true,
    notify_mentions: true,
    notify_joins: true,
    weekly_digest: false,
    updated_at: '2026-03-31T08:00:00.000Z',
  },
  {
    user_id: 'u_demo_2',
    post_visibility: 'circles',
    notify_likes: true,
    notify_comments: true,
    notify_mentions: true,
    notify_joins: false,
    weekly_digest: true,
    updated_at: '2026-03-31T08:00:00.000Z',
  },
];
