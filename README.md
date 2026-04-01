# SkillCircle

SkillCircle is a focused social learning platform for people who want to document progress, build consistency, and learn in public without the noise of a general-purpose social network.

Instead of optimizing for endless posting, SkillCircle is built around short progress updates, small communities called Skill Circles, and lightweight social signals that help users stay accountable over time.

## Live Demo / Preview

- Live app: `https://your-deployed-url-here.com`
- Local frontend: `http://localhost:5173`
- Local backend API: `http://localhost:4000/api`

### Demo Credentials

- `maya@skillcircle.dev` / `password123`
- `aarav@skillcircle.dev` / `password123`

## Why SkillCircle

SkillCircle sits between a habit tracker, a social feed, and a focused community product. It is designed for learners who want:

- visible progress over time
- smaller, higher-signal communities
- real-time interaction without the complexity of a large social platform
- a local-first developer experience with optional hosted services

## Features

### Core Features

- JWT authentication with signup, login, and session restore
- personal profiles with name, bio, skills, and uploaded avatar
- progress posts with timestamps and optional image URL support
- dashboard feed for recent learning activity
- settings page for privacy and notification preferences

### Social Features

- likes and comments on posts
- discoverable user profiles
- Skill Circles for focused communities
- join public circles or private circles by invite code
- circle-specific posting and membership views

### Real-Time Features

- live post updates
- live comment delivery
- real-time notifications
- circle chat with typing indicators and reactions
- direct messages with live delivery and status updates

### Advanced Features

- user analytics and circle analytics
- activity highlights and dashboard insights
- streak-aware product direction and analytics-ready backend structures
- offline-friendly queued message sync behavior
- local demo mode with seeded in-memory data

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Zustand
- React Router

### Backend

- Node.js
- Express
- JWT authentication

### Database

- Supabase PostgreSQL
- in-memory repository fallback for local demo mode

### Realtime

- Socket.io

### Storage

- simulated local asset URLs by default
- optional Cloudinary-backed upload flow

## Architecture Overview

SkillCircle uses a split frontend/backend architecture:

- the React frontend handles routing, UI state, optimistic interactions, and authenticated API access
- the Express backend exposes REST endpoints for auth, profiles, posts, circles, settings, analytics, messaging, and uploads
- the backend uses a repository abstraction to switch between Supabase persistence and an in-memory fallback
- Socket.io delivers real-time updates for posts, comments, notifications, chat messages, reactions, and typing state
- uploads are routed through the backend so the frontend does not need to talk directly to Cloudinary or any future storage provider

At a high level:

1. the frontend sends HTTP requests to the backend API
2. the backend reads or writes through the selected repository
3. the backend emits Socket.io events after real-time actions
4. connected clients reconcile live updates into local Zustand state

## Tech Decisions

- Repository pattern: keeps the app runnable locally without requiring Supabase
- Socket.io: simple event-based real-time model for feed, notifications, and chat
- Zustand: lightweight state management for auth, feed, chat, and analytics
- Vite: fast local iteration and straightforward frontend build pipeline

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

### Folder Guide

- `backend/src/controllers`: request handlers for HTTP endpoints
- `backend/src/routes`: route definitions and request wiring
- `backend/src/models`: repository implementations for memory mode and Supabase mode
- `backend/src/services`: auth helpers, storage helpers, seeding, and other business services
- `backend/src/middleware`: auth, validation, rate limiting, and error handling
- `backend/supabase/schema.sql`: database schema for real Supabase-backed persistence
- `frontend/src/pages`: route-level screens
- `frontend/src/components`: reusable UI building blocks and feature widgets
- `frontend/src/layouts`: shared application shell
- `frontend/src/store`: Zustand stores for auth and application state
- `frontend/src/services`: API and socket client integrations
- `frontend/src/data`: navigation metadata and static app configuration

## Current Implementation Status

The project already includes:

