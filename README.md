# Flying Promotion

Website for Flying Promotion — websites, custom software, CRM, automation and digital growth.

## Development

```bash
npm install
npm run dev
```

The dev server runs Astro with the theme generator in watch mode.

## Build

```bash
npm run build
npm run preview
```

The project uses the Vercel adapter. `src/pages/api/contact.ts` runs as a serverless function (`prerender = false`).

## Contact form

The form posts JSON to `/api/contact`. It never reports a false success. Delivery must be configured with environment variables (see `.env.example`):

- `CONTACT_WEBHOOK_URL` — POSTs the lead as JSON to a webhook or automation platform.
- or `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — sends an email through Resend.

If neither option is configured, the endpoint returns a clear error instead of pretending the message was sent.

## Content

Page content lives in `src/content`:

- `homepage/-index.md`
- `features/-index.md`
- `about/-index.md`
- `contact/-index.md`
- `blog/*.md`
- `sections/*.md`
- `pages/*.md` (privacy, terms)

Site settings live in `src/config` (`config.json`, `theme.json`, `menu.json`, `social.json`). Run `node scripts/themeGenerator.js` after changing `theme.json` (or use `npm run dev`).

## Notes

- Brand assets are in `public/images/brand`.
- Social links are intentionally empty until verified profiles are available.
- Client logos, testimonials and performance statistics are intentionally not shown because none have been verified.

## Credits

Built on the Automark Astro template by Themefisher / ThemeWagon, licensed under MIT.
