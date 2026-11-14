#!/usr/bin/env python3
"""Build the activity directory and detail pages from the public feed.

From the site checkout:
  curl --fail --silent --show-error https://mini.vooqqqm.com/api/campaigns.php -o /tmp/bank-seo-feed.json
  python3 tools/generate-activity-pages.py /tmp/bank-seo-feed.json --as-of YYYY-MM-DD

Review the generated changes before publishing. Complete public rows enter the
current or historical directory, sitemap, and AI feeds. Previously published
URLs remain readable but noindex when they no longer have a valid feed entry.
"""

import argparse
from datetime import date
from html import escape
import ipaddress
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

SITE = "https://bank.vooqqqm.com"
SITE_NAME = "羊毛助手Pro"
DIRECTORY = f"{SITE}/activities/"
OUTPUT = Path(__file__).resolve().parents[1] / "activities"
TEXT_FIELDS = (
    "title", "desc", "bankName", "awardDesc", "pathDesc",
    "region", "consumeChannel", "channel",
)
REQUIRED_FIELDS = ("title", "desc", "bankName")
EMBEDDED_URL = re.compile(r'https?://[^\s<>"\u3000-\u303f\uff00-\uffef]+', re.IGNORECASE)
INDEX_ROBOTS = "index,follow,max-image-preview:large"
ARCHIVE_ROBOTS = "noindex,follow"
STATUS_MESSAGES = {
    "ended": "活动已结束。下方为历史资料，请查看精选活动目录了解近期优惠。",
    "upcoming": "活动尚未开始，实际参与日期请以官方规则为准。",
    "unavailable": "当前活动资料暂时无法核实。下方为此前发布的历史资料。",
}
STATUS_MARKER = "<!-- activity-status -->"


def normalize_brand(value):
    return value.replace("好羊毛银行活动站", SITE_NAME).replace("好羊毛助手Pro", SITE_NAME)


def safe_source(url):
    try:
        parsed = urlsplit(url)
    except ValueError:
        return False
    host = parsed.hostname
    if (
        parsed.scheme != "https" or not host or parsed.username or parsed.password
        or "\\" in url or any(char.isspace() or ord(char) < 32 for char in url)
        or host == "localhost" or host.endswith(".local")
    ):
        return False
    try:
        if not ipaddress.ip_address(host).is_global:
            return False
    except ValueError:
        pass
    return True


