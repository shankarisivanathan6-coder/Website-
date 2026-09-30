# Shankari — UGC portfolio site

A one-page portfolio for UGC / short-form video work. Plain HTML, CSS and
JavaScript — no build step, no framework, no dependencies. Open `index.html`
in a browser and it runs.

```
index.html              ← all the page content and copy
assets/css/styles.css   ← all the styling (colours live at the very top)
assets/js/main.js       ← menu, scroll effects, video player, contact form
assets/video/           ← the videos (web-ready .mp4)
assets/img/             ← poster images, portrait, share image
```

---

## Fill these in before you share the link

Search `index.html` for `EDIT ME` — each spot is marked with a comment.

| # | What | Where |
|---|------|-------|
| 1 | **Prices.** All three packages are placeholder numbers | `index.html`, the Rates section |
| 2 | **Page title and description.** What Google and link previews show | `index.html`, the `<head>` |

Everything else is set up and working: the three videos, the copy, the
photography link, the Instagram and TikTok links, and the contact address.

Your email (`shankari.sivanathan6@gmail.com`) is wired into three places, so if
you ever change it, change all three: the `data-email` attribute on the form,
the visible link below the form, and the "Email" link in the footer.

---

## Publishing it free on GitHub Pages

1. Push this branch, then merge it into `main`.
2. On GitHub: **Settings → Pages**.
3. Under *Build and deployment*, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
4. Wait a minute or two. Your site is live at
   `https://<your-username>.github.io/Website-/`

To put it on your own domain later, add the domain under Settings → Pages and
point a CNAME record at GitHub. Netlify and Cloudflare Pages also work — drag
this folder onto either one and it deploys as-is.

---

## Adding a new video

1. Export as **`.mp4` (H.264)** — not `.mov`. Phones record in HEVC `.mov`,
   which Chrome and Firefox refuse to play. To convert:

   ```bash
   ffmpeg -i clip.mov -c:v libx264 -crf 26 -preset slow \
          -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart \
          assets/video/clip.mp4
   ```

2. Save a still to use as the thumbnail:

   ```bash
   ffmpeg -ss 5 -i assets/video/clip.mp4 -frames:v 1 -q:v 4 assets/img/poster-clip.jpg
   ```

3. Optionally make a WebM twin. Every video here ships as both `.mp4` and
   `.webm` so browsers without H.264 (some Linux builds of Chromium and
   Firefox) can still play them. It's optional — drop the `data-video-webm`
   attribute and the MP4 alone is fine for Chrome, Safari, Edge and iOS.

   ```bash
   ffmpeg -i assets/video/clip.mp4 -c:v libvpx-vp9 -crf 34 -b:v 0 \
          -row-mt 1 -c:a libopus -b:a 80k assets/video/clip.webm
   ```

4. In `index.html`, copy one `<article class="work-card">` block and change the
   `data-video`, `data-video-webm`, `data-title`, `<img src>`, heading and text.
   Add `class="work-card is-wide"` if the video is landscape rather than vertical.

Keep videos under about 10 MB each so the page stays fast.

---

## Getting enquiries in your inbox

The contact form opens the visitor's email app with everything pre-filled. That
needs no server, so it works on GitHub Pages as-is.

If you'd rather messages arrive directly in your inbox, make a free form at
[formspree.io](https://formspree.io) and change the `<form>` tag to:

```html
<form class="form" id="contactForm" action="https://formspree.io/f/YOUR_ID" method="POST">
```

Remove the `data-email` attribute. The JavaScript detects the `action` and
steps out of the way.

---

## Notes

- Dark mode follows the visitor's system setting automatically.
- Respects `prefers-reduced-motion` — animations switch off for anyone who
  asked their device to reduce motion.
- Keyboard accessible throughout; the video player traps focus and closes on
  <kbd>Esc</kbd>.
- To change the colour scheme, edit the `:root` block at the top of
  `styles.css`. `--accent` is the terracotta used for buttons and highlights.
