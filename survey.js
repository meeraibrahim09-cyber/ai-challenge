const SURVEY_TABLE = "survey_responses";

const form = document.getElementById("survey-form");
const submitBtn = document.getElementById("survey-submit");
const statusEl = document.getElementById("survey-status");
const ratingInput = document.getElementById("rating");
const ratingScale = document.getElementById("rating-scale");

// Groups that must have at least one selection.
const REQUIRED_GROUPS = ["enjoyed", "ideas", "expand"];
// Maximum characters allowed in the free-text answer.
const MAX_LEN = 150;

function currentDict() {
  return translations[getLang()];
}

function setError(fieldName, message) {
  const el = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (el) el.textContent = message;
}

function getChecked(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((c) => c.value);
}

// Rating scale selection.
if (ratingScale) {
  ratingScale.querySelectorAll(".rating-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      ratingInput.value = btn.dataset.value;
      ratingScale.querySelectorAll(".rating-btn").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("selected", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      setError("rating", "");
    });
  });
}

function validate() {
  const t = currentDict();
  let valid = true;

  if (!ratingInput.value) {
    setError("rating", t.survey_error_rating);
    valid = false;
  } else {
    setError("rating", "");
  }

  REQUIRED_GROUPS.forEach((name) => {
    if (getChecked(name).length === 0) {
      setError(name, t.survey_error_select);
      valid = false;
    } else {
      setError(name, "");
    }
  });

  const improve = form.elements.improve.value.trim();
  if (improve.length > MAX_LEN) {
    setError("improve", t.error_max_length);
    valid = false;
  } else {
    setError("improve", "");
  }

  return valid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const t = currentDict();
  statusEl.textContent = "";
  statusEl.removeAttribute("data-state");

  if (!validate()) return;

  const payload = {
    rating: Number(ratingInput.value),
    enjoyed: getChecked("enjoyed"),
    ideas: getChecked("ideas"),
    expand: getChecked("expand"),
    improve: form.elements.improve.value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = t.submitting;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SURVEY_TABLE}`, {
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
      ratingInput.value = "";
      ratingScale.querySelectorAll(".rating-btn").forEach((b) => {
        b.classList.remove("selected");
        b.setAttribute("aria-pressed", "false");
      });
      statusEl.textContent = t.survey_success;
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
    submitBtn.textContent = t.survey_submit;
  }
});

document.addEventListener("langchange", () => {
  const t = currentDict();
  if (!submitBtn.disabled) submitBtn.textContent = t.survey_submit;
});