def parse_entry(activity_id, row, as_of):
    start = date.fromisoformat(row["validFrom"])
    end = date.fromisoformat(row["validTo"])
    lastmod = date.fromisoformat((row.get("updatedAtRaw") or row.get("updatedAt") or row["createdAt"])[:10])
    if start > end or lastmod > as_of:
        raise ValueError("Inconsistent activity dates.")

    entry = {key: normalize_brand((row.get(key) or "").strip()) for key in TEXT_FIELDS}
    if not all(entry[key] for key in REQUIRED_FIELDS):
        raise ValueError("Incomplete public activity information.")
    if not entry["awardDesc"]:
        entry["awardDesc"] = "当前记录未提供完整优惠说明，请打开实时详情并以所属机构最新公告为准。"
    if not entry["pathDesc"]:
        entry["pathDesc"] = "当前记录未提供完整参与路径，请打开实时详情并以所属机构最新公告为准。"

    sources = tuple(dict.fromkeys(
        url.rstrip(").,;!?]")
        for url in EMBEDDED_URL.findall(row.get("pathUrl") or "")
        if safe_source(url.rstrip(").,;!?]"))
    ))

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
        "publisher": {"@type": "Organization", "name": SITE_NAME, "url": f"{SITE}/"},
    }
    if lastmod:
        schema["dateModified"] = lastmod
    schema_text = json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c")
    og_type = "article" if lastmod else "website"
    robots = INDEX_ROBOTS if indexable else ARCHIVE_ROBOTS
    styles = "/assets/styles.css?v=20261115-path-highlight" if kind == "WebPage" else "/assets/styles.css"
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
        <a class="site-nav-link" href="https://t.me/yangmaozhushou" target="_blank" rel="noopener noreferrer">Telegram 社群</a>
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
    if entry["sources"]:
        sources = "\n".join(
            f'                <li><a class="detail-link" href="{escape(url)}" rel="nofollow noopener">查看活动来源（{urlsplit(url).hostname}）</a></li>'
            for url in entry["sources"]
        )
    else:
        sources = "                <li>当前记录未提供可直接访问的公开来源链接，请以所属机构最新公告为准。</li>"
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
            <a href="#activity-notes">来源与核对</a>
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
                <div class="detail-side-head"><h2>活动来源与核对</h2></div>
                <ul class="activity-sources">
{sources}
                </ul>
                <p class="detail-section-copy">本站按公开活动信息整理，更新于 {time_element(entry["lastmod"])}。活动资格、名额和领取入口以所属机构最新规则为准。</p>
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
    # Feed-backed pages remain indexable after an activity ends so the site's
    # complete public archive can be found. The page itself carries a prominent
    # ended notice; only feed-missing preserved pages are noindex.
    return document(title, summary, f"{DIRECTORY}{activity_id}.html", "WebPage", body, entry["lastmod"], indexable=True)


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
    title = "当前银行优惠活动目录"
    summary = "浏览当前有效的银行及支付优惠活动，查看活动时间、优惠内容、参与方式和可用来源。"
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
      <p><a href="/#listTitle">返回首页筛选全部实时活动</a></p>
      <p><a href="/activities/archive.html">查看已结束的历史活动资料</a></p>
      <ul class="activity-directory">
{cards}
      </ul>
    </section>
  </main>"""
    return document(title, summary, DIRECTORY, "CollectionPage", body)


def archive_directory(entries):
    title = "已结束活动历史资料"
    summary = "浏览已结束的银行及支付优惠历史资料；所有条目均已失效，仅供查询和研究。"
    cards = "\n".join(f"""        <li class="detail-section">
          <p><strong>已结束</strong></p>
          <h2><a href="/activities/{entry["id"]}.html">{escape(entry["title"])}</a></h2>
          <p>{escape(entry["desc"])}</p>
          <p>{escape(entry["bankName"])} · {period(entry)}</p>
        </li>""" for entry in entries)
    body = f"""  <main class="info-shell">
    <section class="info-card">
      <h1>{title}</h1>
      <p>{summary}</p>
      <p><strong>以下 {len(entries)} 项活动均已结束，不代表当前仍可参与。</strong> 活动内容仅作历史资料，实际优惠请查看当前活动目录。</p>
      <p><a href="/activities/">返回当前活动目录</a></p>
      <ul class="activity-directory">
{cards}
      </ul>
    </section>
  </main>"""
    return document(title, summary, f"{DIRECTORY}archive.html", "CollectionPage", body)


def sitemap_xml(entries):
    root = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in ("/", "/about.html", "/terms.html", "/privacy.html", "/disclaimer.html", "/contact.html", "/activities/", "/activities/archive.html"):
        ET.SubElement(ET.SubElement(root, "url"), "loc").text = f"{SITE}{path}"
    for entry in entries:
        url = ET.SubElement(root, "url")
        ET.SubElement(url, "loc").text = f'{DIRECTORY}{entry["id"]}.html'
        ET.SubElement(url, "lastmod").text = entry["lastmod"]
    ET.indent(root, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"


def clean_line(value):
    return " ".join((value or "").split())


def ai_feed(entries, generated_on):
    payload = {
        "site": SITE_NAME,
        "url": f"{SITE}/",
        "generatedAt": generated_on.isoformat(),
        "total": len(entries),
        "activities": [{
            "id": entry["id"],
            "title": entry["title"],
            "summary": entry["desc"],
            "institution": entry["bankName"],
            "validFrom": entry["validFrom"],
            "validTo": entry["validTo"],
            "status": entry["status"],
            "offer": entry["awardDesc"],
            "participation": entry["pathDesc"],
            "url": f'{DIRECTORY}{entry["id"]}.html',
            "sources": list(entry["sources"]),
        } for entry in entries],
    }
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def llms_index(current, ended, generated_on):
    return f"""# {SITE_NAME}

> 整理银行、支付机构和日常消费场景的公开优惠。当前目录包含 {len(current)} 条有效活动，历史目录包含 {len(ended)} 条已结束活动，更新于 {generated_on.isoformat()}。每篇详情提供活动状态、活动时间、优惠内容、参与方式及可用来源；参与前请以所属机构最新规则为准。

## 活动数据

- [当前活动目录]({DIRECTORY}): 可直接读取的 HTML 活动目录，每项均链接到独立详情页。
- [已结束活动历史资料]({DIRECTORY}archive.html): 已明确标注失效状态的历史活动目录。
- [活动全文索引]({SITE}/llms-full.txt): 面向检索系统的当前及历史活动全文摘要。
- [结构化活动数据]({SITE}/activities/feed.json): 全部公开活动的 JSON 数据，包括状态、标题、机构、有效期、优惠内容、参与方式和详情网址。
- [全部活动与筛选]({SITE}/): 实时活动列表，可按银行、场景、卡种和时间筛选。
- [站点地图]({SITE}/sitemap.xml): 提交给搜索引擎的当前公开页面网址。

