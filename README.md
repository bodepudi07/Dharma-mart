<div align="center">

# 🙏 Dharma Setu

**India's Phygital Spiritual Infrastructure**

*Temple bookings, Poojas, Yatras, Live Darshan, Sacred Texts, AI Guru & more — all in one platform.*

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](#)
[![i18n](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20TE-FF9800)](#)

</div>

---

## ✨ Features

### 🛕 Temple & Darshan
- **Temple Explorer** — Browse & discover temples across India with detailed info, crowd levels, and live darshan
- **Darshan Booking** — Schedule darshan visits and pooja ceremonies online
- **VR Darshan** — Virtual reality temple experiences from home

### 📖 Sacred Knowledge
- **Vedic Library** — Read scriptures including the Avadhuta Gita, Vedas, and more
- **Sloka of the Day** — Daily verses with translations and commentary
- **Knowledge Hub** — Ancient Indian history, facts, and spiritual encyclopedia
- **AI Guru** — AI-powered spiritual guidance and scripture queries

### 🧘 Spiritual Practice
- **Meditation Zone** — Guided meditation sessions and ambient soundscapes
- **Chakra Sanctuary** — Chakra balancing and energy alignment tools
- **Panchang Widget** — Daily Hindu calendar with auspicious timings
- **Festival Calendar** — Upcoming festivals and religious events

### 🚌 Yatra (Pilgrimages)
- **Yatra Planner** — Plan and customize pilgrimage itineraries
- **Jyotirlinga View** — Explore the 12 sacred Jyotirlingas
- **State Sanctuary** — State-wise temple and spiritual destination explorer

### 🛒 Dharma Mart
- **Spiritual Products** — Shop for pooja essentials, books, and spiritual items
- **AI Shopper** — Personalized product recommendations

### 👥 Community
- **Satsang** — Community discussions, posts, and spiritual sharing
- **Chat Rooms** — Real-time spiritual conversations
- **Pandit Directory** — Find and book pandits for ceremonies

### 🎮 Gamification
- **Amrit Collector** — Earn spiritual rewards through engagement
- **Daily Tasks & Achievements** — Track your spiritual journey progress
- **Divya Marga** — Personalized spiritual growth pathways

### 🌐 Platform
- **Multi-Language** — Full support for English, Hindi (हिन्दी), and Telugu (తెలుగు)
- **PWA Ready** — Install as a native app on mobile & desktop
- **Responsive Design** — Optimized for all screen sizes
- **Animated UI** — Premium motion-based transitions & micro-animations

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion) |
| **Backend** | Node.js, Express 5, JSON database |
| **AI** | Google Gemini API, Groq SDK |
| **Build** | Vite 6, Concurrently |
| **Auth** | JWT, bcrypt |
| **Security** | Helmet, CORS, Rate Limiting |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- A [Gemini API key](https://ai.google.dev/) (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dharma-setu.git
cd dharma-setu

# Install dependencies
npm install
```

### Environment Setup

Copy the example env file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
NODE_ENV=development
PORT=5000

JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key          # optional fallback
FRONTEND_URL=http://localhost:5173
```

### Running the App

```bash
# Start both frontend & backend together
npm run dev:fullstack

# Or run them separately:
npm run dev        # Frontend only (Vite dev server)
npm run server     # Backend only (Express API)
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:5000`.

---

## 📁 Project Structure

```
dharma-setu/
├── frontend/
│   ├── src/
│   │   ├── components/     # 120+ React components
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main application
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── constants.ts    # App-wide constants & data
│   └── public/
│       ├── data/           # Static JSON data (books, content)
│       ├── images/         # Static image assets
│       └── assets/         # Other static assets
├── backend/
│   ├── routes/             # Express API routes
│   │   ├── admin.js        # Admin dashboard APIs
│   │   ├── ai.js           # AI/Gemini integration
│   │   ├── auth.js         # Authentication
│   │   ├── bookings.js     # Darshan & pooja bookings
│   │   ├── books.js        # Scripture library
│   │   ├── chats.js        # Real-time chat
│   │   ├── temples.js      # Temple data
│   │   ├── poojas.js       # Pooja ceremonies
│   │   ├── yatras.js       # Pilgrimage routes
│   │   └── ...
│   ├── middleware/          # Auth & validation middleware
│   ├── services/           # Business logic services
│   ├── database/           # JSON data storage
│   └── db.js               # Database layer with caching
└── package.json
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run server` | Start backend API server |
| `npm run dev:fullstack` | Start both frontend & backend |
| `npm run build` | Build frontend for production |
| `npm run lint` | Type-check with TypeScript |
| `npm run preview` | Preview production build |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and not licensed for public distribution.

---

<div align="center">

**Built with ❤️ for the spiritual community**

*Dharma Setu — The Bridge to Dharma*

</div>
