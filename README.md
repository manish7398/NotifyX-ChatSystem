# 💬 NotifyX – Real-time Chat App

A professional full-stack real-time chat application built with **React**, **Node.js**, **Socket.IO**, and **MongoDB** — inspired by WhatsApp & Instagram DMs.

---

## ✨ Features

- 🔐 **JWT Authentication** – Register & login with secure tokens (7-day expiry)
- ⚡ **Real-time Messaging** – Instant message delivery via Socket.IO
- ✓✓ **Read Receipts** – Sent → Delivered → Seen status ticks (blue on seen)
- ⌨️ **Typing Indicators** – Live "typing…" animation
- 🟢 **Online/Offline Status** – Real-time presence with last seen
- 🗑️ **Delete Messages** – Delete for me or delete for everyone
- 🔔 **Toast Notifications** – In-app alerts for new messages
- 📱 **Fully Responsive** – Mobile-first design
- 🔒 **Rate Limiting** – Brute-force protection on login
- 🧠 **Optimistic UI** – Messages appear instantly before server confirmation

---

## 🗂️ Project Structure

```
complete_project/
├── backend/
│   ├── server.js          # Express + Socket.IO entry point
│   ├── db.js              # MongoDB connection
│   ├── socket.js          # Socket event handlers
│   ├── authController.js  # Register & Login logic
│   ├── authMiddleware.js  # JWT verification
│   ├── authRoutes.js      # /api/auth routes
│   ├── userRoutes.js      # /api/users routes
│   ├── messageRoutes.js   # /api/messages routes
│   ├── User.js            # User model
│   ├── Message.js         # Message model
│   ├── Notification.js    # Notification model
│   ├── .env               # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx         # Auth routing
    │   ├── Login.jsx       # Login page
    │   ├── Register.jsx    # Register page
    │   ├── Dashboard.jsx   # Main chat UI
    │   ├── api.js          # Axios instance
    │   ├── socket.js       # Socket.IO client
    │   ├── App.css         # All styles (WhatsApp-inspired)
    │   └── index.css       # Global reset
    ├── index.html
    ├── .env
    └── package.json
```

---

## 🚀 Setup & Run

### 1. Clone / Extract the project

### 2. Backend

```bash
cd backend
npm install
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/notifyx
JWT_SECRET=your_strong_random_secret_here
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev      # development (nodemon)
npm start        # production
```

### 3. Frontend

```bash
cd frontend
npm install
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev      # development
npm run build    # production build
```

---

## 🌐 Deployment

| Service | Purpose |
|---------|---------|
| **Render** / **Railway** | Backend hosting |
| **Vercel** / **Netlify** | Frontend hosting |
| **MongoDB Atlas** | Database |

For deployment, update:
- `MONGO_URI` → MongoDB Atlas connection string
- `JWT_SECRET` → A long random string
- `CLIENT_URL` → Your deployed frontend URL
- `VITE_API_URL` → Your deployed backend URL

---

## 🛠️ Tech Stack

**Frontend:** React 19, Vite, Socket.IO Client, Axios, jwt-decode  
**Backend:** Node.js, Express 5, Socket.IO, Mongoose, bcryptjs, jsonwebtoken  
**Database:** MongoDB  

---

## 📄 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/notifications` | ✅ | Get user notifications |
| GET | `/api/users` | ✅ | Get all users (with search) |
| GET | `/api/users/unread-counts` | ✅ | Get unread message counts |
| GET | `/api/messages/:userId` | ✅ | Get chat history |
| DELETE | `/api/messages/:messageId` | ✅ | Delete a message |

---

## ⚡ Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRoom` | Client → Server | Join user's personal room |
| `sendMessage` | Client → Server | Send a message |
| `receiveMessage` | Server → Client | Receive a message |
| `messageDelivered` | Server → Client | Delivery confirmation |
| `messageSeen` | Both | Read receipt |
| `markAllSeen` | Client → Server | Bulk mark as seen |
| `typing` | Both | Typing indicator start |
| `stopTyping` | Both | Typing indicator stop |
| `deleteMessage` | Client → Server | Delete for everyone |
| `messageDeleted` | Server → Client | Message removed event |
| `onlineUsers` | Server → Client | Online users list |
