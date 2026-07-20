const GITHUB_OWNER = "meeraibrahim09-cyber";
const GITHUB_REPO = "ai-challenge";

const tableEl = document.getElementById("submissions-table");
const bodyEl = document.getElementById("submissions-body");
const messageEl = document.getElementById("dashboard-message");
const refreshBtn = document.getElementById("refresh-btn");

let submissions = [];

function parsePayload(issueBody) {
  const match = issueBody && issueBody.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    return null;
  }
}

function optionLabel(t, value) {
  if (value === "solution") return t.option_solution;
  if (value === "demo") return t.option_demo;
  return value;
}

function areaLabel(t, value) {
  const key = "area_" + value;
  return t[key] || value;
}

async function loadSubmissions() {
  messageEl.hidden = false;
  messageEl.setAttribute("data-i18n", "dashboard_loading");
  messageEl.textContent = currentDict().dashboard_loading;
  tableEl.hidden = true;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?labels=submission&state=all&per_page=100`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!response.ok) throw new Error("bad response");
    const issues = await response.json();

    submissions = issues
      .map((issue) => ({ payload: parsePayload(issue.body), created_at: issue.created_at }))
      .filter((row) => row.payload)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    render();
  } catch (err) {
    messageEl.removeAttribute("data-i18n");
    messageEl.textContent = currentDict().dashboard_error;
    messageEl.hidden = false;
    tableEl.hidden = true;
  }
}

function currentDict() {
  return translations[getLang()];
}

function render() {
  const t = currentDict();

  if (submissions.length === 0) {
    messageEl.setAttribute("data-i18n", "dashboard_empty");
    messageEl.textContent = t.dashboard_empty;
    messageEl.hidden = false;
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
  submissions.forEach(({ payload, created_at }) => {
    const tr = document.createElement("tr");

    const members = Array.isArray(payload.members) ? payload.members : [];

    const cells = [
      { label: t.col_team_name, value: payload.team_name },
      { label: t.col_total_members, value: payload.total_members },
      { label: t.col_members, members: members },
      { label: t.col_option, value: optionLabel(t, payload.option) },
      { label: t.col_area, value: areaLabel(t, payload.area), tag: true },
      { label: t.col_submitted, value: dateFormatter.format(new Date(created_at)) },
    ];

    cells.forEach(({ label, value, tag, members: memberValues }) => {
      const td = document.createElement("td");
      td.setAttribute("data-label", label);
      if (memberValues) {
        if (memberValues.length) {
          const ul = document.createElement("ul");
          ul.className = "member-names";
          memberValues.forEach((name) => {
            const li = document.createElement("li");
            li.textContent = name;
            ul.appendChild(li);
          });
          td.appendChild(ul);
        } else {
          td.textContent = "—";
        }
      } else if (tag) {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = value;
        td.appendChild(span);
      } else {
        td.textContent = value;
      }
      tr.appendChild(td);
    });

    bodyEl.appendChild(tr);
  });
}

refreshBtn.addEventListener("click", loadSubmissions);
document.addEventListener("langchange", () => {
  if (submissions.length) render();
});
document.addEventListener("DOMContentLoaded", loadSubmissions);
