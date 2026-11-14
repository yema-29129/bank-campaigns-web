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
  const unit = activity.amountUnit || '元';
  const min = activity.discountMin;
  const max = activity.discountMax;
  if (min || min === 0) {
    const amount = max || max === 0
      ? `${formatOfferNumber(min)}–${formatOfferNumber(max)}`
      : formatOfferNumber(min);
    return `${amount} ${unit}`;
  }
  if (activity.discountAmount || activity.discountAmount === 0) {
    return `${formatOfferNumber(activity.discountAmount)} ${unit}`;
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
    const lead = item.match(/^(【[^】\n]+】)(?=\n|$)/);
    const inner = lead
      ? `<strong class="detail-rule-label">${escapeHtml(lead[0])}</strong>${escapeHtml(item.slice(lead[0].length).trimStart()).replace(/\n/g, '<br>')}`
      : escapeHtml(item).replace(/\n/g, '<br>');
    return `<p class="detail-text-paragraph">${inner}</p>`;
  }).join('');

  return `<div class="detail-text-block">${html}</div>`;
}

function formatOfferNumber(amount) {
  const number = Number(amount);
  return Number.isFinite(number)
    ? number.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    : String(amount);
}

function renderSpendTiers(ruleText) {
  const normalize = String(ruleText || '').replace(/\r\n?/g, '\n');
  const paragraphs = normalize.split(/\n\s*\n+/);
  const lead = paragraphs.findIndex(part => /单笔折合人民币金额达档位即享立减：\s*$/.test(part));
  const tierText = paragraphs[lead + 1]?.trim();
  if (lead < 0 || !tierText?.endsWith('。')) return '';

  const clauses = tierText.slice(0, -1).split(/[；;]/).map(part => part.trim());
  if (clauses.length < 2 || clauses.length > 6) return '';

  const rows = clauses.map((clause, index) => {
    const range = clause.match(/^满([0-9]+)元至([0-9]+)元，立减([0-9]+)元$/);
    const open = index === clauses.length - 1 && clause.match(/^满([0-9]+)元及以上，立减([0-9]+)元$/);
    if (range) return { from: Number(range[1]), to: Number(range[2]), discount: Number(range[3]) };
    if (open) return { from: Number(open[1]), to: Infinity, discount: Number(open[2]) };
    return null;
  });
  if (rows.some((row, index) => !row || !Number.isSafeInteger(row.from)
    || (Number.isFinite(row.to) && !Number.isSafeInteger(row.to))
    || !Number.isSafeInteger(row.discount)
    || row.from <= 0 || row.to < row.from || row.discount <= 0
    || (index > 0 && row.from <= rows[index - 1]?.to))) return '';

  const cells = rows.map(({ from, to, discount }) => {
    const spend = Number.isFinite(to)
      ? `${formatOfferNumber(from)}–${formatOfferNumber(to)} 元`
      : `${formatOfferNumber(from)} 元及以上`;
    return `<tr><td>${spend}</td><td>${formatOfferNumber(discount)} 元</td></tr>`;
  }).join('');
  return `<div class="detail-tier-frame">
    <table class="detail-tier-table" aria-label="单笔消费立减档位">
      <thead><tr><th scope="col">单笔消费</th><th scope="col">立减金额</th></tr></thead>
      <tbody>${cells}</tbody>
    </table>
  </div>`;
}

