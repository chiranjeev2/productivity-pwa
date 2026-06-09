# ⚡ Productivity Pro (ProdPro)

A modern, real-time, full-stack Progressive Web Application (PWA) designed for seamless task management across devices. 

## ✨ Key Features

* **Real-Time Synchronization:** Built with WebSockets (`Socket.io`) to instantly sync task updates across multiple browsers and devices without refreshing.
* **Progressive Web App (PWA):** Fully installable on desktop and mobile devices with offline caching capabilities.
* **Bulletproof Security:** Custom JWT-based authentication with securely hashed passwords using `bcryptjs`.
* **Modern UI/UX:** Features a seamless Dark/Light mode toggle that remembers your preference.
* **Optimized Data Fetching:** Uses `@tanstack/react-query` for intelligent caching, loading states, and instant UI updates.

## 🛠️ Tech Stack

**Frontend:**
* React (Vite)
* React Query (Data Fetching)
* Axios (API Bridge)
* Socket.io-Client (WebSockets)
* Vite PWA Plugin

**Backend:**
* Node.js & Express
* MongoDB & Mongoose
* Socket.io (Real-time Engine)
* JSON Web Tokens (Auth)

## 🚀 Running Locally

### 1. Clone the repository
```bash
git clone [https://github.com/chiranjeev2/productivity-pwa.git](https://github.com/YOUR_USERNAME/productivity-pwa.git)
cd productivity-pwa