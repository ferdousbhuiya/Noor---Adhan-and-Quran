
# Noor - Islamic Companion App

A high-performance, offline-first Islamic application built with React and the Gemini API.

## 🔒 Security & Deployment

### 1. Local Development
To run this app locally with your own API key:
1. Create a file named `.env` in the root directory.
2. Add your key: `API_KEY=YOUR_ACTUAL_KEY_HERE`
3. The `.gitignore` file ensures this secret is never uploaded to GitHub.

### 2. Deploying to GitHub (Securely)
Since this is a frontend application, you should use a deployment platform that supports **Environment Variables** (like Vercel, Netlify, or GitHub Actions).

#### Using Vercel/Netlify:
1. Connect your GitHub repository to the platform.
2. In the **Project Settings** > **Environment Variables** section, add:
   - Key: `API_KEY`
   - Value: `[Your Gemini API Key]`
3. Deploy. The platform will inject the key into `process.env.API_KEY` automatically.

#### Using GitHub Actions (for GitHub Pages):
If you are using a build tool to deploy to GitHub Pages, you must use **GitHub Secrets**:
1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Create a **New repository secret** named `API_KEY`.
4. In your deployment workflow (`.github/workflows/deploy.yml`), ensure the build step has access to the secret:
   ```yaml
   env:
     API_KEY: ${{ secrets.API_KEY }}
   ```

## 🌙 Features
- **Offline Quran**: Download Surahs for reading and recitation without internet.
- **Dynamic Adhan**: Accurate prayer times with multiple calculation methods and Adhan voices.
- **Smart Explore**: Find nearby Masjids and Halal food using Gemini AI Grounding.
- **Interactive Tasbih**: Haptic feedback and target-based digital counter.
- **Qiblah Finder**: Real-time compass orientation.

## 🛠 Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide Icons
- **AI**: Google Gemini API (@google/genai)
- **Storage**: IndexedDB (LocalDB) for offline support
- **PWA**: Service Workers & Web App Manifest
