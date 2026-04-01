# SkillCircle

SkillCircle is a modern social platform MVP for sharing learning progress, joining focused communities, and keeping momentum visible.

It is designed as a focused social product, not a general-purpose network. The experience is built around short progress updates, small learning communities called Skill Circles, and lightweight interactions that reinforce consistency.

## Stack

- Frontend: React, Vite, Tailwind CSS, Zustand, React Router
- Backend: Node.js, Express, JWT
- Database: Supabase PostgreSQL
- Storage: Cloudflare R2 style upload flow with a simulated local fallback

## Product Goals

- Help users document learning progress in a clean, motivating feed
- Keep community interaction focused on improvement, not noise
- Make the MVP easy to run locally and easy to migrate to real hosted services

## Core Features

- Authentication with signup, login, JWT session restore
- User profile with name, bio, avatar, and skill tags
- Progress posts with optional image URL and timestamps
- Global feed ordered by latest activity
- Likes and comments on posts
- Skill Circles for community creation, joining, and circle-specific posting
- Light and dark mode with a consistent product-style UI
- Real-time feed, comments, notifications, and circle chat with Socket.io
- Personalized dashboard feed with activity highlights and streak tracking
- User settings for privacy and notification preferences
- Insights pages for user and circle-level activity

## Project Structure

```text
SkillCircle/
  package.json
  README.md
  backend/
    .env.example
    package.json
    src/
      controllers/
        authController.js
        circleController.js
        postController.js
        profileController.js
      middleware/
        authMiddleware.js
        errorHandler.js
      models/
        memoryRepository.js
        repository.js
        supabaseRepository.js
      routes/
        authRoutes.js
        circleRoutes.js
        postRoutes.js
        profileRoutes.js
      services/
        authService.js
        seedData.js
        storageService.js
      config.js
      server.js
    supabase/
      schema.sql
  frontend/
    .env.example
    package.json
    index.html
    src/
      components/
        Avatar.jsx
        Button.jsx
        Card.jsx
        CreateCircleModal.jsx
        CreatePostModal.jsx
        Input.jsx
        Modal.jsx
        PostCard.jsx
        RightPanel.jsx
        Sidebar.jsx
        Textarea.jsx
      hooks/
        useTheme.js
      layouts/
        AppLayout.jsx
      pages/
        AuthPage.jsx
        CirclePage.jsx
        DashboardPage.jsx
        ProfilePage.jsx
      services/
        api.js
      store/
        appStore.js
        authStore.js
      data/
        navigation.js
      utils/
        cn.js
      main.jsx
      router.jsx
      styles.css
    postcss.config.js
    tailwind.config.js
    vite.config.js
```

## What Is Implemented

- JWT-based authentication with signup, login, and session restoration
- Editable user profiles with bio, avatar, and skill tags
- Progress post creation with optional image URL and circle targeting
- Global feed and per-circle feed views
- Likes and comments
- Circle creation and membership
- Modern responsive UI with light and dark mode
- Supabase-ready schema with a local simulated data fallback

## Backend Notes

- The backend uses a repository abstraction.
- If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided, it uses Supabase tables.
- If they are not provided, it falls back to an in-memory seeded demo mode so the MVP still runs locally.
- Image uploads are simulated through generated CDN-style URLs unless you wire a real R2 flow.

## Architecture

### Frontend

- `pages/` contains route-level screens
- `components/` contains reusable UI primitives and composed widgets
- `store/` contains Zustand stores for auth and app state
- `services/api.js` centralizes HTTP requests to the backend
- `layouts/AppLayout.jsx` provides the sidebar, main feed shell, and right rail

### Backend

- `controllers/` contains request handlers
- `routes/` maps HTTP endpoints to controllers
- `middleware/` holds auth and error handling
- `models/repository.js` selects the active data source
- `models/supabaseRepository.js` is the production-ready persistence layer
- `models/memoryRepository.js` is the local demo fallback

