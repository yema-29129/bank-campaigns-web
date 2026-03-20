const API_BASE = 'https://mini.vooqqqm.com/api';
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
  lightboxImage: document.getElementById('lightboxImage')
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolvePosterUrl(activity) {
  for (const key of POSTER_FIELDS) {
    const value = activity[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (!tags) return [];
  return String(tags).split(/[，,]/).map((item) => item.trim()).filter(Boolean);
}

function renderDetail(activity) {
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
              <span class="detail-section-kicker">活动说明</span>
              <h2>获奖内容</h2>
            </div>
            <p class="detail-section-copy">${escapeHtml(activity.awardDesc || '--')}</p>
          </section>

          <section class="detail-section">
            <div class="detail-section-head">
              <span class="detail-section-kicker">参与方式</span>
              <h2>活动路径</h2>
            </div>
            <p class="detail-section-copy">${escapeHtml(activity.pathDesc || '--')}</p>
          </section>

          ${activity.pathUrl ? `
            <section class="detail-section detail-section-compact">
              <div class="detail-section-head">
                <span class="detail-section-kicker">链接入口</span>
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
              <span class="detail-section-kicker">辅助查看</span>
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
              <span class="detail-section-kicker">关键信息</span>
              <h2>快速查看</h2>
            </div>
            <div class="detail-stat-grid">${sideGrid}</div>
          </section>

          <section class="detail-side-panel detail-side-panel-action">
            <div class="detail-side-head">
              <span class="detail-section-kicker">图片辅助</span>
              <h2>二维码与路径</h2>
            </div>
            <p class="detail-side-copy">如页面入口不清晰，可点击下方查看活动图片或二维码。</p>
            <button class="primary-btn detail-side-btn" type="button" id="viewPosterBtnSide"${posterUrl ? '' : ' disabled'}>${posterUrl ? '查看图片' : '暂无图片'}</button>
          </section>

          <section class="detail-side-note">
            <span class="detail-section-kicker">提示</span>
            <p>活动规则、名额、页面入口都可能变化，实际请以银行官方页面为准。</p>
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
  const posterBtnSide = document.getElementById('viewPosterBtnSide');
  const openPoster = () => openLightbox(posterUrl);
  if (posterBtn && posterUrl) {
    posterBtn.addEventListener('click', openPoster);
  }
  if (posterBtnSide && posterUrl) {
    posterBtnSide.addEventListener('click', openPoster);
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

function openLightbox(src) {
  els.lightboxImage.src = src;
  els.lightbox.classList.remove('hidden');
  els.lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  els.lightbox.classList.add('hidden');
  els.lightbox.setAttribute('aria-hidden', 'true');
  els.lightboxImage.src = '';
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

fetchDetail();
