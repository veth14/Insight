# 🚀 Quick Start Setup Guide

## ✅ Status

- **Firebase**: ✅ Configured & Connected
- **MongoDB**: ✅ Connected
- **Supabase**: ✅ Configured
- **Mobile**: ✅ Configured (Expo SDK 54)
- **Backend**: ✅ Running on Port 3000

## 🏃 How to Run

I have set up **VS Code Tasks** to make this easy:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac).
2. Type `Run Task` and select it.
3. Choose:
   - **Start Backend Server** (Wait for "Connected to MongoDB")
   - **Start Mobile App** (Scan QR code or press 'a' for Android emulator)

---

## 🔴 Previous Setup Notes

### 1. Firebase Admin SDK (Backend)

**Get credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/qcuresearchapp/settings/serviceaccounts/adminsdk)
2. Click **"Generate New Private Key"**
3. Download JSON file
4. Open `backend/.env` and update:

```env
FIREBASE_PROJECT_ID=qcuresearchapp  # Already set ✓
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_FROM_JSON\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@qcuresearchapp.iam.gserviceaccount.com
```

### 2. Supabase Service Role Key

**Get key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/vsxebuwhddyotyvuqqxl/settings/api)
2. Copy **service_role** key (not anon)
3. Update `backend/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
```

See `SUPABASE_SETUP.md` for detailed instructions.

### 3. MongoDB Atlas

**Setup:**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (for development)
5. Get connection string
6. Update `backend/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/insight?retryWrites=true&w=majority
```

---

## 🏃‍♂️ Running the App

### Backend
```bash
cd backend
npm install
npm run dev
```

Expected output:
```
✅ Firebase Admin initialized successfully
✅ MongoDB connected successfully
✅ Supabase client initialized successfully
🚀 Server running on port 3000
```

### Mobile App
```bash
cd mobile
npm install
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code for physical device

---

## 📋 Configuration Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Firebase (Mobile) | ✅ Done | None |
| Firebase (Backend) | ⚠️ Partial | Get Admin SDK credentials |
| Supabase URL | ✅ Done | None |
| Supabase Anon Key | ✅ Done | None |
| Supabase Service Key | ⚠️ Temporary | Get service_role key |
| MongoDB | ❌ Missing | Create Atlas cluster |

---

## 🆘 Troubleshooting

### Backend won't start
- Check if all env variables are set
- Verify MongoDB connection string
- Ensure Firebase private key is properly formatted (with `\n`)

### Mobile app auth fails
- Check if Firebase project has Email/Password enabled
- Verify API_URL in mobile/.env points to running backend

### File uploads fail
- Must use service_role key, not anon key
- Check Supabase bucket exists and is private
- Verify CORS settings in Supabase

---

## 🎯 Next Steps After Setup

1. **Test Authentication**
   - Register a new user
   - Login/logout
   - Check user created in MongoDB

2. **Implement PDF Upload**
   - Build upload API endpoint
   - Integrate with Supabase storage
   - Extract PDF text

3. **Build Search Feature**
   - Full-text search API
   - Filter by category/year
   - Pagination

4. **Add PDF Reader**
   - Display PDFs in mobile app
   - Track reading progress
   - Save bookmarks
