const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const SESSION_KEY = "tec_session";

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const loginStatus = document.getElementById("login-status");
const logoutBtn = document.getElementById("logout-btn");

const tableEl = document.getElementById("submissions-table");
const bodyEl = document.getElementById("submissions-body");
const messageEl = document.getElementById("dashboard-message");
const refreshBtn = document.getElementById("refresh-btn");

const statTeamsEl = document.getElementById("stat-teams");
const statMembersEl = document.getElementById("stat-members");
const statSolutionEl = document.getElementById("stat-solution");
const statDemoEl = document.getElementById("stat-demo");

let submissions = [];
let surveyRows = [];

const SURVEY_TABLE = "survey_responses";
const surveyCountEl = document.getElementById("survey-count");
const surveyAvgEl = document.getElementById("survey-avg");
const surveyResultsEl = document.getElementById("survey-results");
const surveyMessageEl = document.getElementById("survey-message");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const panels = Array.from(document.querySelectorAll("#teams-panel, #survey-panel"));

// Multi-select survey questions: field name + canonical option values mapped to i18n keys.
const SURVEY_QUESTIONS = [
  {
    field: "enjoyed",
    titleKey: "survey_q2",
    options: [
      ["AI Quiz", "survey_q2_ai_quiz"],
      ["Prototype Presentations", "survey_q2_prototype"],
      ["Interactive Session Format", "survey_q2_interactive"],
    ],
  },
  {
    field: "ideas",
    titleKey: "survey_q3",
    options: [
      ["Definitely", "survey_q3_definitely"],
      ["Yes, somewhat", "survey_q3_somewhat"],
      ["A little", "survey_q3_a_little"],
      ["Not yet", "survey_q3_not_yet"],
    ],
  },
  {
    field: "expand",
    titleKey: "survey_q4",
    options: [
      ["Definitely", "survey_q4_definitely"],
      ["Yes, for selected topics or entities", "survey_q4_selected"],
      ["Maybe, with improvements", "survey_q4_maybe"],
      ["Not at this stage", "survey_q4_not_now"],
    ],
  },
];

// Common words to skip in the word cloud (English + Arabic).
const SURVEY_STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "you", "your", "our", "was", "are",
  "have", "has", "had", "not", "but", "all", "any", "can", "could", "would", "should",
  "more", "most", "some", "such", "than", "then", "them", "they", "there", "were",
  "about", "into", "from", "will", "just", "very", "really", "much", "also", "one",
  "في", "من", "على", "إلى", "عن", "مع", "أن", "أو", "كان", "هذا", "هذه", "التي",
  "الذي", "ما", "لا", "أكثر", "كل", "قد", "و", "يجب",
]);

function currentDict() {
  return translations[getLang()];
}

function saveSession(data) {
  const nowSec = Math.floor(Date.now() / 1000);
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || nowSec + (data.expires_in || 3600),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (err) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function login(email, password) {
  const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("login failed");
  return saveSession(await res.json());
}

async function refreshSession(session) {
  const res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) throw new Error("refresh failed");
  return saveSession(await res.json());
}

async function validAccessToken() {
  let session = getSession();
  if (!session || !session.access_token) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at - nowSec < 60) {
    try {
      session = await refreshSession(session);
    } catch (err) {
      clearSession();
      return null;
    }
  }
  return session.access_token;
}

function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
  logoutBtn.hidden = true;
}

function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  logoutBtn.hidden = false;
}

function optionShort(t, value) {
  if (value === "solution") return t.option_short_solution;
  if (value === "demo") return t.option_short_demo;
  return value;
}

function setMessage(key) {
  messageEl.setAttribute("data-i18n", key);
  messageEl.textContent = currentDict()[key];
  messageEl.hidden = false;
}

async function loadSubmissions() {
  const token = await validAccessToken();
  if (!token) {
    showLogin();
    return;
  }

  refreshBtn.disabled = true;
  refreshBtn.classList.add("is-loading");
  tableEl.hidden = true;
  setMessage("dashboard_loading");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&hidden=eq.false&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status === 401) {
      clearSession();
      showLogin();
      return;
    }
    if (!response.ok) throw new Error("bad response");
    submissions = await response.json();
    render();
  } catch (err) {
    messageEl.removeAttribute("data-i18n");
    messageEl.textContent = currentDict().dashboard_error;
    messageEl.hidden = false;
    tableEl.hidden = true;
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.classList.remove("is-loading");
  }
}

