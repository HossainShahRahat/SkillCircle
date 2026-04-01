create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  bio text default '',
  avatar_url text default '',
  skills text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists circles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text not null,
  is_private boolean not null default false,
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
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'join')),
  reference_id uuid not null,
  triggered_by uuid not null references users(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_created_at on posts (created_at desc);
create index if not exists idx_comments_post_id on comments (post_id);
create index if not exists idx_likes_post_id on likes (post_id);
create index if not exists idx_circle_members_circle_id on circle_members (circle_id);
create index if not exists idx_notifications_user_id on notifications (user_id, created_at desc);

alter table notifications add column if not exists is_read boolean not null default false;
