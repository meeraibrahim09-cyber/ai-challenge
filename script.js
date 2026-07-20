const FORMSPREE_ENDPOINT = "https://formspree.io/f/REPLACE_ME";

const form = document.getElementById("signup-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");

function setError(fieldName, message) {
  const el = form.querySelector(`[data-error-for="${fieldName}"]`);
  const input = form.elements[fieldName];
  if (el) el.textContent = message;
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validate() {
  let valid = true;
  const values = {
    name: form.elements.name.value.trim(),
    team: form.elements.team.value.trim(),
    option: form.elements.option.value,
  };

  if (!values.name) {
    setError("name", "Please enter your name.");
    valid = false;
  } else {
    setError("name", "");
  }

  if (!values.team) {
    setError("team", "Please enter your team name.");
    valid = false;
  } else {
    setError("team", "");
  }

  if (!values.option) {
    setError("option", "Please choose an option.");
    valid = false;
  } else {
    setError("option", "");
  }

  return valid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "";
  statusEl.removeAttribute("data-state");

  if (!validate()) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });

    if (response.ok) {
      form.reset();
      statusEl.textContent = "Thanks! Your response has been recorded.";
      statusEl.setAttribute("data-state", "success");
    } else {
      statusEl.textContent = "Something went wrong. Please try again.";
      statusEl.setAttribute("data-state", "error");
    }
  } catch (err) {
    statusEl.textContent = "Network error. Please try again.";
    statusEl.setAttribute("data-state", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});