function renderDetail(activity) {
  currentActivity = activity;
  updateDetailMeta(activity);

  const posterUrl = resolvePosterUrl(activity);
  const isPathUrlLink = /^https?:\/\//i.test(activity.pathUrl || '');

  const renderDate = date => `<span class="detail-date">${escapeHtml(date)}</span>`;
  const dateRange = activity.validFrom && activity.validTo
    ? `${renderDate(activity.validFrom)} 至 ${renderDate(activity.validTo)}`
    : activity.validFrom
      ? `自 ${renderDate(activity.validFrom)} 起`
      : activity.validTo
        ? `截至 ${renderDate(activity.validTo)}`
        : '见活动规则';

  const metrics = [
    ['活动时间', null, dateRange],
    ['适用地区', activity.region || '--'],
    ['最低门槛', (activity.minAmount || activity.minAmount === 0) ? `${formatOfferNumber(activity.minAmount)} ${activity.amountUnit || '元'}` : '--'],
    ['优惠金额', buildDiscountText(activity)]
  ];

  const sideItems = [
    ['消费渠道', activity.channel],
    ['返现比例', activity.cashbackRate],
    ['重复规则', activity.recurringText],
    ['最近更新', activity.updatedDate || activity.updatedAt || activity.createdAt]
  ].filter(([, value]) => Boolean(value));

  const sideGrid = sideItems.map(([label, value]) => `
    <section class="detail-stat">
      <span class="detail-stat-label">${escapeHtml(label)}</span>
      <p class="detail-stat-value">${escapeHtml(value)}</p>
    </section>
  `).join('');

  const metricGrid = metrics.map(([label, value, dates]) => `
    <div class="detail-metric">
      <dt class="detail-metric-label">${escapeHtml(label)}</dt>
      <dd class="detail-metric-value">${dates ?? escapeHtml(value === '--' ? '见活动规则' : value)}</dd>
    </div>
  `).join('');

  const categoryTags = (activity.tags || []).filter(tag => !activity.bankName?.includes(tag));
  const cardType = (activity.title || '').match(/信用卡|储蓄卡|借记卡/)?.[0];
  if (cardType && !categoryTags.includes(cardType)) categoryTags.unshift(cardType);
  const tags = categoryTags.map((tag) => `<span class="badge tag">${escapeHtml(tag)}</span>`).join('');
  const html = `
    <article class="detail-card">
      <header class="detail-hero">
        <div class="detail-hero-copy">
          <div class="detail-hero-tags">
            <span class="detail-bank-pill">${escapeHtml(activity.bankName || '银行活动')}</span>
            ${tags}
          </div>
          <h1>${escapeHtml(activity.title || '活动详情')}</h1>
        </div>
        <dl class="detail-metric-grid">${metricGrid}</dl>
        <a href="#participation" class="primary-btn detail-focus-link">查看参与方式</a>
      </header>
      <nav class="detail-jump" aria-label="页内导航">
        <span class="detail-jump-label">本页内容</span>
        <a href="#offer-details">优惠规则</a>
        <a href="#participation">参与方式</a>
        ${sideItems.length ? '<a href="#activity-notes">活动信息</a>' : ''}
      </nav>


      <div class="detail-layout">
        <div class="detail-main">
          ${activity.desc ? `<p class="detail-desc detail-overview">${escapeHtml(activity.desc)}</p>` : ''}
          <section id="offer-details" class="detail-section detail-section-emphasis">
            <div class="detail-section-head"><h2>优惠规则</h2></div>
            ${renderSpendTiers(activity.awardDesc)}
            ${renderCompactParagraphs(activity.awardDesc || '暂无规则说明，请以官方页面为准。')}
          </section>
        </div>

        <aside class="detail-side" aria-label="参与方式与补充信息">
          <section id="participation" class="detail-section detail-participation">
            <div class="detail-section-head"><h2>参与方式</h2></div>
            ${renderCompactParagraphs(activity.pathDesc || '暂无参与步骤，请以官方页面为准。')}

            ${activity.pathUrl ? `
              ${isPathUrlLink ? '' : `<p class="detail-link-box detail-link">${escapeHtml(activity.pathUrl)}</p>`}
              <div class="detail-link-actions">
                ${isPathUrlLink ? `<a class="primary-btn" href="${escapeAttribute(activity.pathUrl)}" target="_blank" rel="noopener noreferrer">打开活动链接 <span aria-hidden="true">↗</span></a>` : ''}
                <button class="secondary-btn" type="button" id="copyPathBtn">复制链接</button>
              </div>
              ${isPathUrlLink ? `<details class="detail-link-reveal">
                <summary>查看链接地址</summary>
                <p class="detail-link-box detail-link">${escapeHtml(activity.pathUrl)}</p>
              </details>` : ''}
            ` : ''}

            ${posterUrl ? `<div class="detail-poster-action">
              <button class="secondary-btn" type="button" id="viewPosterBtn">查看活动图片 / 二维码</button>
            </div>` : ''}
          </section>

          ${sideItems.length ? `
            <section id="activity-notes" class="detail-side-panel">
              <div class="detail-side-head"><h2>活动信息</h2></div>
              <div class="detail-stat-grid">${sideGrid}</div>
            </section>
          ` : ''}

          <section class="detail-side-note detail-side-promo">
            <h2>微信群</h2>
            <p>扫码加入微信群，交流活动和优惠线索。</p>
            <button class="secondary-btn detail-promo-btn" type="button" id="viewGroupQrBtn">查看群二维码</button>
          </section>
        </aside>
      </div>

      <div class="detail-footer">
        活动内容归所属机构所有，活动奖品随时间推移可能变化，一切活动请以机构官方规则为准。网站端展示仅作信息整理，不构成保证。
      </div>
    </article>
  `;

  els.root.innerHTML = html;
  const initialSection = ['#offer-details', '#participation', '#activity-notes'].includes(window.location.hash);
  if (initialSection) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });

  const copyBtn = document.getElementById('copyPathBtn');
  if (copyBtn && activity.pathUrl) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(activity.pathUrl);
        copyBtn.textContent = '已复制';
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
