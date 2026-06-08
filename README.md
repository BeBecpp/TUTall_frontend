# TUTall Frontend

**TUTall** is an AI-powered STEM learning platform built for **STEMINATE HACKS 2026**. It helps students learn STEM topics, take guided quizzes, create study plans, track progress, and calculate scholarship readiness — all powered by **AccessSTEM AI**.

> Theme: **AI for a Better World** — Community & Access through STEM education.

## Live Backend

```
https://tutall-backend.vercel.app
```

All API calls go through this secure backend. **No API keys or secrets are stored in the frontend.**

## Frontend Features

- **Home** — Hero section with backend health status
- **Learn** — AI-powered STEM explanations with examples and key points
- **Ask AI** — Interactive assistant with suggested follow-up questions
- **Quiz** — Generate quizzes (3–7 questions), get hints, submit and score
- **Study Plan** — Personalized day-by-day study schedules
- **Scholarship** — Readiness scoring and scholarship match recommendations
- **Progress** — Track quiz scores, averages, and completed topics
- **About** — Project overview for hackathon demo

## File Structure

```
TUTall_frontend/
├── index.html      # Main page with all sections
├── styles.css      # Custom animations, glassmorphism, polish
├── app.js          # Application logic and API calls
├── config.js       # Backend URL and student ID config
├── README.md       # This file
└── .nojekyll       # GitHub Pages Jekyll bypass
```

## Tech Stack

- Plain HTML, CSS, JavaScript (no build step)
- [Tailwind CSS](https://cdn.tailwindcss.com) via CDN
- GitHub Pages compatible static deployment

## Run Locally

No `npm install` or build step required.

**Option 1 — Open directly:**

Open `index.html` in your browser. Some browsers may block `fetch` to external APIs from `file://` URLs. Use Option 2 if API calls fail.

**Option 2 — Simple local server:**

```bash
# Python 3
python -m http.server 8080

# Node.js (if installed)
npx serve .
```

Then visit `http://localhost:8080`.

## Deploy to GitHub Pages

1. Push this repository to GitHub:

```bash
git init
git add .
git commit -m "Add TUTall frontend for STEMINATE HACKS 2026"
git branch -M main
git remote add origin https://github.com/bebecpp/TUTall_frontend.git
git push -u origin main
```

2. In your GitHub repo, go to **Settings → Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`.
5. Click **Save**.

Your site will be live at:

```
https://bebecpp.github.io/TUTall_frontend/
```

The `.nojekyll` file ensures GitHub Pages serves all files correctly.

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Backend health check |
| GET | `/api/meta` | API metadata |
| POST | `/api/accessstem/explain` | Generate STEM explanation |
| POST | `/api/accessstem/assistant` | Ask AI assistant |
| POST | `/api/accessstem/quiz` | Generate quiz |
| POST | `/api/accessstem/hint` | Get quiz hint |
| POST | `/api/accessstem/check-answer` | Verify quiz answer |
| POST | `/api/accessstem/study-plan` | Generate study plan |
| POST | `/api/scholarships/match` | Scholarship readiness |
| POST | `/api/progress` | Save quiz progress |
| GET | `/api/progress?student_id=demo-user` | Load progress |
| DELETE | `/api/progress?student_id=demo-user` | Clear progress |

## Configuration

Edit `config.js` to change settings:

```js
window.TUTALL_CONFIG = {
  API_BASE_URL: "https://tutall-backend.vercel.app",
  STUDENT_ID: "demo-user",
  USE_FALLBACK_WHEN_OFFLINE: true
};
```

## Security Note

This frontend contains **no API keys, secrets, or environment variables**. All AI processing happens on the secure backend. The frontend only sends user input and displays responses.

## STEMINATE HACKS 2026 Demo Flow

Recommended demo sequence for judges and team meetings:

1. **Home** — Show backend connected status
2. **Learn** — Generate explanation for "Newton's Laws"
3. **Ask AI** — Ask a follow-up question
4. **Quiz** — Generate a 5-question quiz on "Photosynthesis"
5. **Hint** — Get a hint on a difficult question
6. **Submit** — Submit quiz, see score, progress auto-saves
7. **Study Plan** — Generate a personalized plan
8. **Scholarship** — Calculate readiness for a Mongolian CS student
9. **Progress** — Review saved scores and averages

## License

Built for STEMINATE HACKS 2026 hackathon submission.
