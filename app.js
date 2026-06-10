const state = {
  currentRoute: 'home',
  quiz: null,
  quizAnswers: {},
  quizHints: {},
  quizSubmitted: false,
  plannerTasks: [
    { id: 'task-1', title: 'Physics review', details: 'Check formulas and concept notes.' },
    { id: 'task-2', title: 'Algebra practice', details: 'Solve equations and analyze graphs.' },
    { id: 'task-3', title: 'Scholarship research', details: 'Review requirements and deadlines.' },
    { id: 'task-4', title: 'Essay outline', details: 'Draft a reflective academic narrative.' }
  ],
  calendarEvents: [
    { id: 'event-1', title: 'Concept review', day: 'mon', time: '09:30' },
    { id: 'event-2', title: 'Practice quiz', day: 'wed', time: '14:00' },
    { id: 'event-3', title: 'Study session', day: 'fri', time: '17:00' }
  ],
  tutorHistory: [
    { type: 'assistant', message: 'Welcome to AccessSTEM AI. Choose a topic or ask a question to begin.', source: 'AccessSTEM AI' }
  ]
};

const routeConfig = {
  home: { label: 'Home', title: 'Welcome back to TUTall', description: 'A premium academic workspace for focus, planning, and intelligent guidance.' },
  dashboard: { label: 'Dashboard', title: 'Academic performance at a glance', description: 'Track progress, review study insights, and open smart learning tools.' },
  tutor: { label: 'Tutor', title: 'AI tutoring with academic rigor', description: 'Ask focused questions, receive clarified explanations, and build concept confidence.' },
  planner: { label: 'Study Planner', title: 'Structured study planning', description: 'Design your weekly learning rhythm with goal-driven schedule blocks.' },
  calendar: { label: 'Calendar', title: 'Calendar and event planning', description: 'Visualize your study calendar with fluid event placement and responsive layout.' },
  profile: { label: 'Profile', title: 'Academic profile summary', description: 'Review your metrics, goals, and first-generation support indicators.' },
  settings: { label: 'Settings', title: 'Personal preferences', description: 'Adjust motion, accessibility, and study environment controls.' }
};

const routeContainer = document.getElementById('route-container');
const routeAnnouncer = document.getElementById('route-announcer');
const toastContainer = document.getElementById('toast-container');
const sidebar = document.getElementById('sidebar');
const navButtons = document.querySelectorAll('.nav-link');
const navToggle = document.getElementById('navigationToggle');

const topics = ['Newton’s Laws', 'Photosynthesis', 'Linear algebra', 'Binary search', 'Cellular respiration', 'Calculus fundamentals'];
const recommendations = ['Review the foundational concept', 'Summarize the key formula', 'Translate the idea into your own words'];

function $(id) {
  return document.getElementById(id);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function announce(message) {
  if (!routeAnnouncer) return;
  routeAnnouncer.textContent = message;
}

function showToast(message, type = 'info') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 3600);
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>\"]/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[match]);
}

function clampQuestionCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 5;
  return Math.min(7, Math.max(3, count));
}

function setActiveNav(route) {
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.route === route);
  });
}

function loadRoute(route, pushState = true) {
  if (!routeConfig[route]) route = 'home';
  state.currentRoute = route;
  setActiveNav(route);
  if (pushState) window.history.pushState({}, '', `#${route}`);
  document.title = `TUTall — ${routeConfig[route].label}`;
  announce(`${routeConfig[route].label} page loaded.`);
  renderRoute(route);
}

function renderRoute(route) {
  const previous = routeContainer.querySelector('.route-panel');
  const panel = document.createElement('section');
  panel.className = 'route-panel route-enter';
  panel.innerHTML = renderRouteContent(route);
  routeContainer.appendChild(panel);
  requestAnimationFrame(() => panel.classList.remove('route-enter'));

  if (previous) {
    previous.classList.add('route-exit');
    previous.addEventListener('transitionend', () => previous.remove(), { once: true });
  }

  bindRouteEvents(route);
}

function renderRouteContent(route) {
  switch (route) {
    case 'dashboard':
      return dashboardTemplate();
    case 'tutor':
      return tutorTemplate();
    case 'planner':
      return plannerTemplate();
    case 'calendar':
      return calendarTemplate();
    case 'profile':
      return profileTemplate();
    case 'settings':
      return settingsTemplate();
    default:
      return homeTemplate();
  }
}