function renderStats() {
  const teams = submissions.length;
  const members = submissions.reduce((sum, r) => sum + (Number(r.total_members) || 0), 0);
  const hasOption = (r, key) =>
    (r.option || "").split(",").map((s) => s.trim()).includes(key);
  const solution = submissions.filter((r) => hasOption(r, "solution")).length;
  const demo = submissions.filter((r) => hasOption(r, "demo")).length;
  statTeamsEl.textContent = teams;
  statMembersEl.textContent = members;
  statSolutionEl.textContent = solution;
  statDemoEl.textContent = demo;
}

function render() {
  const t = currentDict();
  renderStats();

  if (submissions.length === 0) {
    setMessage("dashboard_empty");
    tableEl.hidden = true;
    return;
  }

  messageEl.hidden = true;
  tableEl.hidden = false;

  const dateFormatter = new Intl.DateTimeFormat(getLang() === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  bodyEl.innerHTML = "";
  submissions.forEach((row) => {
    const tr = document.createElement("tr");

    const members = Array.isArray(row.members) ? row.members : [];
    const areas = (row.area || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const tdName = document.createElement("td");
    tdName.setAttribute("data-label", t.col_team_name);
    tdName.textContent = row.team_name || "";
    tr.appendChild(tdName);

    const tdCount = document.createElement("td");
    tdCount.setAttribute("data-label", t.col_total_members);
    tdCount.textContent = row.total_members != null ? row.total_members : "";
    tr.appendChild(tdCount);

    const tdMembers = document.createElement("td");
    tdMembers.setAttribute("data-label", t.col_member_names);
    if (members.length) {
      const ul = document.createElement("ul");
      ul.className = "member-names";
      members.forEach((name) => {
        const li = document.createElement("li");
        li.textContent = name;
        ul.appendChild(li);
      });
      tdMembers.appendChild(ul);
    } else {
      tdMembers.textContent = "-";
    }
    tr.appendChild(tdMembers);

    const tdOption = document.createElement("td");
    tdOption.setAttribute("data-label", t.col_option);
    const optionKeys = (row.option || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (optionKeys.length) {
      const optList = document.createElement("div");
      optList.className = "tag-list";
      optionKeys.forEach((key) => {
        const b = document.createElement("span");
        b.className = "badge badge-" + key;
        b.textContent = optionShort(t, key);
        optList.appendChild(b);
      });
      tdOption.appendChild(optList);
    } else {
      tdOption.textContent = "-";
    }
    tr.appendChild(tdOption);

    const tdAreas = document.createElement("td");
    tdAreas.setAttribute("data-label", t.col_area);
    if (areas.length) {
      const list = document.createElement("div");
      list.className = "tag-list";
      areas.forEach((area) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = area;
        list.appendChild(tag);
      });
      tdAreas.appendChild(list);
    } else {
      tdAreas.textContent = "-";
    }
    tr.appendChild(tdAreas);

    const tdDate = document.createElement("td");
    tdDate.setAttribute("data-label", t.col_submitted);
    tdDate.textContent = row.created_at ? dateFormatter.format(new Date(row.created_at)) : "";
    tr.appendChild(tdDate);

    bodyEl.appendChild(tr);
  });
}

async function loadSurvey() {
  const token = await validAccessToken();
  if (!token) {
    showLogin();
    return;
  }

  surveyMessageEl.setAttribute("data-i18n", "dashboard_loading");
  surveyMessageEl.textContent = currentDict().dashboard_loading;
  surveyMessageEl.hidden = false;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${SURVEY_TABLE}?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status === 401) {
      clearSession();
      showLogin();
      return;
    }
    if (!response.ok) throw new Error("bad response");
    surveyRows = await response.json();
    renderSurvey();
  } catch (err) {
    surveyResultsEl.innerHTML = "";
    surveyMessageEl.removeAttribute("data-i18n");
    surveyMessageEl.textContent = currentDict().dashboard_error;
    surveyMessageEl.hidden = false;
  }
}

