# Shree Satguru Enterprises — Website

A static, mobile-first business website for **Shree Satguru Enterprises**
(Hardware, Paint & Electrical wholesale supplier — Mohanpur, Rewari,
Haryana), plus an owner-only dashboard for managing gallery media and the
store's map/location link.

## What's in this build

```
shree-satguru-enterprises/
├── index.html          Public website (hero, categories, wholesale,
│                        why-choose-us, gallery, contact, enquiry form)
├── style.css            All styling — design tokens at the top
├── script.js             Nav, WhatsApp links, form validation, gallery
│                        rendering, lightbox, scroll animations
├── assets/
│   ├── images/          (empty — add real photos here, or use the
│   │                     owner dashboard once storage is connected)
│   ├── icons/            favicon.svg
│   └── uploads/          (placeholder for future backend-served uploads)
└── owner/
    ├── login.html        Owner login screen
    ├── auth.js            Login flow (see "Authentication" below)
    ├── dashboard.html     Owner dashboard UI
    └── dashboard.js       Media upload / gallery / location management
```

Everything here runs with plain HTML, CSS and vanilla JavaScript — no
build step, no framework. Open `index.html` in a browser, or deploy the
folder as-is to any static host (Netlify, Vercel, GitHub Pages, etc.).

## ⚠️ Important: this is a frontend-only build

The public website (`index.html`) is fully functional as shipped —
WhatsApp links, call links, the enquiry form, navigation, and the gallery
all work with no backend required.

**The owner dashboard is a working preview, not a finished secure
system.** Two things are intentionally *not* implemented with real
security, because they cannot be done safely in frontend-only code:

1. **Owner password authentication**
2. **Publishing uploaded media/location changes to all visitors**

### Authentication — what's here and what you need to add

The initial owner password supplied by the business owner is
`Haryana001`. **This password does not appear anywhere in this code.**
Comparing a password inside frontend JavaScript (`if (password ===
"...")`) is not secure — anyone can read it in the browser's dev tools —
so `owner/auth.js` does not do that.

Instead, `owner/auth.js`:

1. Calls `POST /api/owner/login`, which is where real authentication
   belongs. This endpoint doesn't exist yet in this static build.
2. If that call fails (no backend deployed), it falls back to a
   **DEMO PREVIEW MODE** — clearly labeled everywhere it appears — so you
   can see what the dashboard looks like. Demo mode does not check any
   password and only affects your own browser.

**To make login real**, add a small backend (any of these work):
- A Node/Express (or similar) route at `/api/owner/login` that compares
  the submitted password against a **hashed** password (bcrypt/argon2)
  stored in an environment variable or database, then issues a session
  cookie or JWT.
- **Supabase Auth** — create one owner user, use `supabase.auth.signInWithPassword()`
  from `auth.js`, and gate `dashboard.html` behind a valid session.
- Any other auth provider (Auth0, Firebase Auth, Clerk, etc.).

Once connected, **force a password change on first login** and remove the
demo-preview fallback in `auth.js`.

### Media uploads & location link — what's here and what you need to add

`owner/dashboard.js` validates file type (JPG/PNG/WEBP, MP4/WEBM), file
size (8 MB max), and sanitizes filenames client-side — but it currently
**saves everything to `localStorage` on the owner's own device**. That
means:
- The dashboard UI, upload flow, and gallery preview all work today.
- Uploaded photos/videos will **not** appear for other website visitors
  until real storage is connected, because `localStorage` never leaves
  the owner's browser.

**To make this real**, replace the two functions marked
`// BACKEND INTEGRATION POINT` in `owner/dashboard.js`:

- `saveMedia()` → upload the file to real storage (Supabase Storage, S3,
  Cloudinary, etc.) from a server-side/authenticated request, then save
  the returned public URL + type + caption to a database table your
  public site can read.
- `saveLocation()` → save the map embed URL / directions URL to the same
  database instead of `localStorage`.

Then change `script.js`'s `loadGalleryMedia()` and `applyLocationLinks()`
on the public site to `fetch()` that data instead of reading
`localStorage`.

Server-side, enforce everything the brief calls for regardless of what
the client already checks: require a valid owner session for every
upload/delete request, re-validate MIME type and size, reject anything
that isn't an allowed image/video type (never accept executables or
arbitrary HTML), sanitize/normalize filenames, and store files somewhere
that can't be used to traverse the filesystem (a managed storage bucket,
not a raw server directory).

## WhatsApp & call numbers

Configured in `script.js` (`WHATSAPP_NUMBER`) and hard-coded as `tel:`/`https://wa.me/`
links across `index.html`, using the number given for both contact and
WhatsApp: **9416888344** (`+91 94168 88344`). The secondary phone line is
**9729185344**.

> Note: the original request brief stated this number inconsistently in
> a couple of places (`9416888344` in most places, `9416883344` in a
> couple of others). This build uses `9416888344` throughout, since
> that's the number explicitly given as both "Contact Numbers" and
> "WhatsApp Number." Double-check this against the real number before
> going live, and update `WHATSAPP_NUMBER` in `script.js` plus the
> `tel:+91...` links in `index.html` if it needs to change.

## No invented business claims

Per the brief, this build does not include invented years-of-experience,
guarantees, certifications, brand names, prices, opening hours, or
testimonials. Add these only when the owner supplies them.

## Before going live — checklist

- [ ] Connect real backend authentication for `/owner/login.html`
- [ ] Connect real storage + database for media uploads and location link
- [ ] Force an owner password change after first real login
- [ ] Replace placeholder Google Maps embed with the store's exact pin
- [ ] Add real store/product photos (`assets/images/`) or upload via the
      dashboard once storage is connected
- [ ] Double-check both phone numbers and the WhatsApp number
- [ ] Set a real Open Graph image at `assets/images/og-cover.jpg`
- [ ] Test on 320px–1440px+ widths and with a screen reader
