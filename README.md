# TUTall Frontend

## Overview

**TUTall** is a student support web platform powered by **AccessSTEM AI**.

This frontend connects to the live TUTall backend API and allows students to:

* Generate simple STEM explanations
* Take AI-generated quizzes
* Get guided hints
* Check answers
* Save learning progress
* Generate study plans
* Calculate scholarship readiness

The main goal of TUTall is to make STEM learning and educational opportunity planning more accessible for students.

---

## Live Backend

This frontend uses the deployed backend API:

```text
https://tutall-backend.vercel.app
```

The backend handles:

* Gemini AI integration
* API key security
* Supabase database connection
* Prompt safety checks
* Fallback responses
* Progress tracking
* Scholarship readiness logic

The frontend does **not** store or expose any API keys.

---

## Project Structure

```text
TUTall_frontend/
├─ index.html
├─ styles.css
├─ app.js
├─ config.js
├─ README.md
└─ .nojekyll
```

### File Explanation

| File         | Purpose                                 |
| ------------ | --------------------------------------- |
| `index.html` | Main website structure                  |
| `styles.css` | Website design and responsive styling   |
| `app.js`     | Frontend logic and backend API calls    |
| `config.js`  | Backend API URL configuration           |
| `.nojekyll`  | Helps GitHub Pages serve files normally |
| `README.md`  | Project documentation                   |

---

## How It Works

The frontend sends requests to the backend API.

```text
User
 ↓
TUTall Frontend
 ↓
TUTall Backend
 ↓
Gemini AI + Supabase Database
 ↓
TUTall Backend
 ↓
Frontend UI
```

The frontend never talks directly to Gemini AI.

This keeps the Gemini API key secure because all AI requests go through the backend.

---

## Features

### 1. Backend Status Check

The website checks if the backend is online by calling:

```text
GET /health
```

If the backend is connected, the frontend shows the API status.

---

### 2. STEM Explanation

Students can enter a STEM topic such as:

```text
Newton's Laws
Photosynthesis
Binary Search
Algebra
Electricity
```

The frontend sends the topic to:

```text
POST /api/accessstem/explain
```

The backend returns a simple explanation, example, key points, next topics, and a check question.

---

### 3. Quiz Generation

The frontend can generate a quiz from the selected STEM topic.

Endpoint:

```text
POST /api/accessstem/quiz
```

The backend returns multiple-choice questions with options, correct answers, and explanations.

---

### 4. Hint Mode

If a student is stuck, they can request a hint.

Endpoint:

```text
POST /api/accessstem/hint
```

The hint mode is designed to support learning without directly giving away the final answer.

---

### 5. Answer Checking

The frontend can check student answers using:

```text
POST /api/accessstem/check-answer
```

This endpoint checks whether the selected answer matches the correct answer and returns feedback.

---

### 6. Progress Tracking

After a quiz, the frontend can save progress.

Endpoints:

```text
POST /api/progress
GET /api/progress
DELETE /api/progress
```

This allows the app to track completed topics, scores, and learning history.

---

### 7. Study Plan

Students can generate a short study plan based on their goal and weak topics.

Endpoint:

```text
POST /api/accessstem/study-plan
```

---

### 8. Scholarship Readiness

Students can enter GPA, grade level, country, intended major, English level, activities, and document readiness.

Endpoint:

```text
POST /api/scholarships/match
```

The backend returns:

* Overall readiness score
* Scholarship match examples
* Strengths
* Improvements
* Required documents
* Advisor next steps

The result is only an estimate and does not guarantee acceptance.

---

## Backend Configuration

The backend URL is stored in `config.js`.

```js
window.TUTALL_CONFIG = {
  API_BASE_URL: "https://tutall-backend.vercel.app",
  USE_FALLBACK_WHEN_OFFLINE: true
};
```

If the backend URL changes, only update this file.

Example:

```js
window.TUTALL_CONFIG = {
  API_BASE_URL: "https://your-new-backend-url.vercel.app",
  USE_FALLBACK_WHEN_OFFLINE: true
};
```

---

## Run Locally

You can run this frontend locally with Python's simple HTTP server.

### Step 1: Open the project folder

```powershell
cd D:\Downloads\tutall-frontend-github-pages
```

### Step 2: Start local server

```powershell
python -m http.server 5500
```

### Step 3: Open in browser

```text
http://127.0.0.1:5500
```

---

## Push to GitHub

Repository:

```text
https://github.com/BeBecpp/TUTall_frontend
```

