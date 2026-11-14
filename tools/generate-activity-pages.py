#!/usr/bin/env python3
"""Build the activity directory and detail pages from the public feed.

From the site checkout:
  curl --fail --silent --show-error https://mini.vooqqqm.com/api/campaigns.php -o /tmp/bank-seo-feed.json
  python3 tools/generate-activity-pages.py /tmp/bank-seo-feed.json --as-of YYYY-MM-DD

Review the generated changes before publishing. Only complete, current rows
with approved sources enter the directory and sitemap. Previously published
URLs remain readable when a campaign ends or no longer has a valid feed entry.
"""

import argparse
from datetime import date
from html import escape
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

SITE = "https://bank.vooqqqm.com"
SITE_NAME = "好羊毛银行活动站"
DIRECTORY = f"{SITE}/activities/"
OUTPUT = Path(__file__).resolve().parents[1] / "activities"
SOURCE_HOSTS = frozenset({
    "www.icbcasia.com", "www.dbs.com.hk", "creditcard.ecitic.com", "ccb.cn",
    "www.unionpayintl.com", "www.zyebank.com.cn", "www.abchina.com",
    "www.hangseng.com", "www.bochk.com", "bank.za.group", "www.spdbccc.com.cn",
    "www.psbc.com", "creditcard.cib.com.cn", "www.yantaibank.net",
    "cschannel.alipay.com", "creditcard.cmbc.com.cn", "www.cqcbank.com",
})
# The banks use these hosts for public assets and supporting documents.
# Keep them separate from the approved primary activity sources.
SUPPORTING_DOCUMENT_HOSTS = frozenset({"v.icbc.com.cn", "cdn.zaticdn.com", "ccc.spdb.com.cn"})
EMBEDDED_SOURCE_HOSTS = SOURCE_HOSTS | SUPPORTING_DOCUMENT_HOSTS
MANUAL_REVIEW_IDS = frozenset({"354"})
TEXT_FIELDS = (
    "title", "desc", "bankName", "awardDesc", "pathDesc",
    "region", "consumeChannel", "channel",
)
REQUIRED_FIELDS = ("title", "desc", "bankName", "awardDesc", "pathDesc")
EMBEDDED_URL = re.compile(r'https?://[^\s<>"\u3000-\u303f\uff00-\uffef]+', re.IGNORECASE)
INDEX_ROBOTS = "index,follow,max-image-preview:large"
ARCHIVE_ROBOTS = "noindex,follow"
STATUS_MESSAGES = {
    "ended": "活动已结束。下方为历史资料，请查看精选活动目录了解近期优惠。",
    "upcoming": "活动尚未开始，实际参与日期请以官方规则为准。",
    "unavailable": "当前活动资料暂时无法核实。下方为此前发布的历史资料。",
}
STATUS_MARKER = "<!-- activity-status -->"


def safe_source(url, hosts=SOURCE_HOSTS, require_path=True):
    try:
        parsed = urlsplit(url)
    except ValueError:
        return False
    return (
        parsed.scheme == "https"
        and parsed.netloc.lower() in hosts
        and (not require_path or bool(parsed.path and parsed.path != "/"))
        and "\\" not in url
        and not any(char.isspace() or ord(char) < 32 for char in url)
    )


def parse_entry(activity_id, row, as_of):
    start = date.fromisoformat(row["validFrom"])
    end = date.fromisoformat(row["validTo"])
    lastmod = date.fromisoformat((row.get("updatedAtRaw") or row.get("updatedAt") or row["createdAt"])[:10])
    if start > end or lastmod > as_of:
        raise ValueError("Inconsistent activity dates.")

    entry = {key: (row.get(key) or "").strip() for key in TEXT_FIELDS}
    if not all(entry[key] for key in REQUIRED_FIELDS):
        raise ValueError("Incomplete public activity information.")

    sources = tuple(dict.fromkeys((row.get("pathUrl") or "").split()))
    if activity_id in MANUAL_REVIEW_IDS or not sources or not all(map(safe_source, sources)):
        raise ValueError("Source requires manual review.")
    for value in entry.values():
        if any(
            not safe_source(url.rstrip(").,;!?]"), EMBEDDED_SOURCE_HOSTS, require_path=False)
            for url in EMBEDDED_URL.findall(value)
        ):
            raise ValueError("Embedded URL requires manual review.")

    status = "ended" if end < as_of else "upcoming" if start > as_of else "current"
    entry.update(
        id=activity_id, validFrom=start.isoformat(), validTo=end.isoformat(),
        lastmod=lastmod.isoformat(), sources=sources, status=status,
    )
    return entry