function homeTemplate() {
  return `
    <div class="route-panel-content">
      <div class="section-row">
        <div class="panel-card">
          <p class="panel-label">Premium academic workspace</p>
          <h1 class="page-title">A calm, intelligent learning studio for STEM study.</h1>
          <p class="panel-copy">TUTall blends AI guidance, planning, and progress analytics in a glass surface interface built for serious learners.</p>
          <div class="section-grid grid-2" style="margin-top:2rem;">
            <div class="metric-card"><strong>82%</strong><span>Mastery index</span></div>
            <div class="metric-card"><strong>5 days</strong><span>Study streak</span></div>
          </div>
          <div style="margin-top:2rem; display:flex; flex-wrap:wrap; gap:1rem;">
            <button class="btn-primary" data-action="navigate" data-target="dashboard">Open Dashboard</button>
            <button class="btn-secondary" data-action="navigate" data-target="tutor">Consult Tutor</button>
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Curated for serious study</p>
              <h2 class="panel-title">Designed for university prep, research, and lifelong learners.</h2>
            </div>
            <span class="status-pill connected"><span class="status-dot"></span>Active</span>
          </div>
          <div class="chip-list">
            ${topics.map((topic) => `<button class="chip" data-action="select-topic">${topic}</button>`).join('')}
          </div>
          <div style="margin-top:1.5rem; display:grid; gap:1rem;">
            <div class="feature-card"><strong>AI recommendations</strong><p class="panel-copy">Get topic suggestions and actionable next steps based on your current study focus.</p></div>
            <div class="feature-card"><strong>Academic planning</strong><p class="panel-copy">Create a disciplined weekly schedule with drag-and-drop study blocks.</p></div>
          </div>
        </div>
      </div>
      <div class="section-row" style="margin-top:2rem;">
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Smart summary</p>
              <h3 class="panel-title">Weekly learning insights</h3>
            </div>
          </div>
          <div class="grid-2">
            <div class="metric-card"><strong>4</strong><span>Focus areas</span></div>
            <div class="metric-card"><strong>93%</strong><span>Retention index</span></div>
          </div>
        </div>
        <div class="panel-card">
          <p class="panel-label">Quick actions</p>
          <div class="section-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap:1rem; margin-top:1rem;">
            <button class="feature-card" data-action="navigate" data-target="planner"><strong>Study Planner</strong><p class="panel-copy">Build and refine your study queue.</p></button>
            <button class="feature-card" data-action="navigate" data-target="calendar"><strong>Calendar</strong><p class="panel-copy">See your weekly events and commitments.</p></button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function dashboardTemplate() {
  return `
    <div class="route-panel-content">
      <div class="section-row">
        <div class="panel-card">
          <p class="panel-label">Live academic dashboard</p>
          <h1 class="page-title">Progress summaries and intelligent recommendations.</h1>
          <p class="panel-copy">Monitor performance, study streaks, and learning momentum in one elegant workspace.</p>
          <div class="grid-3" style="margin-top:2rem;">
            <div class="metric-card"><strong>82%</strong><span>Mastery index</span></div>
            <div class="metric-card"><strong>5</strong><span>Study streak</span></div>
            <div class="metric-card"><strong>14%</strong><span>Focus improvement</span></div>
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Learning insight</p>
              <h2 class="panel-title">Your current academic recommendation</h2>
            </div>
          </div>
          <p class="panel-copy">Balance concept review with active problem solving. A disciplined pace and targeted reflection supports deep STEM retention.</p>
          <div class="chip-list" style="margin-top:1.25rem;">
            ${recommendations.map((item) => `<span class="chip">${item}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="section-row" style="margin-top:2rem;">
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Practice assessment</p>
              <h3 class="panel-title">Generate a focused quiz</h3>
            </div>
          </div>
          <div class="section-grid grid-2">
            <div class="form-field">
              <label class="form-label" for="quiz-topic">Topic</label>
              <input class="form-input" id="quiz-topic" value="Photosynthesis" placeholder="Enter topic" />
            </div>
            <div class="form-field">
              <label class="form-label" for="quiz-difficulty">Difficulty</label>
              <select class="form-input" id="quiz-difficulty">
                <option value="elementary">Elementary</option>
                <option value="middle school" selected>Middle School</option>
                <option value="high school">High School</option>
                <option value="college">College</option>
              </select>
            </div>
          </div>
          <div class="section-grid" style="grid-template-columns: minmax(0, 1fr) 160px; gap:1rem; margin-top:1rem; align-items:end;">
            <div class="form-field">
              <label class="form-label" for="quiz-count">Question count</label>
              <select class="form-input" id="quiz-count">
                <option value="3">3 Questions</option>
                <option value="5" selected>5 Questions</option>
                <option value="7">7 Questions</option>
              </select>
            </div>
            <button class="btn-primary" id="btn-quiz">Generate Quiz</button>
          </div>
          <div id="quiz-score" style="margin-top:1rem;"></div>
          <div id="quiz-result" style="margin-top:1.5rem;"></div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Scholarship readiness</p>
              <h3 class="panel-title">Assess your academic profile</h3>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-field">
              <label class="form-label" for="sch-grade">Grade level</label>
              <input class="form-input" id="sch-grade" value="11" placeholder="Grade level" />
            </div>
            <div class="form-field">
              <label class="form-label" for="sch-gpa">GPA</label>
              <input class="form-input" id="sch-gpa" type="number" step="0.1" min="0" max="4" value="3.8" />
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem;">
            <div class="form-field">
              <label class="form-label" for="sch-major">Intended major</label>
              <input class="form-input" id="sch-major" value="Computer Science" placeholder="Intended major" />
            </div>
            <div class="form-field">
              <label class="form-label" for="sch-need">Financial need</label>
              <select class="form-input" id="sch-need">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high" selected>High</option>
              </select>
            </div>
          </div>
          <button class="btn-secondary" id="btn-scholarship" style="margin-top:1.25rem; width:100%;">Calculate readiness</button>
          <div id="scholarship-result" style="margin-top:1.5rem;"></div>
        </div>
      </div>
    </div>
  `;
}

function tutorTemplate() {
  return `
    <div class="route-panel-content">
      <div class="section-row">
        <div class="panel-card">
          <p class="panel-label">Academic tutor</p>
          <h1 class="page-title">A professional teaching assistant for your studies.</h1>
          <p class="panel-copy">Ask a question, request an explanation, and receive a structured academic response with context-sensitive insight.</p>
          <div class="panel-card" style="margin-top:1.75rem; background: rgba(255, 255, 255, 0.05);">
            <div class="form-field">
              <label class="form-label" for="assistant-topic">Topic</label>
              <input class="form-input" id="assistant-topic" value="Newton's Laws" placeholder="Try a STEM topic" />
            </div>
            <div class="form-field" style="margin-top:1rem;">
              <label class="form-label" for="assistant-question">Question</label>
              <textarea class="form-input" id="assistant-question" rows="4">Explain Newton's second law with an applied example.</textarea>
            </div>
            <button class="btn-primary" id="btn-assistant" style="margin-top:1.25rem;">Ask Tutor</button>
          </div>
        </div>
        <div class="panel-card">
          <p class="panel-label">Conversation</p>
          <div id="assistant-result" class="chat-response">
            <p class="text-[#c9ced7]">Ask a question and receive a clear academic explanation with citations and next-step guidance.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function plannerTemplate() {
  return `
    <div class="route-panel-content">
      <div class="section-row">
        <div class="panel-card">
          <p class="panel-label">Study Planner</p>
          <h1 class="page-title">Organize study tasks with drag-and-drop ease.</h1>
          <p class="panel-copy">Build momentum by structuring your week into meaningful, academic-focused blocks.</p>
          <div class="panel-card" style="margin-top:1.5rem;">
            <p class="panel-label">Weekly planning</p>
            <div class="plan-list" id="planner-list">
              ${state.plannerTasks.map((task) => `
                <div class="task-block" draggable="true" data-task="${task.id}">
                  <h4 class="task-block-title">${task.title}</h4>
                  <span class="task-block-detail">${task.details}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Progress forecast</p>
              <h2 class="panel-title">Your upcoming study trajectory</h2>
            </div>
          </div>
          <div class="feature-card">
            <strong>4 focused sessions</strong>
            <p class="panel-copy">This study sequence guides you through review, practice, and scholarship prep with measurable academic goals.</p>
          </div>
          <button class="btn-secondary" data-action="shuffle-planner" style="margin-top:1.25rem; width:100%;">Refresh suggestions</button>
        </div>
      </div>
    </div>
  `;
}

function calendarTemplate() {
  return `
    <div class="route-panel-content">
      <div class="section-row">
        <div class="panel-card">
          <p class="panel-label">Calendar</p>
          <h1 class="page-title">A responsive study calendar for your week.</h1>
          <p class="panel-copy">Drag events between days and maintain a balanced study flow without layout shifts.</p>
          <div class="calendar-grid" id="calendar-grid">
            ${['mon', 'wed', 'fri'].map((day) => `
              <div class="calendar-day ${day === 'mon' ? 'active' : ''}" data-day="${day}">
                <div class="calendar-day-header"><strong>${day.toUpperCase()}</strong><span>${day === 'mon' ? 'Core review' : day === 'wed' ? 'Mock practice' : 'Reflection'}</span></div>
                ${state.calendarEvents.filter((event) => event.day === day).map((event) => `
                  <div class="calendar-event" draggable="true" data-event="${event.id}">
                    <strong>${event.title}</strong>
                    <div class="event-meta">${event.time}</div>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Event details</p>
              <h2 class="panel-title">Arrange your study sessions</h2>
            </div>
          </div>
          <p class="panel-copy">Drop a session onto another day to preserve your study momentum. The calendar adapts to your schedule with smooth interaction.</p>
          <div class="suggested-question" data-action="add-calendar-event">Add focus session</div>
        </div>
      </div>
    </div>
  `;
}

function profileTemplate() {
  return `
    <div class="route-panel-content">
      <div class="section-row">
        <div class="panel-card">
          <p class="panel-label">Profile</p>
          <h1 class="page-title">Academic profile and support summary.</h1>
          <p class="panel-copy">Review your scholar preparedness, support status, and goal progress.</p>
          <div class="grid-2" style="margin-top:1.5rem;">
            <div class="metric-card"><strong>First-generation</strong><span>Eligible</span></div>
            <div class="metric-card"><strong>Scholarship readiness</strong><span>High</span></div>
          </div>
        </div>
        <div class="panel-card">
          <p class="panel-label">Academic journey</p>
          <div class="feature-card"><strong>Learning goals</strong><p class="panel-copy">Complete review sessions, refine your scholarship narrative, and maintain a consistent study rhythm.</p></div>
          <div class="feature-card"><strong>Support status</strong><p class="panel-copy">Your AI assistant and planner are calibrated for focused academic preparation.</p></div>
        </div>
      </div>
    </div>
  `;
}

function settingsTemplate() {
  return `
    <div class="route-panel-content">
      <div class="section-row">
        <div class="panel-card">
          <p class="panel-label">Settings</p>
          <h1 class="page-title">Tailor your environment.</h1>
          <p class="panel-copy">Adjust motion, accessibility, and study preferences for a calm, productive workflow.</p>
          <div class="panel-card" style="margin-top:1.5rem;">
            <label class="form-label" for="motion-toggle">Reduced motion</label>
            <select id="motion-toggle" class="form-input">
              <option value="default">Standard animation</option>
              <option value="reduced">Reduced motion</option>
            </select>
          </div>
          <div class="panel-card" style="margin-top:1rem;">
            <label class="form-label" for="theme-select">Interface density</label>
            <select id="theme-select" class="form-input">
              <option value="spacious">Spacious</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <p class="panel-label">Accessibility</p>
              <h2 class="panel-title">Keyboard and screen reader support.</h2>
            </div>
          </div>
          <p class="panel-copy">All navigation controls and interactive panels support keyboard focus and clear visual states.</p>
        </div>
      </div>
    </div>
  `;
}

function bindRouteEvents(route) {
  if (route === 'dashboard') bindDashboard();
  if (route === 'tutor') bindTutor();
  if (route === 'planner') bindPlanner();
  if (route === 'calendar') bindCalendar();
  if (route === 'settings') bindSettings();
  bindRouteButtons();
}

function bindRouteButtons() {
  routeContainer.querySelectorAll('[data-action="navigate"]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      if (target) loadRoute(target);
    });
  });

  routeContainer.querySelectorAll('[data-action="select-topic"]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.textContent.trim();
      const topicInput = $('assistant-topic');
      if (topicInput) topicInput.value = value;
      showToast(`Topic selected: ${value}`, 'info');
    });
  });

  const plannerShuffle = routeContainer.querySelector('[data-action="shuffle-planner"]');
  if (plannerShuffle) {
    plannerShuffle.addEventListener('click', shufflePlanner);
  }

  const addEvent = routeContainer.querySelector('[data-action="add-calendar-event"]');
  if (addEvent) {
    addEvent.addEventListener('click', addCalendarEvent);
  }
}

