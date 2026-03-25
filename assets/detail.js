const API_BASE = 'https://mini.vooqqqm.com/api';
const COMMUNITY_QR_URL = 'https://mini.vooqqqm.com/uploads/posters/wechat-group-qrcode.png';

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatText(value, fallback = '--') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function formatMoney(value, suffix = ' 元') {
  if (value === null || value === undefined || value === '') return `--${suffix}`;
  return `${value}${suffix}`;
}

function formatDiscount(data) {
  if (data.discountMin !== null && data.discountMin !== '' && data.discountMax !== null && data.discountMax !== '') {
    return `${data.discountMin} ~ ${data.discountMax} 元`;
  }
  if (data.discountAmount !== null && data.discountAmount !== '') {
    return `${data.discountAmount} 元`;
  }
  return '--';
}

function formatDateRange(from, to) {
  const f = formatText(from, '');
  const t = formatText(to, '');
  if (!f && !t) return '--';
  return `${f || '--'} ~ ${t || '--'}`;
}

function getPosterUrl(data) {
  const fields = [
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

  for (const key of fields) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function showError(message) {
  const loadingEl = document.getElementById('detailLoading');
  const errorEl = document.getElementById('detailError');

  if (loadingEl) loadingEl.classList.add('hidden');
  if (errorEl) {
    errorEl.textContent = message || '活动详情加载失败。';
    errorEl.classList.remove('hidden');
  }
}

function hideStates() {
  const loadingEl = document.getElementById('detailLoading');
  const errorEl = document.getElementById('detailError');

  if (loadingEl) loadingEl.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');
}

function buildDetailHtml(data) {
  const bankName = formatText(data.bankName, '银行活动');
  const title = formatText(data.title, '活动详情');
  const desc = formatText(data.desc, '暂无活动描述');
  const region = formatText(data.region, '--');
  const channel = formatText(data.channel, '--');
  const minAmount = formatMoney(data.minAmount);
  const discount = formatDiscount(data);
  const cashback = formatText(data.cashbackRate, '--');
  const validDate = formatDateRange(data.validFrom, data.validTo);
  const recurringText = formatText(data.recurringText, '--');
  const updatedDate = formatText(data.updatedDate, '--');
  const awardDesc = formatText(data.awardDesc, '--');
  const pathDesc = formatText(data.pathDesc, '--');
  const pathUrl = formatText(data.pathUrl, '--');
  const posterUrl = getPosterUrl(data);

  document.title = `${bankName}｜${title} | 好羊毛银行活动站`;

  return `
    <section class="detail-hero">
      <div class="detail-hero-main">
        <div class="detail-hero-bank">${escapeHtml(bankName)}</div>
        <h1 class="detail-hero-title">${escapeHtml(title)}</h1>
        <p class="detail-hero-desc">${escapeHtml(desc)}</p>
        <div class="detail-hero-mark">${escapeHtml(channel)}</div>
      </div>

      <div class="detail-hero-metrics">
        <article class="metric-card">
          <span class="metric-label">立减金额</span>
          <strong class="metric-value">${escapeHtml(discount)}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-label">最低门槛</span>
          <strong class="metric-value">${escapeHtml(minAmount)}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-label">活动时间</span>
          <strong class="metric-value">${escapeHtml(validDate)}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-label">适用地区</span>
          <strong class="metric-value">${escapeHtml(region)}</strong>
        </article>
      </div>
    </section>

    <section class="detail-grid">
      <div class="detail-main">
        <article class="detail-card">
          <h2>获奖内容</h2>
          <div class="detail-text">${escapeHtml(awardDesc).replace(/\n/g, '<br>')}</div>
        </article>

        <article class="detail-card">
          <h2>活动路径</h2>
          <div class="detail-text">${escapeHtml(pathDesc).replace(/\n/g, '<br>')}</div>
        </article>

        <article class="detail-card">
          <h2>活动链接</h2>
          <div class="detail-link-row">
            <div class="detail-link-text">${escapeHtml(pathUrl)}</div>
            <button class="primary-btn" type="button" id="copyPathBtn">复制路径</button>
          </div>
        </article>

        <article class="detail-card">
          <h2>活动图片路径</h2>
          <div class="detail-link-row">
            <div class="detail-link-text">活动路径/二维码</div>
            <button class="primary-btn" type="button" id="viewPosterBtn" ${posterUrl ? '' : 'disabled'}>${posterUrl ? '查看图片' : '暂无图片'}</button>
          </div>
          <div class="detail-hint">${posterUrl ? '点击按钮查看活动海报或二维码' : '当前活动暂无图片'}</div>
        </article>
      </div>

      <aside class="detail-side">
        <article class="detail-card">
          <h2>快速查看</h2>
          <div class="quick-grid">
            <div class="quick-item">
              <span class="quick-label">适用地区</span>
              <strong class="quick-value">${escapeHtml(region)}</strong>
            </div>
            <div class="quick-item">
              <span class="quick-label">消费渠道</span>
              <strong class="quick-value">${escapeHtml(channel)}</strong>
            </div>
            <div class="quick-item">
              <span class="quick-label">最低门槛金额</span>
              <strong class="quick-value">${escapeHtml(minAmount)}</strong>
            </div>
            <div class="quick-item">
              <span class="quick-label">立减金额</span>
              <strong class="quick-value">${escapeHtml(discount)}</strong>
            </div>
            <div class="quick-item">
              <span class="quick-label">返现比例</span>
              <strong class="quick-value">${escapeHtml(cashback)}</strong>
            </div>
            <div class="quick-item">
              <span class="quick-label">活动时间</span>
              <strong class="quick-value">${escapeHtml(validDate)}</strong>
            </div>
            <div class="quick-item">
              <span class="quick-label">重复规则</span>
              <strong class="quick-value">${escapeHtml(recurringText)}</strong>
            </div>
            <div class="quick-item">
              <span class="quick-label">最近更新</span>
              <strong class="quick-value">${escapeHtml(updatedDate)}</strong>
            </div>
          </div>
        </article>

        <article class="detail-card">
          <h2>提示</h2>
          <div class="detail-text">活动规则、名称、页面入口都可能变化，实际请以银行官方页面为准。</div>
        </article>

        <article class="detail-card community-card">
          <div class="community-label">社群福利</div>
          <h2>加入「薅羊毛微信群 · 每月最少薅500元」</h2>
          <div class="detail-text">点击下方按钮即可查看固定微信群二维码，后续扫码进群即可获取更多羊毛线报。</div>
          <button class="primary-btn" type="button" id="viewCommunityBtn">查看群二维码</button>
        </article>
      </aside>
    </section>

    <section class="detail-footer-note">
      活动内容归所属机构所有，活动奖品随时间推移可能变化，一切活动请以机构官方规则为准。网站端展示仅作信息整理，不构成保证。
    </section>
  `;
}

function ensureDetailStyles() {
  if (document.getElementById('detail-runtime-styles')) return;

  const style = document.createElement('style');
  style.id = 'detail-runtime-styles';
  style.textContent = `
    .detail-hero {
      display: grid;
      grid-template-columns: 1.2fr 0.95fr;
      gap: 20px;
      margin-top: 12px;
      margin-bottom: 20px;
      padding: 20px;
      border-radius: 28px;
      background: linear-gradient(135deg, #163a73 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 20px 40px rgba(37, 99, 235, 0.18);
    }

    .detail-hero-bank {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(255, 236, 179, 0.95);
      color: #92400e;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 18px;
    }

    .detail-hero-title {
      font-size: 42px;
      line-height: 1.16;
      font-weight: 900;
      margin: 0 0 16px;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .detail-hero-desc {
      margin: 0 0 22px;
      font-size: 16px;
      line-height: 1.9;
      color: rgba(255,255,255,0.9);
      white-space: pre-line;
    }

    .detail-hero-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 88px;
      min-height: 88px;
      padding: 12px;
      border-radius: 24px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.08);
      color: #fff;
      font-size: 17px;
      font-weight: 800;
      text-align: center;
    }

    .detail-hero-metrics {
      display: grid;
      gap: 12px;
    }

    .metric-card {
      padding: 16px 18px;
      border-radius: 18px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .metric-label {
      display: block;
      font-size: 12px;
      color: rgba(255,255,255,0.72);
      margin-bottom: 10px;
      font-weight: 700;
    }

    .metric-value {
      display: block;
      font-size: 22px;
      line-height: 1.5;
      color: #fff;
      font-weight: 800;
      white-space: pre-line;
      word-break: break-word;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1.65fr 0.9fr;
      gap: 20px;
    }

    .detail-main,
    .detail-side {
      display: grid;
      gap: 16px;
    }

    .detail-card {
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(148,163,184,0.12);
      border-radius: 24px;
      box-shadow: 0 14px 36px rgba(15,23,42,0.06);
      padding: 20px;
    }

    .detail-card h2 {
      margin: 0 0 14px;
      font-size: 18px;
      line-height: 1.4;
      font-weight: 900;
      color: #0f172a;
    }

    .detail-text {
      font-size: 15px;
      line-height: 1.9;
      color: #475569;
      white-space: pre-line;
      word-break: break-word;
    }

    .detail-link-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      padding: 14px;
      border-radius: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .detail-link-text {
      flex: 1;
      min-width: 0;
      font-size: 15px;
      line-height: 1.8;
      color: #0f172a;
      font-weight: 700;
      word-break: break-all;
      white-space: pre-line;
    }

    .detail-hint {
      margin-top: 10px;
      font-size: 13px;
      line-height: 1.7;
      color: #64748b;
    }

    .quick-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .quick-item {
      padding: 14px;
      border-radius: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      min-height: 80px;
      box-sizing: border-box;
    }

    .quick-label {
      display: block;
      margin-bottom: 8px;
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
    }

    .quick-value {
      display: block;
      color: #0f172a;
      font-size: 18px;
      line-height: 1.5;
      font-weight: 800;
      white-space: pre-line;
      word-break: break-word;
    }

    .community-label {
      margin-bottom: 8px;
      color: #64748b;
      font-size: 12px;
      font-weight: 800;
    }

    .detail-footer-note {
      margin-top: 18px;
      padding: 16px 18px;
      border-radius: 18px;
      background: rgba(255,255,255,0.88);
      border: 1px solid rgba(148,163,184,0.12);
      color: #64748b;
      font-size: 13px;
      line-height: 1.8;
    }

    @media (max-width: 1080px) {
      .detail-hero {
        grid-template-columns: 1fr;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .detail-hero-title {
        font-size: 30px;
      }

      .quick-grid {
        grid-template-columns: 1fr;
      }

      .detail-link-row {
        align-items: flex-start;
      }
    }
  `;
  document.head.appendChild(style);
}

function bindDetailActions(data) {
  const pathUrl = formatText(data.pathUrl, '');
  const posterUrl = getPosterUrl(data);

  const copyBtn = document.getElementById('copyPathBtn');
  const posterBtn = document.getElementById('viewPosterBtn');
  const communityBtn = document.getElementById('viewCommunityBtn');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!pathUrl || pathUrl === '--') return;

      try {
        await navigator.clipboard.writeText(pathUrl);
        const oldText = copyBtn.textContent;
        copyBtn.textContent = '已复制';
        setTimeout(() => {
          copyBtn.textContent = oldText;
        }, 1200);
      } catch (err) {
        console.error('复制失败', err);
        alert('复制失败，请手动复制');
      }
    });
  }

  if (posterBtn) {
    if (!posterUrl) {
      posterBtn.disabled = true;
      return;
    }

    posterBtn.addEventListener('click', () => {
      window.open(posterUrl, '_blank', 'noopener,noreferrer');
    });
  }

  if (communityBtn) {
    communityBtn.addEventListener('click', () => {
      window.open(COMMUNITY_QR_URL, '_blank', 'noopener,noreferrer');
    });
  }
}

async function fetchDetail() {
  const id = getQueryParam('id');
  const detailRoot = document.getElementById('detailRoot');

  if (!id) {
    showError('缺少活动 ID');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/campaign_detail.php?id=${encodeURIComponent(id)}`, {
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || payload.code !== 0 || !payload.data) {
      console.error('详情接口返回异常', payload);
      showError((payload && payload.message) ? payload.message : '活动详情加载失败。');
      return;
    }

    ensureDetailStyles();
    hideStates();

    if (detailRoot) {
      detailRoot.innerHTML = buildDetailHtml(payload.data);
    }

    bindDetailActions(payload.data);
  } catch (err) {
    console.error('加载详情失败', err);
    showError('活动详情加载失败。');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchDetail();
});
