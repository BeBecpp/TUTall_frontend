const $ = (id) => document.getElementById(id);

const config = window.TUTALL_CONFIG || {};
const API_BASE = (config.API_BASE_URL || "https://tutall-backend.vercel.app").replace(/\/$/, "");
const STUDENT_ID = config.STUDENT_ID || "demo-user";
let currentQuiz = [];
let lastTopic = "Newton's Laws";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setLoading(button, isLoading, text = "Loading...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.oldText = button.textContent;
    button.textContent = text;
    button.disabled = true;
    button.classList.add("opacity-60", "cursor-wait");
  } else {
    button.textContent = button.dataset.oldText || button.textContent;
    button.disabled = false;
    button.classList.remove("opacity-60", "cursor-wait");
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!response.ok) {
    const message = data?.error?.message || data?.detail || `API error ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function showError(targetId, error) {
  const target = $(targetId);
  if (!target) return;
  target.innerHTML = `<div class="data-card border-red-300 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-100"><strong>Error:</strong> ${escapeHtml(error.message || error)}</div>`;
}

async function checkBackend() {
  $("footerApiUrl").textContent = API_BASE;
  try {
    const health = await api("/health");
    $("backendStatus").textContent = `Connected to ${health.service || "TUTall Backend"}. AI configured: ${health.ai_configured ? "yes" : "fallback mode"}.`;
    $("statusDot").className = "mt-1 h-3 w-3 rounded-full bg-green-400";
  } catch (error) {
    $("backendStatus").textContent = `Backend not reachable: ${error.message}`;
    $("statusDot").className = "mt-1 h-3 w-3 rounded-full bg-red-400";
  }
}

function formatExplanation(data) {
  const points = Array.isArray(data.key_points) ? data.key_points.map((p) => `- ${p}`).join("\n") : "";
  const next = Array.isArray(data.next_topics) ? data.next_topics.join(", ") : "";
  return [
    `Topic: ${data.topic || lastTopic}`,
    `Level: ${data.level || "beginner"}`,
    `Source: ${data.source || "backend"}`,
    "",
    data.explanation || "No explanation returned.",
    "",
    data.example ? `Example: ${data.example}` : "",
    points ? `Key points:\n${points}` : "",
    data.check_question ? `Check question: ${data.check_question}` : "",
    next ? `Next topics: ${next}` : "",
    data.safety_note ? `Safety note: ${data.safety_note}` : ""
  ].filter(Boolean).join("\n");
}

async function generateExplanation() {
  const button = $("explainBtn");
  const topic = $("topicInput").value.trim();
  const difficulty = $("difficultyInput").value;
  const low_bandwidth = $("lowBandwidthInput").checked;
  lastTopic = topic || lastTopic;

  setLoading(button, true, "Generating...");
  $("explanationOutput").textContent = "Asking AccessSTEM AI...";
  try {
    const data = await api("/api/accessstem/explain", {
      method: "POST",
      body: JSON.stringify({ topic, difficulty, low_bandwidth })
    });
    $("explanationOutput").textContent = formatExplanation(data);
  } catch (error) {
    $("explanationOutput").textContent = `Could not generate explanation. ${error.message}`;
  } finally {
    setLoading(button, false);
  }
}

function renderQuiz(data) {
  currentQuiz = data.questions || [];
  if (!currentQuiz.length) {
    $("quizOutput").innerHTML = `<div class="data-card">No quiz generated.</div>`;
    return;
  }

  $("quizOutput").innerHTML = currentQuiz.map((q, index) => {
    const options = (q.options || []).map((option) => `
      <label class="option-label">
        <input type="radio" name="question-${index}" value="${escapeHtml(option)}" class="mt-1 h-4 w-4 accent-ink dark:accent-sand" />
        <span>${escapeHtml(option)}</span>
      </label>
    `).join("");

    return `
      <article class="quiz-card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span class="pill">Question ${index + 1}</span>
            <h3 class="mt-3 text-lg font-black">${escapeHtml(q.question)}</h3>
            ${q.concept ? `<p class="mt-1 text-sm font-bold text-slate dark:text-sand">Concept: ${escapeHtml(q.concept)}</p>` : ""}
          </div>
          <button class="hintBtn secondary-btn !px-4 !py-2" data-index="${index}">Get hint</button>
        </div>
        <div class="mt-3 grid gap-1">${options}</div>
        <div id="hint-${index}" class="mt-3 hidden rounded-2xl bg-white/70 p-4 font-bold text-slate dark:bg-white/10 dark:text-sand"></div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".hintBtn").forEach((button) => button.addEventListener("click", getHint));
  $("submitQuizBtn").classList.remove("hidden");
  $("quizResult").classList.add("hidden");
}