## 网站说明

- [关于我们]({SITE}/about.html): 网站定位与整理方式。
- [免责声明]({SITE}/disclaimer.html): 活动日期、参与资格和名额以所属机构公告为准。
"""


def llms_full(entries, generated_on):
    lines = [
        f"# {SITE_NAME}活动全文索引",
        "",
        f"> 更新于 {generated_on.isoformat()}，共 {len(entries)} 条公开活动，包含当前有效和已结束的历史资料。以下内容来自网站公开活动数据；资格、名额、时间和入口以所属机构最新规则为准。",
        "",
    ]
    for entry in entries:
        source_text = "、".join(entry["sources"]) if entry["sources"] else "当前记录未提供可直接访问的来源链接"
        lines.extend([
            f'## {clean_line(entry["title"])}',
            "",
            f'- 详情：{DIRECTORY}{entry["id"]}.html',
            f'- 状态：{"当前有效" if entry["status"] == "current" else "尚未开始" if entry["status"] == "upcoming" else "已结束"}',
            f'- 活动机构：{clean_line(entry["bankName"])}',
            f'- 有效期：{entry["validFrom"]} 至 {entry["validTo"]}',
            f'- 摘要：{clean_line(entry["desc"])}',
            f'- 优惠内容：{clean_line(entry["awardDesc"])}',
            f'- 参与方式：{clean_line(entry["pathDesc"])}',
            f'- 活动来源：{source_text}',
            "",
        ])
    return "\n".join(lines).rstrip() + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feed", type=Path)
    parser.add_argument("--as-of", required=True, type=date.fromisoformat)
    args = parser.parse_args()
    feed = json.loads(args.feed.read_text(encoding="utf-8"))
    selected, rejected = select_activities(feed, args.as_of)
    active = [entry for entry in selected.values() if entry["status"] in ("current", "upcoming")]
    ended = [entry for entry in selected.values() if entry["status"] == "ended"]
    active.sort(key=lambda entry: (entry["lastmod"], int(entry["id"])), reverse=True)
    ended.sort(key=lambda entry: (entry["validTo"], int(entry["id"])), reverse=True)
    public_entries = active + ended
    if not active:
        raise ValueError("No current, complete activities with approved sources; published files are untouched.")

    manifest_path = OUTPUT / "manifest.json"
    previous = json.loads(manifest_path.read_text(encoding="utf-8"))["activities"] if manifest_path.exists() else []
    published = dict(selected)
    pages = {entry["id"]: detail(entry) for entry in selected.values()}
    for old in previous:
        activity_id = old["id"]
        if not re.fullmatch(r"[1-9][0-9]*", activity_id):
            raise ValueError("Invalid ID in the activity manifest.")
        if activity_id in published:
            continue
        html = (OUTPUT / f"{activity_id}.html").read_text(encoding="utf-8")
        status = "ended" if date.fromisoformat(old["validTo"]) < args.as_of else "unavailable"
        entry = {**old, "status": status}
        pages[activity_id] = preserve_detail(html, status)
        published[activity_id] = entry

    manifest = {"activities": [
        {key: entry[key] for key in ("id", "lastmod", "validTo", "status")}
        for entry in published.values()
    ]}
    directory_html = directory(active)
    archive_html = archive_directory(ended)
    sitemap = sitemap_xml(public_entries)
    feed_json = ai_feed(public_entries, args.as_of)
    llms_text = llms_index(active, ended, args.as_of)
    llms_full_text = llms_full(public_entries, args.as_of)
    OUTPUT.mkdir(exist_ok=True)
    for activity_id, html in pages.items():
        (OUTPUT / f"{activity_id}.html").write_text(html, encoding="utf-8")
    (OUTPUT / "index.html").write_text(directory_html, encoding="utf-8")
    (OUTPUT / "archive.html").write_text(archive_html, encoding="utf-8")
    (OUTPUT / "feed.json").write_text(feed_json, encoding="utf-8")
    (OUTPUT.parent / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (OUTPUT.parent / "llms.txt").write_text(llms_text, encoding="utf-8")
    (OUTPUT.parent / "llms-full.txt").write_text(llms_full_text, encoding="utf-8")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(active)} current or upcoming pages, {len(ended)} public historical pages, and {len(published) - len(selected)} unavailable preserved pages, plus both directories, sitemap, JSON feed, and AI indexes.")
    print(f"Skipped {rejected} feed rows with invalid dates or missing core information.", file=sys.stderr)


if __name__ == "__main__":
    main()