- JWT-based authentication with signup, login, and session restoration
- editable user profiles with bio, uploaded avatar, and skill tags
- post creation with comments, likes, and reactions
- circle creation, joining, and per-circle views
- direct and circle chat flows
- user and circle analytics endpoints
- responsive light/dark UI
- Supabase-ready persistence with a local in-memory fallback

## Setup Guide

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Install Dependencies

From the project root:

```bash
npm install
```

### 2. Configure the Backend

Create the backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

For local demo mode, you can leave Supabase values empty. The backend will seed demo users, circles, posts, likes, and comments in memory.

If you want real persistence:

1. run [backend/supabase/schema.sql](./backend/supabase/schema.sql) in your Supabase SQL editor
2. set `SUPABASE_URL`
3. set `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure the Frontend

Create the frontend environment file:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Recommended local frontend env:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_DEMO_USER_1_EMAIL=maya@skillcircle.dev
VITE_DEMO_USER_1_PASSWORD=password123
VITE_DEMO_USER_2_EMAIL=aarav@skillcircle.dev
VITE_DEMO_USER_2_PASSWORD=password123
```

### 4. Run the App

Start frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

### 5. Expected Result

After startup:

- frontend should be available at `http://localhost:5173`
- backend API should be available at `http://localhost:4000/api`
- the auth page should show demo credentials
- you should be able to sign in, browse the dashboard, open circles, and edit your profile

## Local Development Notes

- If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not provided, the app runs in seeded in-memory mode.
- Seeded memory data resets whenever the backend restarts.
- The frontend expects `http://localhost:4000/api` unless overridden in `frontend/.env`.
- The socket client expects `http://localhost:4000` unless overridden in `frontend/.env`.
- Avatar and chat uploads can go through `POST /api/media/upload`.
- Uploads are simulated by default and can use Cloudinary when its env vars are configured.

## Environment Variables

### Frontend

#### API / Realtime

- `VITE_API_URL`: full base URL for REST API requests used by the frontend
- `VITE_SOCKET_URL`: base URL for the Socket.io connection

#### Demo UX

- `VITE_DEMO_USER_1_EMAIL`: demo account email shown on the auth page
- `VITE_DEMO_USER_1_PASSWORD`: demo account password shown on the auth page
- `VITE_DEMO_USER_2_EMAIL`: second demo account email shown on the auth page
- `VITE_DEMO_USER_2_PASSWORD`: second demo account password shown on the auth page

### Backend

#### Server / App

- `PORT`: Express server port
- `APP_BASE_URL`: canonical backend base URL used for generated links and deployment-aware behavior
- `NODE_ENV`: runtime mode such as `development` or `production`
- `BODY_LIMIT`: JSON body size limit for API payloads
- `FORCE_HTTPS`: redirects forwarded HTTP traffic to HTTPS in production environments

#### Auth

- `JWT_SECRET`: JWT signing secret used for authentication tokens

#### CORS / Client Origins

- `CLIENT_URL`: primary frontend origin
- `CLIENT_URLS`: comma-separated list of allowed frontend origins for production deployments

#### Database

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: privileged backend-only Supabase key for database access

#### Storage

- `STORAGE_MODE`: upload mode, `simulated` by default
- `R2_PUBLIC_BASE_URL`: base URL used for simulated asset links and CDN-style fallbacks
- `CLOUDINARY_CLOUD_NAME`: enables Cloudinary uploads when combined with API credentials
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `CLOUDINARY_UPLOAD_PRESET`: optional Cloudinary upload preset

## Build Verification

```bash
npm run build --workspace backend
npm run build --workspace frontend
```

## API Overview

### Auth

- `POST /api/auth/signup`: create a new user account
- `POST /api/auth/login`: authenticate a user and return a JWT
- `GET /api/auth/me`: fetch the currently authenticated user

### Profile

- `GET /api/profile`: fetch the current user profile
- `PUT /api/profile`: update profile fields such as name, bio, avatar, and skills
- `GET /api/profile/:userId`: fetch a public profile by user id

### Posts

