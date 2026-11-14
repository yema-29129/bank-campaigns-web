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
    name: `${data.title || '活动详情'} | 羊毛助手Pro`,
    url,
    description,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: '羊毛助手Pro',
      url: 'https://bank.vooqqqm.com/'
    }
  };

  script.textContent = JSON.stringify(payload, null, 2);
}

function updateDetailMeta(activity) {
  const title = `${activity.title || '活动详情'} | ${activity.bankName || '银行活动'} | 羊毛助手Pro`;
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

function dxFormatInline(line) {
  let html = escapeHtml(line);
  // 前缀标签加粗，例如“活动对象：”“活动1（大额消费达标）：”
  html = html.replace(/^([^：:，。,]{2,18}?)([：:])/, '<b>$1</b>$2');
  // 金额高亮
  html = html.replace(/(\d+(?:\.\d+)?\s*(?:万元|元|万))/g, '<span class="dx-num">$1</span>');
  return html;
}

function dxRenderRules(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw || raw === '--') return '<p class="dx-rule-item">暂无内容</p>';

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

  return `<div class="dx-rules">${groups.map((g) => `
    <div class="dx-rule-group">
      ${g.title ? `<h3>${escapeHtml(g.title)}</h3>` : ''}
      <div class="dx-rule-items">
        ${g.items.map((item) => `<p class="dx-rule-item${/^活动\s*[0-9一二三四五]/.test(item) ? ' is-boxed' : ''}">${dxFormatInline(item)}</p>`).join('')}
      </div>
    </div>`).join('')}</div>`;
}

function dxRenderSteps(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw || raw === '--') return '<p class="dx-rule-item">暂无内容</p>';
  if (!/→|->|➜|⇒/.test(raw)) return dxRenderRules(raw);
  const steps = raw
    .split(/\s*(?:→|->|➜|⇒|\n)\s*/)
    .map((s) => s.replace(/[。；;]+$/, '').trim())
    .filter(Boolean);
  return `<ol class="dx-steps">${steps.map((s) => `<li class="dx-step"><div class="dx-step-text">${escapeHtml(s)}</div></li>`).join('')}</ol>`;
}

