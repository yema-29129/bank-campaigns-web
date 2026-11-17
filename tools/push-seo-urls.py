#!/usr/bin/env python3
"""Push public URLs from sitemap.xml to IndexNow (Bing/AI search) and Baidu API.

Usage:
  python3 tools/push-seo-urls.py
"""

import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

SITE = "https://bank.vooqqqm.com"
INDEXNOW_KEY = "aa625855966a884521e7ea6c7c8aa02b3409b011"
BAIDU_TOKEN = "PbcUSdVrdgkKed55"


def load_sitemap_urls(sitemap_path: Path):
    root = ET.fromstring(sitemap_path.read_text(encoding="utf-8"))
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [el.text for el in root.findall("sm:url/sm:loc", ns) if el.text]
    for extra in (f"{SITE}/llms.txt", f"{SITE}/llms-full.txt", f"{SITE}/activities/feed.json"):
        if extra not in urls:
            urls.append(extra)
    return urls


def push_indexnow(urls):
    payload = json.dumps({
        "host": "bank.vooqqqm.com",
        "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE}/{INDEXNOW_KEY}.txt",
        "urlList": urls,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        print(f"[IndexNow] HTTP {resp.status} — pushed {len(urls)} URLs")


def push_baidu(urls, limit=10):
    batch = [u for u in urls if not u.endswith((".txt", ".json"))][:limit]
    body = "\n".join(batch).encode("utf-8")
    req = urllib.request.Request(
        f"http://data.zz.baidu.com/urls?site={SITE}&token={BAIDU_TOKEN}",
        data=body,
        headers={"Content-Type": "text/plain"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(f"[Baidu API] HTTP {resp.status} — {resp.read().decode('utf-8', errors='replace')}")
    except urllib.error.HTTPError as exc:
        print(f"[Baidu API] HTTP {exc.code} — {exc.read().decode('utf-8', errors='replace')}")


def main():
    root_dir = Path(__file__).resolve().parents[1]
    sitemap = root_dir / "sitemap.xml"
    if not sitemap.exists():
        sitemap = root_dir / "site" / "sitemap.xml"
    urls = load_sitemap_urls(sitemap)
    push_indexnow(urls)
    push_baidu(urls)


if __name__ == "__main__":
    main()