function bindDashboard() {
  const quizBtn = $('btn-quiz');
  const submitBtn = $('btn-submit-quiz');
  const quizCount = $('quiz-count');
  const studyBtn = $('btn-study');
  const scholarshipBtn = $('btn-scholarship');

  if (quizBtn) quizBtn.addEventListener('click', generateQuiz);
  if (submitBtn) submitBtn.addEventListener('click', submitQuiz);
  if (quizCount) quizCount.addEventListener('change', function () { this.value = clampQuestionCount(this.value); });
  if (studyBtn) studyBtn.addEventListener('click', generateStudyPlan);
  if (scholarshipBtn) scholarshipBtn.addEventListener('click', calculateScholarship);
  renderQuiz();
}

function bindTutor() {
  const askBtn = $('btn-assistant');
  if (askBtn) askBtn.addEventListener('click', askAssistant);
}

function bindPlanner() {
  const list = $('planner-list');
  if (!list) return;

  list.querySelectorAll('.task-block').forEach((block) => {
    block.addEventListener('dragstart', plannerDragStart);
    block.addEventListener('dragend', plannerDragEnd);
  });

  list.addEventListener('dragover', (event) => {
    event.preventDefault();
    const target = event.target.closest('.task-block');
    if (target) target.classList.add('drag-over');
  });

  list.addEventListener('dragleave', (event) => {
    const target = event.target.closest('.task-block');
    if (target) target.classList.remove('drag-over');
  });

  list.addEventListener('drop', (event) => {
    event.preventDefault();
    const swapTarget = event.target.closest('.task-block');
    if (!swapTarget || !state.draggedTaskId) return;
    swapTarget.classList.remove('drag-over');
    const draggedIndex = state.plannerTasks.findIndex((task) => task.id === state.draggedTaskId);
    const targetIndex = state.plannerTasks.findIndex((task) => task.id === swapTarget.dataset.task);
    if (draggedIndex >= 0 && targetIndex >= 0 && draggedIndex !== targetIndex) {
      const [moved] = state.plannerTasks.splice(draggedIndex, 1);
      state.plannerTasks.splice(targetIndex, 0, moved);
      loadRoute('planner', false);
      showToast('Planner order updated.', 'success');
    }
  });
}