function dxBindTabs() {
  const tabs = Array.from(document.querySelectorAll('.dx-tabs a'));
  if (!tabs.length || !('IntersectionObserver' in window)) return;
  const map = new Map();
  tabs.forEach((a) => {
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (target) map.set(target, a);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tabs.forEach((t) => t.classList.remove('is-active'));
      const tab = map.get(entry.target);
      if (tab) {
        tab.classList.add('is-active');
        tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  }, { rootMargin: '-90px 0px -60% 0px' });
  map.forEach((_, el) => observer.observe(el));
}

function renderDetail(activity) {
  currentActivity = activity;
  updateDetailMeta(activity);

  const posterUrl = resolvePosterUrl(activity);
  const isPathUrlLink = /^https?:\/\//i.test(activity.pathUrl || '');
  const status = dxGetStatus(activity);

  const timeText = (activity.validFrom || activity.validTo) ? `${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '--';
  const minText = (activity.minAmount || activity.minAmount === 0) ? `${activity.minAmount} 元` : '--';

  // 大金额
  const dMin = dxNum(activity.discountMin);
  const dMax = dxNum(activity.discountMax);
  const dOne = dxNum(activity.discountAmount);
  const bigAmount = dMax !== null ? dMax : (dOne !== null ? dOne : dMin);
  const isRange = dMin !== null && dMax !== null && dMin !== dMax;
  const prizeLabel = isRange ? '最高可得立减金' : '立减金额';
  const prizeSub = [
    isRange ? `${dxFmtMoney(dMin)} ~ ${dxFmtMoney(dMax)} 元` : '',
    activity.minAmount || activity.minAmount === 0 ? `满 ${activity.minAmount} 元可用` : ''
  ].filter(Boolean).join(' · ') || '以官方活动规则为准';

  const bigAmountHtml = bigAmount !== null
    ? `<small>¥</small><strong>${escapeHtml(dxFmtMoney(bigAmount))}</strong>`
    : `<strong style="font-size:40px">${escapeHtml(activity.cashbackRate || '见规则')}</strong>`;

  // 关键信息
  const facts = [
    ['💳', '最低门槛', minText],
    ['📅', '活动时间', timeText],
    ['📍', '适用地区', activity.region || '--'],
    ['🛒', '消费渠道', activity.channel || '--'],
    ['🔁', '重复规则', activity.recurringText || ''],
    ['💰', '返现比例', activity.cashbackRate || '']
  ].filter(([, , v]) => v && v !== '--' || false);
  const factsHtml = facts.slice(0, 6).map(([icon, label, value]) => `
    <div class="dx-fact">
      <span class="dx-fact-icon" aria-hidden="true">${icon}</span>
      <div>
        <span class="dx-fact-label">${escapeHtml(label)}</span>
        <span class="dx-fact-value">${escapeHtml(value)}</span>
      </div>
    </div>`).join('');

  const kvItems = [
    ['银行', activity.bankName || '--'],
    ['立减金额', buildDiscountText(activity)],
    ['最低门槛', minText],
    ['消费渠道', activity.channel || '--'],
    ['返现比例', activity.cashbackRate || '--'],
    ['重复规则', activity.recurringText || '--'],
    ['适用地区', activity.region || '--'],
    ['最近更新', activity.updatedDate || activity.updatedAt || activity.createdAt || '--']
  ].filter(([, v]) => v !== '--');
  const kvHtml = kvItems.map(([k, v]) => `<div class="dx-kv-row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');

  const bankName = activity.bankName || '银行活动';
  const bankMark = bankName.replace(/^中国/, '').charAt(0) || '银';
  const tags = (activity.tags || [])
    .filter((t) => t && t !== bankName)
    .map((tag) => `<span class="dx-tag">${escapeHtml(tag)}</span>`).join('');

  const primaryAction = isPathUrlLink
    ? `<a class="dx-btn dx-btn-white" href="${escapeAttribute(activity.pathUrl)}" target="_blank" rel="noopener noreferrer">立即参与 →</a>`
    : `<a class="dx-btn dx-btn-white" href="#participation">查看参与方式 ↓</a>`;

  const html = `
    <article class="dx">
      <nav class="dx-crumb" aria-label="面包屑">
        <a href="./index.html">首页</a><span>/</span>
        <a href="./index.html#listTitle">活动列表</a><span>/</span>
        <span>${escapeHtml(activity.title || '活动详情')}</span>
      </nav>

      <section class="dx-card dx-hero">
        <div class="dx-hero-main">
          <div class="dx-hero-head">
            <span class="dx-bank"><span class="dx-bank-logo">${escapeHtml(bankMark)}</span>${escapeHtml(bankName)}</span>
            <span class="dx-status ${status.cls}">${status.text}</span>
            ${tags}
          </div>
          <h1 class="dx-title">${escapeHtml(activity.title || '活动详情')}</h1>
          <p class="dx-desc">${escapeHtml(activity.desc || '暂无活动描述')}</p>
          <div class="dx-facts">${factsHtml}</div>
        </div>

        <aside class="dx-prize">
          <span class="dx-prize-label">${prizeLabel}</span>
          <div class="dx-prize-amount">${bigAmountHtml}</div>
          <div class="dx-prize-sub">${escapeHtml(prizeSub)}</div>
          ${status.countdown ? `<div class="dx-prize-countdown"><span>${status.countdownLabel}</span><b>${status.countdown}</b></div>` : ''}
          <div class="dx-prize-actions">
            ${primaryAction}
            <button class="dx-btn dx-btn-glass" type="button" data-dx-share>分享给好友</button>
          </div>
        </aside>
      </section>

      <a class="dx-card dx-tg-join" href="https://t.me/yangmaozhushou" target="_blank" rel="noopener noreferrer">
        <span class="dx-tg-icon" aria-hidden="true">✈</span>
        <span class="dx-tg-join-copy"><strong>加入 Telegram 羊毛社群</strong><span>第一时间收到银行立减金、信用卡返现提醒</span></span>
        <span class="dx-tg-join-btn">立即加入</span>
      </a>

      <nav class="dx-card dx-tabs" aria-label="活动详情目录">
        <a href="#offer-details" class="is-active">活动规则</a>
        <a href="#participation">参与步骤</a>
        ${activity.pathUrl ? '<a href="#activity-link">活动链接</a>' : ''}
        <a href="#activity-image">活动图片</a>
        <a href="#activity-notes">信息汇总</a>
        <a href="#telegram-reminder">优惠提醒</a>
      </nav>

      <div class="dx-body">
        <div class="dx-main">
          <section class="dx-card dx-section" id="offer-details">
            <div class="dx-section-head"><span class="dx-section-icon">🎁</span><h2>活动规则</h2></div>
            ${dxRenderRules(activity.awardDesc)}
          </section>

          <section class="dx-card dx-section" id="participation">
            <div class="dx-section-head"><span class="dx-section-icon">🧭</span><h2>参与步骤</h2></div>
            ${dxRenderSteps(activity.pathDesc)}
          </section>

          ${activity.pathUrl ? `
          <section class="dx-card dx-section" id="activity-link">
            <div class="dx-section-head"><span class="dx-section-icon">🔗</span><h2>活动链接</h2></div>
            <div class="dx-link">${escapeHtml(activity.pathUrl)}</div>
            <div class="dx-link-actions">
              ${isPathUrlLink ? `<a class="dx-btn dx-btn-primary" href="${escapeAttribute(activity.pathUrl)}" target="_blank" rel="noopener noreferrer">打开链接</a>` : ''}
              <button class="dx-btn dx-btn-line" type="button" id="copyPathBtn">复制链接</button>
            </div>
          </section>` : ''}

          <section class="dx-card dx-section" id="activity-image">
            <div class="dx-section-head"><span class="dx-section-icon">🖼️</span><h2>活动图片</h2></div>
            <div class="dx-poster">
              <span class="dx-poster-thumb" aria-hidden="true">${posterUrl ? '📷' : '🗂️'}</span>
              <div class="dx-poster-copy">
                <strong>活动路径 / 二维码</strong>
                <span>${posterUrl ? '点击查看大图，建议截图保存' : '本活动暂未提供图片'}</span>
              </div>
              <button class="dx-btn dx-btn-primary" type="button" id="viewPosterBtn"${posterUrl ? '' : ' disabled'}>${posterUrl ? '查看图片' : '暂无图片'}</button>
            </div>
          </section>
        </div>

        <aside class="dx-aside">
          <section class="dx-card dx-side-card" id="activity-notes">
            <h3 class="dx-side-title">信息汇总</h3>
            <dl class="dx-kv">${kvHtml}</dl>
          </section>

          <section class="dx-card dx-promo">
            <span class="dx-promo-kicker">社群福利</span>
            <h3>加入「薅羊毛微信群」<br>每月最少薅 500 元</h3>
            <p>扫码进群，第一时间获取银行立减金、返现等羊毛线报。</p>
            <button class="dx-btn dx-btn-block" type="button" id="viewGroupQrBtn">查看群二维码</button>
          </section>

          <a class="dx-card dx-tg" id="telegram-reminder" href="https://t.me/yangmaozhushou" target="_blank" rel="noopener noreferrer">
            <span class="dx-tg-icon" aria-hidden="true">✈</span>
            <span class="dx-tg-copy"><strong>订阅 Telegram 优惠提醒</strong><span>信用卡返现、微信立减金和港卡优惠更新</span></span>
            <span class="dx-tg-arrow" aria-hidden="true">›</span>
          </a>

          <div class="dx-note"><span aria-hidden="true">⚠️</span><span>活动规则、名额、页面入口都可能变化，实际请以银行官方页面为准。</span></div>
        </aside>
      </div>

      <div class="dx-footer">活动内容归所属机构所有，活动奖品随时间推移可能变化，一切活动请以机构官方规则为准。网站端展示仅作信息整理，不构成保证。</div>

      <div class="dx-mobile-bar">
        <button class="dx-btn dx-btn-line" type="button" data-dx-share>分享</button>
        ${isPathUrlLink
          ? `<a class="dx-btn dx-btn-hot" href="${escapeAttribute(activity.pathUrl)}" target="_blank" rel="noopener noreferrer">立即参与</a>`
          : `<a class="dx-btn dx-btn-hot" href="#participation">查看参与方式</a>`}
      </div>
    </article>
  `;

  els.root.innerHTML = html;
  document.body.classList.add('dx-has-bar');

  const sectionId = window.location.hash.slice(1);
  const section = sectionId ? document.getElementById(sectionId) : null;
  if (section && els.root.contains(section)) section.scrollIntoView();

  const copyBtn = document.getElementById('copyPathBtn');
  if (copyBtn && activity.pathUrl) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(activity.pathUrl);
        copyBtn.textContent = '已复制 ✓';
        window.setTimeout(() => {
          copyBtn.textContent = '复制链接';
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

  dxBindTabs();
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
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
