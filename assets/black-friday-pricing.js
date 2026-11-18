(function initBlackFridayPricing() {
  'use strict';

  const API_BASE = 'https://api.frankfurter.dev/v2/rates';
  const RATE_SOURCE = 'https://frankfurter.dev/';
  const CACHE_PREFIX = 'yangmao-bf-rate-v1:';
  const CACHE_TTL = 30 * 60 * 1000;
  const STALE_TTL = 24 * 60 * 60 * 1000;
  const memoryCache = new Map();

  const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    JPY: '¥',
    KRW: '₩',
    HKD: 'HK$',
    CNY: '¥'
  };

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

  function numberOrNull(value) {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function booleanValue(value, fallback = false) {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).toLowerCase() === 'true';
  }

  function fromDataset(dataset) {
    const amount = numberOrNull(dataset.priceAmount);
    const currency = String(dataset.priceCurrency || '').trim().toUpperCase();
    if (amount === null || !/^[A-Z]{3}$/.test(currency)) return null;

    return {
      amount,
      currency,
      label: String(dataset.priceLabel || '活动价').trim(),
      estimate: booleanValue(dataset.priceEstimate),
      note: String(dataset.priceNote || '').trim(),
      product: String(dataset.productName || '').trim(),
      cnPrice: numberOrNull(dataset.cnPrice),
      cnPriceLabel: String(dataset.cnPriceLabel || '中国大陆官方价').trim(),
      cnPriceSource: String(dataset.cnPriceSource || '').trim(),
      comparable: booleanValue(dataset.cnPriceComparable, true),
      checkedDate: String(dataset.priceChecked || '').trim()
    };
  }

  function currencyText(amount, currency) {
    const maximumFractionDigits = ['JPY', 'KRW'].includes(currency) ? 0 : 2;
    const value = new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits
    }).format(amount);
    return `${CURRENCY_SYMBOLS[currency] || `${currency} `}${value}`;
  }

  function cnyText(amount) {
    return `¥${new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount))}`;
  }

  function readStoredRate(currency) {
    try {
      const raw = window.sessionStorage.getItem(`${CACHE_PREFIX}${currency}`) ||
        window.localStorage.getItem(`${CACHE_PREFIX}${currency}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Number.isFinite(parsed.rate) || !parsed.savedAt) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function storeRate(currency, value) {
    const payload = JSON.stringify(value);
    try { window.sessionStorage.setItem(`${CACHE_PREFIX}${currency}`, payload); } catch { /* noop */ }
    try { window.localStorage.setItem(`${CACHE_PREFIX}${currency}`, payload); } catch { /* noop */ }
  }

  async function fetchRate(currency) {
    if (currency === 'CNY') {
      return { rate: 1, date: new Date().toISOString().slice(0, 10), savedAt: Date.now(), cached: false };
    }

    const now = Date.now();
    const inMemory = memoryCache.get(currency);
    if (inMemory && now - inMemory.savedAt < CACHE_TTL) return { ...inMemory, cached: true };

    const stored = readStoredRate(currency);
    if (stored && now - stored.savedAt < CACHE_TTL) {
      memoryCache.set(currency, stored);
      return { ...stored, cached: true };
    }

    try {
      const url = `${API_BASE}?base=${encodeURIComponent(currency)}&quotes=CNY`;
      const response = await fetch(url, { mode: 'cors', cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      const row = Array.isArray(rows) ? rows.find((item) => item.quote === 'CNY') : null;
      if (!row || !Number.isFinite(Number(row.rate))) throw new Error('invalid_rate');
      const value = {
        rate: Number(row.rate),
        date: String(row.date || ''),
        savedAt: now,
        cached: false
      };
      memoryCache.set(currency, value);
      storeRate(currency, value);
      return value;
    } catch (error) {
      if (stored && now - stored.savedAt < STALE_TTL) {
        return { ...stored, cached: true, stale: true };
      }
      throw error;
    }
  }

  function render(pricing) {
    if (!pricing) return '';
    const foreignPrice = currencyText(pricing.amount, pricing.currency);
    const product = pricing.product ? `<p class="bf-price-product">${escapeHtml(pricing.product)}</p>` : '';
    return `
      <section class="bf-price-card" data-bf-price-card aria-live="polite">
        <div class="bf-price-head">
          <div>
            <p class="bf-price-kicker">价格换算与大陆价对比</p>
            <h3>黑五价格一眼看懂</h3>
          </div>
          <span class="bf-price-live">联网更新汇率</span>
        </div>
        ${product}
        <div class="bf-price-grid">
          <div><span>${escapeHtml(pricing.label)}</span><strong>${escapeHtml(foreignPrice)}</strong></div>
          <div><span>人民币参考价</span><strong data-bf-cny>正在换算…</strong></div>
          ${pricing.cnPrice !== null ? `<div><span>${escapeHtml(pricing.cnPriceLabel)}</span><strong>${escapeHtml(cnyText(pricing.cnPrice))}</strong></div>` : ''}
          ${pricing.cnPrice !== null && pricing.comparable ? '<div class="bf-price-diff"><span>与大陆价相比</span><strong data-bf-diff>正在计算…</strong></div>' : ''}
        </div>
        <div class="bf-price-status" data-bf-status>正在获取最新参考汇率…</div>
      </section>
    `;
  }

  function renderComparison(pricing, converted) {
    if (pricing.cnPrice === null || !pricing.comparable) return '';
    const difference = pricing.cnPrice - converted;
    const percent = pricing.cnPrice > 0 ? Math.abs(difference) / pricing.cnPrice * 100 : 0;
    if (Math.abs(difference) < 1) return '价格基本相同';
    const direction = difference > 0 ? '约便宜' : '约贵';
    return `${direction} ${cnyText(Math.abs(difference))}（${percent.toFixed(1)}%）`;
  }

  function sourceLinks(pricing) {
    const links = [
      `<a href="${RATE_SOURCE}" target="_blank" rel="noopener noreferrer">汇率来源</a>`
    ];
    if (pricing.cnPriceSource) {
      links.push(`<a href="${escapeAttribute(pricing.cnPriceSource)}" target="_blank" rel="noopener noreferrer">大陆官方价来源</a>`);
    }
    return links.join(' · ');
  }

  async function hydrate(root, pricing) {
    if (!root || !pricing) return;
    const card = root.querySelector('[data-bf-price-card]');
    if (!card) return;
    const cny = card.querySelector('[data-bf-cny]');
    const diff = card.querySelector('[data-bf-diff]');
    const status = card.querySelector('[data-bf-status]');

    try {
      const result = await fetchRate(pricing.currency);
      const converted = pricing.amount * result.rate;
      if (cny) cny.textContent = `${cnyText(converted)}${pricing.estimate ? '（估算）' : ''}`;
      if (diff) diff.textContent = renderComparison(pricing, converted);

      const details = [];
      if (pricing.estimate) details.push('活动价按官方公布的最高折扣估算');
      if (pricing.note) details.push(pricing.note);
      if (!pricing.comparable && pricing.cnPrice !== null) details.push('配置或口径不完全相同，暂不计算价差');
      details.push(`汇率日期 ${result.date || '最近更新'}：1 ${pricing.currency} ≈ ${result.rate.toFixed(4)} CNY`);
      if (result.stale) details.push('当前使用 24 小时内缓存汇率');
      if (pricing.checkedDate) details.push(`大陆价核验于 ${pricing.checkedDate}`);
      details.push('不含境外销售税、运费、关税及银行卡汇兑费用，最终以商家结账页为准');
      if (status) status.innerHTML = `${details.map(escapeHtml).join('；')}。<span class="bf-price-sources">${sourceLinks(pricing)}</span>`;
    } catch (error) {
      if (cny) cny.textContent = '暂时无法换算';
      if (diff) diff.textContent = '等待汇率后计算';
      if (status) {
        const note = pricing.cnPrice !== null
          ? `${pricing.cnPriceLabel}为 ${cnyText(pricing.cnPrice)}；`
          : '';
        status.innerHTML = `${escapeHtml(note)}汇率服务暂时不可用，请稍后刷新。<span class="bf-price-sources">${sourceLinks(pricing)}</span>`;
      }
      console.warn('黑五价格换算失败', error);
    }
  }

  window.BlackFridayPricing = { fromDataset, render, hydrate };
})();
