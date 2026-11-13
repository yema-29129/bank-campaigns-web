#!/usr/bin/env python3
"""Build the pilot activity directory and detail pages from the public feed.

From the site checkout:
  curl --fail --silent --show-error https://mini.vooqqqm.com/api/campaigns.php -o /tmp/bank-seo-feed.json
  python3 tools/generate-activity-pages.py /tmp/bank-seo-feed.json --as-of YYYY-MM-DD

Review changed activity rules and source URLs before publishing. This command
also updates sitemap.xml to match the published selection.
"""

import argparse
from datetime import date
from html import escape
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

SITE = "https://bank.vooqqqm.com"
SITE_NAME = "好羊毛银行活动站"
DIRECTORY = f"{SITE}/activities/"
OUTPUT = Path(__file__).resolve().parents[1] / "activities"
SELECTED_IDS = (
    "489", "488", "486", "485", "480", "477", "476", "466", "462", "457",
    "446", "424", "411", "408", "407", "400", "398", "386", "382", "363",
    "331", "323", "288", "197", "165",
)
SOURCE_HOSTS = frozenset({
    "www.icbcasia.com", "www.dbs.com.hk", "creditcard.ecitic.com", "ccb.cn",
    "www.unionpayintl.com", "www.zyebank.com.cn", "www.abchina.com",
    "www.hangseng.com", "www.bochk.com", "bank.za.group", "www.spdbccc.com.cn",
    "www.psbc.com", "creditcard.cib.com.cn", "www.yantaibank.net",
    "cschannel.alipay.com", "creditcard.cmbc.com.cn", "www.cqcbank.com",
})


def safe_source(url):
    try:
        parsed = urlsplit(url)
    except ValueError:
        return False
    return (
        parsed.scheme == "https"
        and parsed.netloc.lower() in SOURCE_HOSTS
        and bool(parsed.path and parsed.path != "/")
        and not any(char.isspace() or ord(char) < 32 for char in url)
    )


def select_activities(feed, as_of):
    if feed.get("code") not in (0, 200):
        raise ValueError("The campaign feed reported an error.")
    by_id = {str(row["id"]): row for row in feed["data"]}
    selected = []
    for activity_id in SELECTED_IDS:
        row = by_id[activity_id]
        start = date.fromisoformat(row["validFrom"])
        end = date.fromisoformat(row["validTo"])
        if not start <= as_of <= end:
            raise ValueError(f"Activity {activity_id} is outside its published dates.")

        entry = {key: (row.get(key) or "").strip() for key in (
            "title", "desc", "bankName", "awardDesc", "pathDesc",
            "region", "consumeChannel", "channel",
        )}
        if not all(entry[key] for key in ("title", "desc", "bankName", "awardDesc", "pathDesc")):
            raise ValueError(f"Activity {activity_id} lacks a title, issuer, summary, rules or instructions.")

        sources = tuple(dict.fromkeys((row.get("pathUrl") or "").split()))
        if not sources or not all(safe_source(url) for url in sources):
            raise ValueError(f"Activity {activity_id} needs a review of its source links.")
        entry.update(
            id=activity_id, validFrom=start.isoformat(), validTo=end.isoformat(),
            lastmod=date.fromisoformat(row["updatedAt"][:10]).isoformat(), sources=sources,
        )
        selected.append(entry)
    return selected


def document(title, summary, url, kind, body, lastmod=None):
    page_title = f"{title} | {SITE_NAME}"
    schema = {
        "@context": "https://schema.org",
        "@type": kind,
        "name": title,
        "description": summary,
        "url": url,
        "inLanguage": "zh-CN",
        "isPartOf": {"@type": "WebSite", "name": SITE_NAME, "url": f"{SITE}/"},
    }
    if lastmod:
        schema["dateModified"] = lastmod
    schema_text = json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c")
    og_type = "article" if lastmod else "website"
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(page_title)}</title>
  <meta name="description" content="{escape(summary)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="{url}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="{SITE_NAME}">
  <meta property="og:title" content="{escape(page_title)}">
  <meta property="og:description" content="{escape(summary)}">
  <meta property="og:url" content="{url}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/styles.css">
  <link rel="stylesheet" href="/activities/styles.css">
  <script type="application/ld+json">{schema_text}</script>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="site-brand" href="/">
        <span class="site-brand-mark" aria-hidden="true">薅</span>
        <span class="site-brand-copy"><strong>{SITE_NAME}</strong><small>微信立减金 / 信用卡返现 / 现金红包</small></span>
      </a>
      <nav class="site-nav" aria-label="主导航">
        <a class="site-nav-link" href="/">首页</a>
        <a class="site-nav-link" href="/#listTitle">全部活动</a>
        <a class="site-nav-link" href="/activities/">精选活动</a>
        <a class="site-nav-link" href="/contact.html">联系方式</a>
      </nav>
    </div>
  </header>

{body}

  <footer class="site-footer">
    <div class="site-footer-bottom">
      <span>© {SITE_NAME}</span>
      <a href="/about.html">关于我们</a>
      <a href="/terms.html">使用条款</a>
      <a href="/privacy.html">隐私政策</a>
      <a href="/disclaimer.html">免责声明</a>
    </div>
  </footer>
