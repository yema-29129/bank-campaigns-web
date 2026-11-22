#!/usr/bin/env python3
"""Push high-priority & recently updated URLs to IndexNow and Baidu API
without triggering Bing Webmaster Tools' large-batch throttling warning.

Usage:
  python3 tools/push-seo-urls.py [--max-indexnow 80]
"""

import argparse
import json
from pathlib import Path
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

SITE = "https://bank.vooqqqm.com"
INDEXNOW_KEY = "aa625855966a884521e7ea6c7c8aa02b3409b011"
BAIDU_TOKEN = "PbcUSdVrdgkKed55"


def load_prioritized_urls(sitemap_path: Path):
    root = ET.fromstring(sitemap_path.read_text(encoding="utf-8"))
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    core_and_topics = []
    dated_activities = []
    for u in root.findall("sm:url", ns):
        loc = (u.findtext("sm:loc", default="", namespaces=ns) or "").strip()
        lmod = (u.findtext("sm:lastmod", default="", namespaces=ns) or "").strip()
        if not loc:
            continue
        if "/activities/" not in loc or "/activities/topics/" in loc or loc.endswith("/activities/"):
            core_and_topics.append(loc)
        else:
            dated_activities.append((lmod, loc))
    dated_activities.sort(key=lambda item: item[0], reverse=True)
    ordered = list(core_and_topics)
    for extra in (f"{SITE}/llms.txt", f"{SITE}/llms-full.txt", f"{SITE}/activities/feed.json", f"{SITE}/rss.xml"):
        if extra not in ordered:
            ordered.append(extra)
    ordered.extend(loc for _, loc in dated_activities)
    return ordered


def push_indexnow(urls, max_urls=80):
    batch = urls[:max_urls]
    payload = json.dumps({
        "host": "bank.vooqqqm.com",
        "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE}/{INDEXNOW_KEY}.txt",
        "urlList": batch,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        print(f"[IndexNow] HTTP {resp.status} — pushed {len(batch)} priority/updated URLs")


def push_baidu(urls, limit=10):
    batch = [u for u in urls if not u.endswith((".txt", ".json", ".xml"))][:limit]
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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-indexnow", type=int, default=80)
    args = parser.parse_args()

    root_dir = Path(__file__).resolve().parents[1]
    sitemap = root_dir / "sitemap.xml"
    if not sitemap.exists():
        sitemap = root_dir / "site" / "sitemap.xml"
    urls = load_prioritized_urls(sitemap)
    push_indexnow(urls, max_urls=args.max_indexnow)
    push_baidu(urls)


if __name__ == "__main__":
    main()
