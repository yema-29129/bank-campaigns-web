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
  const items = [
    ['适用地区', activity.region || '--'],
    ['消费渠道', activity.channel || '--'],
    ['最低门槛金额', (activity.minAmount || activity.minAmount === 0) ? `${activity.minAmount} 元` : '--'],
    ['立减金额', buildDiscountText(activity)],
    ['返现比例', activity.cashbackRate || '--'],
    ['活动时间', (activity.validFrom || activity.validTo) ? `${activity.validFrom || '--'} 至 ${activity.validTo || '--'}` : '--'],
    ['重复规则', activity.recurringText || '--'],
    ['最近更新', activity.updatedDate || '--'],
    ['获奖内容', activity.awardDesc || '--'],
    ['活动路径', activity.pathDesc || '--']
  ];

  const grid = items.map(([label, value]) => `
    <section class="detail-item">
      <span class="detail-item-label">${escapeHtml(label)}</span>
      <p class="detail-item-value">${escapeHtml(value)}</p>
    </section>
  `).join('');

  const html = `
    <article class="detail-card">
      <div class="detail-header">
        <div>
          <div class="badge-row">
            <span class="badge tag">${escapeHtml(activity.bankName || '银行活动')}</span>
            ${(activity.tags || []).map((tag) => `<span class="badge tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <h1>${escapeHtml(activity.title || '活动详情')}</h1>
          <p class="detail-desc">${escapeHtml(activity.desc || '暂无活动描述')}</p>
        </div>
      </div>

      <div class="detail-grid">${grid}</div>

      ${activity.pathUrl ? `
        <section class="detail-item" style="margin-top: 18px;">
          <span class="detail-item-label">活动链接</span>
          <div class="detail-link-row">
            <span class="detail-link">${escapeHtml(activity.pathUrl)}</span>
            <div class="card-actions">
              ${isPathUrlLink ? `<a class="secondary-btn" href="${escapeAttribute(activity.pathUrl)}" target="_blank" rel="noopener noreferrer">打开链接</a>` : ''}
              <button class="secondary-btn" type="button" id="copyPathBtn">复制路径</button>
            </div>
          </div>
        </section>
      ` : ''}

      <section class="detail-item" style="margin-top: 18px;">
        <span class="detail-item-label">活动图片路径</span>
        <div class="detail-poster-row">
          <span class="detail-poster-name">活动路径/二维码</span>
          <button class="primary-btn" type="button" id="viewPosterBtn"${posterUrl ? '' : ' disabled'}>${posterUrl ? '查看图片' : '暂无图片'}</button>
        </div>
      </section>

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
  if (posterBtn && posterUrl) {
    posterBtn.addEventListener('click', () => {
      openLightbox(posterUrl);
    });
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
