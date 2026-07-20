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
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&order=created_at.desc`,
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
  const solution = submissions.filter((r) => r.option === "solution").length;
  const demo = submissions.filter((r) => r.option === "demo").length;
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
    const optBadge = document.createElement("span");
    optBadge.className = "badge badge-" + (row.option || "");
    optBadge.textContent = optionShort(t, row.option);
    tdOption.appendChild(optBadge);
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
    await loadSubmissions();
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

refreshBtn.addEventListener("click", loadSubmissions);

document.addEventListener("langchange", () => {
  if (!loginBtn.disabled) loginBtn.textContent = currentDict().login_submit;
  if (!dashboardView.hidden && submissions.length) render();
});

document.addEventListener("DOMContentLoaded", () => {
  if (getSession()) {
    showDashboard();
    loadSubmissions();
  } else {
    showLogin();
  }
});
