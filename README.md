# SkillCircle

SkillCircle is a focused social learning platform built for sharing progress, joining high-signal communities, and keeping momentum visible.

The app combines:

- a social-style dashboard feed
- public and private skill circles
- real-time circle chat
- direct messaging with a floating Messenger-style dock
- profiles, notifications, settings, and analytics

## What Is New

This version includes a refreshed social UI and a more complete app shell:

- redesigned top navigation, sidebar, right panel, and mobile bottom nav
- floating bottom-right direct message dock
- minimizable Messenger-style chat boxes
- improved profile layout and editing flow
- updated notifications and search behavior
- cleaner responsive layout across dashboard, circles, and messaging
- frontend bug fixes across multiple pages

## Features

### Social Feed

- create short progress updates
- react to posts and comments
- comment on updates
- browse a home feed with dashboard insights
- see activity highlights and streak-related signals

### Circles

- create circles
- join public circles instantly
- join private circles with invite codes
- open circle-specific feeds
- view circle members and analytics
- leave circles when needed

### Messaging

- direct messages
- circle chat
- typing indicators
- reactions on chat messages
- delivery and read updates
- offline queue sync for messages
- floating desktop chat dock with minimize, restore, close, and full-chat navigation

### Profiles And Settings

- editable profile with name, bio, skills, and avatar
- profile stats and recent updates
- notification preferences
- post visibility settings

### Real-Time Experience

- live posts
- live comments
- live notifications
- live direct messages
- live circle messages
- live typing state
- live reaction and status updates

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Zustand
- React Router
- Socket.IO client

### Backend

- Node.js
- Express
- Socket.IO
- JWT auth
- repository-driven data provider selection

### Persistence

- Supabase PostgreSQL
- in-memory fallback repository for local demo mode

### Storage

- simulated storage by default
- optional Cloudinary upload support
- optional R2-style config surface in the backend

## Project Structure

```text
SkillCircle/
  backend/
    .env.example
    package.json
    src/
    supabase/
      schema.sql
    test/
  frontend/
    .env
    .env.example
    package.json
    public/
    src/
      components/
      data/
      hooks/
      layouts/
      pages/
      services/
      store/
      utils/
  package.json
  README.md
```

## Main Pages

- `/auth` - login and signup
- `/` - dashboard and feed
- `/circles` - joined/discover circles
- `/circles/:circleId` - circle details, posts, chat, members, analytics
- `/messages` - full direct messages page
- `/notifications` - grouped notifications center
- `/profile` - editable profile
- `/profile/:userId` - public profile view
- `/insights` - personal analytics
- `/settings` - privacy and notification preferences

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Backend Setup

Copy the backend env file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Important:

- keep `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` if you are using Supabase
- if those values are empty, the backend can run in seeded in-memory mode
- `DATA_PROVIDER` supports `memory`, `supabase`, and `auto`

### Frontend Setup

Copy the frontend env file:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Default frontend env:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_DEMO_USER_1_EMAIL=maya@skillcircle.dev
VITE_DEMO_USER_1_PASSWORD=password123
VITE_DEMO_USER_2_EMAIL=aarav@skillcircle.dev
VITE_DEMO_USER_2_PASSWORD=password123
```

### Run The App

Run frontend and backend together:

```bash
npm run dev
```

Or separately:

```bash
npm run dev:backend
npm run dev:frontend
```

### Local URLs

- frontend: `http://localhost:5173`
- backend API: `http://localhost:4000/api`
- backend base URL / socket server: `http://localhost:4000`

## Demo Accounts

- `maya@skillcircle.dev` / `password123`
- `aarav@skillcircle.dev` / `password123`

## Environment Variables

### Frontend

- `VITE_API_URL` - backend API base URL
- `VITE_SOCKET_URL` - backend Socket.IO base URL
- `VITE_DEMO_USER_1_EMAIL` - first demo user email
- `VITE_DEMO_USER_1_PASSWORD` - first demo user password
- `VITE_DEMO_USER_2_EMAIL` - second demo user email
- `VITE_DEMO_USER_2_PASSWORD` - second demo user password

### Backend

#### App

- `PORT`
- `APP_BASE_URL`
- `NODE_ENV`
- `BODY_LIMIT`
- `FORCE_HTTPS`

#### Auth

- `JWT_SECRET`

#### Client Origins

- `CLIENT_URL`
- `CLIENT_URLS`

#### Data

- `DATA_PROVIDER`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Storage

