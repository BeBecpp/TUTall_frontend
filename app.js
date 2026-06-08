(function () {
  "use strict";

  var state = {
    quiz: null,
    quizAnswers: {},
    quizHints: {},
    quizSubmitted: false
  };

  function $(id) { return document.getElementById(id); }
  function $$(selector) { return document.querySelectorAll(selector); }
  function setHTML(id, html) { var el = $(id); if (el) el.innerHTML = html; }
  function setLoading(id, loading) {
    var btn = $(id);
    if (!btn) return;
    btn.disabled = loading;
    var label = btn.querySelector(".btn-label");
    var spinner = btn.querySelector(".btn-spinner");
    if (label) label.classList.toggle("hidden", loading);
    if (spinner) spinner.classList.toggle("hidden", !loading);
  }

  function showToast(message, type) {
    var container = $("toast-container");
    if (!container) return;
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "info");
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3500);
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function clampQuestionCount(val) {
    var n = parseInt(val, 10);
    if (isNaN(n)) return 5;
    return Math.min(7, Math.max(3, n));
  }

  function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function buildMockExplanation(topic, difficulty) {
    var base = {
      beginner: {
        points: ["Simple definitions", "Key examples", "Real-world connections"]
      },
      intermediate: {
        points: ["Main principles", "Common applications", "Study strategy"]
      },
      advanced: {
        points: ["Core theory", "Problem-solving edge", "Exam-ready framing"]
      }
    };

    var nextTopics = ["Vectors in motion", "Energy transfer", "Systems of equations", "Algorithm design", "Cell structure"];
    return {
      topic: topic || "STEM concept",
      explanation: "This explanation helps you understand " + topic + " with a focus on clarity and the vocabulary used in STEM classrooms.",
      example: "For example, if we look at " + topic + ", it becomes easier when you break it into smaller steps and connect it to a familiar problem.",
      key_points: (base[difficulty] ? base[difficulty].points : base.beginner.points),
      next_topics: [randomFrom(nextTopics), randomFrom(nextTopics)],
      source: "AccessSTEM AI Demo"
    };
  }

  function buildMockAssistant(topic, question) {
    return {
      answer: "AccessSTEM AI supports your question on " + topic + " with a friendly explanation that helps you think through the idea.",
      key_points: ["Focus on the main idea", "Link each step to the question", "Try a small example"],
      next_steps: ["Highlight the key formula", "Do a quick practice problem", "Summarize the concept in your own words"],
      suggested_questions: ["Can you compare this with a similar topic?", "What is the common mistake here?", "How would I solve this step-by-step?"],
      source: "AccessSTEM AI Demo"
    };
  }

  function createMockQuiz(topic, difficulty, count) {
    var templates = [
      {
        question: "What is a key characteristic of " + topic + "?",
        options: ["It relies on careful definitions.", "It is always unrelated to problems.", "It only applies in literature.", "It never uses formulas."],
        answer: "It relies on careful definitions.",
        hint: "Think about what separates this idea from unrelated statements."
      },
      {
        question: "Which statement best describes " + topic + "?",
        options: ["It is a foundational STEM principle.", "It only works in art classes.", "It depends on random guessing.", "It requires no reasoning."],
        answer: "It is a foundational STEM principle.",
        hint: "Choose the option that fits scientific or mathematical thinking."
      },
      {
        question: "How would you apply " + topic + " in a real example?",
        options: ["By identifying the key variables first.", "By ignoring the instructions.", "By changing the question entirely.", "By guessing the final result."],
        answer: "By identifying the key variables first.",
        hint: "Good STEM practice starts by defining what matters." 
      },
      {
        question: "What is one simple example of " + topic + "?",
        options: ["A problem that connects the idea to a real scenario.", "A question unrelated to the concept.", "A random fact.", "A memorized list of terms."],
        answer: "A problem that connects the idea to a real scenario.",
        hint: "Look for the option that turns the concept into an application."
      }
    ];

    var questions = [];
    for (var i = 0; i < count; i++) {
      var item = templates[i % templates.length];
      questions.push({
        question: item.question,
        options: item.options,
        correct_answer: item.answer,
        hint: item.hint
      });
    }

    return { topic: topic, difficulty: difficulty, questions: questions, source: "AccessSTEM AI Demo" };
  }

  function renderSourceBadge(source) {
    if (!source) return "";
    return '<span class="source-badge gemini">✦ ' + escapeHtml(source) + '</span>';
  }

  function generateExplanation() {
    var topic = $("learn-topic") ? $("learn-topic").value.trim() : "";
    var difficulty = $("learn-difficulty") ? $("learn-difficulty").value : "beginner";
    if (!topic) {
      showToast("Please enter a topic.", "error");
      return;
    }

    setLoading("btn-explain", true);
    setHTML("explain-result", '<div class="space-y-3"><div class="skeleton h-6 w-3/4"></div><div class="skeleton h-4 w-full"></div><div class="skeleton h-4 w-5/6"></div></div>');

    setTimeout(function () {
      var result = buildMockExplanation(topic, difficulty);
      setHTML("explain-result", [
        '<div class="space-y-4 fade-in-up">',
        renderSourceBadge(result.source),
        '<h4 class="text-lg font-bold text-white">' + escapeHtml(result.topic) + '</h4>',
        '<p class="text-[#d7d7d7]">' + escapeHtml(result.explanation) + '</p>',
        '<div class="bg-[#16394f] border border-white/10 rounded-2xl p-4">',
        '<p class="text-sm font-semibold text-[#8db5ce] mb-2">Example</p>',
        '<p class="text-sm text-[#c9ced7]">' + escapeHtml(result.example) + '</p>',
        '</div>',
        '<div><p class="font-semibold text-white mb-2">Key Points</p><ul class="list-disc list-inside space-y-1 text-[#c9ced7]">' + result.key_points.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') + '</ul></div>',
        '<div><p class="font-semibold text-white mb-2">Next Topics</p><div class="flex flex-wrap gap-2">' + result.next_topics.map(function (topic) { return '<span class="topic-chip">' + escapeHtml(topic) + '</span>'; }).join('') + '</div></div>',
        '</div>'
      ].join(''));
      setLoading("btn-explain", false);
      showToast("Explanation ready.", "success");
    }, 900);
  }

  function askAssistant() {
    var topic = $("assistant-topic") ? $("assistant-topic").value.trim() : "STEM concept";
    var question = $("assistant-question") ? $("assistant-question").value.trim() : "";
    if (!question) {
      showToast("Please enter a question.", "error");
      return;
    }

    setLoading("btn-assistant", true);
    setHTML("assistant-result", '<div class="flex items-center gap-3 py-6 justify-center"><span class="spinner spinner-dark"></span><span class="text-[#c9ced7]">AccessSTEM AI is generating guidance...</span></div>');

    setTimeout(function () {
      var result = buildMockAssistant(topic, question);
      setHTML("assistant-result", [
        '<div class="space-y-4 fade-in-up">',
        '<div><p class="text-sm font-semibold text-[#8db5ce] mb-1">Answer</p><p class="text-[#d7d7d7]">' + escapeHtml(result.answer) + '</p></div>',
        '<div><p class="text-sm font-semibold text-[#8db5ce] mb-1">Key Points</p><ul class="list-disc list-inside text-sm text-[#c9ced7] space-y-1">' + result.key_points.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') + '</ul></div>',
        '<div><p class="text-sm font-semibold text-[#8db5ce] mb-1">Next Steps</p><ol class="list-decimal list-inside text-sm text-[#c9ced7] space-y-1">' + result.next_steps.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') + '</ol></div>',
        '</div>'
      ].join(''));
      setLoading("btn-assistant", false);
      showToast("AI guidance delivered.", "success");
    }, 1000);
  }

  function renderQuiz() {
    if (!state.quiz || !state.quiz.questions) {
      setHTML("quiz-result", '<div class="empty-state glass-card p-8 text-center text-[#c9ced7]"><p class="font-semibold text-white mb-2">No quiz loaded yet.</p><p>Create one to begin.</p></div>');
      return;
    }

    var questions = state.quiz.questions;
    var html = ['<div class="space-y-6 fade-in-up">'];
    html.push('<div class="flex items-center justify-between"><div><p class="text-sm uppercase tracking-[0.24em] text-[#8db5ce] mb-1">Quiz topic</p><h3 class="text-xl font-semibold text-white">' + escapeHtml(state.quiz.topic) + '</h3></div><span class="text-sm text-[#c9ced7]">' + questions.length + ' questions</span></div>');

    questions.forEach(function (q, index) {
      var optionsHtml = q.options.map(function (opt) {
        var checked = state.quizAnswers[index] === opt ? 'checked' : '';
        var disabled = state.quizSubmitted ? 'disabled' : '';
        var labelClass = 'quiz-option';
        if (state.quizSubmitted) {
          if (opt === q.correct_answer) labelClass += ' correct';
          else if (state.quizAnswers[index] === opt) labelClass += ' incorrect';
        }
        return '<label class="' + labelClass + '"><input type="radio" name="quiz-q-' + index + '" value="' + escapeHtml(opt) + '" ' + checked + ' ' + disabled + '><span class="text-[#d7d7d7]">' + escapeHtml(opt) + '</span></label>';
      }).join('');

      html.push('<div class="glass-card p-6" id="quiz-card-' + index + '"><p class="font-semibold text-white mb-4">Q' + (index + 1) + '. ' + escapeHtml(q.question) + '</p><div class="space-y-3">' + optionsHtml + '</div>' +
        (!state.quizSubmitted ? '<button type="button" class="btn-outline text-sm py-2 px-4 mt-4" onclick="TUTall.requestHint(' + index + ')">Get Hint</button>' : '') +
        (state.quizHints[index] ? '<div class="hint-box mt-4"><p class="text-sm font-semibold text-[#8db5ce] mb-1">Hint</p><p class="text-[#c9ced7]">' + escapeHtml(state.quizHints[index].hint || '') + '</p></div>' : '') +
        '</div>');
    });

    html.push('</div>');
    setHTML("quiz-result", html.join(''));

    if (!state.quizSubmitted) {
      questions.forEach(function (_, index) {
        var radios = document.querySelectorAll('input[name="quiz-q-' + index + '"]');
        radios.forEach(function (radio) {
          radio.addEventListener("change", function () {
            state.quizAnswers[index] = radio.value;
          });
        });
      });
    }
  }

  function generateQuiz() {
    var topic = $("quiz-topic") ? $("quiz-topic").value.trim() : "STEM";
    var difficulty = $("quiz-difficulty") ? $("quiz-difficulty").value : "middle school";
    var count = $("quiz-count") ? clampQuestionCount($("quiz-count").value) : 5;
    if ($("quiz-count")) $("quiz-count").value = count;

    if (!topic) {
      showToast("Please enter a quiz topic.", "error");
      return;
    }

    state.quizAnswers = {};
    state.quizHints = {};
    state.quizSubmitted = false;
    state.quiz = createMockQuiz(topic, difficulty, count);

    setHTML("quiz-result", '<div class="space-y-4"><div class="skeleton h-24 w-full"></div><div class="skeleton h-24 w-full"></div></div>');
    setHTML("quiz-score", '');

    setTimeout(function () {
      renderQuiz();
      showToast("Quiz generated with " + count + " questions.", "success");
    }, 650);
  }

  function requestHint(index) {
    if (!state.quiz || !state.quiz.questions[index]) return;
    var question = state.quiz.questions[index];
    state.quizHints[index] = { hint: question.hint || "Review the concept and choose the best answer." };
    renderQuiz();
    showToast("Hint added.", "info");
  }

  function submitQuiz() {
    if (!state.quiz || !state.quiz.questions) {
      showToast("Generate a quiz first.", "error");
      return;
    }

    var questions = state.quiz.questions;
    if (Object.keys(state.quizAnswers).length < questions.length) {
      showToast("Please answer all questions before submitting.", "error");
      return;
    }

    state.quizSubmitted = true;
    var score = 0;
    questions.forEach(function (q, index) {
      if (state.quizAnswers[index] === q.correct_answer) score += 1;
    });

    renderQuiz();
    var pct = Math.round((score / questions.length) * 100);
    setHTML("quiz-score", [
      '<div class="glass-card p-6 text-center fade-in-up">',
      '<p class="text-3xl font-bold text-white">' + score + ' / ' + questions.length + '</p>',
      '<p class="text-[#c9ced7] mt-2">' + pct + '% correct</p>',
      score === questions.length ? '<p class="text-[#8db5ce] font-semibold mt-3">Perfect score! 🎉</p>' : '',
      '</div>'
    ].join(''));

    showToast("Quiz submitted!", "success");
  }

  function generateStudyPlan() {
    var goal = $("study-goal") ? $("study-goal").value.trim() : "";
    var gradeLevel = $("study-grade") ? $("study-grade").value.trim() : "";
    var days = $("study-days") ? parseInt($("study-days").value, 10) : 7;
    var weakRaw = $("study-weak") ? $("study-weak").value.trim() : "";
    var weakTopics = weakRaw ? weakRaw.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
    days = isNaN(days) || days < 1 ? 7 : Math.min(Math.max(days, 1), 7);

    if (!goal) {
      showToast("Please enter a study goal.", "error");
      return;
    }

    setLoading("btn-study", true);
    setHTML("study-result", '<div class="space-y-3"><div class="skeleton h-24 w-full"></div><div class="skeleton h-24 w-full"></div></div>');

    setTimeout(function () {
      var plan = [];
      for (var i = 1; i <= days; i++) {
        var topic = weakTopics.length ? weakTopics[(i - 1) % weakTopics.length] : "";
        plan.push({
          day: i,
          focus: topic ? 'Work on ' + topic : 'Review key concepts',
          tasks: [
            'Read the concept summary',
            'Practice one targeted example',
            'Write a short explanation in your own words'
          ]
        });
      }

      setHTML("study-result", [
        '<div class="space-y-4 fade-in-up">',
        '<div class="glass-card p-6">',
        '<h3 class="text-xl font-semibold text-white mb-3">Personalized study plan</h3>',
        '<p class="text-[#c9ced7]">Goal: ' + escapeHtml(goal) + '</p>',
        '<p class="text-[#c9ced7] mt-1">Grade level: ' + escapeHtml(gradeLevel || 'N/A') + ' · Days: ' + days + '</p>',
        '</div>',
        '<div class="grid gap-4 md:grid-cols-2">' + plan.map(function (item) {
          return '<div class="glass-card p-5"><div class="flex items-center justify-between mb-3"><h4 class="font-semibold text-white">Day ' + item.day + '</h4><span class="text-sm text-[#8db5ce]">Focus</span></div>' +
            '<p class="text-[#d7d7d7] mb-3">' + escapeHtml(item.focus) + '</p>' +
            '<ul class="list-disc list-inside text-[#c9ced7] space-y-1">' + item.tasks.map(function (task) { return '<li>' + escapeHtml(task) + '</li>'; }).join('') + '</ul></div>';
        }).join('') + '</div>',
        '</div>'
      ].join(''));
      setLoading("btn-study", false);
      showToast("Study plan created.", "success");
    }, 850);
  }

  function calculateScholarship() {
    var profile = {
      grade_level: $("sch-grade") ? $("sch-grade").value.trim() : "",
      gpa: $("sch-gpa") ? parseFloat($("sch-gpa").value) : 0,
      country: $("sch-country") ? $("sch-country").value.trim() : "",
      intended_major: $("sch-major") ? $("sch-major").value.trim() : "",
      english_level: $("sch-english") ? $("sch-english").value.trim() : "",
      financial_need: $("sch-need") ? $("sch-need").value : "medium",
      first_gen: $("sch-first-gen") ? $("sch-first-gen").value : "no",
      require_assistance: $("sch-finance") ? $("sch-finance").value : "no",
      activities: $("sch-activities") ? $("sch-activities").value.trim() : "",
      has_essay: $("sch-essay") ? $("sch-essay").checked : false,
      has_english_test: $("sch-english-test") ? $("sch-english-test").checked : false
    };

    setLoading("btn-scholarship", true);
    setHTML("scholarship-result", '<div class="space-y-3"><div class="skeleton h-24 w-full"></div><div class="skeleton h-32 w-full"></div></div>');

    setTimeout(function () {
      var baseScore = 40 + Math.min(40, Math.round(profile.gpa * 10));
      if (profile.first_gen === "yes") baseScore += 12;
      if (profile.require_assistance === "yes") baseScore += 12;
      if (profile.has_essay) baseScore += 8;
      if (profile.has_english_test) baseScore += 8;
      var readiness = Math.min(100, Math.max(35, baseScore));

      var matches = [
        {
          name: "FGLI Opportunity Grant",
          fit_score: readiness,
          estimated_amount: "$3,500",
          deadline: "Nov 15",
          strengths: ["First-generation applicant", "High financial need", "Strong extracurricular profile"],
          improvements: ["Add a short reflective essay", "Review scholarship criteria again"],
          required_documents: ["Transcript", "Personal statement", "Financial aid form"]
        },
        {
          name: "Equity Access Support Fund",
          fit_score: Math.max(75, readiness - 5),
          estimated_amount: "$2,000",
          deadline: "Dec 1",
          strengths: ["Academic potential", "Community service background"],
          improvements: ["Confirm English test submission", "Contact program advisor"],
          required_documents: ["Recommendation note", "Major statement"]
        }
      ];

      setHTML("scholarship-result", [
        '<div class="space-y-6 fade-in-up">',
        '<div class="glass-card p-6">',
        '<h3 class="text-xl font-semibold text-white mb-3">Profile summary</h3>',
        '<div class="grid gap-4 md:grid-cols-2 text-sm text-[#c9ced7]">',
        '<div><strong>Grade:</strong> ' + escapeHtml(profile.grade_level || "N/A") + '</div>',
        '<div><strong>GPA:</strong> ' + escapeHtml(String(profile.gpa || "N/A")) + '</div>',
        '<div><strong>Major:</strong> ' + escapeHtml(profile.intended_major || "N/A") + '</div>',
        '<div><strong>Financial aid:</strong> ' + escapeHtml(profile.require_assistance === "yes" ? "Requested" : "Not requested") + '</div>',
        '</div>',
        '</div>',
        '<div class="glass-card p-6 flex flex-col md:flex-row items-center gap-6">',
        '<div class="progress-circle" style="--progress:' + readiness + '"><span>' + readiness + '%</span></div>',
        '<div class="flex-1">',
        '<h3 class="text-xl font-semibold text-white mb-3">Scholarship readiness</h3>',
        '<div class="progress-bar"><div class="progress-bar-fill" style="width:' + readiness + '%"></div></div>',
        '<p class="text-[#c9ced7] mt-4">Your profile is being matched against targeted equity grants and first-generation support opportunities.</p>',
        '</div>',
        '</div>',
        '<div><h3 class="text-xl font-semibold text-white mb-4">Recommended awards</h3><div class="grid gap-4 md:grid-cols-2">' +
        matches.map(function (match) {
          return '<div class="match-card">' +
            '<div class="flex items-start justify-between mb-3"><h4 class="font-bold text-white">' + escapeHtml(match.name) + '</h4><span class="text-sm text-[#8db5ce]">' + escapeHtml(match.fit_score + '% fit') + '</span></div>' +
            '<p class="text-[#c9ced7] mb-2"><strong>Est. Amount:</strong> ' + escapeHtml(match.estimated_amount) + '</p>' +
            '<p class="text-[#c9ced7] mb-3"><strong>Deadline:</strong> ' + escapeHtml(match.deadline) + '</p>' +
            '<div class="mb-2"><p class="text-xs uppercase text-[#8db5ce] mb-1">Strengths</p><ul class="list-disc list-inside text-[#c9ced7] text-sm">' + match.strengths.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul></div>' +
            '<div class="mb-2"><p class="text-xs uppercase text-[#8db5ce] mb-1">Improvements</p><ul class="list-disc list-inside text-[#c9ced7] text-sm">' + match.improvements.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul></div>' +
            '<div><p class="text-xs uppercase text-[#8db5ce] mb-1">Documents</p><ul class="list-disc list-inside text-[#c9ced7] text-sm">' + match.required_documents.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul></div>' +
            '</div>';
        }).join('') + '</div></div>',
        '<div class="glass-card p-5"><h3 class="text-lg font-semibold text-white mb-3">Next steps</h3><ol class="list-decimal list-inside space-y-2 text-[#c9ced7]">' +
        ['Review your application timeline', 'Prepare the essay with your first-gen story', 'Submit financial support documents early'].map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ol></div>',
        '</div>'
      ].join(''));

      setLoading("btn-scholarship", false);
      showToast("Scholarship readiness calculated.", "success");
    }, 900);
  }

  function initNavigation() {
    var navbar = $("navbar");
    var mobileToggle = $("mobile-menu-toggle");
    var mobileMenu = $("mobile-menu");

    if (navbar) {
      window.addEventListener("scroll", function () {
        navbar.classList.toggle("scrolled", window.scrollY > 50);
      });
    }

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

    var currentUrl = window.location.href;
    $$(".nav-link").forEach(function (link) {
      var href = link.href;
      if (currentUrl.endsWith("/" + href.split('/').pop()) || (currentUrl.endsWith("/") && href.endsWith("index.html"))) {
        link.classList.add("active");
      }
    });
  }

  function animateDashboardCards() {
    $$(".progress-bar-fill").forEach(function (fill) {
      var width = fill.style.width || "0%";
      fill.style.width = "0%";
      setTimeout(function () { fill.style.width = width; }, 100);
    });
  }

  function initTopicChips() {
    var chips = $$(".topic-chip");
    if (!chips.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var value = chip.textContent.trim();
        if ($("learn-topic")) {
          $("learn-topic").value = value;
          showToast("Topic selected: " + value, "info");
        }
      });
    });
  }

  function init() {
    initNavigation();
    animateDashboardCards();
    initTopicChips();

    if ($("btn-explain")) {
      $("btn-explain").addEventListener("click", generateExplanation);
    }
    if ($("btn-assistant")) {
      $("btn-assistant").addEventListener("click", askAssistant);
    }
    if ($("btn-quiz")) {
      $("btn-quiz").addEventListener("click", generateQuiz);
    }
    if ($("btn-submit-quiz")) {
      $("btn-submit-quiz").addEventListener("click", submitQuiz);
    }
    if ($("quiz-count")) {
      $("quiz-count").addEventListener("change", function () {
        this.value = clampQuestionCount(this.value);
      });
    }
    if ($("btn-study")) {
      $("btn-study").addEventListener("click", generateStudyPlan);
    }
    if ($("btn-scholarship")) {
      $("btn-scholarship").addEventListener("click", calculateScholarship);
    }
  }

  window.TUTall = { requestHint: requestHint };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();