- `GET /api/posts`: fetch feed posts, optionally filtered by circle
- `POST /api/posts`: create a new post
- `POST /api/posts/:postId/like`: toggle or create a like interaction
- `POST /api/posts/:postId/comments`: add a comment to a post

### Circles

- `GET /api/circles`: list circles for discovery and membership state
- `GET /api/circles/:circleId`: fetch a single circle and its details
- `POST /api/circles`: create a new circle
- `POST /api/circles/:circleId/join`: join a public circle

### Media

- `POST /api/media/upload`: upload avatar or chat media through the backend

### Settings

- `GET /api/settings`: fetch user settings
- `PUT /api/settings`: update user settings

### Analytics

- `GET /api/dashboard`: fetch dashboard data and highlights
- `GET /api/analytics/user`: fetch user-level analytics
- `GET /api/analytics/circles/:circleId`: fetch circle-level analytics

## Real-Time Events

- `new_post`: pushes a newly created post to connected clients
- `new_comment`: pushes a newly created comment so feeds stay in sync
- `new_notification`: notifies users about activity relevant to them
- `new_message`: delivers new chat messages in circle chat and direct chat
- `message_status_update`: updates delivery/read state for chat messages
- `message_reaction`: syncs reactions applied to chat messages
- `media_upload_notification`: surfaces uploaded media events in chat flows
- `typing`: broadcasts typing presence for circle chat and direct messages
- `reaction_updated`: updates reaction counts for posts and comments
- `post_updated`: syncs post edits
- `post_deleted`: removes deleted posts from connected clients
- `comment_updated`: syncs comment edits
- `comment_deleted`: removes deleted comments from connected clients

Dashboard and analytics endpoints derive from existing post, circle, and notification data, so local demo mode stays useful without extra services.

## Deployment

### Suggested Stack

- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase

### Frontend Deployment Notes

- set `VITE_API_URL` to your deployed backend API URL
- set `VITE_SOCKET_URL` to your deployed backend base URL
- build command: `npm run build --workspace frontend`
- output directory: `frontend/dist`

### Backend Deployment Notes

- deploy the `backend` workspace as a Node service
- start command: `npm run start --workspace backend`
- set `CLIENT_URLS` to a comma-separated list of allowed frontend origins
- set `JWT_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`
- if using simulated storage, keep `STORAGE_MODE=simulated`
- if using hosted uploads, configure the Cloudinary env vars and test `POST /api/media/upload`

### Supabase Notes

- run the latest [schema.sql](./backend/supabase/schema.sql) before production deploys
- the schema includes notifications and circle chat messages
- the schema includes `streaks`, `user_settings`, premium circle metadata, and analytics-friendly counters

## Security Considerations

- JWTs are used for authenticated API access, so `JWT_SECRET` must be strong and private
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the frontend or committed to source control
- authenticated media uploads should remain backend-mediated so storage credentials stay server-side
- request validation and rate limiting are already part of the backend flow and should be preserved as the API grows
- `.env` files should remain local or be managed through your deployment provider's secrets system

## Contributing

Contributions are welcome. If you want to improve SkillCircle:

1. fork the repository
2. create a feature branch
3. make focused changes with clear commit messages
4. test your changes locally
5. open a pull request with a concise summary and screenshots when UI changes are involved

### Code Style Expectations

- keep changes aligned with the existing React, Zustand, and Express patterns
- prefer small, readable components and explicit state updates
- preserve the repository abstraction between memory mode and Supabase mode
- avoid committing secrets, generated logs, or local `.env` files
- update documentation when behavior or setup changes

## Future Improvements

- pagination and infinite scroll for larger feeds
- more scalable realtime and notification architecture
- mobile app clients
- push notifications
- richer moderation and admin controls
- stronger automated test coverage
- production-grade storage abstraction beyond simulated mode

## Portfolio Value

SkillCircle demonstrates:

- product thinking around a focused social experience
- full-stack architecture with clear separation of concerns
- real-time collaboration patterns using Socket.io
- practical state management in React with Zustand
- backend flexibility through repository-driven persistence

## License

Add your preferred license here, for example `MIT`.