async function generateQuiz() {
  const button = $("quizBtn");
  const topic = $("topicInput").value.trim();
  const difficulty = $("difficultyInput").value;
  const question_count = Math.max(3, Math.min(7, Number($("questionCountInput").value || 5)));
  lastTopic = topic || lastTopic;

  setLoading(button, true, "Generating quiz...");
  $("quizOutput").innerHTML = `<div class="data-card">Generating quiz from backend...</div>`;
  try {
    const data = await api("/api/accessstem/quiz", {
      method: "POST",
      body: JSON.stringify({ topic, difficulty, question_count })
    });
    renderQuiz(data);
  } catch (error) {
    showError("quizOutput", error);
  } finally {
    setLoading(button, false);
  }
}

async function getHint(event) {
  const index = Number(event.currentTarget.dataset.index);
  const q = currentQuiz[index];
  const selected = document.querySelector(`input[name="question-${index}"]:checked`);
  const hintBox = $(`hint-${index}`);
  hintBox.classList.remove("hidden");
  hintBox.textContent = "Generating safe hint...";

  try {
    const data = await api("/api/accessstem/hint", {
      method: "POST",
      body: JSON.stringify({
        topic: lastTopic,
        question: q.question,
        student_answer: selected ? selected.value : "No answer selected yet",
        correct_answer: q.correct_answer
      })
    });
    hintBox.innerHTML = `<strong>${escapeHtml(data.encouragement || "Good effort!")}</strong><br>${escapeHtml(data.hint || "Think through the concept step by step.")}`;
  } catch (error) {
    hintBox.textContent = `Hint unavailable: ${error.message}`;
  }
}

async function submitQuiz() {
  if (!currentQuiz.length) return;

  let score = 0;
  const checks = [];

  for (let i = 0; i < currentQuiz.length; i += 1) {
    const q = currentQuiz[i];
    const selected = document.querySelector(`input[name="question-${i}"]:checked`);
    const student_answer = selected ? selected.value : "";
    try {
      const result = await api("/api/accessstem/check-answer", {
        method: "POST",
        body: JSON.stringify({
          question: q.question,
          student_answer,
          correct_answer: q.correct_answer,
          explanation: q.explanation || ""
        })
      });
      if (result.is_correct) score += 1;
      checks.push({ ...result, correct_answer: q.correct_answer, student_answer, explanation: q.explanation });
    } catch {
      const is_correct = student_answer.trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
      if (is_correct) score += 1;
      checks.push({ is_correct, correct_answer: q.correct_answer, student_answer, feedback: q.explanation || "Review the explanation." });
    }
  }

  const percentage = Math.round((score / currentQuiz.length) * 100);
  $("quizResult").classList.remove("hidden");
  $("quizResult").textContent = `Score: ${score}/${currentQuiz.length} · ${percentage}%`;

  try {
    await api("/api/progress", {
      method: "POST",
      body: JSON.stringify({ student_id: STUDENT_ID, topic: lastTopic, score, total: currentQuiz.length })
    });
    await loadProgress();
  } catch (error) {
    console.warn("Progress save failed", error);
  }
}

async function generateStudyPlan() {
  const button = $("studyPlanBtn");
  const goal = $("goalInput").value.trim();
  const grade_level = $("difficultyInput").value;
  const available_days = Number($("daysInput").value || 7);
  const weak_topics = $("weakTopicsInput").value.split(",").map((x) => x.trim()).filter(Boolean);

  setLoading(button, true, "Planning...");
  $("studyPlanOutput").innerHTML = `<div class="data-card">Generating study plan...</div>`;
  try {
    const data = await api("/api/accessstem/study-plan", {
      method: "POST",
      body: JSON.stringify({ goal, grade_level, available_days, weak_topics })
    });
    const days = data.days || [];
    $("studyPlanOutput").innerHTML = days.map((day) => `
      <article class="data-card">
        <span class="pill">Day ${day.day}</span>
        <h3 class="mt-3 text-lg font-black">${escapeHtml(day.focus)}</h3>
        <ul class="mt-3 list-disc space-y-1 pl-5 text-sm font-bold text-slate dark:text-sand">
          ${(day.tasks || []).map((task) => `<li>${escapeHtml(task)}</li>`).join("")}
        </ul>
        <p class="mt-3 text-sm font-black">${escapeHtml(day.estimated_minutes || 45)} minutes</p>
      </article>
    `).join("");
  } catch (error) {
    showError("studyPlanOutput", error);
  } finally {
    setLoading(button, false);
  }
}