- `STORAGE_MODE`
- `R2_PUBLIC_BASE_URL`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_PRESET`

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Dashboard And Feed

- `GET /api/dashboard`
- `GET /api/posts`
- `POST /api/posts`
- `PATCH /api/posts/:postId`
- `DELETE /api/posts/:postId`
- `POST /api/posts/:postId/like`
- `POST /api/posts/:postId/comments`
- `PATCH /api/posts/comments/:commentId`
- `DELETE /api/posts/comments/:commentId`

### Circles

- `GET /api/circles`
- `POST /api/circles`
- `GET /api/circles/:circleId`
- `GET /api/circles/:circleId/search`
- `POST /api/circles/join-by-code`
- `POST /api/circles/:circleId/join`
- `PATCH /api/circles/:circleId/members/:userId/role`
- `DELETE /api/circles/:circleId/leave`

### Messaging

- `GET /api/messages/direct-chats`
- `POST /api/messages/direct-chats`
- `POST /api/messages/direct-chats/with/:userId`
- `GET /api/messages/direct-chats/:chatId/messages`
- `POST /api/messages/direct-chats/:chatId/messages`
- `PATCH /api/messages/direct-chats/:chatId/status`
- `GET /api/messages/direct-chats/:chatId/search`
- `POST /api/messages/direct-messages/:messageId/reactions`
- `GET /api/messages/circles/:circleId`
- `POST /api/messages/circles/:circleId`
- `PATCH /api/messages/circles/:circleId/status`
- `GET /api/messages/circles/:circleId/search`
- `POST /api/messages/circle-messages/:messageId/reactions`
- `POST /api/messages/media`
- `POST /api/messages/offline-sync`
- `POST /api/messages/:messageId/reaction`
- `POST /api/messages/:messageId/status`

### Compatibility Message Routes

- `GET /api/direct/:chatId/messages`
- `POST /api/direct/:chatId/message`
- `POST /api/direct/with/:userId`
- `GET /api/circle/:circleId/messages`
- `POST /api/circle/:circleId/message`

### Profile / Search / Settings / Analytics / Notifications

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/profile/:userId`
- `GET /api/search`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/analytics/user`
- `GET /api/analytics/circles/:circleId`
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`

### Media And Reactions

- `POST /api/media/upload`
- `POST /api/reactions`

### Utility

- `GET /api/health`

## Realtime Events

Socket events currently support:

- `new_post`
- `new_comment`
- `new_notification`
- `new_mention`
- `new_message`
- `message_status_update`
- `message_reaction`
- `media_upload_notification`
- `typing`
- `reaction_updated`
- `post_updated`
- `post_deleted`
- `comment_updated`
- `comment_deleted`

## Build And Test

### Build Everything

```bash
npm run build
```

### Backend Tests

```bash
npm test --workspace backend
```

### Individual Builds

```bash
npm run build --workspace backend
npm run build --workspace frontend
```

## Deployment Notes

### Suggested Stack

- frontend: Vercel
- backend: Render or Railway
- database: Supabase

### Frontend

- set `VITE_API_URL` to your deployed backend API URL
- set `VITE_SOCKET_URL` to your deployed backend base URL
- build output is `frontend/dist`

### Backend

- deploy the `backend` workspace as a Node service
- set `JWT_SECRET`
- set `CLIENT_URL` or `CLIENT_URLS`
- set `SUPABASE_URL`
- set `SUPABASE_SERVICE_ROLE_KEY`
- set `DATA_PROVIDER` appropriately for your environment
- keep storage env vars aligned with your selected upload mode

### Supabase

Before production:

1. run [backend/supabase/schema.sql](./backend/supabase/schema.sql)
2. set `SUPABASE_URL`
3. set `SUPABASE_SERVICE_ROLE_KEY`

## Security Notes

- never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- do not commit real `.env` secrets
- keep uploads server-mediated
- keep `backend/.env` local or managed through deployment secrets

## Current State

The app currently supports:

- auth
- dashboard feed
- circles
- direct messages
- floating chat dock
- circle chat
- live notifications
- profile editing
- settings
- user and circle analytics
- memory mode and Supabase mode

## Future Improvements

- stronger route-level automated tests
- pagination and larger-feed optimization
- richer admin tools for circles
- push notifications
- better media handling and storage abstraction
- end-to-end UI test coverage

## License

This project currently ships with the repository license in [LICENSE](./LICENSE).
