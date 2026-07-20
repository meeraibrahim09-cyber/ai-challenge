const form = document.getElementById("signup-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");
const membersList = document.getElementById("members-list");
const addMemberBtn = document.getElementById("add-member-btn");

function addMemberRow(value = "") {
  const t = currentLangDict();
  const row = document.createElement("div");
  row.className = "member-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "member-input";
  input.value = value;
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

if (membersList) {
  addMemberRow();
  addMemberBtn.addEventListener("click", () => addMemberRow());
}

function setError(fieldName, message) {
  const el = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (el) el.textContent = message;
}

function currentLangDict() {
  return translations[getLang()];
}

function validate() {
  const t = currentLangDict();
  let valid = true;

  const teamName = form.elements.team_name.value.trim();
  const totalMembers = form.elements.total_members.value;
  const memberNames = getMemberNames();
  const option = form.querySelector('input[name="option"]:checked');
  const area = form.elements.area.value;

  setError("team_name", teamName ? "" : t.error_required_team_name);
  if (!teamName) valid = false;

  setError("total_members", totalMembers && Number(totalMembers) > 0 ? "" : t.error_required_total_members);
  if (!totalMembers || Number(totalMembers) <= 0) valid = false;

  setError("members", memberNames.length > 0 ? "" : t.error_required_members);
  if (memberNames.length === 0) valid = false;

  setError("option", option ? "" : t.error_required_option);
  if (!option) valid = false;

  setError("area", area ? "" : t.error_required_area);
  if (!area) valid = false;

  return valid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const t = currentLangDict();
  statusEl.textContent = "";
  statusEl.removeAttribute("data-state");

  if (!validate()) return;

  const payload = {
    team_name: form.elements.team_name.value.trim(),
    total_members: Number(form.elements.total_members.value),
    members: getMemberNames(),
    option: form.querySelector('input[name="option"]:checked').value,
    area: form.elements.area.value,
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
});
