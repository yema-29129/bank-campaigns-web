const API_BASE = 'https://mini.vooqqqm.com/api';
const DETAIL_LOAD_TIMEOUT = 12000;
const GROUP_QR_URL = 'https://github.com/yema-29129/bank-campaigns-web/blob/main/assets/group-wechat-qr.png?raw=true';

const POSTER_FIELDS = [
  'posterUrl',
  'posterPath',
  'poster',
  'imageUrl',
  'imagePath',
  'image',
  'qrCodeUrl',
  'qrCodePath',
  'qrCode',
  'qrcodeUrl',
  'qrcodePath',
  'qrcode',
  'poster_url',
  'poster_path',
  'image_url',
  'image_path',
  'qr_code_url',
  'qr_code_path',
  'qrcode_url',
  'qrcode_path'
];

const params = new URLSearchParams(window.location.search);
const campaignId = params.get('id');

const els = {
  root: document.getElementById('detailRoot'),
  loading: document.getElementById('detailLoading'),
  error: document.getElementById('detailError'),
  errorMessage: document.getElementById('detailErrorMessage'),
  retry: document.getElementById('detailRetryBtn'),
  shareDock: document.getElementById('shareDock'),
  shareSheet: document.getElementById('shareSheet'),
  shareDockBtn: document.getElementById('shareDockBtn'),
  sharePreview: document.getElementById('sharePreview'),
  shareSystemBtn: document.getElementById('shareSystemBtn'),
  shareCopyTextBtn: document.getElementById('shareCopyTextBtn'),
  shareCopyLinkBtn: document.getElementById('shareCopyLinkBtn'),
  lightbox: document.getElementById('imageLightbox'),
  lightboxImage: document.getElementById('lightboxImage'),
  lightboxError: document.getElementById('lightboxError'),
  lightboxRawLink: document.getElementById('lightboxRawLink'),
  lightboxErrorTitle: document.getElementById('lightboxErrorTitle'),
  lightboxErrorText: document.getElementById('lightboxErrorText')
};

let currentLightboxType = 'poster';
let currentActivity = null;
let detailRequestPending = false;

function setMeta(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

async function preferPublishedDetail(id, activity, description) {
  if (!/^\d+$/.test(id)) return;
  try {
    const response = await fetch('./activities/manifest.json');
    if (!response.ok) return;
    const { activities } = await response.json();
    if (activities.some((entry) => entry.id === id && entry.status === 'current')) {
      const canonical = new URL(`./activities/${id}.html`, window.location.href).href;
      setCanonical(canonical);
      updateStructuredData(activity, canonical, description);
    }
  } catch {
    // Keep the live detail canonical if the public directory is unavailable.
  }
}

function updateStructuredData(data, url, description) {
  const script = document.getElementById('detailStructuredData');
  if (!script) return;

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${data.title || '活动详情'} | 好羊毛银行活动站`,
    url,
    description,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: '好羊毛银行活动站',
      url: 'https://bank.vooqqqm.com/'
    }
  };

  script.textContent = JSON.stringify(payload, null, 2);
}

function updateDetailMeta(activity) {
  const title = `${activity.title || '活动详情'} | ${activity.bankName || '银行活动'} | 好羊毛银行活动站`;
  const description = [
    activity.desc || '',
    activity.channel ? `渠道：${activity.channel}` : '',
    activity.validFrom || activity.validTo
      ? `时间：${activity.validFrom || '--'} 至 ${activity.validTo || '--'}`
      : '',
    activity.region ? `地区：${activity.region}` : ''
  ].filter(Boolean).join('，').slice(0, 120);

  const url = `https://bank.vooqqqm.com/detail.html?id=${encodeURIComponent(campaignId)}`;
  const structuredDescription = description || '查看银行立减金活动详情、活动时间、参与路径和二维码图片。';

  document.title = title;
  setMeta('meta[name="description"]', structuredDescription);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description || '查看活动时间、参与路径、二维码图片和关键信息。');
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description || '查看活动时间、参与路径、二维码图片和关键信息。');
  setCanonical(url);
  updateStructuredData(activity, url, structuredDescription);
  void preferPublishedDetail(campaignId, activity, structuredDescription);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeMediaUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `https://mini.vooqqqm.com${value}`;
  return `https://mini.vooqqqm.com/${value.replace(/^\.?\//, '')}`;
}

