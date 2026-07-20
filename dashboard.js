const tableEl = document.getElementById("submissions-table");
const bodyEl = document.getElementById("submissions-body");
const messageEl = document.getElementById("dashboard-message");
const refreshBtn = document.getElementById("refresh-btn");

let submissions = [];

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
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!response.ok) throw new Error("bad response");
    submissions = await response.json();

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
  submissions.forEach((row) => {
    const tr = document.createElement("tr");

    const members = Array.isArray(row.members) ? row.members : [];

    const cells = [
      { label: t.col_team_name, value: row.team_name },
      { label: t.col_total_members, value: row.total_members },
      { label: t.col_members, members: members },
      { label: t.col_option, value: optionLabel(t, row.option) },
      { label: t.col_area, value: areaLabel(t, row.area), tag: true },
      { label: t.col_submitted, value: dateFormatter.format(new Date(row.created_at)) },
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