function plannerDragStart(event) {
  state.draggedTaskId = event.currentTarget.dataset.task;
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.style.opacity = '0.4';
}

function plannerDragEnd(event) {
  event.currentTarget.style.opacity = '';
  state.draggedTaskId = null;
}

function bindCalendar() {
  const events = routeContainer.querySelectorAll('.calendar-event');
  const days = routeContainer.querySelectorAll('.calendar-day');

  events.forEach((event) => {
    event.addEventListener('dragstart', calendarDragStart);
    event.addEventListener('dragend', calendarDragEnd);
  });

  days.forEach((day) => {
    day.addEventListener('dragover', (event) => {
      event.preventDefault();
      day.classList.add('active');
    });
    day.addEventListener('dragleave', () => day.classList.remove('active'));
    day.addEventListener('drop', (event) => {
      event.preventDefault();
      const eventId = event.dataTransfer.getData('text/plain');
      const targetDay = day.dataset.day;
      if (!eventId || !targetDay) return;
      const calendarEvent = state.calendarEvents.find((item) => item.id === eventId);
      if (calendarEvent) {
        calendarEvent.day = targetDay;
        loadRoute('calendar', false);
        showToast('Event moved to ' + targetDay.toUpperCase() + '.', 'success');
      }
    });
  });
}

