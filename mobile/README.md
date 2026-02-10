# Insight Mobile App

React Native mobile application for the Insight academic research repository.

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for Android development)

### Installation

1. **Install dependencies**
```bash
cd mobile
npm install
```

2. **Configure environment variables**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Firebase credentials
```

3. **Start the development server**
```bash
npm start
```

4. **Run on device/simulator**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
mobile/
├── src/
│   ├── config/          # Firebase and app configuration
│   ├── contexts/        # React contexts (Auth)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # Screen components
│   │   ├── auth/       # Login, Register
│   │   └── main/       # Dashboard, Search, etc.
│   ├── services/        # API and auth services
│   └── types/          # TypeScript types
├── App.tsx             # Root component
└── package.json
```

## Features Implemented

✅ Firebase Authentication
✅ Navigation (Stack & Tabs)
✅ Login/Register screens
✅ Auth context and state management
✅ API service with automatic token injection
✅ Protected routes

## Next Steps

- Implement search functionality
- Add PDF reader
- Build bookmarks system
- Create analytics dashboard
- Add file upload capabilities
