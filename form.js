const GITHUB_OWNER = "meeraibrahim09-cyber";
const GITHUB_REPO = "ai-challenge";
const GITHUB_TOKEN = "REPLACE_WITH_FINE_GRAINED_PAT";

const form = document.getElementById("signup-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");

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
  const option = form.querySelector('input[name="option"]:checked');
  const area = form.elements.area.value;

  setError("team_name", teamName ? "" : t.error_required_team_name);
  if (!teamName) valid = false;

  setError("total_members", totalMembers && Number(totalMembers) > 0 ? "" : t.error_required_total_members);
  if (!totalMembers || Number(totalMembers) <= 0) valid = false;

  setError("option", option ? "" : t.error_required_option);
  if (!option) valid = false;

  setError("area", area ? "" : t.error_required_area);
  if (!area) valid = false;

  return valid;
}

function labelFor(select, value) {
  const opt = select.querySelector(`option[value="${value}"]`);
  return opt ? opt.textContent : value;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const t = currentLangDict();
  statusEl.textContent = "";
  statusEl.removeAttribute("data-state");

  if (!validate()) return;

  const teamName = form.elements.team_name.value.trim();
  const totalMembers = Number(form.elements.total_members.value);
  const optionInput = form.querySelector('input[name="option"]:checked');
  const optionValue = optionInput.value;
  const optionLabel = optionInput.closest(".radio-option").querySelector("span").textContent;
  const areaSelect = form.elements.area;
  const areaValue = areaSelect.value;
  const areaLabel = labelFor(areaSelect, areaValue);

  const payload = {
    team_name: teamName,
    total_members: totalMembers,
    option: optionValue,
    area: areaValue,
  };

  const body = [
    `**${t.label_team_name}:** ${teamName}`,
    `**${t.label_total_members}:** ${totalMembers}`,
    `**${t.label_option}:** ${optionLabel}`,
    `**${t.label_area}:** ${areaLabel}`,
    "",
    "```json",
    JSON.stringify(payload),
    "```",
  ].join("\n");

  submitBtn.disabled = true;
  submitBtn.textContent = t.submitting;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: teamName,
        body,
        labels: ["submission"],
      }),
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
});
