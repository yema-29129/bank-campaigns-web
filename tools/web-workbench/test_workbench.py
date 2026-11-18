import json
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server

FIXTURE = """<!doctype html>
<ul>
  <li id="first" data-website-only data-campaign data-merchant="店家" data-market="日本">
    <h2>网页黑五 &amp; <em>优惠</em></h2>
    <ul><li>规则 1</li><li>规则 2</li></ul>
  </li>
  <li id="shared" data-campaign><h2>小程序共用活动</h2></li>
  <li id="second" data-campaign data-website-only><h2>相邻网页活动</h2></li>
</ul>
"""


class AuthStub(BaseHTTPRequestHandler):
    def do_GET(self):
        allowed = self.headers.get("Cookie") == "hym_admin_session=example"
        self.send_response(200 if allowed else 401)
        self.end_headers()
        if allowed:
            self.wfile.write(b'{"ok":true,"csrfToken":"test-csrf"}')

    def log_message(self, *_args):
        pass


class WorkbenchTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        workdir = Path(temporary.name)
        origin = workdir / "origin.git"
        self.repo = workdir / "checkout"

        def git(*args, cwd=workdir):
            return subprocess.run(["git", *args], cwd=cwd, check=True,
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True).stdout

        git("init", "--bare", "--initial-branch=main", str(origin))
        git("clone", str(origin), str(self.repo))
        path = self.repo / server.TOPIC
        path.parent.mkdir(parents=True)
        path.write_text(FIXTURE, encoding="utf-8")
        git("add", server.TOPIC, cwd=self.repo)
        git("-c", "user.name=Test", "-c", "user.email=test@example.com",
            "commit", "-m", "Test fixture", cwd=self.repo)
        git("push", "origin", "main", cwd=self.repo)

        self.auth = self.start_server(AuthStub)
        self.workbench = self.start_server(server.Handler)
        self.settings = patch.multiple(
            server, REPO=self.repo, WRITES_ENABLED=True,
            AUTH_URL=f"http://127.0.0.1:{self.auth.server_port}/api/auth/session",
        )
        self.settings.start()
        self.addCleanup(self.settings.stop)
        self.url = f"http://127.0.0.1:{self.workbench.server_port}/web-activities/"
        self.revision = server.read_offers(FIXTURE)["first"].public(FIXTURE)["revision"]
        self.submitted = lambda: git("show", f"main:{server.TOPIC}", cwd=origin)

    def start_server(self, handler):
        http = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=http.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(http.server_close)
        self.addCleanup(http.shutdown)
        return http

    def api(self, suffix, data=None, auth=True, origin=None, csrf="test-csrf"):
        headers = {}
        if auth:
            headers["Cookie"] = "hym_admin_session=example"
        if data is not None:
            headers.update({"Content-Type": "application/json",
                            "Origin": server.ORIGIN if origin is None else origin, "X-CSRF-Token": csrf})
        try:
            with urlopen(Request(self.url + suffix, headers=headers,
                                 data=None if data is None else json.dumps(data).encode()), timeout=5) as r:
                return r.status, json.load(r)
        except HTTPError as error:
            return error.code, json.load(error)

    def test_listing_and_delete_never_include_shared_offers(self):
        status, data = self.api("api/offers")
        self.assertEqual(status, 200)
        self.assertTrue(data["writesEnabled"])
        self.assertEqual([offer["id"] for offer in data["offers"]], ["first", "second"])
        self.assertEqual(data["offers"][0]["title"], "网页黑五 & 优惠")
        self.assertEqual(self.api("api/delete", {"id": "shared", "revision": self.revision})[0], 404)
        status, data = self.api("api/delete", {"id": "first", "revision": self.revision})
        self.assertEqual(status, 202)
        self.assertRegex(data["commit"], r"^[0-9a-f]{40}$")
        html = self.submitted()
        self.assertEqual(list(server.read_offers(html)), ["second"])
        self.assertIn('<li id="shared" data-campaign>', html)
        self.assertNotIn("规则 2", html)

    def test_unauthorized_cross_origin_and_stale_requests_change_nothing(self):
        data = {"id": "first", "revision": self.revision}
        self.assertEqual(self.api("api/offers", auth=False)[0], 401)
        self.assertEqual(self.api("api/delete", data, auth=False)[0], 401)
        self.assertEqual(self.api("api/delete", data, origin="https://elsewhere.example")[0], 403)
        self.assertEqual(self.api("api/delete", data, csrf="wrong")[0], 403)
        self.assertEqual(self.api("api/delete", {**data, "revision": "f" * 64})[0], 409)
        self.assertEqual(self.submitted(), FIXTURE)

    def test_existing_web_only_catalogue_and_duplicate_fail_closed(self):
        actual = (Path(__file__).resolve().parents[2] / server.TOPIC).read_text(encoding="utf-8")
        self.assertGreater(len(server.read_offers(actual)), 0)
        with self.assertRaises(ValueError):
            server.read_offers(FIXTURE + FIXTURE)


if __name__ == "__main__":
    unittest.main()
