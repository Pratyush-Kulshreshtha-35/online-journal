# 📓 Personal Gemini Journal

An AI-powered, serverless journaling and introspection application built with **React**, **TypeScript**, **Google Cloud Run**, and the **Gemini API**. Developed for the **Google Cloud Gen AI Academy APAC Edition 2026** (Cohort 3: *Accelerate AI with Cloud Run* Ideathon in partnership with **Hack2skill**).

🔗 **Live Deployment:** https://online-journal-1068289664916.us-central1.run.app 
💻 **GitHub Repository:** https://github.com/Pratyush-Kulshreshtha-35/online-journal

---

## ✨ Features

* **Contextual Writing Prompts:** Eliminates writer's block using Gemini to generate dynamic, thought-provoking reflective questions.
* **Mood & Emotion Categorization:** Analyzes entry content and automatically assigns sentiment tags (Reflective, Grateful, Joyful, Calm, Inspired).
* **Private User Isolation:** Secure authentication via Firebase guarantees each user's entries and reflections are strictly private and isolated.
* **Responsive Dark UI:** Modern, clean aesthetic built with Tailwind CSS, Lucide icons, and fluid animations.
* **Continuous Cloud Deployment:** Automated CI/CD through Google Cloud Build connected directly to this GitHub repository.

---

## 🏗️ Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite | Responsive UI with real-time markdown and state management |
| **Generative AI** | Google AI Studio (`@google/genai`) | Multi-turn reflections, tone analysis, and writing prompts |
| **Serverless Compute** | Google Cloud Run | Fully managed containerized service scaling automatically to zero |
| **CI/CD Build** | Google Cloud Build | Automatic container builds triggered on git push |
| **Authentication** | Firebase Authentication | Google Sign-In and email authentication provider |
| **Database** | Cloud Firestore | User-isolated NoSQL document storage with granular security rules |
| **Secret Management** | Google Cloud Secret Manager | Secure storage and runtime injection of `GEMINI_API_KEY` |

---

## 🚀 Local Development

### Prerequisites
* Node.js (v20+)
* npm or bun
* A Gemini API key from [Google AI Studio](https://aistudio.google.com/)
* A Firebase Project configured with Authentication and Firestore

### 1. Clone the repository
```bash
git clone https://github.com/Pratyush-Kulshreshtha-35/online-journal.git
cd online-journal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker & Production Build

To test the production container locally:

```bash
# Build container image
docker build -t online-journal .

# Run on port 8080
docker run -p 8080:8080 -e GEMINI_API_KEY="your_api_key" online-journal
```

---

## ☁️ Google Cloud Run Deployment

Deploy directly via Google Cloud Shell:

```bash
gcloud run deploy online-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge
```

---

## 📄 License
Distributed under the MIT License.
```

#GoogleCloud #GenAIAcademy #Hack2skill #CloudRun #Gemini #ArtificialIntelligence #WebDevelopment #Firebase #React #DevCommunity #FullStack #Serverless #BuildWithAI #AccelerateAIwithCloudRun
