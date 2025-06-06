document.getElementById('contact-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent default form submission

  const form = event.target;
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-message');
  const successEl = document.getElementById('sent-message');

  // Clear previous messages
  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  loadingEl.style.display = 'block';

  // Check for Cloudflare Turnstile token
  const tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
  if (!tokenInput || !tokenInput.value) {
    loadingEl.style.display = 'none';
    errorEl.innerText = "Please complete the CAPTCHA challenge.";
    errorEl.style.display = 'block';
    return;
  }

  const formData = new FormData(form);

  fetch(form.action, {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
  })
  .then(response => {
    loadingEl.style.display = 'none';
    if (response.ok) {
      successEl.style.display = 'block';
      form.reset(); // Clear form fields
      // Reset Turnstile widget if needed
      if (window.turnstile) {
        window.turnstile.reset();
      }
    } else {
      response.json().then(data => {
        errorEl.innerText = data.errors ? data.errors.map(error => error.message).join(", ") : "Oops! There was a problem submitting your form.";
        errorEl.style.display = 'block';
      });
    }
  })
  .catch(error => {
    loadingEl.style.display = 'none';
    errorEl.innerText = "TypeError: Failed to fetch";
    errorEl.style.display = 'block';
  });
});