# SAAD° Portfolio

A single-page portfolio for Syed Saad Ur Rahman. Editorial-technical design
("Technical Monograph"): Fraunces + Hanken Grotesk + JetBrains Mono, a single
electric-indigo accent, a strict hairline grid, and restrained scroll motion.
Hand-built with plain HTML, CSS, and vanilla JS — no framework, no build step,
no runtime dependencies.

## Structure

- index.html: Layout and content
- styles.css: Design system, layout, and motion
- app.js: Reveal motion, nav state, mobile menu, contact form
- api/contact.js: Serverless endpoint that emails the contact form (Resend)
- public/: Optimized live screenshots of the featured projects (WebP)
- public/thumbs/: Optimized thumbnail-design samples for the Design marquee (WebP)
- serve.bat: Local dev server helper

## Contact form (email)

The contact form posts to `/api/contact`, a zero-dependency Vercel function
that sends the message via the [Resend](https://resend.com) REST API.

Set these environment variables in Vercel
(Project → Settings → Environment Variables), then redeploy:

| Variable | Required | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | From https://resend.com/api-keys |
| `CONTACT_TO` | no | Destination inbox. Defaults to `001saadurrahman@gmail.com` |
| `CONTACT_FROM` | no | Verified sender. Defaults to Resend's shared `onboarding@resend.dev`, which only delivers to the Resend account owner. Verify a domain for production: https://resend.com/domains |

Until `RESEND_API_KEY` is set the endpoint returns a clear "not configured"
message and the form surfaces it — no silent or fake submissions.
The `/api` route runs only on Vercel, not via the local static server.

## Project screenshots

The three featured projects embed live, auto-captured screenshots via
[thum.io](https://www.thum.io) (no API key). They lazy-load with a reserved
1200×900 box and a skeleton shimmer, so there is no layout shift.

For best quality/reliability in production, capture each shot once, save an
optimized image under `/public`, and swap the `src` in the matching
`.feat__media` block in `index.html`.

## Run locally

On Windows, run:

```
serve.bat
```

This starts a static server on http://localhost:5173.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Framework Preset: Other.
3. Build Command: leave empty.
4. Output Directory: .
5. Deploy.

The routing behavior is handled by vercel.json.
