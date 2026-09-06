<div align="center">

# 📓 Personal Gemini Journal

**An intelligent, serverless journaling and introspection platform powered by Google Gemini, React, and Google Cloud Run.**

[![Google Cloud Run](https://img.shields.io/badge/Deployed%20on-Google%20Cloud%20Run-4285F4?logo=google-cloud&logoColor=white)](https://online-journal-1068289664916.us-central1.run.app)
[![Gemini API](https://img.shields.io/badge/AI-Google%20Gemini%20API-8E75B2?logo=google-gemini&logoColor=white)](https://aistudio.google.com/)
[![Firebase](https://img.shields.io/badge/Auth%20%26%20DB-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🌐 Live Demo](https://online-journal-1068289664916.us-central1.run.app) • [💻 Source Code](https://github.com/Pratyush-Kulshreshtha-35/online-journal) • [🐛 Report Bug](https://github.com/Pratyush-Kulshreshtha-35/online-journal/issues)

</div>

---

## 📖 Overview

Developed for the **Google Cloud Gen AI Academy APAC Edition 2026** (*Cohort 3: Accelerate AI with Cloud Run* Ideathon in partnership with **Hack2skill**), **Personal Gemini Journal** transforms passive note-taking into an active, mindful conversation. 

By leveraging the **Gemini API** alongside **Cloud Run**, the platform provides dynamic introspective prompts, sentiment analysis, and intelligent reflections—all while ensuring end-to-end data isolation and privacy through **Firebase**.

---

## ✨ Key Features

* 💡 **Contextual Writing Prompts:** Overcomes writer's block using Gemini to generate tailored, introspective prompts based on recent moods or themes.
* 🎭 **Automated Emotion & Sentiment Tagging:** Intelligently tags entries into emotional categories (*Reflective*, *Grateful*, *Joyful*, *Calm*, *Inspired*) for longitudinal trend tracking.
* 🔒 **Private & Isolated Workspaces:** Built on Firebase Authentication and Firestore Security Rules to guarantee strict multi-tenant isolation.
* ⚡ **Serverless Scalability:** Deployed on Google Cloud Run with scale-to-zero capabilities for cost efficiency and low-latency performance.
* 🎨 **Sleek, Responsive Dark UI:** Crafted with React 19, Tailwind CSS, Lucide icons, and responsive layouts optimized for mobile and desktop screens.
* 🔄 **Continuous Cloud Deployment:** Automated CI/CD pipeline powered by Google Cloud Build on every push to the repository.

---

## 🏗️ Architecture & Technology Stack

```text
[ React 19 + Vite Frontend ]
              │
              ├──► [ Firebase Auth & Cloud Firestore ] (User Identity & Encrypted Journal Storage)
              │
              └──► [ Google Cloud Run Service ]
                             │
                             ├──► [ Google Secret Manager ] (Secure GEMINI_API_KEY Injection)
                             └──► [ Google Gemini API ] (Multimodal Analysis & Prompts)
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite | Responsive UI, state management, and real-time markdown editing |
| **GenAI Engine** | Google Gemini API (`@google/genai`) | Tone detection, reflective questions, and cognitive summaries |
| **Compute** | Google Cloud Run | Fully managed container runtime auto-scaling from zero to handle spikes |
| **Authentication** | Firebase Authentication | Secure Google Sign-In and email/password provider |
| **Database** | Cloud Firestore | User-scoped NoSQL document store with role-based security rules |
| **DevOps / CI/CD** | Cloud Build & Artifact Registry | Automated container builds and continuous zero-downtime deployments |
| **Secrets** | Secret Manager | Production-grade runtime protection for API credentials |

---

## 📂 Project Structure

```text
online-journal/
├── public/                # Static assets, icons, and web manifest
├── src/
│   ├── assets/            # Project images and illustrations
│   ├── components/        # Reusable UI components (Modals, Cards, Buttons)
│   ├── context/           # React context providers (AuthContext, JournalContext)
│   ├── hooks/             # Custom hooks (useJournal, useGemini, useAuth)
│   ├── lib/               # Firebase and Gemini client initialization
│   ├── pages/             # Main application views (Dashboard, Journal, Analytics)
│   ├── styles/            # Global styling and Tailwind directives
│   ├── types/             # TypeScript interfaces and schema declarations
│   ├── App.tsx            # Main router and shell layout
│   └── main.tsx           # Application entry point
├── .env.example           # Template for local environment variables
├── Dockerfile             # Multi-stage production container definition
├── firestore.rules        # Security rules for user-isolated database access
├── package.json           # Dependencies and build scripts
├── tailwind.config.js     # Tailwind design system configuration
├── vite.config.ts         # Vite bundler configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** (v20+)
* **npm**, **pnpm**, or **bun**
* **Google Cloud SDK (`gcloud`)** (for deployment)
* A Gemini API key from [Google AI Studio](https://aistudio.google.com/)
* A Firebase Project with **Authentication** and **Cloud Firestore** enabled

### 1. Clone the Repository

```bash
git clone https://github.com/Pratyush-Kulshreshtha-35/online-journal.git
cd online-journal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` (or the port specified by Vite) in your browser.

---

## 🐳 Containerization & Local Testing

You can build and run the production container locally using Docker:

```bash
# Build the container image
docker build -t online-journal .

# Run the container exposing port 8080
docker run -p 8080:8080 \
  -e GEMINI_API_KEY="your_api_key" \
  online-journal
```

---

## ☁️ Deployment

### Automated Google Cloud Run Deployment

Deploy directly using Google Cloud Build and Cloud Run:

```bash
gcloud run deploy online-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

---

## 🔒 Security & Privacy

* **Zero Data Retention for Training:** Prompts processed through enterprise/API tier endpoints adhere to Google Cloud's data privacy commitments.
* **Strict Firestore Rules:** Users can only query documents indexed with their own `auth.uid`.
* **Runtime Secret Protection:** Secret Manager prevents API keys from leaking into client-side bundles or repository commits.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">

Made with ❤️ for **#GoogleCloud #GenAIAcademy #Hack2skill #CloudRun #BuildWithAI**

</div>
