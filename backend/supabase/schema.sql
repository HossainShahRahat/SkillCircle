create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  bio text default '',
  avatar_url text default '',
  skills text[] default '{}',
  total_posts integer not null default 0,
  total_reactions integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists circles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text not null,
  is_private boolean not null default false,
  is_premium boolean not null default false,
  premium_badge text default 'core',
  invite_code text unique,
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists circle_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  circle_id uuid not null references circles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, circle_id)
);

alter table circles add column if not exists is_private boolean not null default false;
alter table circles add column if not exists invite_code text unique;
alter table circle_members add column if not exists role text not null default 'member';

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  circle_id uuid references circles(id) on delete set null,
  content text not null,
  image_url text default '',
  scheduled_for timestamptz,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  content text not null,
  mentioned_users uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  reference_type text not null check (reference_type in ('post', 'comment')),
  reference_id uuid not null,
  type text not null check (type in ('like', 'heart', 'fire', 'celebrate')),
  created_at timestamptz not null default now(),
  unique (user_id, reference_type, reference_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'join', 'mention')),
  reference_id uuid not null,
  triggered_by uuid not null references users(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  media_url text default '',
  media_type text default '',
  media_name text default '',
  media_size bigint not null default 0,
  reactions jsonb not null default '[]'::jsonb,
  message_status jsonb not null default '[]'::jsonb,
  client_id text,
  created_at timestamptz not null default now()
);

create table if not exists direct_chats (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references users(id) on delete cascade,
  user2_id uuid not null references users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user1_id, user2_id),
  check (user1_id <> user2_id)
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references direct_chats(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  content text not null default '',
  media_url text default '',
  media_type text default '',
  media_name text default '',
  media_size bigint not null default 0,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  reactions jsonb not null default '[]'::jsonb,
  message_status jsonb not null default '[]'::jsonb,
  client_id text,
  created_at timestamptz not null default now()
);

create table if not exists streaks (
  user_id uuid primary key references users(id) on delete cascade,
  current_streak integer not null default 0,
  last_posted_at timestamptz
);

create table if not exists user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  post_visibility text not null default 'public' check (post_visibility in ('public', 'circles')),
  notify_likes boolean not null default true,
  notify_comments boolean not null default true,
  notify_mentions boolean not null default true,
  notify_joins boolean not null default true,
  weekly_digest boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_created_at on posts (created_at desc);
create index if not exists idx_comments_post_id on comments (post_id);
create index if not exists idx_likes_post_id on likes (post_id);
create index if not exists idx_circle_members_circle_id on circle_members (circle_id);
create index if not exists idx_notifications_user_id on notifications (user_id, created_at desc);
create index if not exists idx_messages_circle_id on messages (circle_id, created_at asc);
create index if not exists idx_reactions_reference on reactions (reference_type, reference_id);
create index if not exists idx_direct_chats_users on direct_chats (user1_id, user2_id);
create index if not exists idx_direct_messages_chat_id on direct_messages (chat_id, created_at asc);

alter table notifications add column if not exists is_read boolean not null default false;
alter table comments add column if not exists mentioned_users uuid[] not null default '{}';
alter table posts add column if not exists updated_at timestamptz not null default now();
alter table posts add column if not exists deleted_at timestamptz;
alter table posts add column if not exists scheduled_for timestamptz;
alter table comments add column if not exists updated_at timestamptz not null default now();
alter table comments add column if not exists deleted_at timestamptz;
alter table users add column if not exists total_posts integer not null default 0;
alter table users add column if not exists total_reactions integer not null default 0;
alter table circles add column if not exists is_premium boolean not null default false;
alter table circles add column if not exists premium_badge text default 'core';
alter table messages add column if not exists media_url text default '';
alter table messages add column if not exists media_type text default '';
alter table messages add column if not exists media_name text default '';
alter table messages add column if not exists media_size bigint not null default 0;
alter table messages add column if not exists reactions jsonb not null default '[]'::jsonb;
alter table messages add column if not exists message_status jsonb not null default '[]'::jsonb;
alter table messages add column if not exists client_id text;
alter table direct_chats add column if not exists updated_at timestamptz not null default now();
alter table direct_messages add column if not exists media_url text default '';
alter table direct_messages add column if not exists media_type text default '';
alter table direct_messages add column if not exists media_name text default '';
alter table direct_messages add column if not exists media_size bigint not null default 0;
alter table direct_messages add column if not exists status text not null default 'sent';
alter table direct_messages add column if not exists reactions jsonb not null default '[]'::jsonb;
alter table direct_messages add column if not exists message_status jsonb not null default '[]'::jsonb;
alter table direct_messages add column if not exists client_id text;
