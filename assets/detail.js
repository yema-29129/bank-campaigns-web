const API_BASE = 'https://mini.vooqqqm.com/api';
const COMMUNITY_QR_URL = 'https://mini.vooqqqm.com/uploads/posters/wechat-group-qrcode.png';

function $(id) {
  return document.getElementById(id);
}

const els = {
  pageTitle: $('detailPageTitle'),
  backBtn: $('backBtn'),

  bankBadge: $('bankBadge'),
  mainTitle: $('mainTitle'),
  mainDesc: $('mainDesc'),
  heroChannel: $('heroChannel'),

  heroDiscount: $('heroDiscount'),
  heroMinAmount: $('heroMinAmount'),
  heroDate: $('heroDate'),
  heroRegion: $('heroRegion'),

  awardDesc: $('awardDesc'),
  pathDesc: $('pathDesc'),

  quickRegion: $('quickRegion'),
  quickChannel: $('quickChannel'),
  quickMinAmount: $('quickMinAmount'),
  quickDiscount: $('quickDiscount'),
  quickCashback: $('quickCashback'),
  quickDate: $('quickDate'),
  quickRecurring: $('quickRecurring'),
  quickUpdated: $('quickUpdated'),

  posterBtn: $('posterBtn'),
  posterHint: $('posterHint'),
  communityBtn: $('communityBtn'),

  loadingState: $('loadingState'),
  errorState: $('errorState'),
  detailContent: $('detailContent')
};

function getIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || '';
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

function setText(el, value, fallback = '--') {
  if (!el) return;
  el.textContent = formatText(value, fallback);
}

function setHtml(el, value, fallback = '--') {
  if (!el) return;
  const text = formatText(value, fallback);
  el.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
}

function showLoading() {
  if (els.loadingState) els.loadingState.classList.remove('hidden');
  if (els.errorState) els.errorState.classList.add('hidden');
  if (els.detailContent) els.detailContent.classList.add('hidden');
}

function showError(message = '加载失败，请稍后再试') {
  if (els.loadingState) els.loadingState.classList.add('hidden');

  if (els.errorState) {
    els.errorState.textContent = message;
    els.errorState.classList.remove('hidden');
  }

  if (els.detailContent) els.detailContent.classList.add('hidden');
}

function showContent() {
  if (els.loadingState) els.loadingState.classList.add('hidden');
  if (els.errorState) els.errorState.classList.add('hidden');
  if (els.detailContent) els.detailContent.classList.remove('hidden');
}

function renderDetail(data) {
  const title = formatText(data.title, '活动详情');
  const bankName = formatText(data.bankName, '银行活动');
  const desc = formatText(data.desc, '暂无活动描述');
  const channel = formatText(data.channel, '--');
  const region = formatText(data.region, '--');
  const discountText = formatDiscount(data);
  const minAmountText = formatMoney(data.minAmount);
  const cashbackText = formatText(data.cashbackRate, '--');
  const dateRangeText = formatDateRange(data.validFrom, data.validTo);
  const recurringText = formatText(data.recurringText, '--');
  const updatedText = formatText(data.updatedDate, '--');

  const awardText = formatText(data.awardDesc, '--');
  const pathDescText = formatText(data.pathDesc, '--');
  const posterUrl = getPosterUrl(data);

  document.title = `${bankName}｜${title}`;

  setText(els.pageTitle, title, '活动详情');
  setText(els.bankBadge, bankName, '银行活动');
  setText(els.mainTitle, title, '活动详情');
  setText(els.mainDesc, desc, '暂无活动描述');
  setText(els.heroChannel, channel, '--');

  setText(els.heroDiscount, discountText, '--');
  setText(els.heroMinAmount, minAmountText, '--');
  setText(els.heroDate, dateRangeText, '--');
  setText(els.heroRegion, region, '--');

  setHtml(els.awardDesc, awardText, '--');
  setHtml(els.pathDesc, pathDescText, '--');

  setText(els.quickRegion, region, '--');
  setText(els.quickChannel, channel, '--');
  setText(els.quickMinAmount, minAmountText, '--');
  setText(els.quickDiscount, discountText, '--');
  setText(els.quickCashback, cashbackText, '--');
  setText(els.quickDate, dateRangeText, '--');
  setText(els.quickRecurring, recurringText, '--');
  setText(els.quickUpdated, updatedText, '--');

  if (els.posterBtn) {
    if (posterUrl) {
      els.posterBtn.textContent = '查看图片';
      els.posterBtn.disabled = false;
      els.posterBtn.onclick = () => {
        window.open(posterUrl, '_blank', 'noopener,noreferrer');
      };
    } else {
      els.posterBtn.textContent = '暂无图片';
      els.posterBtn.disabled = true;
      els.posterBtn.onclick = null;
    }
  }

  if (els.posterHint) {
    els.posterHint.textContent = posterUrl
      ? '查看图片可打开活动海报或二维码'
      : '当前活动暂无图片';
  }

  if (els.communityBtn) {
    els.communityBtn.onclick = () => {
      window.open(COMMUNITY_QR_URL, '_blank', 'noopener,noreferrer');
    };
  }

  showContent();
}

async function fetchDetail() {
  const id = getIdFromQuery();

  if (!id) {
    showError('缺少活动 ID');
    return;
  }

  showLoading();

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
      showError((payload && payload.message) ? payload.message : '活动不存在或加载失败');
      return;
    }

    renderDetail(payload.data);
  } catch (err) {
    console.error('加载详情失败', err);
    showError('加载失败，请稍后再试');
  }
}

function bindEvents() {
  if (els.backBtn) {
    els.backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = './index.html';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  fetchDetail();
});