function countBlock(title, rows) {
  const t = currentDict();
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  const block = document.createElement("div");
  block.className = "result-block";

  const h = document.createElement("h3");
  h.className = "result-title";
  h.textContent = title;
  block.appendChild(h);

  rows.forEach((r) => {
    const row = document.createElement("div");
    row.className = "result-row";

    const label = document.createElement("span");
    label.className = "result-label";
    label.textContent = r.label;
    row.appendChild(label);

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = (r.count / max) * 100 + "%";
    bar.appendChild(fill);
    row.appendChild(bar);

    const count = document.createElement("span");
    count.className = "bar-count";
    const pct = total ? Math.round((r.count / total) * 100) : 0;
    count.textContent = `${r.count} · ${pct}%`;
    row.appendChild(count);

    block.appendChild(row);
  });

  return block;
}

function buildWordCloud() {
  const t = currentDict();
  const block = document.createElement("div");
  block.className = "result-block";

  const h = document.createElement("h3");
  h.className = "result-title";
  h.textContent = t.survey_q5;
  block.appendChild(h);

  const text = surveyRows.map((r) => r.improve || "").join(" ").toLowerCase();
  const words = text.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !SURVEY_STOPWORDS.has(w));
  const freq = {};
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });
  const entries = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "wordcloud-empty";
    empty.textContent = t.survey_wordcloud_empty;
    block.appendChild(empty);
    return block;
  }

  const maxF = entries[0][1];
  const minF = entries[entries.length - 1][1];
  const cloud = document.createElement("div");
  cloud.className = "wordcloud";
  entries.forEach(([word, f], i) => {
    const span = document.createElement("span");
    span.className = "cloud-word cloud-tone-" + (i % 4);
    const scale = maxF === minF ? 1 : (f - minF) / (maxF - minF);
    span.style.fontSize = (0.85 + scale * 1.4).toFixed(2) + "rem";
    span.textContent = word;
    span.title = `${word} · ${f}`;
    cloud.appendChild(span);
  });
  block.appendChild(cloud);
  return block;
}

function renderSurvey() {
  const t = currentDict();
  const count = surveyRows.length;
  surveyCountEl.textContent = count;

  const ratings = surveyRows.map((r) => Number(r.rating)).filter((n) => !Number.isNaN(n));
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  surveyAvgEl.textContent = avg === null ? "–" : avg.toFixed(1);

  surveyResultsEl.innerHTML = "";

  if (count === 0) {
    surveyMessageEl.setAttribute("data-i18n", "survey_empty");
    surveyMessageEl.textContent = t.survey_empty;
    surveyMessageEl.hidden = false;
    return;
  }
  surveyMessageEl.hidden = true;

  // Q1 — rating distribution (1..5).
  const ratingRows = [1, 2, 3, 4, 5].map((v) => ({
    label: String(v),
    count: ratings.filter((n) => n === v).length,
  }));
  surveyResultsEl.appendChild(countBlock(t.survey_q1, ratingRows));

  // Q2..Q4 — multi-select tallies.
  SURVEY_QUESTIONS.forEach((q) => {
    const rows = q.options.map(([value, key]) => ({
      label: t[key],
      count: surveyRows.filter((r) => Array.isArray(r[q.field]) && r[q.field].includes(value)).length,
    }));
    surveyResultsEl.appendChild(countBlock(t[q.titleKey], rows));
  });

  // Q5 — word cloud.
  surveyResultsEl.appendChild(buildWordCloud());
}

function refreshAll() {
  loadSubmissions();
  loadSurvey();
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const panelId = btn.dataset.panel;
    tabButtons.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((p) => {
      p.hidden = p.id !== panelId;
    });
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const t = currentDict();
  loginStatus.textContent = "";
  loginStatus.removeAttribute("data-state");

  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;
  if (!email || !password) return;

  loginBtn.disabled = true;
  loginBtn.textContent = t.login_signing;

  try {
    await login(email, password);
    loginForm.reset();
    showDashboard();
    refreshAll();
  } catch (err) {
    loginStatus.textContent = t.login_error;
    loginStatus.setAttribute("data-state", "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = t.login_submit;
  }
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  showLogin();
});

refreshBtn.addEventListener("click", refreshAll);

document.addEventListener("langchange", () => {
  if (!loginBtn.disabled) loginBtn.textContent = currentDict().login_submit;
  if (!dashboardView.hidden && submissions.length) render();
  if (!dashboardView.hidden && surveyRows.length) renderSurvey();
});

document.addEventListener("DOMContentLoaded", () => {
  if (getSession()) {
    showDashboard();
    refreshAll();
  } else {
    showLogin();
  }
});
