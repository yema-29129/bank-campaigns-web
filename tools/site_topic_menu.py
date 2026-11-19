"""Render and verify the shared topic menu on public website pages."""

import argparse
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MENU_ASSETS = """  <link rel="stylesheet" href="/assets/site-topic-menu.css?v=1">
  <script defer src="/assets/site-topic-menu.js?v=1"></script>"""
NAV = re.compile(r'<nav class="site-nav"[^>]*>.*?</nav>', re.S)
MOBILE_NAV = re.compile(r'<nav class="radar-mobile-site-nav"[^>]*>.*?</nav>', re.S)
EXISTING_MENU = re.compile(
    r'(?m)^([ \t]*)<details class="site-topic-menu">\s*'
    r'<summary class="([^"]*)">优惠专题</summary>.*?</details>',
    re.S,
)
LEGACY_LINK = re.compile(
    r'(?m)^([ \t]*)<a class="(site-nav-link[^"]*)" href="(?:\./|/)activities/topics/"[^>]*>优惠专题</a>'
)


def topic_menu(link_class="site-nav-link", indent="        "):
    return "\n".join(indent + line for line in (
        '<details class="site-topic-menu">',
        f'  <summary class="{link_class}">优惠专题</summary>',
        '  <div class="site-topic-menu-links">',
        '    <a href="/activities/topics/">优惠专题首页</a>',
        '    <a href="/activities/">活动总目录</a>',
        '    <a href="/activities/topics/overseas-deals.html">海外活动</a>',
        '  </div>',
        '</details>',
    ))


def apply_menu(html):
    nav = NAV.search(html)
    if not nav:
        return html
    def update_nav(match):
        source = EXISTING_MENU.sub(lambda part: topic_menu(part[2], part[1]), match[0])
        return LEGACY_LINK.sub(lambda part: topic_menu(part[2], part[1]), source)

    html = NAV.sub(update_nav, html, count=1)
    html = MOBILE_NAV.sub(update_nav, html, count=1)
    if MENU_ASSETS not in html:
        html = html.replace("</head>", MENU_ASSETS + "\n</head>", 1)
    return html


def menu_is_valid(html, nav):
    menus = re.findall(r'<details class="site-topic-menu">.*?</details>', nav, re.S)
    if len(menus) != 1 or LEGACY_LINK.search(nav) or MENU_ASSETS not in html:
        return False
    expected = topic_menu().replace('class="site-nav-link"', 'class=""')
    actual = re.sub(r'<summary class="site-nav-link[^"]*"', '<summary class=""', menus[0], count=1)
    return [line.strip() for line in actual.splitlines()] == [line.strip() for line in expected.splitlines()]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Update existing public pages before checking them.")
    args = parser.parse_args()
    pages = subprocess.check_output(["git", "ls-files", "-z", "*.html"], cwd=ROOT).decode().split("\0")
    checked = changed = 0
    failed = []
    for name in filter(None, pages):
        path = ROOT / name
        html = path.read_text(encoding="utf-8")
        nav = NAV.search(html)
        if not nav:
            continue
        if args.apply:
            updated = apply_menu(html)
            if updated != html:
                path.write_text(updated, encoding="utf-8")
                html = updated
                changed += 1
            nav = NAV.search(html)
        checked += 1
        if not menu_is_valid(html, nav[0]):
            failed.append(name)
        if name == "index.html" and topic_menu("radar-mobile-site-link", "          ") not in html:
            failed.append(f"{name} (mobile menu)")
    if failed:
        raise SystemExit("Missing or inconsistent topic menu in:\n" + "\n".join(failed))
    print(f"Checked {checked} public navigation headers. Updated {changed} pages.")


if __name__ == "__main__":
    main()