def select_activities(feed, as_of):
    if not isinstance(feed, dict) or feed.get("code") not in (0, 200):
        raise ValueError("The campaign feed reported an error.")
    rows = feed.get("data")
    if not isinstance(rows, list) or not rows:
        raise ValueError("The campaign feed contains no rows.")

    selected = {}
    seen = set()
    rejected = 0
    for row in rows:
        activity_id = str(row.get("id", "")) if isinstance(row, dict) else ""
        if not re.fullmatch(r"[1-9][0-9]*", activity_id) or activity_id in seen:
            raise ValueError("The campaign feed contains an invalid or duplicate ID.")
        seen.add(activity_id)
        try:
            selected[activity_id] = parse_entry(activity_id, row, as_of)
        except (AttributeError, KeyError, TypeError, ValueError):
            rejected += 1
    return selected, rejected


def document(title, summary, url, kind, body, lastmod=None, indexable=True):
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
    robots = INDEX_ROBOTS if indexable else ARCHIVE_ROBOTS
    styles = "/assets/styles.css?v=20261115-telegram-detail" if kind == "WebPage" else "/assets/styles.css"
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(page_title)}</title>
  <meta name="description" content="{escape(summary)}">
  <meta name="robots" content="{robots}">
  <link rel="canonical" href="{url}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="{SITE_NAME}">
  <meta property="og:title" content="{escape(page_title)}">
  <meta property="og:description" content="{escape(summary)}">
  <meta property="og:url" content="{url}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="{styles}">
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
        f'                <p class="detail-section-copy activity-copy">{escape(paragraph)}</p>'
        for paragraph in paragraphs
    )


def status_notice(status):
    message = STATUS_MESSAGES.get(status)
    return f'<p class="detail-section">{message}</p>' if message else ""


def fact(label, value):
    return f"""            <div class="detail-metric">
              <dt class="detail-metric-label">{label}</dt>
              <dd class="detail-metric-value">{value}</dd>
            </div>"""


def detail(entry):
    title = entry["title"]
    summary = entry["desc"]
    activity_id = entry["id"]
    sources = "\n".join(
        f'                <li><a class="detail-link" href="{escape(url)}">查看来源（{urlsplit(url).hostname}）</a></li>'
        for url in entry["sources"]
    )
    facts = [fact("活动机构", escape(entry["bankName"])), fact("活动时间", period(entry))]
    for key, label in (("region", "适用地区"), ("consumeChannel", "消费场景"), ("channel", "支付渠道")):
        if entry[key]:
            facts.append(fact(label, escape(entry[key])))
    facts_markup = "\n".join(facts)
    status = entry["status"]
    body = f"""  <div class="detail-shell">
    <header class="detail-topbar">
      <a class="ghost-btn" href="/activities/">返回精选活动</a>
    </header>
    <aside class="telegram-subscribe">
      <p>信用卡返现、微信立减金和港卡优惠更新。</p>
      <a class="ghost-btn" href="https://t.me/yangmaozhushou">订阅 Telegram 优惠提醒</a>
    </aside>
    <main class="detail-root">
      <article class="detail-card">
        <header class="detail-hero">
          <div class="detail-hero-copy">
            <h1>{escape(title)}</h1>
            <p class="detail-desc">{escape(summary)}</p>
          </div>
          <dl class="detail-metric-grid">
{facts_markup}
          </dl>
        </header>
        {STATUS_MARKER}{status_notice(status)}
        <div class="detail-layout">
          <nav class="detail-section-nav" aria-label="活动详情目录">
            <p class="detail-section-nav-title">本页内容</p>
            <a href="#offer-details">优惠内容</a>
            <a href="#participation">参与方式</a>
            <a href="#activity-notes">官方来源</a>
            <a href="#telegram-reminder">Telegram 优惠提醒</a>
          </nav>
          <div class="detail-layout-content">
            <div class="detail-main">
              <section class="detail-section detail-section-emphasis" id="offer-details">
                <div class="detail-section-head"><h2>优惠内容与条件</h2></div>
{prose(entry["awardDesc"])}
              </section>
              <section class="detail-section" id="participation">
                <div class="detail-section-head"><h2>参与方式</h2></div>
{prose(entry["pathDesc"])}
              </section>
            </div>
            <aside class="detail-side">
              <section class="detail-side-panel" id="activity-notes">
                <div class="detail-side-head"><h2>官方来源</h2></div>
                <ul class="activity-sources">
{sources}
                </ul>
                <p class="detail-section-copy">本站整理更新于 {time_element(entry["lastmod"])}。活动资格、名额和领取入口以官方规则为准。</p>
                <a class="detail-link" href="/detail.html?id={activity_id}">查看实时详情和活动图片</a>
              </section>
              <aside class="telegram-subscribe detail-telegram-reminder" id="telegram-reminder" aria-label="订阅优惠更新">
                <p>信用卡返现、微信立减金和港卡优惠更新。</p>
                <a class="ghost-btn" href="https://t.me/yangmaozhushou">订阅 Telegram 优惠提醒</a>
              </aside>
            </aside>
          </div>
        </div>
      </article>
    </main>
  </div>"""
    return document(title, summary, f"{DIRECTORY}{activity_id}.html", "WebPage", body, entry["lastmod"], indexable=status == "current")


