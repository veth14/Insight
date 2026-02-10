# Insight Backend API

Node.js Express backend for the Insight academic research repository.

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Firebase Admin SDK credentials
- Supabase account

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment variables**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your credentials:
# - MongoDB Atlas connection string
# - Firebase Admin SDK credentials (from Firebase Console > Project Settings > Service Accounts)
# - Supabase URL and service role key
```

3. **Get Firebase Admin SDK Credentials**
- Go to Firebase Console → Project Settings → Service Accounts
- Click "Generate New Private Key"
- Copy the values from the JSON file to your `.env`

4. **Start development server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── config/           # Database, Firebase, Supabase config
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, error handling
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic (to be implemented)
│   ├── types/            # TypeScript types
│   └── server.ts         # Main entry point
├── .env.example          # Environment variables template
├── package.json
└── tsconfig.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (requires Firebase token)
- `GET /api/auth/me` - Get current user profile

### Health Check
- `GET /health` - Server health status

## Database Models

### User
- Stores user profiles synced from Firebase
- Fields: uid, email, displayName, role, yearLevel

### AcademicStudy
- Stores research paper metadata
- Full-text search enabled on title, abstract, content

### ReadingHistory
- Tracks user reading progress

### Bookmark
- Stores user bookmarks

## Security

- Firebase ID token verification on protected routes
- Role-based access control (RBAC)
- Helmet.js for security headers
- CORS configured for specific origins
- No direct database access from frontend

## Next Steps

- Implement study upload API (with Supabase integration)
- Add PDF text extraction service
- Create search API with MongoDB full-text search
- Build bookmarks and reading history endpoints
- Implement analytics endpoints for admins
