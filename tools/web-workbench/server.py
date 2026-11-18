#!/usr/bin/env python3
"""Private mobile operations for the website's independent Black Friday catalogue."""

import hashlib
import hmac
import json
import os
import re
import subprocess
from dataclasses import dataclass, field
from datetime import datetime, timezone
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen

PREFIX = "/web-activities/"
TOPIC = "activities/topics/black-friday-2026.html"
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
ASSETS = Path(__file__).parent
REPO = Path(os.environ.get("WEBOPS_CHECKOUT", "/var/lib/yangmao-webops/site"))
ORIGIN = os.environ.get("WEBOPS_ORIGIN", "https://haoyangmao.tmhzz.com")
AUTH_URL = os.environ.get("WEBOPS_AUTH_URL", "http://127.0.0.1:3210/api/auth/session")
SITE_URL = os.environ.get("WEBOPS_SITE_URL", "https://bank.vooqqqm.com")
BRANCH = os.environ.get("WEBOPS_BRANCH", "main")
WRITES_ENABLED = os.environ.get("WEBOPS_WRITES_ENABLED") == "1"
GIT_LOCK = Lock()
GIT_ENV = {**os.environ, "GIT_TERMINAL_PROMPT": "0"}


class Problem(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


@dataclass
class Offer:
    fields: dict
    start: int
    end: int = 0
    heading: list = field(default_factory=list)

    @property
    def id(self):
        return self.fields["id"]

    @property
    def title(self):
        return " ".join("".join(self.heading).split())

    def public(self, html):
        return {
            "id": self.id,
            "title": self.title,
            "merchant": self.fields.get("data-merchant", ""),
            "market": self.fields.get("data-market", ""),
            "until": self.fields.get("data-valid-to", ""),
            "revision": hashlib.sha256(html[self.start:self.end].encode()).hexdigest(),
        }


class Topic(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.offsets = [0] + [match.end() for match in re.finditer("\n", html)]
        self.offers = {}
        self.pending = None
        self.depth = 0
        self.heading = False
        self.feed(html)
        self.close()
        if self.pending:
            raise ValueError("Unclosed website offer")

    def absolute_position(self):
        line, col = self.getpos()
        return self.offsets[line - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag == "li":
            if self.pending:
                self.depth += 1
            else:
                fields = dict(attrs)
                if "data-campaign" in fields and "data-website-only" in fields:
                    if not SLUG.fullmatch(fields.get("id") or ""):
                        raise ValueError("Invalid website offer ID")
                    self.pending = Offer(fields, self.absolute_position())
                    self.depth = 1
        if tag == "h2" and self.pending and not self.pending.heading:
            self.heading = True

    def handle_data(self, data):
        if self.heading and self.pending:
            self.pending.heading.append(data)

    def handle_endtag(self, tag):
        if tag == "h2":
            self.heading = False
        if tag != "li" or not self.pending:
            return
        self.depth -= 1
        if self.depth:
            return
        offer = self.pending
        offer.end = self.absolute_position()
        if not offer.title or offer.id in self.offers:
            raise ValueError("Missing title or duplicate website offer")
        self.offers[offer.id] = offer
        self.pending = None
        self.heading = False


def read_offers(html):
    topic = Topic(html)
    # HTMLParser reports the location of the closing tag start.
    for offer in topic.offers.values():
        ending = re.match(r"</li\s*>", html[offer.end:offer.end + 12], re.I)
        if not ending:
            raise ValueError("Invalid closing tag")
        offer.end += ending.end()
    return topic.offers


def remove_offer(html, offer_id, revision):
    before = read_offers(html)
    offer = before.get(offer_id)
    if not offer:
        raise Problem(404, "这条网页活动已不存在。")
    if not hmac.compare_digest(offer.public(html)["revision"], revision):
        raise Problem(409, "活动内容已变更，请刷新后重新确认。")
    start, end = offer.start, offer.end
    line_start = html.rfind("\n", 0, start) + 1
    if not html[line_start:start].strip() and html[end:end + 1] == "\n":
        start, end = line_start, end + 1
    updated = html[:start] + html[end:]
    after = read_offers(updated)
    if list(after) != [key for key in before if key != offer_id]:
        raise ValueError("Unexpected catalogue change")
    return updated


def git(*args, timeout=25, check=True):
    return subprocess.run(
        ["/usr/bin/git", *args], cwd=REPO, env=GIT_ENV,
        stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        encoding="utf-8", timeout=timeout, check=check,
    )


def latest():
    git("fetch", "--no-tags", "--depth=1", "origin", f"refs/heads/{BRANCH}")
    return git("rev-parse", "FETCH_HEAD").stdout.strip()


def published_html():
    stamp = int(datetime.now(timezone.utc).timestamp())
    request = Request(f"{SITE_URL}/{TOPIC}?ops={stamp}", headers={
        "User-Agent": "YangmaoWebWorkbench/1.0", "Cache-Control": "no-cache",
    })
    with urlopen(request, timeout=8) as response:
        return response.read(2_000_000).decode("utf-8")


def delete_offer(offer_id, revision):
    if not WRITES_ENABLED:
        raise Problem(503, "网页提交权限尚未启用。")
    with GIT_LOCK:
        base = latest()
        html = git("show", f"{base}:{TOPIC}").stdout
        updated = remove_offer(html, offer_id, revision)
        git("checkout", "--force", "--detach", base)
        (REPO / TOPIC).write_text(updated, encoding="utf-8")
        git("add", "--", TOPIC)
        if git("diff", "--cached", "--name-only").stdout.splitlines() != [TOPIC]:
            raise ValueError("Refusing a commit outside the website catalogue")
        git("-c", "user.name=羊毛助手网页工作台",
            "-c", "user.email=web-workbench@vooqqqm.com",
            "commit", "-m", f"Remove website offer {offer_id}", "--", TOPIC)
        commit = git("rev-parse", "HEAD").stdout.strip()
        try:
            result = git("push", "origin", f"{commit}:refs/heads/{BRANCH}", timeout=35, check=False)
            if result.returncode == 0:
                return commit
        except subprocess.TimeoutExpired:
            pass
        # Read back remote state before reporting failure after an interrupted push.
        current = latest()
        if current == commit:
            return commit
        if current != base:
            raise Problem(409, "网页目录已更新，请刷新后重新确认。")
        raise Problem(502, "网页提交失败，活动仍在目录内。请稍后重试。")


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, data, mime="application/json; charset=utf-8"):
        if isinstance(data, dict):
            data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy",
                         "default-src 'none'; script-src 'self'; style-src 'self'; "
                         "connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(data)

    def session(self, require_csrf=False):
        cookie = self.headers.get("Cookie")
        if not cookie:
            raise Problem(401, "请先登录。")
        try:
            request = Request(AUTH_URL, headers={"Cookie": cookie})
            with urlopen(request, timeout=4) as response:
                session = json.load(response)
        except HTTPError as error:
            if error.code == 401:
                raise Problem(401, "登录已过期，请重新登录。") from error
            raise Problem(502, "暂时无法校验登录状态。") from error
        except (URLError, TimeoutError, ValueError) as error:
            raise Problem(502, "暂时无法校验登录状态。") from error
        token = session.get("csrfToken")
        if session.get("ok") is not True or not isinstance(token, str):
            raise Problem(401, "请先登录。")
        if require_csrf:
            if self.headers.get("Origin") != ORIGIN or not hmac.compare_digest(
                token.encode(), self.headers.get("X-CSRF-Token", "").encode()
            ):
                raise Problem(403, "请求验证失败，请重新打开工作台。")

    def dispatch(self):
        target = urlsplit(self.path)
        if not target.path.startswith(PREFIX):
            raise Problem(404, "页面不存在。")
        route = target.path[len(PREFIX):]
        if self.command == "GET":
            files = {
                "": ("index.html", "text/html; charset=utf-8"),
                "workbench.css": ("workbench.css", "text/css; charset=utf-8"),
                "workbench.js": ("workbench.js", "text/javascript; charset=utf-8"),
            }
            if route in files:
                file_name, mime = files[route]
                self.reply(200, (ASSETS / file_name).read_bytes(), mime)
                return
            self.session()
            if route == "api/offers":
                with GIT_LOCK:
                    html = git("show", f"{latest()}:{TOPIC}").stdout
                    offers = [offer.public(html) for offer in read_offers(html).values()]
                self.reply(200, {"offers": offers, "writesEnabled": WRITES_ENABLED})
                return
            if route == "api/status":
                offer_id = parse_qs(target.query).get("id", [""])[0]
                if not SLUG.fullmatch(offer_id):
                    raise Problem(400, "活动编号无效。")
                self.reply(200, {"removed": offer_id not in read_offers(published_html())})
                return
        elif self.command == "POST" and route == "api/delete":
            self.session(require_csrf=True)
            if self.headers.get_content_type() != "application/json":
                raise Problem(415, "请求格式无效。")
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 1024:
                raise Problem(400, "请求格式无效。")
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise Problem(400, "请求格式无效。")
            offer_id, revision = data.get("id"), data.get("revision")
            if not isinstance(offer_id, str) or not SLUG.fullmatch(offer_id):
                raise Problem(400, "活动编号无效。")
            if not isinstance(revision, str) or not re.fullmatch(r"[0-9a-f]{64}", revision):
                raise Problem(400, "活动版本无效。")
            commit = delete_offer(offer_id, revision)
            self.reply(202, {"commit": commit, "id": offer_id})
            return
        raise Problem(404, "页面不存在。")

    def handle_request(self):
        try:
            self.dispatch()
        except Problem as error:
            self.reply(error.status, {"message": error.message})
        except (ValueError, TypeError) as error:
            self.log_error("Validation failure: %s", type(error).__name__)
            self.reply(400, {"message": "请求或活动目录格式无效。"})
        except (OSError, subprocess.SubprocessError) as error:
            self.log_error("Operation failure: %s", type(error).__name__)
            self.reply(502, {"message": "暂时无法读取或提交网页数据，请稍后重试。"})

    do_GET = handle_request
    do_POST = handle_request


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", int(os.environ.get("WEBOPS_PORT", "18765"))), Handler).serve_forever()
