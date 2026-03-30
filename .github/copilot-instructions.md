# Project Guidelines

## Code Style
Frontend uses functional React components with hooks and ES6 modules. Backend follows Express middleware patterns with try/catch error handling and ES6 modules. CSS is paired with components in external files, with inline styles for dynamic layouts.

Reference: [src/components/ui/Button.jsx](src/components/ui/Button.jsx) for component structure and variant system.

## Architecture
Full-stack JavaScript application with React frontend (Vite), Node.js/Express backend, and MongoDB database. Features JWT-based authentication, Claude AI agent integration for user profiling, and streaming responses via Server-Sent Events.

Key boundaries:
- Frontend: Routing, UI components, auth context
- Backend: API routes, middleware, database models
- Data flow: Authenticate → JWT token → Protected API calls → MongoDB persistence

## Build and Test
Frontend commands:
- `npm run dev`: Start Vite dev server with HMR
- `npm run build`: Production build to dist/
- `npm run lint`: ESLint check

Backend commands:
- `npm run dev`: Start with Nodemon for hot reload
- `npm start`: Production start

Required environment variables (backend/.env):
- MONGO_URI: MongoDB connection string
- JWT_SECRET: Token signing secret
- ANTHROPIC_API_KEY: Claude API key
- FRONTEND_URL: CORS origin (default: http://localhost:5173)
- PORT: Backend port (default: 5001)

## Conventions
- Naming: Components in PascalCase, API routes in kebab-case
- Auth: ProtectedRoute HOC checks authentication and onboarding status
- Onboarding: Multi-step questionnaire with Framer Motion transitions
- Agent chat: SSE streaming for real-time Claude responses
- JWT: 30-day expiration, verified on protected requests

Pitfalls:
- API endpoints hardcoded to localhost:5001; use environment variables for different environments
- Ensure .env file is not committed (add to .gitignore)

See [README.md](README.md) for React/Vite setup basics.