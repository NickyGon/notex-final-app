# 📝 NoteX — Real-Time Notes App (Next.js + Node.js + SSE)

NoteX is a lightweight but powerful notes application featuring real-time updates, a modern Next.js frontend, a Node.js backend with SSE (Server-Sent Events), and a clean UI with color-coded notes and a rich text editor (Quill).

This project is fully deployable, with:
- **Frontend** hosted on **Google Cloud Storage (Static website)**  
- **Backend API** hosted on **Render / Railway / Google Cloud Run**  
- **SSE live sync** across all browser tabs  

---

## 🚀 Features

### **Frontend (Next.js 15 — App Router)**
- Modern React UI  
- Persistent sidebar note editor  
- Live-updating grid (via SSE messages)  
- Rich text editor using **React Quill**  
- Color palette per note  
- Optimistic UI updates  
- Responsive note cards (2-column layout)  
- Hosted as a static website (`output: export`)

### **Backend (Node.js + Express + SQLite/PostgreSQL)**
- REST API for CRUD operations  
- **Server-Sent Events (SSE)** broadcasting:
  - Note created  
  - Note updated  
  - Note deleted  
- CORS-enabled for Next.js frontend  
- Persistent database storage  

---

## 📁 Project Structure

notex-final-app/
│
├── backend/
│ ├── app.js # Express server + SSE
│ ├── db.js # SQLite or Postgres helpers
│ ├── package.json
│ └── .env
│
├── frontend/
│ ├── public/ # SVG backgrounds, icons
│ ├── src/app/ # Next.js application pages
│ │ ├── page.tsx
│ │ ├── components/
│ │ └── services/
│ ├── next.config.ts
│ └── .env.local
│
└── README.md

---

## 🔧 Tech Stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | Next.js 15, React 19, React Quill |
| Backend      | Node.js, Express |
| Database     | SQLite or PostgreSQL |
| Realtime     | Server-Sent Events (SSE) |
| Hosting      | Google Cloud Storage (Frontend), Cloud Run/Render (Backend) |

---

# 🛠️ Installation & Setup

---

## 1️⃣ **Clone the repository**

```bash
git clone https://github.com/NickyGon/notex-final-app.git
cd notex-final-app
```

## 2️⃣ **Backend Setup**

### Install dependencies:

```bash
cd backend
npm install
```

### Create .env file:

```bash
PORT=4000
DATABASE_URL=./notes.db
CORS_ORIGIN=https://your-frontend-url.web.app
```

### Install dependencies:

```bash
node app.js
```

Backend will run at:
```bash
http://localhost:4000
http://localhost:4000/events   <-- SSE stream
```

## 3️⃣ **Frontend Setup (Next.js)**

Go to frontend folder:
```bash
cd ../frontend
npm install
```

Create .env.local:
```bash
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

Run development:
```bash
npm run dev
```

Frontend available at:
```bash
http://localhost:3000
```
