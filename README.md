# HC Energy Mobility: redesigned website

A Node.js (Express) site with a modern front end for HC Energy Mobility, Rwanda's first nationwide EV fast-charge network.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000 (set `PORT` to change it).

## Logo

Place the original logo at `public/img/logo.jpeg`. It is used in the navigation bar. If the file is missing, a text wordmark is shown instead.

## What's inside

- `server.js`: Express server, security headers, and the `/api/contact` endpoint (messages are saved to `data/messages.json`)
- `public/index.html`: the single-page site
- `public/css/style.css`: design system and responsive styles
- `public/js/main.js`: animations, charger demo, province explorer, contact form
- `public/privacy.html`, `public/terms.html`: template legal pages (replace with approved text)

## Notes

- The contact form stores messages locally. To receive them by email, add a mail service such as nodemailer in `server.js`.
- Team members show initials. Drop real photos into `public/img/` and swap the `.avatar` blocks in `index.html` to use them.