function calendarDragStart(event) {
  event.dataTransfer.setData('text/plain', event.currentTarget.dataset.event);
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.style.opacity = '0.4';
}

function calendarDragEnd(event) {
  event.currentTarget.style.opacity = '';
}

function bindSettings() {
  const motion = $('motion-toggle');
  if (motion) {
    motion.addEventListener('change', () => {
      document.documentElement.classList.toggle('reduced-motion', motion.value === 'reduced');
      showToast('Motion settings updated.', 'info');
    });
  }
}

function shufflePlanner() {
  state.plannerTasks.sort(() => Math.random() - 0.5);
  loadRoute('planner', false);
  showToast('Planner recommendations refreshed.', 'success');
}

function addCalendarEvent() {
  const nextId = `event-${Date.now()}`;
  state.calendarEvents.push({ id: nextId, title: 'Focus review', day: 'mon', time: '12:00' });
  loadRoute('calendar', false);
  showToast('New calendar event added.', 'success');
}

function setLoading(id, isLoading) {
  const element = $(id);
  if (!element) return;
  element.disabled = isLoading;
}

function buildMockExplanation(topic, difficulty) {
  const base = {
    beginner: ['Simple definitions', 'Key examples', 'Real-world connections'],
    intermediate: ['Main principles', 'Common applications', 'Study strategy'],
    advanced: ['Core theory', 'Problem-solving edge', 'Exam-ready framing']
  };
  const nextTopics = ['Vectors in motion', 'Energy transfer', 'Systems of equations', 'Algorithm design', 'Cell structure'];
  return {
    topic: topic || 'STEM concept',
    explanation: `This explanation helps you understand ${topic} with a focus on clarity and the vocabulary used in STEM classrooms.`,
    example: `For example, if we look at ${topic}, it becomes easier when you break it into smaller steps and connect it to a familiar problem.`,
    key_points: base[difficulty] || base.beginner,
    next_topics: [nextTopics[Math.floor(Math.random() * nextTopics.length)], nextTopics[Math.floor(Math.random() * nextTopics.length)]],
    source: 'AccessSTEM AI Demo'
  };
}

