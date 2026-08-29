# Personal Gemini Journal - Project Submission Kit

---

## 1. Project README (README.md)

```markdown
# 📓 Personal Gemini Journal

An AI-powered, serverless journaling and introspection application built with **React**, **TypeScript**, **Google Cloud Run**, and the **Gemini API**. Developed for the **Google Cloud Gen AI Academy APAC Edition 2026** (Cohort 3: *Accelerate AI with Cloud Run* Ideathon in partnership with **Hack2skill**).

🔗 **Live Deployment:** [https://online-journal-1068289664916.us-central1.run.app](https://online-journal-1068289664916.us-central1.run.app)  
💻 **GitHub Repository:** [https://github.com/Pratyush-Kulshreshtha-35/online-journal](https://github.com/Pratyush-Kulshreshtha-35/online-journal)

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

---

## 2. Brief Description of Your Solution

### Short Version (Form Submission Friendly):
**Personal Gemini Journal** is an AI-powered, serverless reflection platform designed to make daily journaling engaging, consistent, and private.
* **Gemini:** Generates contextual writing prompts, analyzes entry sentiment to assign mood tags, and synthesizes long-term reflection trends.
* **Firebase Authentication:** Manages secure Google Sign-In and email login to ensure strict privacy for personal reflections.
* **Cloud Firestore:** Provides low-latency, real-time NoSQL storage to secure journal entries and metadata isolated by user UID.
* **Google Cloud Run:** Hosts the containerized application on a scalable, zero-to-hero serverless runtime integrated with automated CI/CD via Cloud Build.

---

## 3. LinkedIn Announcement Post

Excited to announce that I built and deployed **Personal Gemini Journal** as part of the **Google Cloud Gen AI Academy APAC Edition 2026** (Cohort 3: *Accelerate AI with Cloud Run* Ideathon), organized in collaboration with **Hack2skill**! 🚀

The goal was to transform how people approach daily reflection by engineering a serverless, AI-powered journaling companion with Google Cloud and Gemini.

### 💡 The Problem & Solution
Consistency is the hardest part of journaling. **Personal Gemini Journal** acts as an intelligent sounding board. Instead of facing a blank page, users get contextual writing prompts, emotional categorization, and smart summaries that help track personal growth, thought patterns, and mental clarity over time.

### 🛠️ Technical Architecture & Stack
* **AI & Natural Language:** Google AI Studio & Gemini API for reflective prompt generation, emotion tagging, and sentiment summarization.
* **Serverless Compute:** **Google Cloud Run** to run the containerized backend with autoscaling to zero and low-latency delivery.
* **CI/CD Pipeline:** Fully automated delivery workflow using **Google Cloud Build** connected directly to GitHub.
* **Authentication & Persistence:** **Firebase Authentication** (Google Sign-In) and **Cloud Firestore** for secure, encrypted user reflections.
* **Frontend:** Modern, high-performance web client built using **React**, **TypeScript**, and **Tailwind CSS** (Vite).

### 🔍 Key Engineering Highlights
* Configured Docker production multi-stage builds optimized for Vite applications on Cloud Run.
* Handled headless runtime constraints, binding dynamic port routing (`$PORT`) and securing host allowed origins.
* Integrated Firebase Identity Platform with Google Cloud IAM and authorized security domains.

Huge thanks to the **Google Cloud** team and **Hack2skill** for organizing such an enriching, builder-focused cohort!

🔗 **Live Application:** https://online-journal-1068289664916.us-central1.run.app  
💻 **GitHub Repository:** https://github.com/Pratyush-Kulshreshtha-35/online-journal

---
#GoogleCloud #GenAIAcademy #Hack2skill #CloudRun #Gemini #ArtificialIntelligence #WebDevelopment #Firebase #React #DevCommunity #FullStack #Serverless #BuildWithAI #AccelerateAIwithCloudRun
