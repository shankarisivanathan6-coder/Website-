#!/usr/bin/env python3
"""
Build a single self-contained standalone.html.

Takes index.html and folds the stylesheet, the script, the images and the
videos into the file itself as data URIs, so the result needs no assets
folder. Drop it on any host, open it by double-clicking it, or email it.

    python3 tools/build-standalone.py

Re-run it any time you change index.html or the assets.

Note: only the .mp4 of each video goes in, not the .webm twin. Every browser
that matters plays H.264, and carrying both would nearly double the file.
"""

import base64
import mimetypes
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
OUT = ROOT / "standalone.html"

TYPES = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".webp": "image/webp", ".svg": "image/svg+xml",
    ".mp4": "video/mp4", ".webm": "video/webm",
}


def data_uri(rel: str) -> str:
    """Read a file next to index.html and return it as a base64 data URI."""
    path = ROOT / rel
    if not path.is_file():
        raise SystemExit("missing asset: %s" % rel)
    mime = TYPES.get(path.suffix.lower()) or mimetypes.guess_type(path.name)[0] \
        or "application/octet-stream"
    return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode("ascii"))


def main() -> None:
    html = SRC.read_text()

    # 1. Stylesheet -> inline <style>
    css = (ROOT / "assets/css/styles.css").read_text()
    # NB: a lambda, not a plain replacement string. re.sub expands backslash
    # escapes in a string replacement, which would corrupt any \n or \d in the
    # file being inlined.
    html = re.sub(
        r'<link rel="stylesheet" href="assets/css/styles\.css">',
        lambda _: "<style>\n%s\n</style>" % css,
        html, count=1,
    )

    # 2. Script -> inline <script>
    js = (ROOT / "assets/js/main.js").read_text()
    html = re.sub(
        r'<script src="assets/js/main\.js"></script>',
        lambda _: "<script>\n%s\n</script>" % js,
        html, count=1,
    )

    # 3. Drop the .webm <source> tags, then inline the .mp4 ones
    html = re.sub(r'\n\s*<source src="[^"]+\.webm" type="video/webm">', "", html)
    html = re.sub(
        r'(<source src=")(assets/video/[^"]+\.mp4)(")',
        lambda m: m.group(1) + data_uri(m.group(2)) + m.group(3),
        html,
    )

    # 4. The lightbox reads these off the buttons, so they get inlined too.
    #    data-video-webm goes away with the .webm files.
    html = re.sub(r'\n\s*data-video-webm="[^"]+"', "", html)
    html = re.sub(
        r'(data-video=")(assets/video/[^"]+\.mp4)(")',
        lambda m: m.group(1) + data_uri(m.group(2)) + m.group(3),
        html,
    )

    # 5. Images: <img src> and the video posters
    html = re.sub(
        r'((?:src|poster)=")(assets/img/[^"]+)(")',
        lambda m: m.group(1) + data_uri(m.group(2)) + m.group(3),
        html,
    )

    # 6. og:image can't be a data URI for link previews, and a relative path
    #    would dangle, so drop the tag rather than ship a broken one.
    html = re.sub(r'\n\s*<meta property="og:image" content="assets/img/[^"]+">', "", html)
    html = re.sub(r'\n\s*<meta name="twitter:card" content="[^"]+">', "", html)

    # 7. Strip the editing comments. They describe how to change index.html and
    #    the assets folder, which is misleading inside a generated file.
    html = re.sub(r'\n?[ \t]*<!--(?!\[if).*?-->', "", html, flags=re.DOTALL)
    html = html.replace(
        "<head>",
        "<head>\n<!-- GENERATED FILE. Edit index.html, then re-run"
        " tools/build-standalone.py. Changes made here will be overwritten. -->",
        1,
    )

    leftover = re.findall(r'"(assets/[^"]+)"', html)
    if leftover:
        raise SystemExit("still referencing files on disk: %s" % sorted(set(leftover)))

    OUT.write_text(html)
    mb = OUT.stat().st_size / 1_000_000
    print("wrote %s (%.1f MB)" % (OUT.relative_to(ROOT), mb))
    if mb > 24:
        print("warning: too big to email as an attachment on most services")


if __name__ == "__main__":
    sys.exit(main())
