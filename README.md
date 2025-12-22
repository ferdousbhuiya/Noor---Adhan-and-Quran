
# 🌙 Noor - Islamic Companion App

A high-performance, offline-first Islamic application built with React, Tailwind CSS, and Google Gemini API. Designed for spiritual consistency with a premium user experience.

## 🚀 Key Features
- **Holy Quran**: Read and listen with multi-Qari support. Offline mode allows downloading Surahs to your device.
- **Prayer Times**: Highly accurate timings with 12-hour AM/PM format and Adhan notifications.
- **Digital Tasbih**: Interactive counter with haptic feedback, AI voice-to-arabic, and image-to-arabic conversion.
- **Dua Library**: Personal supplication manager with benefit tracking and recitation modes.
- **Explore Nearby**: Find Masjids and Halal restaurants using AI-powered grounding.
- **Qiblah Finder**: Real-time compass for accurate prayer direction.

## 📦 Deployment Guide

### 1. GitHub Pages (Recommended)
This app is perfect for GitHub Pages. 
1. Push your code to a repository.
2. Use a build tool like Vite or a simple GitHub Action to deploy.
3. **Environment Variables**: Since this is a client-side app, ensure your `API_KEY` is set up in your hosting provider's secrets (e.g., Vercel Secrets or GitHub Action Secrets).

### 2. Local Setup
1. Clone the repository.
2. Ensure you have Node.js installed.
3. Install dependencies: `npm install`
4. Create a `.env` file and add: `API_KEY=your_gemini_api_key_here`
5. Run the dev server: `npm run dev`

## 🛠 Tech Stack
- **Framework**: React 19
- **Styling**: Tailwind CSS (with Glassmorphism)
- **Icons**: Lucide React
- **AI**: @google/genai (Gemini 2.5/3.0)
- **Database**: IndexedDB (Offline Persistence)

## 🔒 Privacy & Offline Support
Noor uses **IndexedDB** to store your downloaded Quran content and settings directly in your browser's memory. No data is sent to a server except for API calls to fetch prayer times and AI processing.

---
*Built with heart for the Ummah.*
