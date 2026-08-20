const form = document.getElementById("signup-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");
const membersList = document.getElementById("members-list");
const addMemberBtn = document.getElementById("add-member-btn");

// Maximum number of characters allowed in any text input field.
const MAX_LEN = 150;

const AREA_KEYS = [
  "government_services",
  "excellence_assessment",
  "happiness_surveys",
  "policies",
  "legislations",
  "dubai_plan_agendas",
  "sg_office",
  "decision_follow_up",
  "decision_making",
  "data_analysis",
  "hr",
  "it",
  "admin",
  "finance",
  "project_management",
  "audit",
  "governance",
];

function currentLangDict() {
  return translations[getLang()];
}

function addMemberRow(value = "") {
  const t = currentLangDict();
  const row = document.createElement("div");
  row.className = "member-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "member-input";
  input.value = value;
  input.maxLength = MAX_LEN;
  input.setAttribute("placeholder", t.member_placeholder);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "member-remove";
  remove.setAttribute("aria-label", t.remove_member);
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    if (membersList.querySelectorAll(".member-row").length > 1) {
      row.remove();
    } else {
      input.value = "";
    }
  });

  row.appendChild(input);
  row.appendChild(remove);
  membersList.appendChild(row);
}

function getMemberNames() {
  return Array.from(membersList.querySelectorAll(".member-input"))
    .map((el) => el.value.trim())
    .filter((v) => v.length > 0);
}

function getSelectedOptions() {
  return Array.from(form.querySelectorAll(".option-checkbox:checked")).map((c) => c.value);
}

if (membersList) {
  addMemberRow();
  addMemberBtn.addEventListener("click", () => addMemberRow());
}

const areaSelect = document.getElementById("area-select");
const areaTrigger = document.getElementById("area-trigger");
const areaPanel = document.getElementById("area-panel");
const areaValue = document.getElementById("area-value");

function buildAreaOptions() {
  const t = currentLangDict();
  areaPanel.innerHTML = "";
  AREA_KEYS.forEach((key) => {
    const row = document.createElement("label");
    row.className = "multiselect-option";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "area-checkbox";
    cb.value = key;
    cb.addEventListener("change", updateAreaValue);

    const span = document.createElement("span");
    span.setAttribute("data-i18n", "area_" + key);
    span.textContent = t["area_" + key];

    row.appendChild(cb);
    row.appendChild(span);
    areaPanel.appendChild(row);
  });
}

function getSelectedAreaKeys() {
  return Array.from(areaPanel.querySelectorAll(".area-checkbox:checked")).map((c) => c.value);
}

function updateAreaValue() {
  const t = currentLangDict();
  const keys = getSelectedAreaKeys();
  if (keys.length === 0) {
    areaValue.setAttribute("data-i18n", "area_placeholder");
    areaValue.textContent = t.area_placeholder;
    areaValue.classList.add("multiselect-placeholder");
    areaValue.removeAttribute("title");
  } else {
    const sep = getLang() === "ar" ? "، " : ", ";
    const labels = keys.map((k) => t["area_" + k]).join(sep);
    areaValue.removeAttribute("data-i18n");
    areaValue.textContent = labels;
    areaValue.classList.remove("multiselect-placeholder");
    areaValue.setAttribute("title", labels);
  }
}

function openAreaPanel() {
  areaPanel.removeAttribute("hidden");
  areaTrigger.setAttribute("aria-expanded", "true");
}

function closeAreaPanel() {
  areaPanel.setAttribute("hidden", "");
  areaTrigger.setAttribute("aria-expanded", "false");
}

if (areaSelect) {
  buildAreaOptions();
  updateAreaValue();

  areaTrigger.addEventListener("click", () => {
    if (areaPanel.hasAttribute("hidden")) openAreaPanel();
    else closeAreaPanel();
  });

  document.addEventListener("click", (event) => {
    if (!areaSelect.contains(event.target)) closeAreaPanel();
  });
}

function setError(fieldName, message) {
  const el = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (el) el.textContent = message;
}

function validate() {
  const t = currentLangDict();
  let valid = true;

  const teamName = form.elements.team_name.value.trim();
  const totalMembers = form.elements.total_members.value;
  const memberNames = getMemberNames();
  const optionKeys = getSelectedOptions();
  const areaKeys = getSelectedAreaKeys();

  setError("team_name", "");
  if (!teamName) {
    setError("team_name", t.error_required_team_name);
    valid = false;
  } else if (teamName.length > MAX_LEN) {
    setError("team_name", t.error_max_length);
    valid = false;
  }

  setError("total_members", totalMembers && Number(totalMembers) > 0 ? "" : t.error_required_total_members);
  if (!totalMembers || Number(totalMembers) <= 0) valid = false;

  setError("members", "");
  if (memberNames.length === 0) {
    setError("members", t.error_required_members);
    valid = false;
  } else if (memberNames.some((name) => name.length > MAX_LEN)) {
    setError("members", t.error_max_length);
    valid = false;
  }

  setError("option", optionKeys.length > 0 ? "" : t.error_required_option);
  if (optionKeys.length === 0) valid = false;

  setError("area", areaKeys.length > 0 ? "" : t.error_required_area);
  if (areaKeys.length === 0) valid = false;

  return valid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const t = currentLangDict();
  statusEl.textContent = "";
  statusEl.removeAttribute("data-state");

  if (!validate()) return;

  const areaLabels = getSelectedAreaKeys()
    .map((k) => translations.en["area_" + k])
    .join(", ");

  const payload = {
    team_name: form.elements.team_name.value.trim(),
    total_members: Number(form.elements.total_members.value),
    members: getMemberNames(),
    option: getSelectedOptions().join(", "),
    area: areaLabels,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = t.submitting;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      form.reset();
      updateAreaValue();
      closeAreaPanel();
      statusEl.textContent = t.success;
      statusEl.setAttribute("data-state", "success");
    } else {
      statusEl.textContent = t.error_generic;
      statusEl.setAttribute("data-state", "error");
    }
  } catch (err) {
    statusEl.textContent = t.error_network;
    statusEl.setAttribute("data-state", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t.submit;
  }
});

document.addEventListener("langchange", () => {
  const t = currentLangDict();
  if (!submitBtn.disabled) submitBtn.textContent = t.submit;
  membersList.querySelectorAll(".member-input").forEach((el) => {
    el.setAttribute("placeholder", t.member_placeholder);
  });
  membersList.querySelectorAll(".member-remove").forEach((el) => {
    el.setAttribute("aria-label", t.remove_member);
  });
  updateAreaValue();
});
