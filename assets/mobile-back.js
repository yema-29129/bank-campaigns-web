(function () {
  "use strict";

  var pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  var isHome = pathname === "/" || pathname === "/index.html";
  var hasDedicatedBack = pathname === "/detail.html";

  if (isHome || hasDedicatedBack) return;

  function pageConfig() {
    if (/^\/activities\/topics\/[^/]+\.html$/.test(pathname)) {
      return { label: "← 返回优惠专题", fallback: "/activities/topics/" };
    }
    if (pathname === "/activities/topics" || pathname === "/activities/topics/index.html") {
      return { label: "← 返回活动首页", fallback: "/" };
    }
    if (/^\/activities\/[1-9][0-9]*\.html$/.test(pathname)) {
      return { label: "← 返回活动列表", fallback: "/activities/" };
    }
    if (pathname === "/activities/archive.html") {
      return { label: "← 返回活动目录", fallback: "/activities/" };
    }
    if (pathname === "/activities" || pathname === "/activities/index.html") {
      return { label: "← 返回活动首页", fallback: "/" };
    }
    return { label: "← 返回活动首页", fallback: "/" };
  }

  function hasSameSiteReferrer() {
    if (!document.referrer) return false;
    try {
      return new URL(document.referrer).origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function addStylesheet() {
    if (document.getElementById("mobileBackStyles")) return;
    var link = document.createElement("link");
    link.id = "mobileBackStyles";
    link.rel = "stylesheet";
    link.href = "/assets/mobile-back.css?v=20261118-back1";
    document.head.appendChild(link);
  }

  function initialize() {
    if (document.querySelector(".site-mobile-back-wrap")) return;
    addStylesheet();

    var config = pageConfig();
    var wrap = document.createElement("div");
    wrap.className = "site-mobile-back-wrap";
    wrap.setAttribute("aria-label", "页面返回操作");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "site-mobile-back-btn";
    button.textContent = config.label;
    button.addEventListener("click", function () {
      if (hasSameSiteReferrer() && window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.assign(config.fallback);
    });

    wrap.appendChild(button);
    document.body.appendChild(wrap);
    document.body.classList.add("has-site-mobile-back");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
