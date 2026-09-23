# Kenneth Yandan — Portfolio

Static portfolio site (HTML, CSS, vanilla JS). No build step.

```bash
python -m http.server 5173   # then open http://localhost:5173
```

Deploy the folder as-is to Cloudflare Pages, Netlify, Vercel or GitHub Pages.

CSS/JS links carry a `?v=` version (in `index.html` and `demo/index.html`). Bump it whenever you change a stylesheet or script, otherwise returning visitors keep the old file for up to 24 hours.
