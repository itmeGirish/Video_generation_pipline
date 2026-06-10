#!/usr/bin/env python3
"""
fetch_images.py — source real, license-safe images from the web for video bullets.

Part of the video_generation pipeline. Searches Openverse (CC / public-domain,
filtered to commercial-use + modification) or Wikimedia Commons, OR downloads a
specific URL you already located with the WebSearch tool. Every image is saved
with a JSON sidecar capturing license + attribution — required because the final
video is monetized and the YouTube description must credit each image.

stdlib only (no pip install). See rule 24 (web-image-sourcing) for the workflow.

USAGE
  # Search Openverse (default) — best for concepts / photos. Downloads N candidates:
  python storyboard/fetch_images.py --query "server room data center" \
      --out projects/layoffs_2026/public/img --name datacenter --count 6

  # Search Wikimedia Commons — best for logos / public-domain diagrams:
  python storyboard/fetch_images.py --query "Amazon logo" --source wikimedia \
      --out projects/layoffs_2026/public/img --name amazon_logo --count 4

  # Search Pexels — best for modern, production-quality people/tech photos.
  # Needs a free API key (instant): https://www.pexels.com/api/  → set PEXELS_API_KEY
  python storyboard/fetch_images.py --query "software engineer at desk" --source pexels \
      --out projects/layoffs_2026/public/img --name win_senior --count 6

  # Download a specific image you found via the WebSearch tool (record its license!):
  python storyboard/fetch_images.py \
      --url "https://upload.wikimedia.org/wikipedia/commons/.../Foo.png" \
      --out projects/layoffs_2026/public/img --name foo \
      --license "CC BY-SA 4.0" --attribution "Jane Doe / Wikimedia Commons"

AFTER IT RUNS
  1. Inspect the downloaded candidates with the Read tool (they are images).
  2. Keep the best one; delete the rejects AND their .json sidecars.
  3. Reference it in the bullet body as  [asset: img/<name>.png]  (rule 17).
  4. Fold every kept sidecar into projects/<name>/CREDITS.md for the description.
"""
import argparse
import json
import mimetypes
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Descriptive User-Agent — Wikimedia's API policy requires tool + contact identification.
UA = "VideoExplainerBot/1.0 (+https://github.com/itmeGirish/Video_generation_pipline) python-urllib"
OPENVERSE = "https://api.openverse.org/v1/images/"
WIKIMEDIA = "https://commons.wikimedia.org/w/api.php"
PEXELS = "https://api.pexels.com/v1/search"
OK_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
THROTTLE_SECONDS = 1.0   # polite delay between downloads — avoids HTTP 429 rate-limit
ROOT = Path(__file__).resolve().parents[1]   # video_explainer/ project root


def _load_dotenv():
    """Load KEY=VALUE lines from a .env (cwd or project root) into os.environ if
    unset. Lenient: tolerates 'export ' / '$env:' prefixes and surrounding quotes,
    so you can keep PEXELS_API_KEY in a .env file instead of exporting it each shell.
    Never prints values."""
    for env_path in (Path.cwd() / ".env", ROOT / ".env"):
        if not env_path.is_file():
            continue
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            for pre in ("export ", "$env:"):
                if key.startswith(pre):
                    key = key[len(pre):].strip()
            val = val.strip().strip("'\"")
            if key and key not in os.environ:
                os.environ[key] = val


def _fetch(url, timeout=30, retries=3, extra_headers=None):
    """GET with descriptive UA + retry/backoff on HTTP 429. Returns (bytes, content_type)."""
    headers = {"User-Agent": UA}
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, headers=headers)
    delay = 2.0
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read(), r.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            raise


def _get_json(url, extra_headers=None):
    body, _ = _fetch(url, timeout=30, extra_headers=extra_headers)
    return json.loads(body.decode("utf-8"))


def _ext_for(url, ctype):
    path_ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
    guess = (mimetypes.guess_extension(ctype or "") or "").lower()
    for cand in (path_ext, guess):
        if cand in OK_EXT:
            return ".jpg" if cand == ".jpeg" else cand
    return ".jpg"


def download(url, dest_base):
    data, ctype = _fetch(url, timeout=60)
    dest = dest_base.with_suffix(_ext_for(url, ctype))
    dest.write_bytes(data)
    return dest, len(data)


def write_sidecar(dest, meta):
    dest.with_suffix(".json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


def search_openverse(query, count):
    q = urllib.parse.urlencode(
        {"q": query, "page_size": count, "license_type": "commercial,modification"}
    )
    data = _get_json(f"{OPENVERSE}?{q}")
    results = []
    for it in data.get("results", []):
        lic = f'{(it.get("license") or "").upper()} {it.get("license_version") or ""}'.strip()
        results.append(
            {
                "image_url": it.get("url"),
                "title": it.get("title"),
                "creator": it.get("creator"),
                "license": lic,
                "license_url": it.get("license_url"),
                "source_url": it.get("foreign_landing_url"),
                "attribution": it.get("attribution"),
                "source": "openverse",
            }
        )
    return results


def search_wikimedia(query, count):
    q = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "prop": "imageinfo",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,  # File: namespace
            "gsrlimit": count,
            "iiprop": "url|extmetadata",
            "iiurlwidth": 1600,
        }
    )
    data = _get_json(f"{WIKIMEDIA}?{q}")
    pages = (data.get("query", {}) or {}).get("pages", {}) or {}
    results = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata", {}) or {}

        def val(key):
            return (em.get(key) or {}).get("value")

        results.append(
            {
                "image_url": ii.get("thumburl") or ii.get("url"),
                "title": p.get("title"),
                "creator": val("Artist"),
                "license": val("LicenseShortName"),
                "license_url": val("LicenseUrl"),
                "source_url": ii.get("descriptionurl"),
                "attribution": val("Attribution") or val("Artist"),
                "source": "wikimedia",
            }
        )
    return results