function buildMockAssistant(topic, question) {
  return {
    answer: `AccessSTEM AI supports your question on ${topic} with a friendly explanation that helps you think through the idea.`,
    key_points: ['Focus on the main idea', 'Link each step to the question', 'Try a small example'],
    next_steps: ['Highlight the key formula', 'Do a quick practice problem', 'Summarize the concept in your own words'],
    source: 'AccessSTEM AI Demo'
  };
}

function createMockQuiz(topic, difficulty, count) {
  const templates = [
    {
      question: `What is a key characteristic of ${topic}?`,
      options: ['It relies on careful definitions.', 'It is always unrelated to problems.', 'It only applies in literature.', 'It never uses formulas.'],
      answer: 'It relies on careful definitions.',
      hint: 'Think about what separates this idea from unrelated statements.'
    },
    {
      question: `Which statement best describes ${topic}?`,
      options: ['It is a foundational STEM principle.', 'It only works in art classes.', 'It depends on random guessing.', 'It requires no reasoning.'],
      answer: 'It is a foundational STEM principle.',
      hint: 'Choose the option that fits scientific or mathematical thinking.'
    },
    {
      question: `How would you apply ${topic} in a real example?`,
      options: ['By identifying the key variables first.', 'By ignoring the instructions.', 'By changing the question entirely.', 'By guessing the final result.'],
      answer: 'By identifying the key variables first.',
      hint: 'Good STEM practice starts by defining what matters.'
    },
    {
      question: `What is one simple example of ${topic}?`,
      options: ['A problem that connects the idea to a real scenario.', 'A question unrelated to the concept.', 'A random fact.', 'A memorized list of terms.'],
      answer: 'A problem that connects the idea to a real scenario.',
      hint: 'Look for the option that turns the concept into an application.'
    }
  ];

  const questions = [];
  for (let i = 0; i < count; i += 1) {
    const item = templates[i % templates.length];
    questions.push({
      question: item.question,
      options: item.options,
      correct_answer: item.answer,
      hint: item.hint
    });
  }

  return { topic, difficulty, questions, source: 'AccessSTEM AI Demo' };
}

function renderQuiz() {
  if (!state.quiz || !state.quiz.questions) {
    setHTML('quiz-result', '<div class="empty-state glass-card p-8 text-center text-[#c9ced7]"><p class="font-semibold text-white mb-2">No quiz loaded yet.</p><p>Create one to begin.</p></div>');
    return;
  }

  const questions = state.quiz.questions;
  const html = ['<div class="space-y-6 fade-in-up">'];
  html.push(`<div class="flex items-center justify-between"><div><p class="text-sm uppercase tracking-[0.24em] text-[#8db5ce] mb-1">Quiz topic</p><h3 class="text-xl font-semibold text-white">${escapeHtml(state.quiz.topic)}</h3></div><span class="text-sm text-[#c9ced7]">${questions.length} questions</span></div>`);

  questions.forEach((q, index) => {
    const optionsHtml = q.options.map((opt) => {
      const checked = state.quizAnswers[index] === opt ? 'checked' : '';
      const disabled = state.quizSubmitted ? 'disabled' : '';
      let labelClass = 'quiz-option';
      if (state.quizSubmitted) {
        if (opt === q.correct_answer) labelClass += ' correct';
        else if (state.quizAnswers[index] === opt) labelClass += ' incorrect';
      }
      return `<label class="${labelClass}"><input type="radio" name="quiz-q-${index}" value="${escapeHtml(opt)}" ${checked} ${disabled}><span class="text-[#d7d7d7]">${escapeHtml(opt)}</span></label>`;
    }).join('');

    html.push(`<div class="glass-card p-6" id="quiz-card-${index}"><p class="font-semibold text-white mb-4">Q${index + 1}. ${escapeHtml(q.question)}</p><div class="space-y-3">${optionsHtml}</div>${!state.quizSubmitted ? `<button type="button" class="btn-outline text-sm py-2 px-4 mt-4" onclick="TUTall.requestHint(${index})">Get Hint</button>` : ''}${state.quizHints[index] ? `<div class="hint-box mt-4"><p class="text-sm font-semibold text-[#8db5ce] mb-1">Hint</p><p class="text-[#c9ced7]">${escapeHtml(state.quizHints[index].hint || '')}</p></div>` : ''}</div>`);
  });

  html.push('</div>');
  setHTML('quiz-result', html.join(''));

  if (!state.quizSubmitted) {
    state.quiz.questions.forEach((_, index) => {
      document.querySelectorAll(`input[name="quiz-q-${index}"]`).forEach((radio) => {
        radio.addEventListener('change', () => {
          state.quizAnswers[index] = radio.value;
        });
      });
    });
  }
}

