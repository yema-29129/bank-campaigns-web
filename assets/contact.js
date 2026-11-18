(function () {
  "use strict";

  var QR_WEBP = "/assets/group-wechat-qr.webp?v=20261118-contactfix1";
  var QR_ORIGINAL = "/assets/group-wechat-qr.png?v=20261118-contactfix1";
  var lastQrTrigger = null;

  function businessNavigation(event) {
    var link = event.currentTarget;
    var destination = link && link.getAttribute("href");
    if (!destination) return;
    event.preventDefault();
    window.location.assign(destination);
  }

  function setQrExpanded(expanded) {
    document.querySelectorAll("[data-open-group-qr]").forEach(function (trigger) {
      trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  function ensureQrModal() {
    var modal = document.getElementById("groupWechatQrModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "groupWechatQrModal";
    modal.className = "mp-qr-modal hidden";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="mp-qr-backdrop" data-close-group-qr="true"></div>',
      '<div class="mp-qr-dialog is-contact-qr contact-group-qr-dialog" role="dialog" aria-modal="true" aria-labelledby="groupWechatQrTitle">',
      '<picture><source srcset="' + QR_WEBP + '" type="image/webp"><img src="' + QR_ORIGINAL + '" width="2470" height="3293" alt="微信群二维码"></picture>',
      '<p class="mp-qr-title" id="groupWechatQrTitle">微信群二维码</p>',
      '<p class="mp-qr-hint">微信内可长按图片识别，或使用另一部手机扫一扫。</p>',
      '<a class="contact-qr-original-link" href="' + QR_ORIGINAL + '">识别困难时打开原图</a>',
      '<button type="button" class="mp-qr-close" data-close-group-qr="true">关闭</button>',
      '</div>'
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  function openQrModal(trigger) {
    var modal = ensureQrModal();
    lastQrTrigger = trigger || null;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-open-contact-qr");
    setQrExpanded(true);
    var closeButton = modal.querySelector("[data-close-group-qr]");
    if (closeButton) closeButton.focus({ preventScroll: true });
  }

  function closeQrModal() {
    var modal = document.getElementById("groupWechatQrModal");
    if (!modal || modal.classList.contains("hidden")) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-open-contact-qr");
    setQrExpanded(false);
    if (lastQrTrigger) lastQrTrigger.focus({ preventScroll: true });
  }

  function initialize() {
    document.querySelectorAll("[data-business-link]").forEach(function (link) {
      link.addEventListener("click", businessNavigation);
    });

    document.addEventListener("click", function (event) {
      var qrTrigger = event.target.closest("[data-open-group-qr]");
      if (qrTrigger) {
        event.preventDefault();
        openQrModal(qrTrigger);
        return;
      }
      if (event.target.closest("[data-close-group-qr]")) closeQrModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeQrModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