function resolvePosterUrl(activity) {
  for (const key of POSTER_FIELDS) {
    const value = activity[key];
    if (typeof value === 'string' && value.trim()) {
      return normalizeMediaUrl(value.trim());
    }
  }
  return '';
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (!tags) return [];
  return String(tags)
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDiscountText(activity) {
  if (activity.discountMin || activity.discountMin === 0) {
    return `${activity.discountMin} ~ ${activity.discountMax} 元`;
  }
  if (activity.discountAmount || activity.discountAmount === 0) {
    return `${activity.discountAmount} 元`;
  }
  return '--';
}

function getDetailUrl() {
  return `https://bank.vooqqqm.com/detail.html?id=${encodeURIComponent(campaignId || '')}`;
}

function buildShareText(activity) {
  const lines = [
    `活动标题：${activity.title || '银行活动'}`,
    `立减金额：${buildDiscountText(activity)}`,
    `活动时间：${(activity.validFrom || activity.validTo) ? `${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '--'}`,
    `活动链接：${getDetailUrl()}`
  ];

  return lines.join('\n');
}

function renderCompactParagraphs(text) {
  const raw = String(text || '--').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!raw) {
    return `<div class="detail-text-block"><div class="detail-text-paragraph">--</div></div>`;
  }

  const paragraphs = raw
    .split(/\n\s*\n+/)
    .map(item => item.trim())
    .filter(Boolean);

  const html = paragraphs.map(item => {
    const inner = escapeHtml(item).replace(/\n/g, '<br>');
    return `<div class="detail-text-paragraph">${inner}</div>`;
  }).join('');

  return `<div class="detail-text-block">${html}</div>`;
}

function ensureRuntimeStyles() {
  if (document.getElementById('detail-runtime-fix-styles')) return;

  const style = document.createElement('style');
  style.id = 'detail-runtime-fix-styles';
  style.textContent = `
    .detail-text-block {
      margin: 0;
      padding: 0;
    }

    .detail-text-paragraph {
      margin: 0 0 14px 0;
      line-height: 1.7;
      font-size: 15px;
      color: inherit;
      font-weight: inherit;
      word-break: break-word;
    }

    .detail-text-paragraph:last-child {
      margin-bottom: 0;
    }

    .detail-link-box {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 70px;
      padding: 16px 18px;
      border-radius: 22px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      box-sizing: border-box;
      overflow: hidden;
    }

    .detail-link-box .detail-link {
      display: block;
      width: 100%;

      font-size: 14px;          /* 👈 原来15 → 再小一号 */
      line-height: 1.6;
      font-weight: 500;         /* 👈 更轻一点，更高级 */

      color: #0f172a;
      word-break: break-all;
      overflow-wrap: anywhere;
    }

    .detail-link-actions {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .detail-inline-card.column-card {
      display: block;
    }

    .detail-inline-card.column-card .detail-poster-name {
      display: block;
    }

    .detail-group-btn-row {
      margin-top: 14px;
      display: flex;
      justify-content: flex-start;
    }

    .detail-link-actions .secondary-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-width: 110px;         /* 👈 原来120 */
      height: 40px;             /* 👈 原来42 → 更精致 */
      padding: 0 16px;          /* 👈 原来18 */

      border-radius: 999px;

      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #ffffff !important;
      border: none;
      text-decoration: none;

      font-size: 14px;          /* 👈 原来14（保持） */
      font-weight: 600;         /* 👈 原来700 → 降一点更舒服 */

      box-shadow: 0 6px 14px rgba(37, 99, 235, 0.15); /* 👈 阴影也柔一点 */

      cursor: pointer;
      transition: all 0.2s ease;
    }

    .detail-link-actions .secondary-btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }

    .detail-link-actions .secondary-btn:hover {
      opacity: 0.96;
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .detail-link-actions {
        flex-direction: column;
      }

      .detail-link-actions .secondary-btn {
        width: 100%;
      }

      .detail-text-paragraph {
        margin-bottom: 12px;
        line-height: 1.65;
        font-size: 15px;
      }
    }
  `;
  document.head.appendChild(style);
}

function dxNum(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function dxFmtMoney(n) {
  if (n === null) return '';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function dxParseDate(value, endOfDay) {
  if (!value) return null;
  const m = String(value).match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

function dxGetStatus(activity) {
  const now = new Date();
  const from = dxParseDate(activity.validFrom, false);
  const to = dxParseDate(activity.validTo, true);
  const DAY = 86400000;
  if (from && now < from) {
    const days = Math.ceil((from - now) / DAY);
    return { cls: 'is-soon', text: '即将开始', countdownLabel: '距开始', countdown: `${days} 天` };
  }
  if (to && now > to) {
    return { cls: 'is-ended', text: '已结束', countdownLabel: '活动状态', countdown: '已结束' };
  }
  if (to) {
    const days = Math.max(0, Math.ceil((to - now) / DAY) - 1);
    return { cls: 'is-live', text: '进行中', countdownLabel: '距结束', countdown: days === 0 ? '今天截止' : `剩 ${days} 天` };
  }
  return { cls: 'is-live', text: '进行中', countdownLabel: '', countdown: '' };
}

const DX_PURE_URL_RE = /^https?:\/\/\S+$/i;
const DX_INLINE_URL_RE = /https?:\/\/[^\s<>"'）)】]+/gi;
const DX_HAS_PREFIX_MARKER_RE = /^(?:[\d①②③④⑤⑥⑦⑧⑨⑩]+[.、)）]|[-•·*]|[（(]\d+[)）])/;

function dxFormatTextSegment(text, isStartOfLine) {
  let html = escapeHtml(text);
  if (isStartOfLine) {
    html = html.replace(/^([^：:，。,；;|（(\s]{2,14}?)([：:])/, '<span class="dx-rule-key">$1$2</span>');
  }
  html = html.replace(/(\d+(?:\.\d+)?\s*(?:万元|元|万|港元|港币|折))/g, '<span class="dx-num">$1</span>');
  return html;
}

function dxFormatInline(line) {
  const raw = String(line || '');
  const urlRe = new RegExp(DX_INLINE_URL_RE.source, 'gi');
  let out = '';
  let lastIndex = 0;
  let match;

  while ((match = urlRe.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      out += dxFormatTextSegment(raw.slice(lastIndex, match.index), lastIndex === 0);
    }
    const rawUrl = match[0];
    const url = rawUrl.replace(/[。，；、,.!?;:)]+$/, '');
    const trailing = rawUrl.slice(url.length);
    if (url) {
      out += `<a class="dx-inline-link" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)} ↗</a>`;
    }
    if (trailing) {
      out += escapeHtml(trailing);
    }
    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < raw.length) {
    out += dxFormatTextSegment(raw.slice(lastIndex), lastIndex === 0);
  }
  return out;
}

function dxRenderRules(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw || raw === '--') return '<p class="dx-clean-p">暂无详细规则</p>';

  const groups = [];
  let current = null;
  raw.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const m = line.match(/^【([^】]+)】\s*(.*)$/);
    if (m) {
      current = { title: m[1], items: [] };
      groups.push(current);
      if (m[2]) current.items.push(m[2]);
      return;
    }
    if (!current) {
      current = { title: '', items: [] };
      groups.push(current);
    }
    current.items.push(line);
  });

  return `<div class="dx-clean-rules-list">${groups.map((g) => {
    const nonUrlCount = g.items.filter((it) => !DX_PURE_URL_RE.test(it)).length;
    return `
      <div class="dx-clean-rule-group">
        ${g.title ? `<h3>${escapeHtml(g.title)}</h3>` : ''}
        <div class="dx-clean-rule-items">
          ${g.items.map((item) => {
            if (DX_PURE_URL_RE.test(item)) {
              return `<p class="dx-clean-p is-url">${dxFormatInline(item)}</p>`;
            }
            if (nonUrlCount > 1 && !DX_HAS_PREFIX_MARKER_RE.test(item)) {
              return `<p class="dx-clean-p is-bullet">${dxFormatInline(item)}</p>`;
            }
            return `<p class="dx-clean-p">${dxFormatInline(item)}</p>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

function dxRenderSteps(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw || raw === '--') return '';
  if (!/→|->|➜|⇒/.test(raw)) {
    return raw.split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => `<p class="dx-clean-p">${dxFormatInline(l)}</p>`).join('');
  }
  const steps = raw
    .split(/\s*(?:→|->|➜|⇒|\n)\s*/)
    .map((s) => s.replace(/[。；;]+$/, '').trim())
    .filter(Boolean);
  return `<ol class="dx-clean-steps">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`;
}

function renderDetail(activity) {
  currentActivity = activity;
  updateDetailMeta(activity);

  const posterUrl = resolvePosterUrl(activity);
  const pathUrl = String(activity.pathUrl || '').trim();
  const isPathUrlLink = /^https?:\/\//i.test(pathUrl);
  const status = dxGetStatus(activity);

  const discount = buildDiscountText(activity);
  const amountVal = discount !== '--' ? discount : (activity.cashbackRate || '');
  const minVal = (activity.minAmount || activity.minAmount === 0) ? `${activity.minAmount} 元` : '';
  const timeVal = (activity.validFrom || activity.validTo) ? `${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '';
  const channelVal = activity.channel || activity.consumeChannel || '';
  const regionVal = activity.region || '';
  const recurringVal = activity.recurringText || '';

  const kvItems = [
    ['优惠额度', amountVal],
    ['最低门槛', minVal],
    ['活动时间', timeVal],
    ['消费渠道', channelVal],
    ['卡组织', activity.cardOrg || ''],
    ['适用地区', regionVal],
    ['重复规则', recurringVal]
  ].filter(([, v]) => Boolean(v));

  const bankName = activity.bankName || '银行活动';
  const tags = (activity.tags || [])
    .filter((t) => t && t !== bankName)
    .map((tag) => `<span class="dx-clean-tag">${escapeHtml(tag)}</span>`).join('');
  const stepsHtml = dxRenderSteps(activity.pathDesc);

  const html = `
    <div class="dx-clean-wrap">
      <div class="dx-clean-topbar">
        <a class="dx-clean-back" href="./index.html#listTitle">← 返回活动列表</a>
        <button class="dx-clean-share-btn" type="button" data-dx-share>分享</button>
      </div>

      <article class="dx-clean-card">
        <div class="dx-clean-meta-row">
          <span class="dx-clean-bank">${escapeHtml(bankName)}</span>
          <span class="dx-clean-status ${status.cls}">${escapeHtml(status.text === '即将开始' ? `${status.countdown}后开始` : (status.countdown || status.text))}</span>
          ${tags}
        </div>

        <div class="dx-clean-top-links">
          <a class="dx-clean-top-pill is-tg" href="https://t.me/yangmaozhushou" target="_blank" rel="noopener noreferrer">✈ 加入 Telegram 优惠群</a>
          <button type="button" class="dx-clean-top-pill is-wx" id="viewGroupQrBtn">💬 微信群二维码</button>
        </div>

        <h1 class="dx-clean-title">${escapeHtml(activity.title || '活动详情')}</h1>
        ${activity.desc ? `<p class="dx-clean-desc">${escapeHtml(activity.desc)}</p>` : ''}

        ${kvItems.length ? `
          <dl class="dx-clean-kv">
            ${kvItems.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}
          </dl>
        ` : ''}

        ${(pathUrl || posterUrl) ? `
          <div class="dx-clean-actions">
            ${isPathUrlLink ? `<a class="dx-clean-btn is-primary" href="${escapeAttribute(pathUrl)}" target="_blank" rel="noopener noreferrer">直达活动入口 ↗</a>` : ''}
            ${pathUrl ? `<button class="dx-clean-btn" type="button" id="copyPathBtn">复制${isPathUrlLink ? '链接' : '路径'}</button>` : ''}
            ${posterUrl ? `<button class="dx-clean-btn" type="button" id="viewPosterBtn">查看活动图片 / 二维码</button>` : ''}
          </div>
          ${(!isPathUrlLink && pathUrl) ? `<div class="dx-clean-path-box">${escapeHtml(pathUrl)}</div>` : ''}
        ` : ''}

        ${stepsHtml ? `
          <section class="dx-clean-section" id="participation">
            <h2>参与路径</h2>
            ${stepsHtml}
          </section>
        ` : ''}

        <section class="dx-clean-section" id="offer-details">
          <h2>活动规则</h2>
          ${dxRenderRules(activity.awardDesc)}
        </section>

        <footer class="dx-clean-foot">
          <p class="dx-clean-disclaimer">活动内容归所属机构所有，规则与名额可能变动，实际请以银行官方页面为准。</p>
        </footer>
      </article>

      <div class="dx-clean-mobile-bar${isPathUrlLink ? ' has-direct' : ''}">
        <a class="dx-clean-btn dx-clean-mobile-back" href="./index.html#listTitle">← 返回列表</a>
        <button class="dx-clean-btn" type="button" data-dx-share>分享</button>
        ${isPathUrlLink
          ? `<a class="dx-clean-btn is-primary" href="${escapeAttribute(pathUrl)}" target="_blank" rel="noopener noreferrer">直达活动入口 ↗</a>`
          : ''}
      </div>
    </div>
  `;

  els.root.innerHTML = html;
  document.body.classList.add('dx-clean-page');

  const copyBtn = document.getElementById('copyPathBtn');
  if (copyBtn && activity.pathUrl) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(activity.pathUrl);
        const idle = isPathUrlLink ? '复制链接' : '复制路径';
        copyBtn.textContent = '已复制 ✓';
        window.setTimeout(() => {
          copyBtn.textContent = idle;
        }, 1600);
      } catch (err) {
        console.error('复制链接失败', err);
        window.alert('复制失败，请手动复制。');
      }
    });
  }

  const posterBtn = document.getElementById('viewPosterBtn');
  if (posterBtn && posterUrl) {
    posterBtn.addEventListener('click', () => openLightbox(posterUrl, 'poster'));
  }

  const groupQrBtn = document.getElementById('viewGroupQrBtn');
  if (groupQrBtn) {
    groupQrBtn.addEventListener('click', () => openLightbox(GROUP_QR_URL, 'group'));
  }

  els.root.querySelectorAll('[data-dx-share]').forEach((btn) => {
    btn.addEventListener('click', () => openShareSheet());
  });

  bindShareActions(activity);
}

function setCopiedState(button, idleText, activeText = '已复制') {
  if (!button) return;
  button.textContent = activeText;
  window.setTimeout(() => {
    button.textContent = idleText;
  }, 1600);
}

function openShareSheet() {
  if (!els.shareSheet || !currentActivity) return;

  if (els.sharePreview) {
    els.sharePreview.textContent = buildShareText(currentActivity);
  }

  els.shareSheet.classList.remove('hidden');
  els.shareSheet.setAttribute('aria-hidden', 'false');

  if (els.shareDockBtn) {
    els.shareDockBtn.setAttribute('aria-expanded', 'true');
  }
}

function closeShareSheet() {
  if (!els.shareSheet) return;

  els.shareSheet.classList.add('hidden');
  els.shareSheet.setAttribute('aria-hidden', 'true');

  if (els.shareDockBtn) {
    els.shareDockBtn.setAttribute('aria-expanded', 'false');
  }
}

async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

function bindShareActions(activity) {
  if (els.shareDock) {
    els.shareDock.classList.remove('hidden');
  }

  if (els.sharePreview) {
    els.sharePreview.textContent = buildShareText(activity);
  }

  if (els.shareDockBtn && !els.shareDockBtn.dataset.bound) {
    els.shareDockBtn.dataset.bound = 'true';
    els.shareDockBtn.addEventListener('click', () => {
      openShareSheet();
    });
  }

  if (els.shareSystemBtn && !els.shareSystemBtn.dataset.bound) {
    els.shareSystemBtn.dataset.bound = 'true';
    els.shareSystemBtn.addEventListener('click', async () => {
      if (!currentActivity) return;

      if (!navigator.share) {
        window.alert('当前浏览器暂不支持系统分享，请使用下面的复制按钮。');
        return;
      }

      try {
        await navigator.share({
          title: `${currentActivity.title || '银行活动'} | ${buildDiscountText(currentActivity)}`,
          text: buildShareText(currentActivity),
          url: getDetailUrl()
        });
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('系统分享失败', err);
        window.alert('系统分享失败，请改用复制分享文案。');
      }
    });
  }

  if (els.shareCopyTextBtn && !els.shareCopyTextBtn.dataset.bound) {
    els.shareCopyTextBtn.dataset.bound = 'true';
    els.shareCopyTextBtn.addEventListener('click', async () => {
      if (!currentActivity) return;

      try {
        await copyText(buildShareText(currentActivity));
        setCopiedState(els.shareCopyTextBtn, '复制分享文案');
      } catch (err) {
        console.error('复制分享文案失败', err);
        window.alert('复制失败，请稍后重试。');
      }
    });
  }

  if (els.shareCopyLinkBtn && !els.shareCopyLinkBtn.dataset.bound) {
    els.shareCopyLinkBtn.dataset.bound = 'true';
    els.shareCopyLinkBtn.addEventListener('click', async () => {
      if (!currentActivity) return;

      try {
        const shareLine = `${currentActivity.title || '银行活动'}｜立减金额 ${buildDiscountText(currentActivity)}｜${getDetailUrl()}`;
        await copyText(shareLine);
        setCopiedState(els.shareCopyLinkBtn, '复制分享链接');
      } catch (err) {
        console.error('复制分享链接失败', err);
        window.alert('复制失败，请稍后重试。');
      }
    });
  }
}

function openLightbox(src, type = 'poster') {
  currentLightboxType = type;

  if (!els.lightbox) {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }

  els.lightboxError.classList.add('hidden');
  els.lightboxImage.classList.remove('hidden');
  els.lightboxImage.src = src;
  els.lightboxRawLink.href = src;

  els.lightbox.classList.remove('hidden');
  els.lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  if (!els.lightbox) return;

  els.lightbox.classList.add('hidden');
  els.lightbox.setAttribute('aria-hidden', 'true');
  els.lightboxImage.src = '';
  els.lightboxRawLink.href = '#';
  els.lightboxError.classList.add('hidden');
  els.lightboxImage.classList.remove('hidden');
}

function unwrapDetailPayload(payload) {
  if (!payload) return null;

  if (payload.code === 0 && payload.data) {
    return payload.data;
  }

  if (!payload.code && !payload.message && (payload.id || payload.title || payload.bankName)) {
    return payload;
  }

  return null;
}

async function fetchDetail() {
  if (detailRequestPending) return;
  if (!campaignId) {
    if (els.loading) els.loading.classList.add('hidden');
    if (els.error) els.error.classList.remove('hidden');
    if (els.errorMessage) els.errorMessage.textContent = '此链接缺少活动编号，请返回列表选择活动。';
    if (els.retry) els.retry.hidden = true;
    return;
  }

  detailRequestPending = true;
  if (els.loading) els.loading.classList.remove('hidden');
  if (els.error) els.error.classList.add('hidden');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DETAIL_LOAD_TIMEOUT);
  try {
    const response = await fetch(`${API_BASE}/campaign_detail.php?id=${encodeURIComponent(campaignId)}`, {
      credentials: 'omit',
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const data = unwrapDetailPayload(payload);

    if (!data) {
      throw new Error(payload && payload.message ? payload.message : 'not_found');
    }

    data.tags = normalizeTags(data.tags);

    if (els.loading) els.loading.classList.add('hidden');
    renderDetail(data);
  } catch (err) {
    console.error('加载详情失败', err);
    if (els.loading) els.loading.classList.add('hidden');
    if (els.error) els.error.classList.remove('hidden');
    if (els.errorMessage) els.errorMessage.textContent = controller.signal.aborted
      ? '活动详情加载超时，请重试。'
      : '活动详情加载失败，请重试。';
  } finally {
    clearTimeout(timeout);
    detailRequestPending = false;
  }
}

if (els.retry) els.retry.addEventListener('click', fetchDetail);

if (els.lightbox) {
  els.lightbox.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-lightbox="true"]')) {
      closeLightbox();
    }
  });
}

if (els.shareSheet) {
  els.shareSheet.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-share="true"]')) {
      closeShareSheet();
    }
  });
}

function openMpQrModal() {
  let modal = document.getElementById('mpQrModal');
  if (!modal) {
    const navQrImg = document.querySelector('.site-nav-qr-pop img');
    const qrSrc = (navQrImg && navQrImg.src) ? navQrImg.src : './assets/miniprogram-qr.jpg';
    modal = document.createElement('div');
    modal.id = 'mpQrModal';
    modal.className = 'mp-qr-modal hidden';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="mp-qr-backdrop" data-close-mp-qr="true"></div>
      <div class="mp-qr-dialog" role="dialog" aria-modal="true" aria-label="微信小程序二维码">
        <img src="${qrSrc}" alt="好羊毛助手微信小程序码" width="250" height="264">
        <p class="mp-qr-title">好羊毛助手小程序</p>
        <p class="mp-qr-hint">微信内可长按图片识别 · 或微信扫一扫</p>
        <button type="button" class="mp-qr-close" data-close-mp-qr="true">关闭</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeMpQrModal() {
  const modal = document.getElementById('mpQrModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-mp-qr="true"]')) {
    closeMpQrModal();
    return;
  }
  const qrBox = event.target.closest('.site-nav-qr');
  document.querySelectorAll('.site-nav-qr.is-open').forEach((el) => {
    if (el !== qrBox) {
      el.classList.remove('is-open');
      const b = el.querySelector('.site-nav-qr-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  });
  if (qrBox && event.target.closest('.site-nav-qr-btn')) {
    if (window.matchMedia('(max-width: 860px)').matches) {
      openMpQrModal();
      return;
    }
    const opened = qrBox.classList.toggle('is-open');
    const b = qrBox.querySelector('.site-nav-qr-btn');
    if (b) b.setAttribute('aria-expanded', String(opened));
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMpQrModal();
    document.querySelectorAll('.site-nav-qr.is-open').forEach((el) => {
      el.classList.remove('is-open');
      const b = el.querySelector('.site-nav-qr-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    closeLightbox();
    closeShareSheet();
  }
});

if (els.lightboxImage) {
  els.lightboxImage.addEventListener('error', () => {
    els.lightboxImage.classList.add('hidden');

    if (currentLightboxType === 'group') {
      els.lightboxErrorTitle.textContent = '群二维码暂时无法显示';
      els.lightboxErrorText.textContent = '固定微信群二维码还没有上传到指定地址，或者图片文件暂时无法公开访问。';
    } else {
      els.lightboxErrorTitle.textContent = '图片加载失败';
      els.lightboxErrorText.textContent = '当前图片地址可能已失效、禁止跨域访问，或者数据库里保存的是不完整路径。';
    }

    els.lightboxError.classList.remove('hidden');
  });
}

fetchDetail();