## Environment Variables

### Frontend

- `VITE_API_URL`: backend API base URL
- `VITE_SOCKET_URL`: backend websocket base URL

### Backend

- `PORT`: Express server port
- `CLIENT_URL`: frontend origin for CORS
- `CLIENT_URLS`: comma-separated allowed frontend origins for production deployments
- `JWT_SECRET`: signing secret for JWT auth
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `STORAGE_MODE`: `simulated` by default
- `R2_PUBLIC_BASE_URL`: public base URL for generated asset links
- `R2_BUCKET_NAME`: Cloudflare R2 bucket name for production image storage
- `R2_ENDPOINT`: Cloudflare R2 S3-compatible endpoint
- `R2_ACCESS_KEY_ID`: R2 access key id
- `R2_SECRET_ACCESS_KEY`: R2 secret access key
- `BODY_LIMIT`: JSON payload size limit for the API
- `APP_BASE_URL`: deployed backend base URL
- `FORCE_HTTPS`: redirect forwarded HTTP traffic to HTTPS in production
- `NODE_ENV`: runtime mode

## Demo Login

- Email: `maya@skillcircle.dev`
- Email: `aarav@skillcircle.dev`
- Password: `password123`

## Setup

1. Install root and workspace dependencies:

```bash
npm install
```

2. Create backend env file:

```powershell
Copy-Item backend/.env.example backend/.env
```

3. Create frontend env file:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

4. Optional: if you want real Supabase persistence, run [backend/supabase/schema.sql](./backend/supabase/schema.sql) in your Supabase SQL editor and fill in `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

5. Start both apps:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Local Development Notes

- The backend can run without Supabase and will seed demo users, circles, posts, likes, and comments in memory.
- The seeded data resets whenever the backend restarts in simulated mode.
- The frontend expects the backend at `http://localhost:4000/api` unless overridden in `frontend/.env`.
- The socket client expects the backend websocket server at `http://localhost:4000` unless overridden in `frontend/.env`.

## Build Verification

```bash
npm run build --workspace backend
npm run build --workspace frontend
```

## Deployment

### Suggested Stack

- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase

### Frontend Deployment Notes

- Set `VITE_API_URL` to your deployed backend API URL, for example `https://skillcircle-api.onrender.com/api`
- Set `VITE_SOCKET_URL` to your deployed backend base URL, for example `https://skillcircle-api.onrender.com`
- Build command: `npm run build --workspace frontend`
- Output directory: `frontend/dist`

### Backend Deployment Notes

- Deploy the `backend` workspace as a Node service
- Start command: `npm run start --workspace backend`
- Set `CLIENT_URLS` to a comma-separated list of allowed frontend origins
- Set `JWT_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`
- If using simulated storage, keep `STORAGE_MODE=simulated`; otherwise wire a real CDN or R2 flow

### Supabase Notes

- Run the latest [schema.sql](./backend/supabase/schema.sql) before production deploys
- The schema now includes notifications and circle chat messages
- The schema also includes `streaks`, `user_settings`, premium circle metadata, and analytics-friendly counters

## Real-Time Events

- `new_post`
- `new_comment`
- `new_notification`
- `new_message`
- Dashboard and analytics endpoints derive from existing post, circle, and notification data, so local demo mode stays useful without extra services

## New Endpoints

- `GET /api/dashboard`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/analytics/user`
- `GET /api/analytics/circles/:circleId`

## Suggested Next Steps

- Replace simulated image URLs with real Cloudflare R2 uploads
- Add route guards and server-side validation hardening
- Add pagination and optimistic updates for larger feeds
- Introduce tests for auth, post interactions, and circle membership flows

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/posts`
- `POST /api/posts`
- `POST /api/posts/:postId/like`
- `POST /api/posts/:postId/comments`
- `GET /api/circles`
- `GET /api/circles/:circleId`
- `POST /api/circles`
- `POST /api/circles/:circleId/join`
