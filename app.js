/* TUTall — AccessSTEM AI Frontend */

(function () {
  "use strict";

  // ─── Config & State ───────────────────────────────────────────────
  var config = window.TUTALL_CONFIG;
  var state = {
    health: null,
    quiz: null,
    quizAnswers: {},
    quizHints: {},
    quizSubmitted: false,
    progress: [],
    currentTopic: "Newton's Laws"
  };

  // ─── DOM Helpers ──────────────────────────────────────────────────
  function $(id) {
    return document.getElementById(id);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function setHTML(id, html) {
    var el = $(id);
    if (el) el.innerHTML = html;
  }

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function setLoading(btnId, loading) {
    var btn = $(btnId);
    if (!btn) return;
    btn.disabled = loading;
    var label = btn.querySelector(".btn-label");
    var spinner = btn.querySelector(".btn-spinner");
    if (label) label.classList.toggle("hidden", loading);
    if (spinner) spinner.classList.toggle("hidden", !loading);
  }

  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function clampQuestionCount(val) {
    var n = parseInt(val, 10);
    if (isNaN(n)) return 5;
    return Math.min(7, Math.max(3, n));
  }

  // ─── API Helper ───────────────────────────────────────────────────
  async function apiRequest(path, options) {
    var url = config.API_BASE_URL + path;
    var opts = options || {};
    var fetchOpts = {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json" }
    };
    if (opts.body) fetchOpts.body = JSON.stringify(opts.body);

    try {
      var response = await fetch(url, fetchOpts);
      var data = null;

      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        var msg = "Request failed.";
        if (response.status === 422) msg = "Please check the required fields.";
        else if (response.status === 429) msg = "Too many requests. Please wait a moment.";
        else if (data && data.detail) {
          msg = typeof data.detail === "string" ? data.detail : msg;
        } else if (data && data.message) {
          msg = data.message;
        }
        return { ok: false, status: response.status, error: msg, data: data };
      }

      return { ok: true, status: response.status, data: data };
    } catch (err) {
      return { ok: false, status: 0, error: "Unable to reach the backend. Check your connection.", data: null };
    }
  }

  // ─── Toast Helper ─────────────────────────────────────────────────
  function showToast(message, type) {
    var container = $("toast-container");
    if (!container) return;
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "info");
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }

  // ─── Source Badge ─────────────────────────────────────────────────
  function renderSourceBadge(source) {
    if (!source) return "";
    if (source === "gemini") {
      return '<span class="source-badge gemini">✦ Powered by Gemini through secure backend</span>';
    }
    if (source === "fallback") {
      return '<span class="source-badge fallback">⚠ Fallback mode active. Backend is responding, but Gemini may be unavailable.</span>';
    }
    return '<span class="source-badge gemini">' + escapeHtml(source) + "</span>";
  }

  // ─── Health ───────────────────────────────────────────────────────
  async function checkHealth() {
    setHTML("health-status", '<div class="flex items-center gap-2"><span class="spinner spinner-dark"></span> Checking...</div>');

    var result = await apiRequest("/health");

    if (result.ok && result.data) {
      state.health = result.data;
      var connected = result.data.status === "ok" || result.data.status === "healthy" || result.ok;
      var aiOk = result.data.ai_configured || result.data.gemini_configured;
      var dbOk = result.data.database_configured || result.data.db_configured;

      setHTML("health-status", [
        '<div class="space-y-3">',
        '<div class="flex items-center gap-2">',
        '<span class="status-pill ' + (connected ? "connected" : "offline") + '">',
        '<span class="status-dot"></span>',
        connected ? "Connected" : "Offline",
        "</span>",
        result.data.version ? '<span class="text-xs text-slate-400">v' + escapeHtml(result.data.version) + "</span>" : "",
        "</div>",
        result.data.service ? '<p class="text-sm text-slate-300">' + escapeHtml(result.data.service) + "</p>" : "",
        aiOk !== undefined ? '<p class="text-sm text-slate-300">AI: <strong class="' + (aiOk ? "text-green-400" : "text-amber-400") + '">' + (aiOk ? "Configured" : "Not configured") + "</strong></p>" : "",
        dbOk !== undefined ? '<p class="text-sm text-slate-300">Database: <strong class="' + (dbOk ? "text-green-400" : "text-amber-400") + '">' + (dbOk ? "Configured" : "Not configured") + "</strong></p>" : "",
        "</div>"
      ].join(""));
    } else {
      state.health = null;
      setHTML("health-status", [
        '<div class="space-y-2">',
        '<span class="status-pill offline"><span class="status-dot"></span>Offline</span>',
        '<p class="text-sm text-slate-400">' + escapeHtml(result.error || "Backend unavailable") + "</p>",
        "</div>"
      ].join(""));
    }
  }

  // ─── Explanation ──────────────────────────────────────────────────
  async function generateExplanation() {
    var topic = $("learn-topic").value.trim();
    var difficulty = $("learn-difficulty").value;
    var lowBandwidth = $("learn-low-bandwidth").checked;

    if (!topic) {
      showToast("Please enter a topic.", "error");
      return;
    }

    state.currentTopic = topic;
    setLoading("btn-explain", true);
    setHTML("explain-result", '<div class="space-y-3"><div class="skeleton h-6 w-3/4"></div><div class="skeleton h-4 w-full"></div><div class="skeleton h-4 w-5/6"></div><div class="skeleton h-4 w-2/3"></div></div>');

    var result = await apiRequest("/api/accessstem/explain", {
      method: "POST",
      body: { topic: topic, difficulty: difficulty, low_bandwidth: lowBandwidth }
    });

    setLoading("btn-explain", false);

    if (!result.ok) {
      setHTML("explain-result", '<div class="text-red-600 text-sm">' + escapeHtml(result.error) + "</div>");
      showToast(result.error, "error");
      return;
    }

    var d = result.data;
    var keyPoints = (d.key_points || []).map(function (p) { return "<li>" + escapeHtml(p) + "</li>"; }).join("");
    var nextTopics = (d.next_topics || []).map(function (t) { return '<span class="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm mr-2 mb-2">' + escapeHtml(t) + "</span>"; }).join("");

    setHTML("explain-result", [
      '<div class="space-y-4 fade-in">',
      renderSourceBadge(d.source),
      '<h4 class="text-lg font-bold text-slate-800">' + escapeHtml(d.topic || topic) + "</h4>",
      '<div class="prose prose-sm max-w-none text-slate-600"><p>' + escapeHtml(d.explanation || "") + "</p></div>",
      d.example ? '<div class="bg-blue-50 border border-blue-100 rounded-xl p-4"><p class="text-sm font-semibold text-blue-800 mb-1">Example</p><p class="text-sm text-blue-700">' + escapeHtml(d.example) + "</p></div>" : "",
      keyPoints ? '<div><p class="font-semibold text-slate-700 mb-2">Key Points</p><ul class="key-points list-disc list-inside space-y-1 text-slate-600 text-sm">' + keyPoints + "</ul></div>" : "",
      d.check_question ? '<div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><p class="text-sm font-semibold text-slate-700 mb-1">Check Your Understanding</p><p class="text-sm text-slate-600">' + escapeHtml(d.check_question) + "</p></div>" : "",
      nextTopics ? '<div><p class="font-semibold text-slate-700 mb-2">Next Topics</p><div>' + nextTopics + "</div></div>" : "",
      "</div>"
    ].join(""));

    showToast("Explanation generated!", "success");
  }

  // ─── Assistant ────────────────────────────────────────────────────
  async function askAssistant() {
    var topic = $("assistant-topic").value.trim();
    var question = $("assistant-question").value.trim();
    var difficulty = $("assistant-difficulty").value;
    var mode = $("assistant-mode").value;

    if (!topic || !question) {
      showToast("Please enter a topic and question.", "error");
      return;
    }

    setLoading("btn-assistant", true);
    setHTML("assistant-result", '<div class="flex items-center gap-3 py-6 justify-center"><span class="spinner spinner-dark"></span><span class="text-slate-500">AccessSTEM AI is thinking...</span></div>');

    var result = await apiRequest("/api/accessstem/assistant", {
      method: "POST",
      body: {
        topic: topic,
        question: question,
        difficulty: difficulty,
        mode: mode,
        student_context: "student using TUTall frontend"
      }
    });

    setLoading("btn-assistant", false);

    if (!result.ok) {
      setHTML("assistant-result", '<div class="text-red-600 text-sm">' + escapeHtml(result.error) + "</div>");
      showToast(result.error, "error");
      return;
    }

    var d = result.data;
    var keyPoints = (d.key_points || []).map(function (p) { return "<li>" + escapeHtml(p) + "</li>"; }).join("");
    var nextSteps = (d.next_steps || []).map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("");
    var suggested = (d.suggested_questions || []).map(function (q, i) {
      return '<button type="button" class="suggested-question" data-question="' + escapeHtml(q) + '">' + escapeHtml(q) + "</button>";
    }).join("");

    setHTML("assistant-result", [
      '<div class="chat-response space-y-4 fade-in">',
      renderSourceBadge(d.source),
      '<div><p class="text-sm font-semibold text-slate-500 mb-1">Answer</p><p class="text-slate-700">' + escapeHtml(d.answer || "") + "</p></div>",
      keyPoints ? '<div><p class="text-sm font-semibold text-slate-500 mb-1">Key Points</p><ul class="list-disc list-inside text-sm text-slate-600 space-y-1">' + keyPoints + "</ul></div>" : "",
      d.example ? '<div class="bg-indigo-50 rounded-lg p-3"><p class="text-sm font-semibold text-indigo-700 mb-1">Example</p><p class="text-sm text-indigo-600">' + escapeHtml(d.example) + "</p></div>" : "",
      nextSteps ? '<div><p class="text-sm font-semibold text-slate-500 mb-1">Next Steps</p><ol class="list-decimal list-inside text-sm text-slate-600 space-y-1">' + nextSteps + "</ol></div>" : "",
      suggested ? '<div><p class="text-sm font-semibold text-slate-500 mb-2">Suggested Follow-ups</p><div class="flex flex-wrap">' + suggested + "</div></div>" : "",
      "</div>"
    ].join(""));

    $$(".suggested-question").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $("assistant-question").value = btn.getAttribute("data-question");
        $("assistant-question").focus();
      });
    });

    showToast("AI response received!", "success");
  }

  // ─── Quiz ─────────────────────────────────────────────────────────
  async function generateQuiz() {
    var topic = $("quiz-topic").value.trim();
    var difficulty = $("quiz-difficulty").value;
    var count = clampQuestionCount($("quiz-count").value);

    $("quiz-count").value = count;

    if (!topic) {
      showToast("Please enter a quiz topic.", "error");
      return;
    }

    state.quizAnswers = {};
    state.quizHints = {};
    state.quizSubmitted = false;
    state.currentTopic = topic;

    setLoading("btn-quiz", true);
    setHTML("quiz-result", '<div class="space-y-4"><div class="skeleton h-20 w-full"></div><div class="skeleton h-20 w-full"></div></div>');
    setHTML("quiz-score", "");

    var result = await apiRequest("/api/accessstem/quiz", {
      method: "POST",
      body: { topic: topic, difficulty: difficulty, question_count: count }
    });

    setLoading("btn-quiz", false);

    if (!result.ok) {
      setHTML("quiz-result", '<div class="text-red-600 text-sm">' + escapeHtml(result.error) + "</div>");
      showToast(result.error, "error");
      return;
    }

    state.quiz = result.data;
    renderQuiz();
    showToast("Quiz generated with " + (result.data.questions || []).length + " questions!", "success");
  }

  function renderQuiz() {
    if (!state.quiz || !state.quiz.questions) {
      setHTML("quiz-result", '<div class="empty-state"><p>No quiz loaded. Generate one above.</p></div>');
      return;
    }

    var questions = state.quiz.questions;
    var html = ['<div class="space-y-6 fade-in">', renderSourceBadge(state.quiz.source)];

    questions.forEach(function (q, index) {
      var options = q.options || [];
      var optionsHtml = options.map(function (opt, oi) {
        var selected = state.quizAnswers[index] === opt ? " selected" : "";
        var extra = "";
        if (state.quizSubmitted) {
          if (opt === q.correct_answer) extra = " correct";
          else if (state.quizAnswers[index] === opt) extra = " incorrect";
        }
        return [
          '<label class="quiz-option' + selected + extra + '">',
          '<input type="radio" name="quiz-q-' + index + '" value="' + escapeHtml(opt) + '" class="mt-1"' + (state.quizAnswers[index] === opt ? " checked" : "") + (state.quizSubmitted ? " disabled" : "") + ">",
          "<span class=\"text-sm text-slate-700\">" + escapeHtml(opt) + "</span>",
          "</label>"
        ].join("");
      }).join("");

      var hintHtml = state.quizHints[index]
        ? '<div class="hint-box"><p class="text-sm font-semibold text-amber-800 mb-1">Hint</p><p class="text-sm text-amber-700">' + escapeHtml(state.quizHints[index].hint || "") + "</p>" +
          (state.quizHints[index].encouragement ? '<p class="text-sm text-amber-600 mt-2 italic">' + escapeHtml(state.quizHints[index].encouragement) + "</p>" : "") +
          "</div>"
        : "";

      html.push([
        '<div class="glass-card p-5" id="quiz-card-' + index + '">',
        '<p class="font-semibold text-slate-800 mb-3"><span class="text-indigo-600">Q' + (index + 1) + ".</span> " + escapeHtml(q.question) + "</p>",
        '<div class="space-y-2 mb-3">' + optionsHtml + "</div>",
        !state.quizSubmitted ? '<button type="button" class="btn-outline text-sm py-2 px-4" onclick="TUTall.requestHint(' + index + ')">Get Hint</button>' : "",
        hintHtml,
        "</div>"
      ].join(""));
    });

    html.push("</div>");
    setHTML("quiz-result", html.join(""));

    if (!state.quizSubmitted) {
      questions.forEach(function (q, index) {
        var radios = document.querySelectorAll('input[name="quiz-q-' + index + '"]');
        radios.forEach(function (radio) {
          radio.addEventListener("change", function () {
            state.quizAnswers[index] = radio.value;
          });
        });
      });
    }
  }

  async function requestHint(index) {
    if (!state.quiz || !state.quiz.questions[index]) return;

    var q = state.quiz.questions[index];
    var topic = $("quiz-topic").value.trim() || state.currentTopic;

    var btn = document.querySelector("#quiz-card-" + index + " .btn-outline");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Loading hint...";
    }

    var result = await apiRequest("/api/accessstem/hint", {
      method: "POST",
      body: {
        topic: topic,
        question: q.question,
        student_answer: state.quizAnswers[index] || "",
        correct_answer: q.correct_answer || ""
      }
    });

    if (!result.ok) {
      showToast(result.error, "error");
      if (btn) { btn.disabled = false; btn.textContent = "Get Hint"; }
      return;
    }

    state.quizHints[index] = result.data;
    renderQuiz();
    showToast("Hint received!", "info");
  }

  async function submitQuiz() {
    if (!state.quiz || !state.quiz.questions) {
      showToast("Generate a quiz first.", "error");
      return;
    }

    var questions = state.quiz.questions;
    var answered = Object.keys(state.quizAnswers).length;

    if (answered < questions.length) {
      showToast("Please answer all " + questions.length + " questions.", "error");
      return;
    }

    setLoading("btn-submit-quiz", true);
    var score = 0;
    var topic = $("quiz-topic").value.trim() || state.currentTopic;

    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var studentAns = state.quizAnswers[i] || "";
      var correct = false;

      var checkResult = await apiRequest("/api/accessstem/check-answer", {
        method: "POST",
        body: {
          question: q.question,
          student_answer: studentAns,
          correct_answer: q.correct_answer || "",
          explanation: q.explanation || ""
        }
      });

      if (checkResult.ok && checkResult.data) {
        correct = checkResult.data.correct === true || checkResult.data.is_correct === true;
      } else {
        correct = studentAns === q.correct_answer;
      }

      if (correct) score++;
    }

    state.quizSubmitted = true;
    setLoading("btn-submit-quiz", false);
    renderQuiz();

    var pct = Math.round((score / questions.length) * 100);
    setHTML("quiz-score", [
      '<div class="glass-card p-6 text-center fade-in mt-6">',
      '<p class="text-3xl font-bold gradient-text">' + score + " / " + questions.length + "</p>",
      '<p class="text-slate-600 mt-1">' + pct + "% correct</p>",
      score === questions.length ? '<p class="text-green-600 font-semibold mt-2">Perfect score! 🎉</p>' : "",
      "</div>"
    ].join(""));

    await saveProgress(score, questions.length);
    showToast("Quiz submitted! Score: " + score + "/" + questions.length, "success");
  }

  // ─── Study Plan ───────────────────────────────────────────────────
  async function generateStudyPlan() {
    var goal = $("study-goal").value.trim();
    var gradeLevel = $("study-grade").value.trim();
    var days = parseInt($("study-days").value, 10) || 7;
    var weakRaw = $("study-weak").value.trim();
    var weakTopics = weakRaw ? weakRaw.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];

    if (!goal) {
      showToast("Please enter a study goal.", "error");
      return;
    }

    setLoading("btn-study", true);
    setHTML("study-result", '<div class="space-y-3"><div class="skeleton h-16 w-full"></div><div class="skeleton h-16 w-full"></div></div>');

    var result = await apiRequest("/api/accessstem/study-plan", {
      method: "POST",
      body: {
        goal: goal,
        grade_level: gradeLevel,
        available_days: days,
        weak_topics: weakTopics
      }
    });

    setLoading("btn-study", false);

    if (!result.ok) {
      setHTML("study-result", '<div class="text-red-600 text-sm">' + escapeHtml(result.error) + "</div>");
      showToast(result.error, "error");
      return;
    }

    var d = result.data;
    var daysHtml = (d.days || d.plan || []).map(function (day, i) {
      var tasks = (day.tasks || []).map(function (t) { return "<li class=\"text-sm text-slate-600\">" + escapeHtml(typeof t === "string" ? t : t.task || t.description || JSON.stringify(t)) + "</li>"; }).join("");
      return [
        '<div class="glass-card p-5 day-card">',
        '<div class="flex items-center justify-between mb-2">',
        '<h4 class="font-bold text-slate-800">Day ' + (day.day || i + 1) + "</h4>",
        day.estimated_minutes ? '<span class="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">' + day.estimated_minutes + " min</span>" : "",
        "</div>",
        day.focus ? '<p class="text-sm font-medium text-indigo-600 mb-2">' + escapeHtml(day.focus) + "</p>" : "",
        tasks ? '<ul class="list-disc list-inside space-y-1">' + tasks + "</ul>" : "",
        "</div>"
      ].join("");
    }).join("");

    if (!daysHtml && d.schedule) {
      daysHtml = '<pre class="text-sm text-slate-600 whitespace-pre-wrap">' + escapeHtml(JSON.stringify(d.schedule, null, 2)) + "</pre>";
    }

    setHTML("study-result", [
      '<div class="space-y-4 fade-in">',
      renderSourceBadge(d.source),
      d.summary ? '<p class="text-slate-600">' + escapeHtml(d.summary) + "</p>" : "",
      '<div class="grid gap-4 md:grid-cols-2">' + (daysHtml || '<p class="text-slate-500">No plan days returned.</p>') + "</div>",
      "</div>"
    ].join(""));

    showToast("Study plan generated!", "success");
  }

  // ─── Scholarship ──────────────────────────────────────────────────
  async function calculateScholarship() {
    var body = {
      grade_level: $("sch-grade").value.trim(),
      gpa: parseFloat($("sch-gpa").value) || 0,
      country: $("sch-country").value.trim(),
      intended_major: $("sch-major").value.trim(),
      english_level: $("sch-english").value.trim(),
      financial_need: $("sch-need").value,
      activities: $("sch-activities").value.trim(),
      has_essay: $("sch-essay").checked,
      has_english_test: $("sch-english-test").checked
    };

    setLoading("btn-scholarship", true);
    setHTML("scholarship-result", '<div class="space-y-3"><div class="skeleton h-24 w-full"></div><div class="skeleton h-32 w-full"></div></div>');

    var result = await apiRequest("/api/scholarships/match", {
      method: "POST",
      body: body
    });

    setLoading("btn-scholarship", false);

    if (!result.ok) {
      setHTML("scholarship-result", '<div class="text-red-600 text-sm">' + escapeHtml(result.error) + "</div>");
      showToast(result.error, "error");
      return;
    }

    var d = result.data;
    var readiness = d.overall_readiness_score || d.readiness_score || 0;

    var matchesHtml = (d.matches || d.scholarships || []).map(function (m) {
      var strengths = (m.strengths || []).map(function (s) { return "<li class=\"text-sm text-green-700\">" + escapeHtml(s) + "</li>"; }).join("");
      var improvements = (m.improvements || []).map(function (s) { return "<li class=\"text-sm text-amber-700\">" + escapeHtml(s) + "</li>"; }).join("");
      var docs = (m.required_documents || []).map(function (doc) { return "<li class=\"text-sm text-slate-600\">" + escapeHtml(doc) + "</li>"; }).join("");

      return [
        '<div class="match-card">',
        '<div class="flex items-start justify-between mb-3">',
        '<h4 class="font-bold text-slate-800">' + escapeHtml(m.name || m.scholarship_name || "Scholarship") + "</h4>",
        m.fit_score !== undefined ? '<span class="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">' + m.fit_score + "% fit</span>" : "",
        "</div>",
        m.estimated_amount ? '<p class="text-sm text-slate-600 mb-1"><strong>Est. Amount:</strong> ' + escapeHtml(String(m.estimated_amount)) + "</p>" : "",
        m.deadline ? '<p class="text-sm text-slate-600 mb-2"><strong>Deadline:</strong> ' + escapeHtml(m.deadline) + "</p>" : "",
        strengths ? '<div class="mb-2"><p class="text-xs font-semibold text-green-800 uppercase mb-1">Strengths</p><ul class="list-disc list-inside">' + strengths + "</ul></div>" : "",
        improvements ? '<div class="mb-2"><p class="text-xs font-semibold text-amber-800 uppercase mb-1">Improvements</p><ul class="list-disc list-inside">' + improvements + "</ul></div>" : "",
        docs ? '<div><p class="text-xs font-semibold text-slate-500 uppercase mb-1">Required Documents</p><ul class="list-disc list-inside">' + docs + "</ul></div>" : "",
        "</div>"
      ].join("");
    }).join("");

    var nextSteps = (d.next_steps || []).map(function (s) { return "<li class=\"text-sm text-slate-600\">" + escapeHtml(s) + "</li>"; }).join("");

    setHTML("scholarship-result", [
      '<div class="space-y-6 fade-in">',
      '<div class="glass-card p-6">',
      '<h4 class="font-bold text-slate-800 mb-4">Profile Summary</h4>',
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">',
      '<div><span class="text-slate-500">Grade</span><p class="font-semibold">' + escapeHtml(body.grade_level) + "</p></div>",
      '<div><span class="text-slate-500">GPA</span><p class="font-semibold">' + body.gpa + "</p></div>",
      '<div><span class="text-slate-500">Country</span><p class="font-semibold">' + escapeHtml(body.country) + "</p></div>",
      '<div><span class="text-slate-500">Major</span><p class="font-semibold">' + escapeHtml(body.intended_major) + "</p></div>",
      "</div>",
      "</div>",
      '<div class="flex flex-col md:flex-row items-center gap-6 glass-card p-6">',
      '<div class="progress-circle" style="--progress:' + readiness + '"><span>' + readiness + "%</span></div>",
      '<div class="flex-1">',
      '<h4 class="font-bold text-slate-800 mb-2">Overall Readiness</h4>',
      '<div class="progress-bar w-full"><div class="progress-bar-fill" style="width:' + readiness + '%"></div></div>',
      d.advisor_summary ? '<p class="text-sm text-slate-600 mt-3">' + escapeHtml(d.advisor_summary) + "</p>" : "",
      "</div>",
      "</div>",
      d.warning ? '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">⚠ ' + escapeHtml(d.warning) + "</div>" : "",
      matchesHtml ? '<div><h4 class="font-bold text-slate-800 mb-4">Scholarship Matches</h4><div class="grid gap-4 md:grid-cols-2">' + matchesHtml + "</div></div>" : "",
      nextSteps ? '<div class="glass-card p-5"><h4 class="font-bold text-slate-800 mb-2">Next Steps</h4><ol class="list-decimal list-inside space-y-1">' + nextSteps + "</ol></div>" : "",
      "</div>"
    ].join(""));

    showToast("Scholarship readiness calculated!", "success");
  }

  // ─── Progress ─────────────────────────────────────────────────────
  async function saveProgress(score, total) {
    var topic = state.currentTopic || $("quiz-topic").value.trim() || "General";

    var result = await apiRequest("/api/progress", {
      method: "POST",
      body: {
        student_id: config.STUDENT_ID,
        topic: topic,
        score: score,
        total: total
      }
    });

    if (result.ok) {
      await loadProgress();
    } else {
      showToast("Could not save progress: " + result.error, "error");
    }
  }

  async function loadProgress() {
    setHTML("progress-list", '<div class="flex items-center gap-2 py-4"><span class="spinner spinner-dark"></span> Loading...</div>');

    var result = await apiRequest("/api/progress?student_id=" + encodeURIComponent(config.STUDENT_ID));

    if (!result.ok) {
      setHTML("progress-list", '<div class="empty-state"><p>' + escapeHtml(result.error) + "</p></div>");
      setText("progress-avg", "—");
      setText("progress-count", "0");
      return;
    }

    var payload = result.data;
    var records = payload.items || payload.records || payload;
    if (!Array.isArray(records)) records = records ? [records] : [];

    state.progress = records;

    if (records.length === 0) {
      setHTML("progress-list", '<div class="empty-state"><p>No progress yet. Complete a quiz to get started!</p></div>');
      setText("progress-avg", (payload.average_percentage !== undefined ? payload.average_percentage : 0) + "%");
      setText("progress-count", String(payload.completed_topics !== undefined ? payload.completed_topics : 0));
      return;
    }

    var totalPct = 0;
    var listHtml = records.map(function (r) {
      var pct = r.percentage !== undefined ? r.percentage : (r.total > 0 ? Math.round((r.score / r.total) * 100) : 0);
      totalPct += pct;
      return [
        '<div class="glass-card p-4 flex items-center justify-between">',
        '<div>',
        '<p class="font-semibold text-slate-800">' + escapeHtml(r.topic || "Unknown") + "</p>",
        '<p class="text-sm text-slate-500">' + (r.score || 0) + "/" + (r.total || 0) + " correct</p>",
        "</div>",
        '<div class="text-right">',
        '<p class="text-lg font-bold text-indigo-600">' + pct + "%</p>",
        '<div class="progress-bar w-24 mt-1"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>',
        "</div>",
        "</div>"
      ].join("");
    }).join("");

    var avg = payload.average_percentage !== undefined
      ? Math.round(payload.average_percentage)
      : Math.round(totalPct / records.length);
    var count = payload.completed_topics !== undefined ? payload.completed_topics : records.length;

    setHTML("progress-list", '<div class="space-y-3">' + listHtml + "</div>");
    setText("progress-avg", avg + "%");
    setText("progress-count", String(count));
  }

  async function clearProgress() {
    if (!confirm("Clear all progress for demo-user?")) return;

    setLoading("btn-clear-progress", true);

    var result = await apiRequest("/api/progress?student_id=" + encodeURIComponent(config.STUDENT_ID), {
      method: "DELETE"
    });

    setLoading("btn-clear-progress", false);

    if (result.ok) {
      state.progress = [];
      await loadProgress();
      showToast("Progress cleared.", "info");
    } else {
      showToast(result.error, "error");
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────
  function initNavigation() {
    var navbar = $("navbar");
    var mobileToggle = $("mobile-menu-toggle");
    var mobileMenu = $("mobile-menu");

    window.addEventListener("scroll", function () {
      if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 50);
    });

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener("click", function () {
        mobileMenu.classList.toggle("open");
      });
    }

    $$(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mobileMenu) mobileMenu.classList.remove("open");
      });
    });

    var sections = $$("section[id]");
    var navLinks = $$(".nav-link");

    function updateActiveNav() {
      var scrollPos = window.scrollY + 120;
      sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        var id = section.getAttribute("id");
        if (scrollPos >= top && scrollPos < top + height) {
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
        }
      });
    }

    window.addEventListener("scroll", updateActiveNav);
    updateActiveNav();
  }

  // ─── Init ─────────────────────────────────────────────────────────
  function init() {
    initNavigation();

    $("btn-explain").addEventListener("click", generateExplanation);
    $("btn-assistant").addEventListener("click", askAssistant);
    $("btn-quiz").addEventListener("click", generateQuiz);
    $("btn-submit-quiz").addEventListener("click", submitQuiz);
    $("btn-study").addEventListener("click", generateStudyPlan);
    $("btn-scholarship").addEventListener("click", calculateScholarship);
    $("btn-refresh-progress").addEventListener("click", loadProgress);
    $("btn-clear-progress").addEventListener("click", clearProgress);

    $("hero-learn").addEventListener("click", function () {
      document.querySelector("#learn").scrollIntoView({ behavior: "smooth" });
    });
    $("hero-assistant").addEventListener("click", function () {
      document.querySelector("#assistant").scrollIntoView({ behavior: "smooth" });
    });
    $("hero-scholarship").addEventListener("click", function () {
      document.querySelector("#scholarship").scrollIntoView({ behavior: "smooth" });
    });

    $("quiz-count").addEventListener("change", function () {
      this.value = clampQuestionCount(this.value);
    });

    checkHealth();
    loadProgress();
  }

  window.TUTall = {
    requestHint: requestHint,
    checkHealth: checkHealth,
    generateExplanation: generateExplanation,
    askAssistant: askAssistant,
    generateQuiz: generateQuiz,
    submitQuiz: submitQuiz,
    generateStudyPlan: generateStudyPlan,
    calculateScholarship: calculateScholarship,
    saveProgress: saveProgress,
    loadProgress: loadProgress,
    clearProgress: clearProgress
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
