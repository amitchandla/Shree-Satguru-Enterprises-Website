/* ==========================================================================
   owner/dashboard.js

   Session gate + media/location management for the DEMO build.

   ⚠️ Everything that writes data in this file writes to this browser's
   localStorage only. That's fine for previewing the dashboard UI, but it
   is NOT the real feature: uploads here never become visible to other
   visitors. Before going live, replace the two functions marked
   "BACKEND INTEGRATION POINT" with real calls to your server/storage
   (Supabase Storage + a Postgres table is a straightforward option — see
   README.md).
   ========================================================================== */
(function () {
  "use strict";

  var SESSION_KEY = "sse_owner_session_v1";
  var STORAGE_KEY_GALLERY = "sse_gallery_media_v1";
  var STORAGE_KEY_LOCATION = "sse_location_v1";

  var MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
  var ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  var ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

  /* ---- Session gate ---- */
  var session = null;
  try {
    session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch (e) { session = null; }

  if (!session || !session.mode) {
    window.location.href = "login.html";
    return;
  }

  var modeBanner = document.getElementById("modeBanner");
  if (modeBanner) {
    if (session.mode === "demo") {
      modeBanner.textContent = "DEMO PREVIEW MODE — not connected to a real backend. Uploads and changes only exist on this device. See README.md.";
    } else {
      modeBanner.textContent = "Signed in.";
      modeBanner.style.background = "var(--color-success)";
      modeBanner.style.color = "#fff";
    }
  }

  document.getElementById("logoutBtn").addEventListener("click", function () {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    window.location.href = "login.html";
  });

  /* ------------------------------------------------------------------ *
   * Media management
   * ------------------------------------------------------------------ */
  function loadMedia() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_GALLERY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore malformed data */ }
    return [];
  }

  // BACKEND INTEGRATION POINT:
  // Replace this with a call that persists the uploaded file to real
  // storage (e.g. upload to Supabase Storage / S3, then save the returned
  // public URL + type + caption to your database) instead of localStorage.
  function saveMedia(media) {
    localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify(media));
  }

  function renderMediaList() {
    var list = document.getElementById("mediaList");
    list.innerHTML = "";
    var media = loadMedia();

    media.forEach(function (item, index) {
      var thumb = document.createElement("div");
      thumb.className = "media-thumb";

      var el = document.createElement(item.type === "video" ? "video" : "img");
      el.src = item.src;
      if (item.type === "video") { el.muted = true; el.setAttribute("playsinline", ""); }
      thumb.appendChild(el);

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.setAttribute("aria-label", "Delete this media");
      delBtn.textContent = "\u00d7";
      delBtn.addEventListener("click", function () {
        var current = loadMedia();
        current.splice(index, 1);
        saveMedia(current);
        renderMediaList();
      });
      thumb.appendChild(delBtn);

      list.appendChild(thumb);
    });
  }
  renderMediaList();

  function setUploadStatus(message, isError) {
    var el = document.getElementById("uploadStatus");
    el.textContent = message;
    el.className = "status-msg show " + (isError ? "error" : "success");
  }

  function sanitizeFileLabel(name) {
    // Strip anything that isn't alphanumeric, dot, dash or underscore.
    return String(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  }

  document.getElementById("mediaInput").addEventListener("change", function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    if (!files.length) return;

    var accepted = 0;
    var rejected = [];
    var pending = files.length;

    files.forEach(function (file) {
      var isImage = ALLOWED_IMAGE_TYPES.indexOf(file.type) !== -1;
      var isVideo = ALLOWED_VIDEO_TYPES.indexOf(file.type) !== -1;

      if (!isImage && !isVideo) {
        rejected.push(sanitizeFileLabel(file.name) + " (unsupported file type)");
        pending -= 1;
        checkDone();
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(sanitizeFileLabel(file.name) + " (over 8\u00a0MB)");
        pending -= 1;
        checkDone();
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        var media = loadMedia();
        media.unshift({
          type: isVideo ? "video" : "image",
          src: reader.result, // data URL — demo-only storage, see note above
          caption: sanitizeFileLabel(file.name),
          addedAt: Date.now()
        });
        saveMedia(media);
        accepted += 1;
        pending -= 1;
        checkDone();
      };
      reader.onerror = function () {
        rejected.push(sanitizeFileLabel(file.name) + " (couldn't be read)");
        pending -= 1;
        checkDone();
      };
      reader.readAsDataURL(file);
    });

    function checkDone() {
      if (pending > 0) return;
      renderMediaList();
      var msg = accepted + " file(s) added.";
      if (rejected.length) msg += " Skipped: " + rejected.join(", ") + ".";
      setUploadStatus(msg, rejected.length > 0 && accepted === 0);
      e.target.value = "";
    }
  });

  /* ------------------------------------------------------------------ *
   * Location management
   * ------------------------------------------------------------------ */
  function loadLocation() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore malformed data */ }
    return {};
  }

  // BACKEND INTEGRATION POINT:
  // Replace with a call that saves the location config to your database so
  // it's shared across all visitors, not just this browser.
  function saveLocation(config) {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(config));
  }

  var existingLocation = loadLocation();
  if (existingLocation.mapEmbedUrl) document.getElementById("mapEmbedUrl").value = existingLocation.mapEmbedUrl;
  if (existingLocation.directionsUrl) document.getElementById("directionsUrl").value = existingLocation.directionsUrl;

  document.getElementById("locationForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var mapEmbedUrl = document.getElementById("mapEmbedUrl").value.trim();
    var directionsUrl = document.getElementById("directionsUrl").value.trim();
    var statusEl = document.getElementById("locationStatus");

    var urlPattern = /^https:\/\//i;
    if ((mapEmbedUrl && !urlPattern.test(mapEmbedUrl)) || (directionsUrl && !urlPattern.test(directionsUrl))) {
      statusEl.textContent = "Links must start with https://";
      statusEl.className = "status-msg show error";
      return;
    }

    saveLocation({ mapEmbedUrl: mapEmbedUrl, directionsUrl: directionsUrl });
    statusEl.textContent = "Location saved. It will show next time the public site loads.";
    statusEl.className = "status-msg show success";
  });

})();
