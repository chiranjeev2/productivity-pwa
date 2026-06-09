# ⚡ Productivity Pro (ProdPro)

![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

A modern, full-stack Progressive Web Application (PWA) designed for seamless task management. ProdPro features real-time cross-device synchronization, secure authentication, and a fully installable mobile experience.

### 🌐 **Live Demo:** [productivity-pwac.vercel.app](https://productivity-pwac.vercel.app)

---

## ✨ Key Features

* **Real-Time Cross-Device Sync:** Built with WebSockets (`Socket.io`) to instantly synchronize task updates between your desktop browser and mobile phone without refreshing.
* **Progressive Web App (PWA):** Fully installable on iOS and Android home screens, functioning exactly like a native mobile application.
* **Production-Grade Auth:** Secure, custom JWT-based authentication with encrypted passwords (`bcryptjs`).
* **Optimized Data Fetching:** Utilizes `@tanstack/react-query` for intelligent caching and instant UI updates.
* **Cloud Infrastructure:** Securely hosted with strict CORS routing and IP-whitelisted database access.

## 🏗️ Cloud Architecture

* **Frontend Hosting:** [Vercel](https://vercel.com/) (Edge Network)
* **Backend Server:** [Render](https://render.com/) (Node.js/Express)
* **Database:** MongoDB Atlas (Cloud Cluster)
* **Real-Time Bridge:** Socket.io communicating across Vercel and Render infrastructure.

---

## 🛠️ Running Locally (For Developers)

If you would like to clone and test this project on your local machine:

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/productivity-pwa.git](https://github.com/YOUR_USERNAME/productivity-pwa.git)
cd productivity-pwa

### 2. Install the dependencies
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

### 3. Environment Variables
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173

VITE_API_URL=http://localhost:5000/api/v1

### 4. Start Development Servers
# Terminal 1 (Backend)
cd backend
node server.js

# Terminal 2 (Frontend)
cd frontend
npm run dev

Designed and built by a future software engineer for personal workflow optimization.