const API_BASE = 'https://mini.vooqqqm.com/api';
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
  lightbox: document.getElementById('imageLightbox'),
  lightboxImage: document.getElementById('lightboxImage'),
  lightboxError: document.getElementById('lightboxError'),
  lightboxRawLink: document.getElementById('lightboxRawLink'),
  lightboxErrorTitle: document.getElementById('lightboxErrorTitle'),
  lightboxErrorText: document.getElementById('lightboxErrorText')
};

let currentLightboxType = 'poster';

function setMeta(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

function setCanonical(url) {
  const el = document.querySelector('link[rel="canonical"]');
  if (el) el.setAttribute('href', url);
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

  document.title = title;
  setMeta('meta[name="description"]', description || '查看银行立减金活动详情、活动时间、参与路径和二维码图片。');
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description || '查看活动时间、参与路径、二维码图片和关键信息。');
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description || '查看活动时间、参与路径、二维码图片和关键信息。');
  setCanonical(url);
  updateStructuredData(activity, url, description || '查看银行立减金活动详情、活动时间、参与路径和二维码图片。');
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
    .detail-metric-grid {
      display: grid;
      gap: 14px;
    }

    .detail-metric-extend {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .detail-mini-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.10);
      color: rgba(255,255,255,0.92);
      font-size: 13px;
      line-height: 1.2;
      font-weight: 700;
      backdrop-filter: blur(8px);
    }

    .detail-mini-pill strong {
      color: #ffffff;
      font-weight: 800;
    }

    .detail-text-block {
      margin: 0;
      padding: 0;
    }

    .detail-text-paragraph {
      margin: 0 0 14px 0;
      line-height: 1.7;
      font-size: 17px;
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
      .detail-mini-pill {
        font-size: 12px;
      }

      .detail-link-actions {
        flex-direction: column;
      }

      .detail-link-actions .secondary-btn {
        width: 100%;
      }

      .detail-text-paragraph {
        margin-bottom: 12px;
        line-height: 1.65;
        font-size: 16px;
      }
    }
  `;
  document.head.appendChild(style);
}

function renderDetail(activity) {
  updateDetailMeta(activity);
  ensureRuntimeStyles();

  const posterUrl = resolvePosterUrl(activity);
  const isPathUrlLink = /^https?:\/\//i.test(activity.pathUrl || '');

  const metrics = [
    ['立减金额', buildDiscountText(activity)],
    ['最低门槛', (activity.minAmount || activity.minAmount === 0) ? `${activity.minAmount} 元` : '--'],
    ['活动时间', (activity.validFrom || activity.validTo) ? `${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '--'],
    ['适用地区', activity.region || '--']
  ];

  const sideItems = [
    ['适用地区', activity.region || '--'],
    ['消费渠道', activity.channel || '--'],
    ['最低门槛金额', (activity.minAmount || activity.minAmount === 0) ? `${activity.minAmount} 元` : '--'],
    ['立减金额', buildDiscountText(activity)],
    ['返现比例', activity.cashbackRate || '--'],
    ['活动时间', (activity.validFrom || activity.validTo) ? `${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '--'],
    ['重复规则', activity.recurringText || '--'],
    ['最近更新', activity.updatedDate || '--']
  ];

  const sideGrid = sideItems.map(([label, value]) => `
    <section class="detail-stat">
      <span class="detail-stat-label">${escapeHtml(label)}</span>
      <p class="detail-stat-value">${escapeHtml(value)}</p>
    </section>
  `).join('');

  const metricGrid = metrics.map(([label, value]) => `
    <div class="detail-metric">
      <span class="detail-metric-label">${escapeHtml(label)}</span>
      <strong class="detail-metric-value">${escapeHtml(value)}</strong>
    </div>
  `).join('');

  const tags = (activity.tags || []).map((tag) => `<span class="badge tag">${escapeHtml(tag)}</span>`).join('');
  const summaryPills = [
    activity.bankName || '银行活动',
    activity.channel || '',
    activity.recurringText || '',
    activity.validTo ? `到期 ${activity.validTo}` : ''
  ].filter(Boolean).map((text) => `<span class="detail-summary-pill">${escapeHtml(text)}</span>`).join('');

  const heroExtraPills = [
    activity.validFrom ? `<span class="detail-mini-pill"><span>开始</span><strong>${escapeHtml(activity.validFrom)}</strong></span>` : '',
    activity.validTo ? `<span class="detail-mini-pill"><span>截止</span><strong>${escapeHtml(activity.validTo)}</strong></span>` : ''
  ].filter(Boolean).join('');

  const html = `
    <article class="detail-card">
      <section class="detail-hero">
        <div class="detail-hero-copy">
          <div class="detail-hero-top">
            <div class="detail-hero-tags">
              <span class="detail-bank-pill">${escapeHtml(activity.bankName || '银行活动')}</span>
              ${tags ? `<div class="detail-tag-row">${tags}</div>` : ''}
            </div>
            <span class="detail-kicker">活动详情</span>
          </div>

          <h1>${escapeHtml(activity.title || '活动详情')}</h1>
          <p class="detail-desc">${escapeHtml(activity.desc || '暂无活动描述')}</p>
          <div class="detail-summary-row">${summaryPills}</div>

          ${heroExtraPills ? `<div class="detail-metric-extend">${heroExtraPills}</div>` : ''}
        </div>

        <div class="detail-metric-grid">${metricGrid}</div>
      </section>

      <div class="detail-layout">
        <section class="detail-main">
          <section class="detail-section detail-section-emphasis">
            <div class="detail-section-head">
              <h2>获奖内容</h2>
            </div>
            ${renderCompactParagraphs(activity.awardDesc || '--')}
          </section>

          <section class="detail-section">
            <div class="detail-section-head">
              <h2>活动路径</h2>
            </div>
            ${renderCompactParagraphs(activity.pathDesc || '--')}
          </section>

          ${activity.pathUrl ? `
            <section class="detail-section detail-section-compact">
              <div class="detail-section-head">
                <h2>活动链接</h2>
              </div>

              <div class="detail-link-box">
                <span class="detail-link">${escapeHtml(activity.pathUrl)}</span>
              </div>

              <div class="detail-link-actions">
                ${isPathUrlLink ? `<a class="secondary-btn" href="${escapeAttribute(activity.pathUrl)}" target="_blank" rel="noopener noreferrer">打开链接</a>` : ''}
                <button class="secondary-btn" type="button" id="copyPathBtn">复制链接</button>
              </div>
            </section>
          ` : ''}

          <section class="detail-section detail-section-compact">
            <div class="detail-section-head">
              <h2>活动图片路径</h2>
            </div>
            <div class="detail-inline-card column-card">
              <span class="detail-poster-name">活动路径/二维码</span>
              <div class="detail-group-btn-row">
                <button class="primary-btn" type="button" id="viewPosterBtn"${posterUrl ? '' : ' disabled'}>${posterUrl ? '查看图片' : '暂无图片'}</button>
              </div>
            </div>
          </section>
        </section>

        <aside class="detail-side">
          <section class="detail-side-panel">
            <div class="detail-side-head">
              <h2>快速查看</h2>
            </div>
            <div class="detail-stat-grid">${sideGrid}</div>
          </section>

          <section class="detail-side-note">
            <span class="detail-section-kicker">提示</span>
            <p>活动规则、名额、页面入口都可能变化，实际请以银行官方页面为准。</p>
          </section>

          <section class="detail-side-note detail-side-promo">
            <span class="detail-section-kicker">社群福利</span>
            <h2>加入「薅羊毛微信群·每月最少薅500元」</h2>
            <p>点击下方按钮即可查看固定微信群二维码，后续扫码进群即可获取更多羊毛线报。</p>
            <button class="primary-btn detail-promo-btn" type="button" id="viewGroupQrBtn">查看群二维码</button>
          </section>
        </aside>
      </div>

      <div class="detail-footer">
        活动内容归所属机构所有，活动奖品随时间推移可能变化，一切活动请以机构官方规则为准。网站端展示仅作信息整理，不构成保证。
      </div>
    </article>
  `;

  els.root.innerHTML = html;

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
  if (!campaignId) {
    if (els.loading) els.loading.classList.add('hidden');
    if (els.error) els.error.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/campaign_detail.php?id=${encodeURIComponent(campaignId)}`, {
      credentials: 'omit'
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
  }
}

if (els.lightbox) {
  els.lightbox.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-lightbox="true"]')) {
      closeLightbox();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
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
