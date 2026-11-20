(() => {
  'use strict';

  const STORAGE_KEY = 'yangmao.today-deals.cards';
  const BANK_NAMES = {
    农行: '中国农业银行', 工行: '中国工商银行', 邮储: '中国邮政储蓄银行', 建行: '中国建设银行',
    中行: '中国银行', 交行: '交通银行', 招行: '招商银行', 兴业: '兴业银行', 中信: '中信银行',
    浦发: '浦发银行', 民生: '民生银行', 光大: '中国光大银行', 华夏: '华夏银行',
    平安: '平安银行', 广发: '广发银行', 浙商: '浙商银行', 渤海: '渤海银行', 恒丰: '恒丰银行'
  };

  function bankKey(item) {
    return ['big6', 'joint'].includes(item.bankGroup) ? item.bankSub : String(item.bankName || '').trim();
  }

  function listsBank(item, bank) {
    if (bankKey(item) === bank) return true;
    const named = String(item.bankName || '').match(/^([工农中建交招]{2,})等\d+家银行$/);
    const abbreviated = { 工行: '工', 农行: '农', 中行: '中', 建行: '建', 交行: '交', 招行: '招' };
    return Boolean(named && abbreviated[bank] && named[1].includes(abbreviated[bank]));
  }

  function matches(item, query) {
    const issuerMatches = query.cards.some(({ bank, type }) => {
      if (!listsBank(item, bank)) return false;
      if (type === 'all') return true;
      if (type === 'credit') return item.isCredit;
      return !item.isCredit || /借记卡|储蓄卡|社保卡/.test([item.title, item.desc].join(' '));
    });
    return issuerMatches && window.ChinaRegions.matches(item.region, query.location, { includeOverseas: true });
  }

  function bankOptionsFor(items, bankGroups) {
    const groups = [
      ['六大国有银行', new Map(bankGroups[0].items.map(([key]) => [key, BANK_NAMES[key] || key]))],
      ['股份制银行', new Map(bankGroups[1].items.map(([key]) => [key, BANK_NAMES[key] || key]))],
      ['城市商业银行', new Map()],
      ['其他银行', new Map()]
    ];
    for (const item of items) {
      const name = String(item.bankName || '').trim();
      if (['big6', 'joint'].includes(item.bankGroup) ||
          !/银行|农商|农信|邮储|信用社/.test(name) || /^(?:多家银行|.*等\d+家银行)$/.test(name)) continue;
      const cityCommercialBank = item.bankGroup === 'local' &&
        !/香港|澳门|台湾|农商|农村|农信|信用社|村镇|微众|网商|新网|百信|众邦|亿联|富民|蓝海|民营|开发银行|农业发展银行|进出口银行|厦门国际银行/.test(name);
      groups[cityCommercialBank ? 2 : 3][1].set(bankKey(item), name);
    }
    return groups.map(([label, banks], index) => [label, index < 2
      ? [...banks]
      : [...banks].sort(([, a], [, b]) => a.localeCompare(b, 'zh-CN'))]);
  }

  function mount({ root, bankGroups, categories, getCampaigns, onSearch, onClear }) {
    const form = root.querySelector('form');
    const cardList = root.querySelector('[data-deal-cards]');
    const province = form.elements.province;
    const city = form.elements.city;
    const category = form.elements.category;
    const regions = window.ChinaRegions;
    regions.provinces.forEach(([label]) => province.add(new Option(label, label)));
    categories.filter(({ key }) => key !== 'all').forEach(({ key, label }) => category.add(new Option(label, key)));

    function populateCities(preferred = '') {
      city.replaceChildren(new Option(province.value ? '仅地区通用' : '请先选择省级地区', ''));
      const cities = regions.cities(province.value);
      cities.forEach(name => city.add(new Option(name, name)));
      city.disabled = !cities.length;
      if (cities.includes(preferred)) city.value = preferred;
      else if (cities.length === 1) city.value = cities[0];
    }
    const status = root.querySelector('[data-deal-status]');
    const clear = root.querySelector('[data-clear-bank-search]');
    const addButton = root.querySelector('[data-add-deal-card]');
    const submit = form.querySelector('[type="submit"]');
    let bankOptions = [];
    let loaded = false;
    let appliedCategory = null;

    function loadSaved() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    }

    function addCard(saved = {}) {
      const row = document.createElement('div');
      row.className = 'today-card';
      row.innerHTML = `
        <label>发卡行<select name="bank" required aria-describedby="bank-issuer-hint"><option value="">选择银行</option></select></label>
        <label>卡种<select name="cardType"><option value="all">全部卡种</option><option value="debit">储蓄卡</option><option value="credit">信用卡</option></select></label>
        <button class="radar-text-reset" type="button" aria-label="移除该发卡行">移除</button>
      `;
      const bank = row.querySelector('[name="bank"]');
      bankOptions.forEach(([name, entries]) => {
        if (!entries.length) return;
        const group = document.createElement('optgroup');
        group.label = name;
        entries.forEach(([key, label]) => group.append(new Option(label, key)));
        bank.append(group);
      });
      bank.value = saved.bank || '';
      row.querySelector('[name="cardType"]').value = ['credit', 'debit'].includes(saved.type) ? saved.type : 'all';
      row.querySelector('button').addEventListener('click', () => {
        if (cardList.children.length === 1) {
          bank.value = '';
          row.querySelector('[name="cardType"]').value = 'all';
        } else {
          row.remove();
        }
        addButton.disabled = false;
      });
      cardList.append(row);
      addButton.disabled = cardList.children.length >= 6;
      return bank;
    }

    function showResultCount(query, activeCount, archivedCount, activeCategory) {
      clear.classList.toggle('hidden', !query);
      if (!query) {
        if (appliedCategory !== null) category.value = 'all';
        appliedCategory = null;
        status.textContent = '';
        return;
      }
      if (activeCategory.key !== appliedCategory) {
        category.value = activeCategory.key;
        appliedCategory = activeCategory.key;
      }
      const locationLabel = query.location.city || query.location.province || '全国通用';
      const bankLabels = [...new Set(query.cards.map(({ bank, type }) => {
        const cardType = type === 'credit' ? '信用卡' : type === 'debit' ? '储蓄卡' : '';
        return cardType ? `${BANK_NAMES[bank] || bank}（${cardType}）` : (BANK_NAMES[bank] || bank);
      }))];
      const categoryLabel = activeCategory.key === 'all' ? '' : activeCategory.label;
      const scope = [locationLabel, ...bankLabels, categoryLabel].filter(Boolean).join(' · ');
      const archived = archivedCount ? `，另有 ${archivedCount} 条已过期` : '';
      status.textContent = `${scope} · 未过期 ${activeCount} 条${archived}`;
    }

    function syncCampaigns() {
      const campaigns = getCampaigns();
      if (!campaigns.length) return;
      const previous = Array.from(cardList.children, row => ({
        bank: row.querySelector('[name="bank"]').value,
        type: row.querySelector('[name="cardType"]').value
      }));
      bankOptions = bankOptionsFor(campaigns, bankGroups);
      const banks = new Set(bankOptions.flatMap(([, entries]) => entries.map(([key]) => key)));
      const saved = loadSaved();
      if (!loaded) {
        const location = saved.location || regions.fromLegacyCity(saved.city);
        province.value = location?.province || '';
        populateCities(location?.city);
        category.value = categories.some(({ key }) => key === saved.category) ? saved.category : 'all';
      }
      const savedCards = Array.isArray(saved.cards) ? saved.cards.filter(card => card && banks.has(card.bank)).slice(0, 6)
        .map(card => ({ ...card, type: saved.queryVersion === 2 ? card.type : 'all' })) : [];
      cardList.replaceChildren();
      (previous.length ? previous : savedCards.length ? savedCards : [{}]).forEach(addCard);
      root.hidden = false;
      submit.disabled = false;
      if (!loaded && savedCards.length) root.open = true;
      loaded = true;
    }

    addButton.addEventListener('click', () => addCard().focus());
    clear.addEventListener('click', onClear);
    province.addEventListener('change', () => populateCities());
    form.addEventListener('submit', event => {
      event.preventDefault();
      const choices = {
        location: { province: province.value, city: city.value },
        category: category.value,
        cards: [...cardList.children].map(row => ({
          bank: row.querySelector('[name="bank"]').value,
          type: row.querySelector('[name="cardType"]').value
        }))
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...choices, queryVersion: 2 }));
      } catch {
        // Matching still works with storage disabled.
      }

      onSearch(choices);
    });

    return { syncCampaigns, showResultCount };
  }

  window.BankLookup = { mount, matches };
})();
