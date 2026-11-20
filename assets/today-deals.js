(() => {
  'use strict';

  const STORAGE_KEY = 'yangmao.today-deals.cards';
  const TIME_ZONE = 'Asia/Shanghai';
  const FOOD = /外卖|饿了么|淘宝闪购|京东秒送/;
  const ORDER_PLATFORM = /美团|京东到家|饿了么|淘宝闪购|京东秒送/;
  const LIMITED_ELIGIBILITY = /受邀|邀约|定向邀请|仅限新客|新户|首次绑|首绑|首刷|新办卡|联名卡|分期付款|购买[^。；]{0,12}券包/;
  const PAYMENT = /微信支付|支付宝|云闪付|美团支付|京东支付|抖音支付|数字人民币|(?:Apple|Huawei|Xiaomi|Samsung|OPPO|vivo|银联|手机)\s*Pay|手机闪付|手机钱包/i;
  const DEBIT = /借记卡|储蓄卡|社保卡/;
  const CREDIT = /信用卡|贷记卡|credit card/i;
  const NON_FIXED = /随机|抽奖|盲盒|至高|最高\s*(?:可\s*)?(?:立减|减|返|省|得|享)|满减券包|返现|刷卡金/;
  const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
  const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const FIXED_SAVING = /满\s*([\d,]+(?:\.\d+)?)\s*元?\s*(?:及以上|或以上|\(含\)|\(含以上\))?\s*(?:即可|可|享|可享)?\s*(?:定额|直接)?(?:立)?减\s*([\d,]+(?:\.\d+)?)\s*元?/g;

  function todayInChina(now = new Date()) {
    const fields = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now).map(({ type, value }) => [type, value]));
    return {
      date: `${fields.year}-${fields.month}-${fields.day}`,
      day: WEEKDAY.indexOf(fields.weekday),
      minute: Number(fields.hour) * 60 + Number(fields.minute)
    };
  }

  function dateMatches(item, today) {
    return /^\d{4}-\d{2}-\d{2}/.test(item.validFrom) && /^\d{4}-\d{2}-\d{2}/.test(item.validTo) &&
      item.validFrom.slice(0, 10) <= today.date && today.date <= item.validTo.slice(0, 10);
  }

  function savingsIn(text) {
    return [...String(text || '').normalize('NFKC').matchAll(FIXED_SAVING)].map(([, minimum, saving]) => ({
      minimum: Number(minimum.replaceAll(',', '')),
      saving: Number(saving.replaceAll(',', ''))
    })).filter(({ minimum, saving }) => minimum > 0 && saving > 0 && saving <= minimum);
  }

  function findFixedSaving(item) {
    return savingsIn([item.title, item.desc].filter(Boolean).join(' '))[0];
  }

  function bankKey(item) {
    return ['big6', 'joint'].includes(item.bankGroup) ? item.bankSub : String(item.bankName || '').trim();
  }

  function bankOptionsFor(items, bankGroups) {
    const groups = [
      ['六大国有银行', new Map(bankGroups[0].items.map(([key]) => [key, key]))],
      ['股份制银行', new Map(bankGroups[1].items.map(([key]) => [key, key]))],
      ['城市商业银行', new Map()],
      ['其他银行', new Map()]
    ];
    for (const item of items) {
      const name = String(item.bankName || '').trim();
      if (['big6', 'joint'].includes(item.bankGroup) ||
          !/银行|农商|农信|邮储|信用社/.test(name)) continue;
      const cityCommercialBank = item.bankGroup === 'local' &&
        !/香港|澳门|台湾|农商|农村|农信|信用社|村镇|微众|网商|新网|百信|众邦|亿联|富民|蓝海|民营|开发银行|农业发展银行|进出口银行|厦门国际银行/.test(name);
      groups[cityCommercialBank ? 2 : 3][1].set(bankKey(item), name);
    }
    return groups.map(([label, banks], index) => [label, index < 2
      ? [...banks]
      : [...banks].sort(([, a], [, b]) => a.localeCompare(b, 'zh-CN'))]);
  }

  function shortList(items, choices, today) {
    return items.flatMap(item => {
      const summary = [item.title, item.desc, item.channel, item.consumeChannel].filter(Boolean).join(' ');
      const types = choices.cards.filter(card => card.bank === bankKey(item)).map(card => card.type);
      if (!types.length || item.websiteOfferId || !dateMatches(item, today) ||
          !window.ChinaRegions.matches(item.region, choices.location) ||
          (!FOOD.test(summary) && !ORDER_PLATFORM.test(summary)) ||
          NON_FIXED.test(summary) || LIMITED_ELIGIBILITY.test(summary)) return [];
      if (CREDIT.test(summary) && !DEBIT.test(summary) && !types.includes('credit')) return [];
      if (DEBIT.test(summary) && !CREDIT.test(summary) && !types.includes('debit')) return [];
      const discount = findFixedSaving(item);
      return [{ item, discount, types, location: choices.location }];
    }).sort((a, b) => (a.discount?.minimum ?? Infinity) - (b.discount?.minimum ?? Infinity) ||
      (b.discount?.saving || 0) - (a.discount?.saving || 0));
  }

  function matchesSchedule(text, recurringType, today) {
    const weeks = [...text.matchAll(/(?:每逢)?(?:周|星期)([一二三四五六日天])\s*(?:至|到|[-—~～])\s*(?:周|星期)?([一二三四五六日天])/g)];
    const dayNumber = value => DAYS.indexOf(value === '天' ? '日' : value);
    const weekDays = [...text.matchAll(/(?:周|星期)([一二三四五六日天])/g)].map(match => dayNumber(match[1]));
    if (weeks.length && !weeks.some(([, first, last]) =>
      (today.day - dayNumber(first) + 7) % 7 <= (dayNumber(last) - dayNumber(first) + 7) % 7
    )) return false;
    if (!weeks.length && weekDays.length && !weekDays.includes(today.day)) return false;
    if (/周末/.test(text) && ![0, 6].includes(today.day)) return false;
    if (recurringType === 'week' && !weekDays.length && !/每天|每日|周末/.test(text)) return false;
    if (/工作日|节假日|法定假期|每隔|指定日期|指定时段|指定时间|活动日另行|每月\s*(?:第|首|\d+\s*[日号])/.test(text)) return false;

    const hours = [...text.matchAll(/(?:每日|每天|每周[一二三四五六日天]|周[一二三四五六日天])\s*(\d{1,2})(?::(\d{2})(?::\d{2})?|点|时)\s*(?:至|到|[-—~～])\s*(\d{1,2})(?::(\d{2})(?::\d{2})?|点|时)/g)];
    if (hours.length) {
      return hours.some(([, from, fromMinute, to, toMinute]) =>
        today.minute >= Number(from) * 60 + Number(fromMinute || 0) &&
        today.minute <= Number(to) * 60 + Number(toMinute || 0)
      );
    }
    const opens = [...text.matchAll(/(?:每日|每天|每周[一二三四五六日天]|周[一二三四五六日天])\s*(\d{1,2})(?::(\d{2})(?::\d{2})?|点|时)\s*(?:起|开始)/g)];
    if (opens.length && opens.some(([, hour, minute]) => today.minute < Number(hour) * 60 + Number(minute || 0))) return false;
    return !['quarter', 'year'].includes(recurringType);
  }

  function qualify(candidate, detail, today) {
    if (!detail || !dateMatches(detail, today) || !String(detail.awardDesc || '').trim() ||
        !window.ChinaRegions.matches(detail.region || candidate.item.region, candidate.location)) return null;
    const steps = String(detail.pathDesc || '').trim();
    const rule = detail.awardDesc;
    const overview = [detail.title, detail.desc, steps].join(' ');
    const eligibility = rule.match(/【(?:活动对象|参与对象|参与资格|适用对象|适用卡种)】([^【]+)/)?.[1] || overview;
    if (!steps || !PAYMENT.test(steps) || LIMITED_ELIGIBILITY.test(overview) ||
        LIMITED_ELIGIBILITY.test(eligibility)) return null;

    const offer = rule.match(/【(?:优惠内容|活动内容|优惠与名额|优惠规则)】([^【]+)/)?.[1] || rule;
    const eligibleScenes = [overview, offer].join(' ').replace(/(?:不含|不适用|不参加|不支持)[^。；，]*外卖/g, '');
    if (!FOOD.test(eligibleScenes) || NON_FIXED.test(offer)) return null;
    if (!candidate.types.some(type => type === 'credit' ? CREDIT.test(eligibility) : DEBIT.test(eligibility))) return null;
    const ruleSavings = savingsIn(offer);
    const discount = candidate.discount
      ? ruleSavings.find(entry => entry.minimum === candidate.discount.minimum && entry.saving === candidate.discount.saving)
      : ruleSavings[0];
    if (!discount) return null;

    const qualifier = eligibility.match(/(?:62\s*开头|银联|Visa|万事达|Mastercard|美国运通|JCB|指定[^，。；\s]{1,10}卡)/i);
    const specialCard = rule.match(/(?:62\s*开头|银联|Visa|万事达|Mastercard|美国运通|JCB|汉卡|专项|联名卡|指定[^，。；\s]{1,10}卡)/i);
    const needsCheck = Boolean(qualifier || specialCard);
    const isLimited = /(?:限量|名额有限|先到先得|用完即止|限享|限\d+次)/.test(rule);
    const schedule = [detail.recurringText, eligibility, rule].join(' ');
    if (!matchesSchedule(schedule, detail.recurringType, today)) return null;
    const stepsByAction = steps.split(/\s*(?:→|\n)\s*/);
    const step = stepsByAction.find(part => PAYMENT.test(part) && /收银台|付款|结账/.test(part)) || steps;
    const payment = [...new Set(step.match(new RegExp(PAYMENT, 'gi')))].join(' / ');
    return { ...candidate, ...discount, payment, step: step.slice(0, 140), needsCheck, isLimited };
  }

  function mount({ root, bankGroups, getCampaigns, getDetail, openDetail }) {
    const form = root.querySelector('form');
    const cardList = root.querySelector('[data-deal-cards]');
    const province = form.elements.province;
    const city = form.elements.city;
    const regions = window.ChinaRegions;
    regions.provinces.forEach(([label]) => province.add(new Option(label, label)));

    function populateCities(preferred = '') {
      city.replaceChildren(new Option(province.value ? '仅地区通用' : '请先选择省级地区', ''));
      const cities = regions.cities(province.value);
      cities.forEach(name => city.add(new Option(name, name)));
      city.disabled = !cities.length;
      if (cities.includes(preferred)) city.value = preferred;
      else if (cities.length === 1) city.value = cities[0];
    }
    const status = root.querySelector('[data-deal-status]');
    const results = root.querySelector('[data-deal-results]');
    const addButton = root.querySelector('[data-add-deal-card]');
    const submit = form.querySelector('[type="submit"]');
    let version = 0;
    let bankOptions = [];
    let loaded = false;

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
        <label>发卡行<select name="bank" required><option value="">选择银行</option></select></label>
        <label>卡种<select name="cardType"><option value="debit">储蓄卡</option><option value="credit">信用卡</option></select></label>
        <button class="radar-text-reset" type="button" aria-label="移除这张卡">移除</button>
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
      row.querySelector('[name="cardType"]').value = saved.type === 'credit' ? 'credit' : 'debit';
      row.querySelector('button').addEventListener('click', () => {
        if (cardList.children.length === 1) {
          bank.value = '';
          row.querySelector('[name="cardType"]').value = 'debit';
        } else {
          row.remove();
        }
        addButton.disabled = false;
        clearResults();
      });
      cardList.append(row);
      addButton.disabled = cardList.children.length >= 6;
      return bank;
    }

    function clearResults() {
      version += 1;
      results.replaceChildren();
      status.textContent = '';
      submit.disabled = bankOptions.length === 0;
    }

    function renderMatches(matches) {
      for (const match of matches) {
        const entry = document.createElement('li');
        const link = document.createElement('a');
        link.href = `./detail.html?id=${encodeURIComponent(match.item.id)}`;
        link.textContent = match.item.title;
        link.addEventListener('click', event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
          event.preventDefault();
          void openDetail(match.item);
        });
        const summary = document.createElement('p');
        summary.textContent = `满 ${match.minimum} 元减 ${match.saving} 元 · ${match.payment}`;
        const steps = document.createElement('p');
        steps.textContent = match.step;
        entry.append(link, summary, steps);
        if (match.needsCheck || match.isLimited) {
          const note = document.createElement('small');
          note.textContent = [match.needsCheck ? '付款前请核对卡组织或具体卡种' : '', match.isLimited ? '名额和剩余次数以结算页为准' : ''].filter(Boolean).join(' · ');
          entry.append(note);
        }
        results.append(entry);
      }
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
      }
      const savedCards = Array.isArray(saved.cards) ? saved.cards.filter(card => card && banks.has(card.bank)).slice(0, 6) : [];
      cardList.replaceChildren();
      (previous.length ? previous : savedCards.length ? savedCards : [{}]).forEach(addCard);
      root.hidden = false;
      clearResults();
      if (!loaded && savedCards.length && savedCards.length === cardList.children.length) {
        root.open = true;
        form.requestSubmit();
      }
      loaded = true;
    }

    addButton.addEventListener('click', () => {
      clearResults();
      addCard().focus();
    });
    province.addEventListener('change', () => populateCities());
    form.addEventListener('change', clearResults);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const request = ++version;
      results.replaceChildren();
      const choices = {
        location: { province: province.value, city: city.value },
        cards: [...cardList.children].map(row => ({
          bank: row.querySelector('[name="bank"]').value,
          type: row.querySelector('[name="cardType"]').value
        }))
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
      } catch {
        // Matching still works with storage disabled.
      }

      const today = todayInChina();
      const shortlist = shortList(getCampaigns(), choices, today);
      status.textContent = '正在核对今天的外卖优惠…';
      submit.disabled = true;
      const matches = [];
      let failed = false;
      for (let i = 0; i < shortlist.length && matches.length < 5; i += 4) {
        const batch = await Promise.allSettled(shortlist.slice(i, i + 4).map(async candidate =>
          qualify(candidate, await getDetail(String(candidate.item.id)), today)));
        if (version !== request) return;
        for (const outcome of batch) {
          if (outcome.status === 'rejected') failed = true;
          else if (outcome.value) matches.push(outcome.value);
        }
      }

      const visible = matches.sort((a, b) => Number(a.needsCheck) - Number(b.needsCheck)).slice(0, 5);
      renderMatches(visible);
      submit.disabled = false;
      status.textContent = visible.length ? `找到 ${visible.length} 条规则符合的外卖优惠${failed ? '，部分规则暂时未能核对' : ''}。`
        : failed ? '部分活动规则暂时无法核对，请重试或打开下方活动列表查看。'
          : '暂未找到符合所选地区、发卡行和卡种的外卖固定立减。';
    });
    return { syncCampaigns };
  }

  window.TodayDeals = { mount };
})();
