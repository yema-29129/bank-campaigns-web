(function (global) {
  'use strict';

  // Every URL below has been verified in non-WeChat desktop browsers to land on
  // official 1st-party platform H5 pages (meituan.com, h5.ele.me, u.jd.com,
  // mobile.yangkeduo.com, didi.cn, huaxz.cn, feizhu.com, mp.elong.com).
  const RULES = [
    {
      id: 'watsons',
      re: /屈臣氏/,
      links: [{ label: '领屈臣氏美团闪购官方红包 ↗', url: 'https://dpurl.cn/4RBDQ7Lz' }]
    },
    {
      id: 'coffee_tea',
      re: /瑞幸|库迪|星巴克|喜茶|奈雪|霸王茶姬|古茗|茶百道|蜜雪冰城/,
      domesticOnly: true,
      links: [
        { label: '领美团咖啡茶饮到店团购券 ↗', url: 'https://dpurl.cn/4eDhTsuz' },
        { label: '领京东外卖大牌饮品补贴券 ↗', url: 'https://u.jd.com/mGK9jkR' }
      ]
    },
    {
      id: 'fastfood',
      re: /肯德基|KFC|麦当劳|金拱门|必胜客|汉堡王|华莱士|萨莉亚|海底捞/i,
      domesticOnly: true,
      links: [
        { label: '领美团大牌餐饮团购优惠券 ↗', url: 'https://dpurl.cn/4eDhTsuz' },
        { label: '领美团外卖叠叠券红包 ↗', url: 'https://dpurl.cn/XbWlvzWz' }
      ]
    },
    {
      id: 'meituan_medicine',
      re: /美团买药/,
      links: [{ label: '领美团买药官方立减券 ↗', url: 'https://dpurl.cn/CBsTEG2z' }]
    },
    {
      id: 'meituan_shangou',
      re: /美团闪购|小象超市|美团买菜|百果园/,
      domesticOnly: true,
      links: [{ label: '领美团闪购超市便利店红包 ↗', url: 'https://dpurl.cn/oihbt42z' }]
    },
    {
      id: 'meituan_flight',
      re: /美团机票|美团火车票/,
      links: [{ label: '领美团机票官方出行补贴券 ↗', url: 'https://dpurl.cn/dp8UNrtz' }]
    },
    {
      id: 'meituan_waimai',
      re: /美团外卖/,
      links: [
        { label: '先领美团外卖红包神券 ↗', url: 'https://dpurl.cn/XbWlvzWz' },
        { label: '美团外卖叠叠券会场 ↗', url: 'https://kurl04.cn/t9v3VS' }
      ]
    },
    {
      id: 'dianping',
      re: /大众点评|美团团购|美团到店/,
      domesticOnly: true,
      links: [{ label: '领美团到店餐饮团购1折起神券 ↗', url: 'https://dpurl.cn/4eDhTsuz' }]
    },
    {
      id: 'meituan_general',
      re: /美团/,
      domesticOnly: true,
      skipIfMatched: ['meituan_medicine', 'meituan_shangou', 'meituan_flight', 'meituan_waimai', 'dianping', 'watsons', 'coffee_tea', 'fastfood'],
      links: [
        { label: '先领美团外卖红包券（叠加银行立减） ↗', url: 'https://dpurl.cn/XbWlvzWz' },
        { label: '美团到店吃喝玩乐团购券 ↗', url: 'https://dpurl.cn/4eDhTsuz' }
      ]
    },
    {
      id: 'eleme',
      re: /饿了么/,
      links: [{ label: '先领饿了么官方天天领红包 ↗', url: 'https://u.ele.me/zXKAAwon' }]
    },
    {
      id: 'taobao',
      re: /淘宝闪购|淘宝|天猫/,
      domesticOnly: true,
      links: [
        { label: '领淘宝闪购活动补贴红包 ↗', url: 'https://kurl04.cn/t9v3fu' },
        { label: '领饿了么官方红包券 ↗', url: 'https://u.ele.me/zXKAAwon' }
      ]
    },
    {
      id: 'jd_waimai',
      re: /京东外卖|京东秒送/,
      links: [{ label: '领京东外卖官方高额补贴券 ↗', url: 'https://u.jd.com/mGK9jkR' }]
    },
    {
      id: 'jd',
      re: /京东/,
      domesticOnly: true,
      skipIfMatched: ['jd_waimai'],
      links: [
        { label: '领京东精选补贴券（叠加京东支付满减） ↗', url: 'https://u.jd.com/mGKFazo' },
        { label: '京东秒杀特价会场 ↗', url: 'https://u.jd.com/mDKVXbd' }
      ]
    },
    {
      id: 'pdd',
      re: /拼多多|多多支付|多多买菜/,
      domesticOnly: true,
      links: [{ label: '进拼多多官方领券中心领补贴券 ↗', url: 'https://p.pinduoduo.com/2KYkDekX?sc=EFAC' }]
    },
    {
      id: 'huaxiaozhu',
      re: /花小猪/,
      links: [{ label: '领花小猪官方打车立减券包 ↗', url: 'https://kurl05.cn/t9v3QA' }]
    },
    {
      id: 'didi_daijia',
      re: /代驾/,
      domesticOnly: true,
      links: [{ label: '领滴滴代驾官方立减券 ↗', url: 'https://kurl04.cn/t9v3Q6' }]
    },
    {
      id: 'didi',
      re: /滴滴|高德打车|T3出行|哈啰|曹操出行|享道出行|网约车|打车/,
      domesticOnly: true,
      skipIfMatched: ['huaxiaozhu'],
      links: [
        { label: '先领滴滴打车官方出行券包 ↗', url: 'https://kurl05.cn/t9v3vo' },
        { label: '滴滴网约车与代驾联合券包 ↗', url: 'https://kurl05.cn/t9v3pZ' }
      ]
    },
    {
      id: 'fliggy',
      re: /飞猪/,
      links: [
        { label: '领飞猪酒店渠道专享红包 ↗', url: 'https://a.feizhu.com/25j5zj' },
        { label: '飞猪大牌乐园景点门票券 ↗', url: 'https://a.feizhu.com/3Sg31h' }
      ]
    },
    {
      id: 'hotel_cn',
      re: /同程|艺龙|携程|去哪儿|美团酒店|华住|亚朵|锦江|首旅如家/,
      domesticOnly: true,
      links: [
        { label: '领同程艺龙特价酒店红包券 ↗', url: 'https://kurl05.cn/t9v3Yn' },
        { label: '领飞猪酒店渠道专享红包 ↗', url: 'https://a.feizhu.com/25j5zj' }
      ]
    },
    {
      id: 'train_12306',
      re: /12306|火车票|高铁/,
      domesticOnly: true,
      links: [{ label: '领火车票与接送站打车官方券包 ↗', url: 'https://kurl04.cn/t9v3Ql' }]
    },
    {
      id: 'flight_cn',
      re: /南航|东航|国航|海航|深航|川航|厦航|吉祥航空|春秋航空/,
      domesticOnly: true,
      links: [
        { label: '领美团机票特惠补贴券 ↗', url: 'https://dpurl.cn/dp8UNrtz' },
        { label: '领滴滴国内特价机票券 ↗', url: 'https://kurl05.cn/t9v3rF' }
      ]
    }
  ];

  const OVERSEAS_REGION_RE = /香港|澳門|澳门|境外|海外|台湾|台灣|日本|韩国|新加坡|美国|英国|欧洲|澳洲|加拿大|Agoda|Expedia|Booking|Klook|KKday/i;

  function escapeHtml(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function matchOffers(activity) {
    if (!activity) return [];
    const region = String(activity.region || '');
    const title = String(activity.title || '');
    const desc = String(activity.desc || '');
    const pathDesc = String(activity.pathDesc || '');
    const channel = String(activity.channel || '');
    const tags = Array.isArray(activity.tags) ? activity.tags.join(' ') : String(activity.tags || '');

    const text = [title, desc, pathDesc, channel, tags].join(' ');
    const isOverseas = OVERSEAS_REGION_RE.test(region + ' ' + title);

    const matchedIds = new Set();
    const out = [];
    const seenUrls = new Set();

    for (const rule of RULES) {
      if (rule.domesticOnly && isOverseas) continue;
      if (rule.skipIfMatched && rule.skipIfMatched.some((id) => matchedIds.has(id))) continue;
      if (rule.re.test(text)) {
        matchedIds.add(rule.id);
        for (const link of rule.links) {
          if (!seenUrls.has(link.url)) {
            seenUrls.add(link.url);
            out.push(link);
            if (out.length >= 3) return out;
          }
        }
      }
    }
    return out;
  }

  function render(activity) {
    const links = matchOffers(activity);
    if (!links.length) return '';

    const btns = links.map((item) => (
      `<a href="${escapeHtml(item.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer" ` +
      `style="display:inline-flex;align-items:center;padding:6px 12px;border-radius:8px;` +
      `background:#fff7ed;border:1px solid #fdba74;color:#c2410c;font-size:0.86rem;font-weight:600;` +
      `text-decoration:none;line-height:1.35;">🎁 ${escapeHtml(item.label)}</a>`
    )).join('');

    return (
      `<div class="jtk-partner-box" style="margin:10px 0 14px;padding:10px 12px;border-radius:10px;` +
      `background:#fffaf5;border:1px dashed #fdba74;">` +
      `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">${btns}</div>` +
      `<p style="margin:6px 0 0;font-size:0.75rem;color:#9a3412;line-height:1.45;">` +
      `联盟推广福利：可先领上方官方平台红包券，结账时选择本活动对应银行卡/支付方式享双重叠加省钱。` +
      `</p></div>`
    );
  }

  global.JutuikePartner = {
    matchOffers,
    render
  };
})(window);