function generateQuiz() {
  const topic = $('quiz-topic') ? $('quiz-topic').value.trim() : 'STEM';
  const difficulty = $('quiz-difficulty') ? $('quiz-difficulty').value : 'middle school';
  const count = $('quiz-count') ? clampQuestionCount($('quiz-count').value) : 5;
  if ($('quiz-count')) $('quiz-count').value = count;

  if (!topic) {
    showToast('Please enter a quiz topic.', 'error');
    return;
  }

  state.quizAnswers = {};
  state.quizHints = {};
  state.quizSubmitted = false;
  state.quiz = createMockQuiz(topic, difficulty, count);

  setHTML('quiz-result', '<div class="space-y-4"><div class="skeleton h-24 w-full"></div><div class="skeleton h-24 w-full"></div></div>');
  setHTML('quiz-score', '');

  setTimeout(() => {
    renderQuiz();
    showToast(`Quiz generated with ${count} questions.`, 'success');
  }, 650);
}

function requestHint(index) {
  if (!state.quiz || !state.quiz.questions[index]) return;
  const question = state.quiz.questions[index];
  state.quizHints[index] = { hint: question.hint || 'Review the concept and choose the best answer.' };
  renderQuiz();
  showToast('Hint added.', 'info');
}

function submitQuiz() {
  if (!state.quiz || !state.quiz.questions) {
    showToast('Generate a quiz first.', 'error');
    return;
  }

  const questions = state.quiz.questions;
  if (Object.keys(state.quizAnswers).length < questions.length) {
    showToast('Please answer all questions before submitting.', 'error');
    return;
  }

  state.quizSubmitted = true;
  const score = questions.reduce((acc, q, index) => acc + (state.quizAnswers[index] === q.correct_answer ? 1 : 0), 0);
  renderQuiz();
  const pct = Math.round((score / questions.length) * 100);
  setHTML('quiz-score', `<div class="panel-card text-center fade-in-up"><p class="text-3xl font-bold text-white">${score} / ${questions.length}</p><p class="text-[#c9ced7] mt-2">${pct}% correct</p>${score === questions.length ? '<p class="text-[#8db5ce] font-semibold mt-3">Perfect score! 🎉</p>' : ''}</div>`);
  showToast('Quiz submitted!', 'success');
}

function generateStudyPlan() {
  const goal = $('study-goal') ? $('study-goal').value.trim() : '';
  const gradeLevel = $('study-grade') ? $('study-grade').value.trim() : '';
  const days = $('study-days') ? Number($('study-days').value) || 7 : 7;
  const weakRaw = $('study-weak') ? $('study-weak').value.trim() : '';
  const weakTopics = weakRaw.split(',').map((t) => t.trim()).filter(Boolean);
  const duration = Math.min(Math.max(days, 1), 7);

  if (!goal) {
    showToast('Please enter a study goal.', 'error');
    return;
  }

  setLoading('btn-study', true);
  setHTML('study-result', '<div class="space-y-3"><div class="skeleton h-24 w-full"></div><div class="skeleton h-24 w-full"></div></div>');

  setTimeout(() => {
    const plan = Array.from({ length: duration }, (_, index) => {
      const topic = weakTopics.length ? weakTopics[index % weakTopics.length] : '';
      return {
        day: index + 1,
        focus: topic ? `Work on ${topic}` : 'Review key concepts',
        tasks: ['Read the concept summary', 'Practice one targeted example', 'Write a short explanation in your own words']
      };
    });

    setHTML('study-result', `<div class="space-y-4 fade-in-up"><div class="panel-card"><h3 class="text-xl font-semibold text-white mb-3">Personalized study plan</h3><p class="text-[#c9ced7]">Goal: ${escapeHtml(goal)}</p><p class="text-[#c9ced7] mt-1">Grade level: ${escapeHtml(gradeLevel || 'N/A')} · Days: ${duration}</p></div><div class="grid gap-4 md:grid-cols-2">${plan.map((item) => `<div class="panel-card"><div class="flex items-center justify-between mb-3"><h4 class="font-semibold text-white">Day ${item.day}</h4><span class="text-sm text-[#8db5ce]">Focus</span></div><p class="text-[#d7d7d7] mb-3">${escapeHtml(item.focus)}</p><ul class="list-disc list-inside text-[#c9ced7] space-y-1">${item.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join('')}</ul></div>`).join('')}</div></div>`);
    setLoading('btn-study', false);
    showToast('Study plan created.', 'success');
  }, 850);
}

