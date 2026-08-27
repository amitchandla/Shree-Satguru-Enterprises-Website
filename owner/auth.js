/* ==========================================================================
   owner/auth.js

   ⚠️  READ THIS BEFORE DEPLOYING  ⚠️
   ---------------------------------------------------------------------------
   Real authentication CANNOT live in frontend JavaScript — anyone can open
   devtools and read this file, so a client-side password check (e.g.
   `if (password === "Haryana001")`) is not security, it's an illusion of
   security. This file intentionally does NOT compare a password locally.

   What this file actually does:
   1. It tries to call a backend endpoint, POST /api/owner/login, which is
      where real password verification must happen (bcrypt/argon2 hash
      comparison, session/JWT issuance, rate limiting). That endpoint does
      not exist in this static build — see README.md "Backend Integration"
      for how to add it (a small Node/Express route, a Supabase Edge
      Function, etc. all work).
   2. Until that backend exists, it falls back to a clearly-labeled DEMO
      PREVIEW MODE so the owner can see what the dashboard looks like. Demo
      mode is NOT secure, works only on this browser/device, cannot upload
      real files anywhere public, and is flagged everywhere it appears.
   ---------------------------------------------------------------------------
*/
(function () {
  "use strict";

  var SESSION_KEY = "sse_owner_session_v1";
  var form = document.getElementById("ownerLoginForm");
  var errorBox = document.getElementById("loginError");

  function goToDashboard(mode) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ mode: mode, at: Date.now() }));
    } catch (e) { /* sessionStorage unavailable — dashboard.js will re-check */ }
    window.location.href = "dashboard.html";
  }

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.add("show");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errorBox) errorBox.classList.remove("show");

      var password = document.getElementById("ownerPassword").value;
      if (!password) return;

      // Step 1 — try the real backend endpoint. This is the ONLY path that
      // should exist once a backend is connected; everything below the
      // catch block is demo-only scaffolding for previewing the UI.
      fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password })
      })
        .then(function (res) {
          if (res.ok) {
            goToDashboard("live");
          } else if (res.status === 404) {
            // No backend deployed yet — offer the demo preview instead of
            // silently failing.
            offerDemoPreview();
          } else {
            showError("Incorrect password.");
          }
        })
        .catch(function () {
          // Network error / no backend reachable at all (expected in this
          // static build).
          offerDemoPreview();
        });
    });
  }

  function offerDemoPreview() {
    showError(
      "The owner-login backend isn't connected yet, so real authentication can't run. " +
      "Continuing in DEMO PREVIEW MODE — not secure, and only visible on this device."
    );
    // Give the owner a moment to read the message, then drop them into the
    // clearly-flagged demo dashboard so they can see what it looks like.
    window.setTimeout(function () { goToDashboard("demo"); }, 1400);
  }
})();
