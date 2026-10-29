# Jorge Lira — Portfolio

Personal portfolio of a Data Engineer: client case studies, projects with architecture diagrams, skills and certifications.

**Live:** https://jorgelira123.github.io/

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

## Structure

```
index.html        single page (English is the default and lives in the HTML)
css/style.css     styles, color tokens, light/dark theme
js/i18n.js        Portuguese strings (key → text)
js/main.js        language and theme toggles, scroll reveal, diagram animation, mobile menu
assets/           photo, images, résumé PDFs, certificate PDFs, favicon
robots.txt, sitemap.xml
.nojekyll         serve files as they are on GitHub Pages (no Jekyll processing)
```

Architecture diagrams are inline SVG. Their colors come from CSS tokens, so they follow the light/dark theme,
and `js/main.js` adds the moving "data packets" along the edges (disabled when the system asks for reduced motion).

### Editing text

- **English:** directly in `index.html`.
- **Portuguese:** in `js/i18n.js`, under the same key as the element's `data-i18n` attribute.
  A missing key falls back to English and logs `Missing PT translation` in the browser console.
- `?lang=pt` at the end of the URL opens the site in Portuguese.

After changing CSS or JS, bump the `?v=` number in `index.html` so browsers fetch the new file.

## Run locally

Open `index.html` directly in the browser, or start a local server:

```bash
python -m http.server 8000
```

and open http://localhost:8000.

## Deploy

GitHub Pages, from the `main` branch, root folder (**Settings → Pages → Deploy from a branch**).
Every push to `main` publishes the site in about a minute. If a change does not show up, wait a moment and reload with Ctrl+F5.

## Changing the domain

All paths are relative. The only absolute URLs (canonical, Open Graph, JSON-LD, sitemap) use the current domain,
`https://jorgelira123.github.io`, in `index.html`, `robots.txt` and `sitemap.xml`. To move to another domain:

```bash
sed -i 's#https://jorgelira123.github.io#https://new-domain.com#g' index.html robots.txt sitemap.xml
```

For a custom domain on GitHub Pages, set it in **Settings → Pages → Custom domain** and point the DNS as GitHub instructs.
