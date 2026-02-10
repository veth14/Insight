# Insight - Academic Research Repository

University-restricted research repository for theses, papers, and capstone projects.

## Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Authentication**: Firebase Auth
- **Navigation**: React Navigation

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript

### Database & Storage
- **Database**: MongoDB Atlas (metadata, analytics, search indexes)
- **File Storage**: Supabase Storage (PDFs, private access)

## Project Structure

```
insight/
├── mobile/                 # Expo React Native app
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── components/    # Reusable UI components
│   │   ├── navigation/    # Navigation configuration
│   │   ├── services/      # API calls and Firebase
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Helper functions
│   │   └── constants/     # App constants
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
└── backend/               # Node.js Express server
    ├── src/
    │   ├── controllers/   # Request handlers
    │   ├── models/        # MongoDB schemas
    │   ├── routes/        # API routes
    │   ├── middleware/    # Auth, validation, error handling
    │   ├── services/      # Business logic (PDF processing, Supabase)
    │   ├── config/        # Configuration (DB, Firebase, Supabase)
    │   └── types/         # TypeScript types
    ├── server.ts
    ├── package.json
    └── tsconfig.json
```

## User Roles

- **1st–3rd year students**: Read-only access
- **4th year students**: Read + Upload capabilities
- **Admins/Faculty**: Analytics, moderation, audit logs

## Features

- 🔐 Firebase Authentication (email/password)
- 📚 Search academic papers with full-text indexing
- 📄 In-app PDF reading
- 🔖 Bookmarks and reading history
- 📊 Analytics dashboard (admin only)
- 📝 Citation generation
- ⬆️ PDF upload (4th year & admin only)

## Getting Started

See individual README files in `/mobile` and `/backend` directories for setup instructions.