</body>
</html>
"""


def time_element(value):
    return f'<time datetime="{value}">{value}</time>'


def period(entry):
    return f'{time_element(entry["validFrom"])} 至 {time_element(entry["validTo"])}'


def prose(value):
    paragraphs = re.split(r"\n\s*\n", value.replace("\r\n", "\n").replace("\r", "\n"))
    return "\n".join(
        f'              <p class="detail-section-copy activity-copy">{escape(paragraph)}</p>'
        for paragraph in paragraphs
    )


def detail(entry):
    title = entry["title"]
    summary = entry["desc"]
    activity_id = entry["id"]
    sources = "\n".join(
        f'              <li><a class="detail-link" href="{escape(url)}">查看来源（{urlsplit(url).hostname}）</a></li>'
        for url in entry["sources"]
    )
    context = " · ".join(filter(None, (entry["region"], entry["consumeChannel"], entry["channel"])))
    context_markup = f'<p class="detail-desc">{escape(context)}</p>' if context else ""
    body = f"""  <div class="detail-shell">
    <header class="detail-topbar">
      <a class="ghost-btn" href="/activities/">返回精选活动</a>
    </header>
    <main class="detail-root">
      <article class="detail-card">
        <header class="detail-hero">
          <div class="detail-hero-copy">
            <span class="detail-bank-pill">{escape(entry["bankName"])}</span>
            <h1>{escape(title)}</h1>
            <p class="detail-desc">{escape(summary)}</p>
            {context_markup}
          </div>
          <div class="detail-metric-grid">
            <div class="detail-metric">
              <span class="detail-metric-label">活动时间</span>
              <strong class="detail-metric-value">{period(entry)}</strong>
            </div>
          </div>
        </header>
        <div class="detail-layout">
          <div class="detail-main">
            <section class="detail-section detail-section-emphasis">
              <div class="detail-section-head"><h2>获奖内容</h2></div>
{prose(entry["awardDesc"])}
            </section>
            <section class="detail-section">
              <div class="detail-section-head"><h2>活动路径</h2></div>
{prose(entry["pathDesc"])}
            </section>
          </div>
          <aside class="detail-side">
            <section class="detail-side-panel">
              <div class="detail-side-head"><h2>活动来源</h2></div>
              <ul class="activity-sources">
{sources}
              </ul>
              <p class="detail-section-copy">本站整理更新于 {time_element(entry["lastmod"])}。活动资格、名额和领取入口以官方规则为准。</p>
              <a class="detail-link" href="/detail.html?id={activity_id}">查看实时详情和活动图片</a>
            </section>
          </aside>
        </div>
      </article>
    </main>
  </div>"""
    return document(title, summary, f"{DIRECTORY}{activity_id}.html", "WebPage", body, entry["lastmod"])


def directory(entries):
    title = "精选银行活动"
    summary = "浏览银行及支付机构公开发布的优惠活动，查看活动时间、参与方式和官方来源。"
    cards = "\n".join(f"""        <li class="detail-section">
          <h2><a href="/activities/{entry["id"]}.html">{escape(entry["title"])}</a></h2>
          <p>{escape(entry["desc"])}</p>
          <p>{escape(entry["bankName"])} · {period(entry)}</p>
        </li>""" for entry in entries)
    body = f"""  <main class="info-shell">
    <section class="info-card">
      <h1>{title}</h1>
      <p>{summary}</p>
      <p><a href="/#listTitle">浏览和筛选全部活动</a></p>
      <ul class="activity-directory">
{cards}
      </ul>
    </section>
  </main>"""
    return document(title, summary, DIRECTORY, "CollectionPage", body)


def write_sitemap(entries):
    root = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in ("/", "/about.html", "/terms.html", "/privacy.html", "/disclaimer.html", "/contact.html", "/activities/"):
        ET.SubElement(ET.SubElement(root, "url"), "loc").text = f"{SITE}{path}"
    for entry in entries:
        url = ET.SubElement(root, "url")
        ET.SubElement(url, "loc").text = f'{DIRECTORY}{entry["id"]}.html'
        ET.SubElement(url, "lastmod").text = entry["lastmod"]
    ET.indent(root, space="  ")
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
    (OUTPUT.parent / "sitemap.xml").write_text(sitemap, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feed", type=Path)
    parser.add_argument("--as-of", required=True, type=date.fromisoformat)
    args = parser.parse_args()
    feed = json.loads(args.feed.read_text(encoding="utf-8"))
    entries = select_activities(feed, args.as_of)
    manifest = {
        "activities": [{key: row[key] for key in ("id", "lastmod", "validTo")} for row in entries],
    }
    manifest_path = OUTPUT / "manifest.json"
    previous_ids = set()
    if manifest_path.exists():
        previous = json.loads(manifest_path.read_text(encoding="utf-8"))
        previous_ids = {row["id"] for row in previous["activities"]}
    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / "index.html").write_text(directory(entries), encoding="utf-8")
    for entry in entries:
        (OUTPUT / f'{entry["id"]}.html').write_text(detail(entry), encoding="utf-8")
    for activity_id in previous_ids.difference(SELECTED_IDS):
        if re.fullmatch(r"[0-9]+", activity_id):
            (OUTPUT / f"{activity_id}.html").unlink(missing_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    write_sitemap(entries)
    print(f"Wrote {len(entries)} activity pages, the directory, and the sitemap.")


if __name__ == "__main__":
    main()
