(function () {
  "use strict";

  var STORAGE_KEY = "yangmao_privacy_choice_v1";
  var ACCEPTED = "analytics";
  var ESSENTIAL = "essential";
  var GA_ID = "G-2C78TMMNY4";
  var BAIDU_ID = "5a215c4d20e9848b4a15ef5dd602d64e";
  var BYTEDANCE_SRC = "https://lf1-cdn-tos.bytegoofy.com/goofy/ttzz/push.js?de566e6ef1de0b221926cc924d964af7b5f3beb5809d0e0020d409059de975c0bc434964556b7d7129e9b750ed197d397efd7b0c6c715c1701396e1af40cec962b8d7c8c6655c9b00211740aa8a98e2e";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });

  function addStylesheet() {
    if (document.getElementById("privacyConsentStyles")) return;
    var link = document.createElement("link");
    link.id = "privacyConsentStyles";
    link.rel = "stylesheet";
    link.href = "/assets/privacy-consent.css?v=20261118-consent1";
    document.head.appendChild(link);
  }

  function addScript(id, src, attrs) {
    if (document.getElementById(id)) return;
    var script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    Object.keys(attrs || {}).forEach(function (key) {
      script.setAttribute(key, attrs[key]);
    });
    document.head.appendChild(script);
  }

  function detectAiPlatform() {
    var ref = String(document.referrer || "").toLowerCase();
    var ua = String(navigator.userAgent || "").toLowerCase();
    var search = String(window.location.search || "").toLowerCase();
    var combined = ref + " " + search + " " + ua;
    var rules = [
      ["deepseek", /deepseek\.com|deepseek/],
      ["doubao", /doubao\.com|bytedancewebview|toutiao|ttwebview/],
      ["yuanbao", /yuanbao\.tencent\.com|hunyuan\.tencent\.com|yuanbao/],
      ["wechat_workbot", /wxwork|wecom|work\.weixin\.qq\.com/],
      ["wechat", /micromessenger|weixin\.qq\.com/],
      ["chatgpt", /chatgpt\.com|chat\.openai\.com|oai-searchbot|gptbot/],
      ["codex", /\bcodex\b|openai-codex/],
      ["gemini", /gemini\.google\.com|bard\.google\.com|vertexbot/],
      ["claude", /claude\.ai|anthropic/],
      ["perplexity", /perplexity\.ai|perplexitybot/],
      ["kimi", /moonshot\.cn|kimi\.ai|kimi\.com/],
      ["copilot", /copilot\.microsoft\.com|bing\.com\/chat/],
      ["quark_qwen", /quark\.cn|qianwen|tongyi\.aliyun\.com/]
    ];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][1].test(combined)) return rules[i][0];
    }
    return "";
  }

  function isStrictOptInRegion() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return /^Europe\//i.test(tz);
    } catch (error) {
      return false;
    }
  }

  function loadAnalytics() {
    if (document.documentElement.dataset.analyticsLoaded === "true") return;
    document.documentElement.dataset.analyticsLoaded = "true";

    var aiPlatform = detectAiPlatform();
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    var gaConfig = { anonymize_ip: true };
    if (aiPlatform) {
      gaConfig.campaign_source = aiPlatform;
      gaConfig.campaign_medium = "ai_assistant";
    }
    window.gtag("config", GA_ID, gaConfig);
    if (aiPlatform) {
      window.gtag("event", "ai_referral_visit", {
        ai_platform: aiPlatform,
        referrer_url: document.referrer || "(in-app-or-direct)",
        landing_path: window.location.pathname
      });
    }
    addScript("googleAnalyticsScript", "https://www.googletagmanager.com/gtag/js?id=" + GA_ID);

    window._hmt = window._hmt || [];
    if (aiPlatform) {
      window._hmt.push(["_trackEvent", "ai_referral", aiPlatform, window.location.pathname]);
    }
    addScript("baiduAnalyticsScript", "https://hm.baidu.com/hm.js?" + BAIDU_ID);
    addScript("ttzz", BYTEDANCE_SRC);
  }

  function readChoice() {
    try {
      var choice = window.localStorage.getItem(STORAGE_KEY);
      return choice === ACCEPTED || choice === ESSENTIAL ? choice : null;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch (error) {
      // The current page still respects the user's choice when storage is unavailable.
    }
  }

  function clearAnalyticsCookies() {
    var host = window.location.hostname;
    var rootDomain = host.split(".").slice(-2).join(".");
    var domains = ["", host, "." + host, rootDomain, "." + rootDomain];
    document.cookie.split(";").forEach(function (item) {
      var name = item.split("=")[0].trim();
      if (!/^(_ga|_gid|_gat|Hm_lvt_|Hm_lpvt_)/.test(name)) return;
      domains.forEach(function (domain) {
        document.cookie = name + "=; Max-Age=0; path=/" + (domain ? "; domain=" + domain : "") + "; SameSite=Lax";
      });
    });
  }

  function closePanel() {
    var panel = document.getElementById("privacyConsentPanel");
    if (panel) panel.remove();
  }

  function choose(choice) {
    saveChoice(choice);
    if (choice === ACCEPTED) {
      loadAnalytics();
    } else {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      clearAnalyticsCookies();
      if (document.documentElement.dataset.analyticsLoaded === "true") {
        window.location.reload();
        return;
      }
    }
    closePanel();
    window.dispatchEvent(new CustomEvent("yangmao:privacy-choice", { detail: { choice: choice } }));
  }

  function openPanel() {
    addStylesheet();
    closePanel();
    var panel = document.createElement("section");
    panel.id = "privacyConsentPanel";
    panel.className = "privacy-consent";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "privacyConsentTitle");
    panel.innerHTML = [
      '<div class="privacy-consent-copy">',
      '<h2 id="privacyConsentTitle">隐私与统计设置</h2>',
      '<p>本站仅在您同意后加载 Google Analytics、百度统计和头条搜索推送，用于了解页面使用情况；当前未加载广告，也不会因拒绝统计而影响活动查询。</p>',
      '<a href="/privacy.html">查看隐私政策</a>',
      '</div>',
      '<div class="privacy-consent-actions">',
      '<button type="button" class="privacy-consent-btn is-secondary" data-privacy-choice="essential">仅使用必要功能</button>',
      '<button type="button" class="privacy-consent-btn is-primary" data-privacy-choice="analytics">同意统计</button>',
      '</div>'
    ].join("");
    panel.addEventListener("click", function (event) {
      var button = event.target.closest("[data-privacy-choice]");
      if (button) choose(button.getAttribute("data-privacy-choice"));
    });
    document.body.appendChild(panel);
    var activeChoice = readChoice();
    var activeButton = panel.querySelector('[data-privacy-choice="' + (activeChoice || ESSENTIAL) + '"]');
    if (activeButton) activeButton.focus({ preventScroll: true });
  }

  function addSettingsButton() {
    if (document.querySelector("[data-open-privacy-settings]")) return;
    var target = document.querySelector(".radar-footer-links:last-of-type") ||
      document.querySelector(".site-footer-bottom") || document.querySelector("footer");
    if (!target) return;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "privacy-settings-link";
    button.setAttribute("data-open-privacy-settings", "true");
    button.textContent = "Cookie设置";
    button.addEventListener("click", openPanel);
    target.appendChild(button);
  }

  function initialize() {
    addStylesheet();
    addSettingsButton();
    var choice = readChoice();
    if (choice === ACCEPTED) {
      loadAnalytics();
    } else if (!choice) {
      if (isStrictOptInRegion()) {
        openPanel();
      } else {
        loadAnalytics();
      }
    }
  }

  window.YangmaoPrivacy = {
    open: openPanel,
    getChoice: readChoice
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
