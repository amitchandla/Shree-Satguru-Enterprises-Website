/* ==========================================================================
   SHREE SATGURU ENTERPRISES — script.js
   Vanilla JS only. No frameworks, no external dependencies.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Shared config — kept in one place so numbers only need updating once.
   * NOTE: the business's WhatsApp number, as given, is 9416888344.
   * ------------------------------------------------------------------ */
  var WHATSAPP_NUMBER = "919416888344"; // country code + number, no + or spaces
  var STORAGE_KEY_GALLERY = "sse_gallery_media_v1";
  var STORAGE_KEY_LOCATION = "sse_location_v1";

  var WA_MESSAGES = {
    general: "Hello Shree Satguru Enterprises, I would like to enquire about your products and wholesale rates.",
    hardware: "Hello, I want to enquire about hardware items and wholesale rates.",
    paint: "Hello, I want to enquire about paint products and wholesale rates.",
    electrical: "Hello, I want to enquire about electrical items and wholesale rates.",
    wholesale: "Hello Shree Satguru Enterprises, I am a business buyer and would like to know your wholesale rates."
  };

  function buildWhatsAppUrl(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  /* ------------------------------------------------------------------ *
   * Mobile navigation
   * ------------------------------------------------------------------ */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("primary-nav");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * WhatsApp CTA buttons — every element with .js-whatsapp-cta
   * ------------------------------------------------------------------ */
  document.querySelectorAll(".js-whatsapp-cta").forEach(function (el) {
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
    var key = el.getAttribute("data-wa-message") || "general";
    el.setAttribute("href", buildWhatsAppUrl(WA_MESSAGES[key] || WA_MESSAGES.general));
  });

  /* ------------------------------------------------------------------ *
   * Location / directions link
   * Owner can override this from the dashboard (stored in localStorage).
   * Falls back to a Google Maps search for the printed address.
   * ------------------------------------------------------------------ */
  function getLocationConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore malformed data */ }
    return null;
  }

  function applyLocationLinks() {
    var defaultAddress = "Near HP Petrol Pump, Main Bus Stand, Mohanpur, Rewari, Haryana 123401";
    var defaultDirections = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(defaultAddress);
    var config = getLocationConfig();

    var directionsUrl = (config && config.directionsUrl) ? config.directionsUrl : defaultDirections;
    var mapEmbedUrl = (config && config.mapEmbedUrl) ? config.mapEmbedUrl : null;

    ["directionsBtn", "directionsBtnSmall"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", directionsUrl);
    });

    if (mapEmbedUrl) {
      var frame = document.getElementById("mapFrame");
      if (frame) frame.setAttribute("src", mapEmbedUrl);
    }
  }
  applyLocationLinks();

  /* ------------------------------------------------------------------ *
   * Gallery — renders owner-uploaded media if present, otherwise shows
   * clean placeholders. Media is read from the same localStorage key the
   * owner dashboard writes to.
   *
   * IMPORTANT: this is a DEMO persistence layer only (browser localStorage
   * on the visitor's own device). It does NOT publish media to other
   * visitors. A real deployment must replace loadGalleryMedia() with a
   * fetch() call to a backend/storage API — see README.md.
   * ------------------------------------------------------------------ */
  function loadGalleryMedia() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_GALLERY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore malformed data */ }
    return [];
  }

  function placeholderTile() {
    var div = document.createElement("div");
    div.className = "gallery-item is-placeholder";
    div.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>' +
      "</svg><span>Store photo coming soon</span>";
    return div;
  }

  function mediaTile(item) {
    var btn = document.createElement("button");
    btn.className = "gallery-item";
    btn.type = "button";
    btn.setAttribute("aria-label", (item.type === "video" ? "Play video" : "View photo") + ": " + (item.caption || "store media"));

    if (item.type === "video") {
      var vid = document.createElement("video");
      vid.src = item.src;
      vid.muted = true;
      vid.setAttribute("playsinline", "");
      vid.setAttribute("preload", "metadata");
      btn.appendChild(vid);
      var badge = document.createElement("span");
      badge.className = "gallery-play-badge";
      badge.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      btn.appendChild(badge);
    } else {
      var img = document.createElement("img");
      img.src = item.src;
      img.alt = item.caption || "Shree Satguru Enterprises store photo";
      img.loading = "lazy";
      btn.appendChild(img);
    }

    btn.addEventListener("click", function () { openLightbox(item); });
    return btn;
  }

  function renderGallery() {
    var grid = document.getElementById("galleryGrid");
    if (!grid) return;
    grid.innerHTML = "";
    var media = loadGalleryMedia();

    if (!media.length) {
      for (var i = 0; i < 8; i++) grid.appendChild(placeholderTile());
      return;
    }
    media.forEach(function (item) { grid.appendChild(mediaTile(item)); });
  }
  renderGallery();

  /* Lightbox */
  var lightbox = document.getElementById("lightbox");
  var lightboxContent = document.getElementById("lightboxContent");
  var lightboxClose = document.getElementById("lightboxClose");

  function openLightbox(item) {
    if (!lightbox || !lightboxContent) return;
    lightboxContent.innerHTML = "";
    if (item.type === "video") {
      var v = document.createElement("video");
      v.src = item.src;
      v.controls = true;
      v.autoplay = true;
      v.setAttribute("playsinline", "");
      lightboxContent.appendChild(v);
    } else {
      var img = document.createElement("img");
      img.src = item.src;
      img.alt = item.caption || "Shree Satguru Enterprises store photo";
      lightboxContent.appendChild(img);
    }
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightboxContent.innerHTML = "";
    document.body.style.overflow = "";
  }

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  /* ------------------------------------------------------------------ *
   * Scroll reveal animations (respects prefers-reduced-motion via CSS)
   * ------------------------------------------------------------------ */
  var revealTargets = document.querySelectorAll(".cat-card, .why-card, .fade-in");
  if ("IntersectionObserver" in window && revealTargets.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------ *
   * Enquiry form
   * ------------------------------------------------------------------ */
  var form = document.getElementById("enquiryForm");

  function setFieldError(rowId, hasError) {
    var row = document.getElementById(rowId);
    if (row) row.classList.toggle("has-error", hasError);
  }

  function isValidMobile(value) {
    var digits = value.replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(digits);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var mobile = form.mobile.value.trim();
      var product = form.product.value;
      var details = form.details.value.trim();

      var valid = true;

      if (!name) { setFieldError("row-name", true); valid = false; }
      else setFieldError("row-name", false);

      if (!isValidMobile(mobile)) { setFieldError("row-mobile", true); valid = false; }
      else setFieldError("row-mobile", false);

      if (!product) { setFieldError("row-product", true); valid = false; }
      else setFieldError("row-product", false);

      if (!valid) return;

      var lines = [
        "Hello Shree Satguru Enterprises,",
        "Name: " + name,
        "Mobile: " + mobile,
        "Requirement: " + product
      ];
      if (details) lines.push("Quantity/Details: " + details);
      lines.push("I would like to know the wholesale price.");

      var message = lines.join("\n");
      var successEl = document.getElementById("formSuccess");
      if (successEl) successEl.classList.add("show");

      var url = buildWhatsAppUrl(message);
      window.open(url, "_blank", "noopener");
    });
  }

})();
