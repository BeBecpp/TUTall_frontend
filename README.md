# TUTall Frontend

A simple GitHub Pages frontend for **TUTall**, powered by the live backend:

```txt
https://tutall-backend.vercel.app
```

This frontend is intentionally simple so teammates who do not know backend can see exactly how to connect to the deployed API.

## Features

- Backend health check
- AccessSTEM AI topic explanation
- Quiz generation
- Hint mode
- Answer checking
- Progress saving/listing
- AI study plan
- Scholarship readiness calculator
- GitHub Pages ready

## Files

```txt
index.html
styles.css
app.js
config.js
.nojekyll
README.md
```

## Configure backend URL

Edit `config.js` if the backend URL changes:

```js
window.TUTALL_CONFIG = {
  API_BASE_URL: "https://tutall-backend.vercel.app",
  STUDENT_ID: "demo-user",
  USE_LOCAL_PROGRESS_FALLBACK: true
};
```

## Local run

```bash
python -m http.server 5500
```

Open:

```txt
http://127.0.0.1:5500
```

## Push to GitHub Pages repo

```bash
git init
git add .
git commit -m "Add TUTall frontend"
git branch -M main
git remote add origin YOUR_FRONTEND_REPO_URL
git push -u origin main
```

Then GitHub:

```txt
Settings -> Pages -> Deploy from a branch -> main -> / root -> Save
```

## API endpoints used

```txt
GET    /health
POST   /api/accessstem/explain
POST   /api/accessstem/quiz
POST   /api/accessstem/hint
POST   /api/accessstem/check-answer
POST   /api/accessstem/study-plan
POST   /api/scholarships/match
POST   /api/progress
GET    /api/progress?student_id=demo-user
DELETE /api/progress?student_id=demo-user
```

## Important

Do not put Gemini keys or database URLs in this frontend. All secrets stay inside the backend environment variables on Vercel.
