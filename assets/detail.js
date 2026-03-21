const API_BASE = 'https://mini.vooqqqm.com/api';
const GROUP_QR_URL = 'https://mini.vooqqqm.com/uploads/fixed/group-wechat-qr.png?v=20260321';
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
    activity.validFrom || activity.validTo ? `时间：${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '',
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
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
    if (typeof value === 'string' && value.trim()) return normalizeMediaUrl(value.trim());
  }
  return '';
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (!tags) return [];
  return String(tags).split(/[，,]/).map((item) => item.trim()).filter(Boolean);
}

function renderDetail(activity) {
  updateDetailMeta(activity);
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
        </div>
        <div class="detail-metric-grid">${metricGrid}</div>
      </section>

      <div class="detail-layout">
        <section class="detail-main">
          <section class="detail-section detail-section-emphasis">
            <div class="detail-section-head">
              <h2>获奖内容</h2>
            </div>
            <p class="detail-section-copy">${escapeHtml(activity.awardDesc || '--')}</p>
          </section>

          <section class="detail-section">
            <div class="detail-section-head">
              <h2>活动路径</h2>
            </div>
            <p class="detail-section-copy">${escapeHtml(activity.pathDesc || '--')}</p>
          </section>

          ${activity.pathUrl ? `
            <section class="detail-section detail-section-compact">
              <div class="detail-section-head">
                <h2>活动链接</h2>
              </div>
              <div class="detail-inline-card">
                <span class="detail-link">${escapeHtml(activity.pathUrl)}</span>
                <div class="card-actions">
                  ${isPathUrlLink ? `<a class="secondary-btn" href="${escapeAttribute(activity.pathUrl)}" target="_blank" rel="noopener noreferrer">打开链接</a>` : ''}
                  <button class="secondary-btn" type="button" id="copyPathBtn">复制路径</button>
                </div>
              </div>
            </section>
          ` : ''}

          <section class="detail-section detail-section-compact">
            <div class="detail-section-head">
              <h2>活动图片路径</h2>
            </div>
            <div class="detail-inline-card">
              <span class="detail-poster-name">活动路径/二维码</span>
              <button class="primary-btn" type="button" id="viewPosterBtn"${posterUrl ? '' : ' disabled'}>${posterUrl ? '查看图片' : '暂无图片'}</button>
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
          copyBtn.textContent = '复制路径';
        }, 1600);
      } catch (err) {
        console.error('复制路径失败', err);
        window.alert('复制失败，请手动复制。');
      }
    });
  }

  const posterBtn = document.getElementById('viewPosterBtn');
  const openPoster = () => openLightbox(posterUrl, 'poster');
  if (posterBtn && posterUrl) {
    posterBtn.addEventListener('click', openPoster);
  }

  const groupQrBtn = document.getElementById('viewGroupQrBtn');
  if (groupQrBtn) {
    groupQrBtn.addEventListener('click', () => openLightbox(GROUP_QR_URL, 'group'));
  }
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

function openLightbox(src, type = 'poster') {
  currentLightboxType = type;
  els.lightboxError.classList.add('hidden');
  els.lightboxImage.classList.remove('hidden');
  els.lightboxRawLink.href = src;
  els.lightboxImage.src = src;
  els.lightbox.classList.remove('hidden');
  els.lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  els.lightbox.classList.add('hidden');
  els.lightbox.setAttribute('aria-hidden', 'true');
  els.lightboxImage.src = '';
  els.lightboxRawLink.href = '#';
  els.lightboxError.classList.add('hidden');
  els.lightboxImage.classList.remove('hidden');
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchDetail() {
  if (!campaignId) {
    els.loading.classList.add('hidden');
    els.error.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/campaign_detail.php?id=${encodeURIComponent(campaignId)}`, { credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data || data.error) throw new Error(data && data.error ? data.error : 'not_found');

    data.tags = normalizeTags(data.tags);
    els.loading.classList.add('hidden');
    renderDetail(data);
  } catch (err) {
    console.error('加载详情失败', err);
    els.loading.classList.add('hidden');
    els.error.classList.remove('hidden');
  }
}

els.lightbox.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-lightbox="true"]')) {
    closeLightbox();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
});

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

fetchDetail();