function calculateScholarship() {
  const profile = {
    grade_level: $('sch-grade') ? $('sch-grade').value.trim() : '',
    gpa: Number($('sch-gpa') ? $('sch-gpa').value : 0),
    intended_major: $('sch-major') ? $('sch-major').value.trim() : '',
    financial_need: $('sch-need') ? $('sch-need').value : 'medium'
  };

  setLoading('btn-scholarship', true);
  setHTML('scholarship-result', '<div class="space-y-3"><div class="skeleton h-24 w-full"></div><div class="skeleton h-32 w-full"></div></div>');

  setTimeout(() => {
    let baseScore = 40 + Math.min(40, Math.round(profile.gpa * 10));
    if (profile.financial_need === 'high') baseScore += 12;
    const readiness = Math.min(100, Math.max(35, baseScore));
    const matches = [
      {
        name: 'FGLI Opportunity Grant',
        fit_score: readiness,
        estimated_amount: '$3,500',
        deadline: 'Nov 15',
        strengths: ['First-generation applicant', 'High financial need', 'Strong extracurricular profile'],
        required_documents: ['Transcript', 'Personal statement', 'Financial aid form']
      },
      {
        name: 'Equity Access Support Fund',
        fit_score: Math.max(75, readiness - 5),
        estimated_amount: '$2,000',
        deadline: 'Dec 1',
        strengths: ['Academic potential', 'Community service background'],
        required_documents: ['Recommendation note', 'Major statement']
      }
    ];

    setHTML('scholarship-result', `<div class="space-y-6 fade-in-up"><div class="panel-card"><h3 class="text-xl font-semibold text-white mb-3">Profile summary</h3><div class="grid gap-4 md:grid-cols-2 text-sm text-[#c9ced7]"><div><strong>Grade:</strong> ${escapeHtml(profile.grade_level || 'N/A')}</div><div><strong>GPA:</strong> ${escapeHtml(String(profile.gpa || 'N/A'))}</div><div><strong>Major:</strong> ${escapeHtml(profile.intended_major || 'N/A')}</div><div><strong>Financial aid:</strong> ${escapeHtml(profile.financial_need === 'high' ? 'Requested' : 'Not requested')}</div></div></div><div class="panel-card flex flex-col md:flex-row items-center gap-6"><div class="progress-circle" style="--progress:${readiness}"><span>${readiness}%</span></div><div class="flex-1"><h3 class="text-xl font-semibold text-white mb-3">Scholarship readiness</h3><div class="progress-bar"><div class="progress-bar-fill" style="width:${readiness}%"></div></div><p class="text-[#c9ced7] mt-4">Your profile is being matched against targeted equity grants and first-generation support opportunities.</p></div></div><div><h3 class="text-xl font-semibold text-white mb-4">Recommended awards</h3><div class="grid gap-4 md:grid-cols-2">${matches.map((match) => `<div class="match-card"><div class="flex items-start justify-between mb-3"><h4 class="match-title">${escapeHtml(match.name)}</h4><span class="text-sm text-[#8db5ce]">${escapeHtml(match.fit_score + '% fit')}</span></div><p class="text-[#c9ced7] mb-2"><strong>Est. Amount:</strong> ${escapeHtml(match.estimated_amount)}</p><p class="text-[#c9ced7] mb-3"><strong>Deadline:</strong> ${escapeHtml(match.deadline)}</p><div class="mb-2"><p class="text-xs uppercase text-[#8db5ce] mb-1">Strengths</p><ul class="list-disc list-inside text-[#c9ced7] text-sm">${match.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div><p class="text-xs uppercase text-[#8db5ce] mb-1">Documents</p><ul class="list-disc list-inside text-[#c9ced7] text-sm">${match.required_documents.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div></div>`).join('')}</div></div><div class="panel-card"><h3 class="text-lg font-semibold text-white mb-3">Next steps</h3><ol class="list-decimal list-inside space-y-2 text-[#c9ced7]">${['Review your application timeline', 'Prepare the essay with your first-gen story', 'Submit financial support documents early'].map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></div></div>`);
    setLoading('btn-scholarship', false);
    showToast('Scholarship readiness calculated.', 'success');
  }, 900);
}

function initNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => loadRoute(button.dataset.route));
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

function handleHash() {
  const hash = window.location.hash.replace('#', '') || 'home';
  loadRoute(hash, false);
}

window.addEventListener('popstate', handleHash);
window.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  handleHash();
});

window.TUTall = {
  requestHint: (index) => requestHint(index)
};