async function calculateScholarship() {
  const button = $("scholarshipBtn");
  const payload = {
    student_id: STUDENT_ID,
    grade_level: $("gradeInput").value.trim(),
    gpa: Number($("gpaInput").value || 0),
    country: $("countryInput").value.trim(),
    intended_major: $("majorInput").value.trim(),
    english_level: $("englishInput").value.trim(),
    financial_need: $("needInput").value,
    activities: $("activitiesInput").value.trim(),
    has_essay: $("essayInput").checked,
    has_english_test: $("testInput").checked
  };

  setLoading(button, true, "Calculating...");
  $("scholarshipOutput").innerHTML = `<div class="data-card">Calculating scholarship readiness...</div>`;
  try {
    const data = await api("/api/scholarships/match", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const matches = data.matches || [];
    $("scholarshipOutput").innerHTML = `
      <div class="data-card">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="pill">Overall readiness</span>
            <h3 class="mt-3 text-3xl font-black">${Number(data.overall_readiness_score || 0)}%</h3>
          </div>
          <p class="max-w-2xl font-bold text-slate dark:text-sand">${escapeHtml(data.profile_summary || data.advisor?.summary || "Scholarship readiness estimate generated.")}</p>
        </div>
        <p class="mt-4 font-bold text-slate dark:text-sand">${escapeHtml(data.advisor?.warning || "This is an estimate and does not guarantee acceptance.")}</p>
      </div>
      ${matches.map((m) => `
        <article class="data-card">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-xl font-black">${escapeHtml(m.name)}</h3>
              <p class="font-bold text-slate dark:text-sand">${escapeHtml(m.category || "Opportunity")} · Deadline: ${escapeHtml(m.deadline || "TBD")}</p>
            </div>
            <span class="pill">${Number(m.fit_score || 0)}% fit</span>
          </div>
          <p class="mt-3 font-black">Estimated amount: $${Number(m.estimated_amount || 0).toLocaleString()}</p>
          <div class="mt-3 grid gap-3 md:grid-cols-3">
            <div><strong>Strengths</strong><ul class="mt-1 list-disc pl-5 text-sm text-slate dark:text-sand">${(m.strengths || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
            <div><strong>Improve</strong><ul class="mt-1 list-disc pl-5 text-sm text-slate dark:text-sand">${(m.improvements || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
            <div><strong>Documents</strong><ul class="mt-1 list-disc pl-5 text-sm text-slate dark:text-sand">${(m.required_documents || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
          </div>
        </article>
      `).join("")}
    `;
  } catch (error) {
    showError("scholarshipOutput", error);
  } finally {
    setLoading(button, false);
  }
}

async function loadProgress() {
  try {
    const data = await api(`/api/progress?student_id=${encodeURIComponent(STUDENT_ID)}`);
    const items = data.items || [];
    $("progressSummary").textContent = `${data.completed_topics || items.length} completed topics · Average ${data.average_percentage || 0}%`;
    $("progressOutput").innerHTML = items.length ? items.map((item) => `
      <article class="data-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-black">${escapeHtml(item.topic)}</h3>
          <p class="text-sm font-bold text-slate dark:text-sand">${escapeHtml(item.created_at || "Saved")}</p>
        </div>
        <span class="pill">${Number(item.score || 0)}/${Number(item.total || 0)} · ${Number(item.percentage || 0)}%</span>
      </article>
    `).join("") : `<div class="data-card">No progress yet. Complete a quiz to save progress.</div>`;
  } catch (error) {
    $("progressSummary").textContent = `Could not load progress: ${error.message}`;
    $("progressOutput").innerHTML = `<div class="data-card">Backend progress endpoint is unavailable.</div>`;
  }
}

async function clearProgress() {
  if (!confirm("Clear demo progress?")) return;
  try {
    await api(`/api/progress?student_id=${encodeURIComponent(STUDENT_ID)}`, { method: "DELETE" });
  } catch (error) {
    console.warn(error);
  }
  await loadProgress();
}

function initTheme() {
  const saved = localStorage.getItem("tutall-theme") || "dark";
  document.documentElement.classList.toggle("dark", saved === "dark");
}

function toggleTheme() {
  const nextDark = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", nextDark);
  localStorage.setItem("tutall-theme", nextDark ? "dark" : "light");
}

function bindEvents() {
  $("themeToggle").addEventListener("click", toggleTheme);
  $("explainBtn").addEventListener("click", generateExplanation);
  $("quizBtn").addEventListener("click", generateQuiz);
  $("submitQuizBtn").addEventListener("click", submitQuiz);
  $("studyPlanBtn").addEventListener("click", generateStudyPlan);
  $("scholarshipBtn").addEventListener("click", calculateScholarship);
  $("refreshProgressBtn").addEventListener("click", loadProgress);
  $("clearProgressBtn").addEventListener("click", clearProgress);
}

initTheme();
bindEvents();
checkBackend();
loadProgress();