def preserve_detail(html, status):
    html = html.replace(f'content="{INDEX_ROBOTS}"', f'content="{ARCHIVE_ROBOTS}"', 1)
    # The marker makes this update idempotent on generated pages. The fallback
    # inserts the notice before the rules on pages from the original pilot.
    marker = STATUS_MARKER
    if marker not in html:
        html = html.replace('        <div class="detail-layout">', f'        {marker}\n        <div class="detail-layout">', 1)
    return re.sub(
        re.escape(marker) + r'(?:<p class="detail-section">[^<]*</p>)?',
        lambda _: marker + status_notice(status), html, count=1,
    )


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
      <p>共 {len(entries)} 项。活动名额、参与资格与有效期以官方公告为准。</p>
      <p><a href="/#listTitle">浏览和筛选全部活动</a></p>
      <ul class="activity-directory">
{cards}
      </ul>
    </section>
  </main>"""
    return document(title, summary, DIRECTORY, "CollectionPage", body)


def sitemap_xml(entries):
    root = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in ("/", "/about.html", "/terms.html", "/privacy.html", "/disclaimer.html", "/contact.html", "/activities/"):
        ET.SubElement(ET.SubElement(root, "url"), "loc").text = f"{SITE}{path}"
    for entry in entries:
        url = ET.SubElement(root, "url")
        ET.SubElement(url, "loc").text = f'{DIRECTORY}{entry["id"]}.html'
        ET.SubElement(url, "lastmod").text = entry["lastmod"]
    ET.indent(root, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feed", type=Path)
    parser.add_argument("--as-of", required=True, type=date.fromisoformat)
    args = parser.parse_args()
    feed = json.loads(args.feed.read_text(encoding="utf-8"))
    selected, rejected = select_activities(feed, args.as_of)
    current = [entry for entry in selected.values() if entry["status"] == "current"]
    current.sort(key=lambda entry: (entry["lastmod"], int(entry["id"])), reverse=True)
    if not current:
        raise ValueError("No current, complete activities with approved sources; published files are untouched.")

    manifest_path = OUTPUT / "manifest.json"
    previous = json.loads(manifest_path.read_text(encoding="utf-8"))["activities"] if manifest_path.exists() else []
    published = {entry["id"]: entry for entry in current}
    pages = {entry["id"]: detail(entry) for entry in current}
    for old in previous:
        activity_id = old["id"]
        if not re.fullmatch(r"[1-9][0-9]*", activity_id):
            raise ValueError("Invalid ID in the activity manifest.")
        if activity_id in published:
            continue
        if activity_id in selected:
            entry = selected[activity_id]
            pages[activity_id] = detail(entry)
        else:
            html = (OUTPUT / f"{activity_id}.html").read_text(encoding="utf-8")
            status = "ended" if date.fromisoformat(old["validTo"]) < args.as_of else "unavailable"
            entry = {**old, "status": status}
            pages[activity_id] = preserve_detail(html, status)
        published[activity_id] = entry

    manifest = {"activities": [
        {key: entry[key] for key in ("id", "lastmod", "validTo", "status")}
        for entry in published.values()
    ]}
    directory_html = directory(current)
    sitemap = sitemap_xml(current)
    OUTPUT.mkdir(exist_ok=True)
    for activity_id, html in pages.items():
        (OUTPUT / f"{activity_id}.html").write_text(html, encoding="utf-8")
    (OUTPUT / "index.html").write_text(directory_html, encoding="utf-8")
    (OUTPUT.parent / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(current)} current pages and {len(published) - len(current)} archived or unavailable pages, plus the directory and sitemap.")
    print(f"Skipped {rejected} feed rows with incomplete information or sources requiring review.", file=sys.stderr)


if __name__ == "__main__":
    main()