def search_pexels(query, count):
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        raise SystemExit(
            "PEXELS_API_KEY not set. Get a free key (instant) at https://www.pexels.com/api/ , then:\n"
            "  PowerShell:  $env:PEXELS_API_KEY = 'your_key'\n"
            "  bash:        export PEXELS_API_KEY=your_key"
        )
    q = urllib.parse.urlencode({"query": query, "per_page": count, "orientation": "landscape"})
    data = _get_json(f"{PEXELS}?{q}", extra_headers={"Authorization": key})
    results = []
    for p in data.get("photos", []):
        src = p.get("src", {}) or {}
        results.append(
            {
                "image_url": src.get("large2x") or src.get("original") or src.get("large"),
                "title": p.get("alt") or query,
                "creator": p.get("photographer"),
                "license": "Pexels License (free for commercial use)",
                "license_url": "https://www.pexels.com/license/",
                "source_url": p.get("url"),
                "attribution": f"Photo by {p.get('photographer')} on Pexels",
                "source": "pexels",
            }
        )
    return results


def fetch_one(query, dest_path, source="openverse", count=6):
    """Search `source` for `query`, download the FIRST working candidate to the
    exact `dest_path`, write a `.json` license sidecar beside it, and return the
    metadata dict. Returns None if no candidate could be downloaded.

    Used by build_video.py's auto-asset-resolution stage: when the script
    references [asset: img/foo.jpg] and that file is missing on disk, the
    pipeline calls this with the bullet description as `query` to source a
    license-safe image automatically. stdlib-only; never spawns the claude CLI.
    """
    _load_dotenv()
    finders = {"openverse": search_openverse, "wikimedia": search_wikimedia, "pexels": search_pexels}
    dest_path = Path(dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    results = finders[source](query, count)
    for r in results:
        url = r.get("image_url")
        if not url:
            continue
        try:
            data, _ctype = _fetch(url, timeout=60)
        except Exception:
            continue  # one bad candidate shouldn't abort — try the next
        dest_path.write_bytes(data)
        write_sidecar(dest_path, r)
        time.sleep(THROTTLE_SECONDS)
        return r
    return None


def run_direct(args, out_dir):
    dest, n = download(args.url, out_dir / args.name)
    write_sidecar(
        dest,
        {
            "image_url": args.url,
            "title": args.name,
            "license": args.license,
            "attribution": args.attribution,
            "source_url": args.source_url,
            "source": "direct-url",
        },
    )
    lic = args.license or "UNKNOWN — set --license before using in a monetized video!"
    print(f"Downloaded {dest}  ({n // 1024} KB)\n  license: {lic}")
    if not args.license:
        print("  WARNING: no --license recorded. Find and record it before shipping.")


def run_search(args, out_dir):
    finders = {"openverse": search_openverse, "wikimedia": search_wikimedia, "pexels": search_pexels}
    results = finders[args.source](args.query, args.count)
    if not results:
        print(
            f"No results for {args.query!r} on {args.source}. "
            f"Try the other --source or rephrase the query."
        )
        return
    print(f"{len(results)} candidates from {args.source} for {args.query!r}:\n")
    kept = 0
    for i, r in enumerate(results, 1):
        if not r.get("image_url"):
            continue
        try:
            dest, n = download(r["image_url"], out_dir / f"{args.name}-{i}")
        except Exception as e:  # one bad result shouldn't abort the batch
            print(f"  [{i}] download failed: {e}")
            continue
        write_sidecar(dest, r)
        kept += 1
        print(f"  [{i}] {dest.name}  ({n // 1024} KB)")
        print(f"       license: {r.get('license') or 'unknown'}")
        print(f"       credit : {r.get('attribution') or r.get('creator') or 'unknown'}")
        print(f"       source : {r.get('source_url') or r.get('image_url')}")
        time.sleep(THROTTLE_SECONDS)
    print(f"\nSaved {kept} candidate(s) + sidecars to {out_dir}")
    print(
        "NEXT: inspect with the Read tool, keep the best, delete rejects + their .json,\n"
        "      reference as [asset: <relpath>] in the bullet (rule 17),\n"
        "      fold kept sidecars into projects/<name>/CREDITS.md."
    )


def main():
    _load_dotenv()
    ap = argparse.ArgumentParser(description="License-safe web image sourcing for video bullets.")
    ap.add_argument("--query", help="search phrase (Openverse or Wikimedia)")
    ap.add_argument("--url", help="direct image URL to download (skips search)")
    ap.add_argument("--out", required=True, help="output dir, e.g. projects/<name>/public/img")
    ap.add_argument("--name", required=True, help="filename slug")
    ap.add_argument("--count", type=int, default=6, help="how many candidates to fetch (search mode)")
    ap.add_argument("--source", choices=["openverse", "wikimedia", "pexels"], default="openverse")
    ap.add_argument("--license", help="(--url mode) license string to record")
    ap.add_argument("--attribution", help="(--url mode) credit string to record")
    ap.add_argument("--source-url", dest="source_url", help="(--url mode) page the image came from")
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.url:
        run_direct(args, out_dir)
    elif args.query:
        run_search(args, out_dir)
    else:
        ap.error("provide --query (search) or --url (direct download)")


if __name__ == "__main__":
    main()