### First push

```powershell
cd D:\Downloads\tutall-frontend-github-pages

git init
git remote add origin https://github.com/BeBecpp/TUTall_frontend.git
git add .
git commit -m "Add TUTall frontend connected to backend"
git branch -M main
git push -u origin main
```

### If remote already exists

```powershell
git remote set-url origin https://github.com/BeBecpp/TUTall_frontend.git
git push -u origin main
```

### If GitHub rejects because remote has files

```powershell
git pull origin main --allow-unrelated-histories
git add .
git commit -m "Merge frontend files"
git push -u origin main
```

---

## Deploy to GitHub Pages

After pushing the frontend to GitHub:

1. Open the GitHub repository
2. Go to **Settings**
3. Go to **Pages**
4. Under **Build and deployment**, choose:

```text
Source: Deploy from a branch
Branch: main
Folder: / root
```

5. Click **Save**

The live frontend will be available at:

```text
https://bebecpp.github.io/TUTall_frontend/
```

If the page shows 404, wait 1–3 minutes and refresh.

---

## API Endpoints Used

| Feature               | Method | Endpoint                       |
| --------------------- | -----: | ------------------------------ |
| Health check          |    GET | `/health`                      |
| Metadata              |    GET | `/api/meta`                    |
| STEM explanation      |   POST | `/api/accessstem/explain`      |
| Quiz generation       |   POST | `/api/accessstem/quiz`         |
| Hint mode             |   POST | `/api/accessstem/hint`         |
| Answer checking       |   POST | `/api/accessstem/check-answer` |
| Study plan            |   POST | `/api/accessstem/study-plan`   |
| Scholarship readiness |   POST | `/api/scholarships/match`      |
| Save progress         |   POST | `/api/progress`                |
| Get progress          |    GET | `/api/progress`                |
| Clear progress        | DELETE | `/api/progress`                |

---

## Example API Request

Example request for STEM explanation:

```js
fetch("https://tutall-backend.vercel.app/api/accessstem/explain", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    topic: "Newton's Laws",
    difficulty: "beginner",
    low_bandwidth: false
  })
});
```

---

## Security Notes

This frontend does not include secrets.

Do not put these in frontend code:

```text
GEMINI_API_KEY
DATABASE_URL
Supabase password
Private tokens
```

All secrets are stored in the backend deployment environment.

The backend protects sensitive credentials and handles AI requests securely.

---

## Common Issues

### Backend is not responding

Check:

```text
https://tutall-backend.vercel.app/health
```

If this does not return JSON, the backend may be down or redeploying.

---

### CORS error

Make sure the frontend URL is included in the backend `ALLOWED_ORIGINS`.

Example:

```text
https://bebecpp.github.io
https://bebecpp.github.io/TUTall_frontend
```

---

### GitHub Pages shows 404

Wait a few minutes after enabling Pages.

Also check:

```text
Settings → Pages → Branch: main → Folder: / root
```

---

### AI output is fallback

This may happen if:

* Gemini API key is missing
* Gemini quota is reached
* Backend failed to call AI
* Backend is using fallback mode for safety

The app is designed to still work even if AI fails.

---

## Hackathon Submission Summary

**TUTall** is an AI-powered student support platform built around **AccessSTEM AI**.

It helps students learn STEM topics through simple explanations, quizzes, guided hints, study planning, progress tracking, and scholarship readiness guidance.

The project supports the theme **AI for a Better World** by improving access to STEM education and future academic opportunities.

---

## Repositories

Frontend:

```text
https://github.com/BeBecpp/TUTall_frontend
```

Backend:

```text
https://github.com/BeBecpp/TUTall_backend
```

Backend API:

```text
https://tutall-backend.vercel.app
```

---

## Final Demo Flow

For the demo video, show this flow:

1. Open the TUTall frontend
2. Show backend status is connected
3. Enter a STEM topic
4. Generate explanation
5. Generate quiz
6. Use hint mode
7. Submit/check answers
8. Save progress
9. Generate study plan
10. Calculate scholarship readiness
11. Explain the social impact

---

## Tech Stack

Frontend:

```text
HTML
CSS
JavaScript
GitHub Pages
```

Backend:

```text
Python
FastAPI
Gemini API
Supabase Postgres
Vercel
```

---

## Final Note

TUTall separates frontend and backend for better security.

The frontend focuses on user experience.

The backend handles AI, database, safety, and secrets.

This makes the project easier to deploy, safer to maintain, and more realistic as a product.
