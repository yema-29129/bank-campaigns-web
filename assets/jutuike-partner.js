(function (global) {
  'use strict';

  const RULES = [
    {
      id: 'watsons',
      re: /屈臣氏/,
      links: [{ label: '领屈臣氏美团闪购专场红包 ↗', url: 'https://dpurl.cn/4RBDQ7Lz' }]
    },
    {
      id: 'luckin',
      re: /瑞幸/,
      links: [{ label: '瑞幸咖啡在线特惠点单领券 ↗', url: 'https://kurl04.cn/t9v3C7' }]
    },
    {
      id: 'cotti',
      re: /库迪/,
      links: [{ label: '库迪咖啡在线特惠点单领券 ↗', url: 'https://kurl04.cn/t9v3C8' }]
    },
    {
      id: 'starbucks',
      re: /星巴克/,
      links: [{ label: '星巴克在线特惠点单入口 ↗', url: 'https://kurl04.cn/t9v3Cc' }]
    },
    {
      id: 'heytea',
      re: /喜茶/,
      links: [{ label: '喜茶在线特惠点单领券 ↗', url: 'https://kurl04.cn/t9v3CA' }]
    },
    {
      id: 'nayuki',
      re: /奈雪/,
      links: [{ label: '奈雪的茶在线特惠点单领券 ↗', url: 'https://kurl05.cn/t9v3CT' }]
    },
    {
      id: 'kfc',
      re: /肯德基|KFC/i,
      links: [{ label: '肯德基在线特惠点餐入口 ↗', url: 'https://kurl04.cn/t9v3rN' }]
    },
    {
      id: 'pizzahut',
      re: /必胜客/,
      links: [{ label: '必胜客在线特惠点餐入口 ↗', url: 'https://kurl04.cn/t9v3CF' }]
    },
    {
      id: 'burgerking',
      re: /汉堡王/,
      links: [{ label: '汉堡王在线特惠点餐入口 ↗', url: 'https://kurl04.cn/t9v3CI' }]
    },
    {
      id: 'wallace',
      re: /华莱士/,
      links: [{ label: '华莱士在线特惠点餐入口 ↗', url: 'https://kurl05.cn/t9v3Cp' }]
    },
    {
      id: 'mcd',
      re: /麦当劳|金拱门/,
      links: [{ label: '麦当劳与大牌快餐特惠点餐 ↗', url: 'https://kurl04.cn/t9v3rC' }]
    },
    {
      id: 'pagoda',
      re: /百果园/,
      links: [{ label: '百果园水果外送特惠领券 ↗', url: 'https://kurl05.cn/t9v3C6' }]
    },
    {
      id: 'meituan_medicine',
      re: /美团买药/,
      links: [{ label: '领美团买药专属立减券 ↗', url: 'https://dpurl.cn/CBsTEG2z' }]
    },
    {
      id: 'meituan_shangou',
      re: /美团闪购|小象超市|美团买菜/,
      links: [{ label: '领美团闪购超市神价红包 ↗', url: 'https://kurl04.cn/t9v3Vo' }]
    },
    {
      id: 'meituan_hotel',
      re: /美团酒店|美团民宿/,
      links: [{ label: '领美团酒店特惠订房红包 ↗', url: 'https://kurl05.cn/t9v3VV' }]
    },
    {
      id: 'meituan_flight',
      re: /美团机票|美团火车票/,
      links: [{ label: '领美团机票出行补贴券 ↗', url: 'https://dpurl.cn/dp8UNrtz' }]
    },
    {
      id: 'meituan_waimai',
      re: /美团外卖/,
      links: [
        { label: '先领美团外卖红包神券 ↗', url: 'https://dpurl.cn/XbWlvzWz' },
        { label: '美团外卖赏金叠加红包 ↗', url: 'https://kurl04.cn/t9v3VS' }
      ]
    },
    {
      id: 'dianping',
      re: /大众点评|美团团购|美团到店/,
      links: [{ label: '领美团到店餐饮团购优惠券 ↗', url: 'https://dpurl.cn/4eDhTsuz' }]
    },
    {
      id: 'meituan_general',
      re: /美团/,
      skipIfMatched: ['meituan_medicine', 'meituan_shangou', 'meituan_hotel', 'meituan_flight', 'meituan_waimai', 'dianping', 'watsons'],
      links: [
        { label: '先领美团外卖红包券（可叠加银行立减） ↗', url: 'https://dpurl.cn/XbWlvzWz' },
        { label: '美团吃喝玩乐综合红包 ↗', url: 'https://kurl05.cn/t9v3Vi' }
      ]
    },
    {
      id: 'eleme',
      re: /饿了么/,
      links: [{ label: '先领饿了么无门槛叠加红包 ↗', url: 'https://kurl04.cn/t9v3f2' }]
    },
    {
      id: 'taobao_shangou',
      re: /淘宝闪购/,
      links: [{ label: '领淘宝闪购红包与免单福利 ↗', url: 'https://kurl04.cn/t9v3fu' }]
    },
    {
      id: 'taobao',
      re: /淘宝|天猫/,
      domesticOnly: true,
      skipIfMatched: ['taobao_shangou'],
      links: [{ label: '领淘宝闪购日常补贴红包 ↗', url: 'https://kurl04.cn/t9v3fu' }]
    },
    {
      id: 'jd_waimai',
      re: /京东外卖|京东秒送/,
      links: [{ label: '领京东外卖高额补贴券 ↗', url: 'https://u.jd.com/mGK9jkR' }]
    },
    {
      id: 'jd',
      re: /京东/,
      domesticOnly: true,
      skipIfMatched: ['jd_waimai'],
      links: [
        { label: '领京东精选补贴券（可叠加京东支付满减） ↗', url: 'https://u.jd.com/mGKFazo' },
        { label: '京东秒杀特价会场 ↗', url: 'https://u.jd.com/mDKVXbd' }
      ]
    },
    {
      id: 'pdd',
      re: /拼多多|多多支付|多多买菜/,
      domesticOnly: true,
      links: [{ label: '进拼多多领券中心领补贴券 ↗', url: 'https://p.pinduoduo.com/2KYkDekX?sc=EFAC' }]
    },
    {
      id: 'huaxiaozhu',
      re: /花小猪/,
      links: [{ label: '领花小猪打车立减券包 ↗', url: 'https://kurl05.cn/t9v3QA' }]
    },
    {
      id: 'didi_daijia',
      re: /代驾/,
      links: [{ label: '领滴滴代驾专属立减券 ↗', url: 'https://kurl04.cn/t9v3Q6' }]
    },
    {
      id: 'didi',
      re: /滴滴|高德打车|T3出行|哈啰|曹操出行|享道出行|网约车|打车/,
      domesticOnly: true,
      skipIfMatched: ['huaxiaozhu'],
      links: [
        { label: '先领滴滴打车出行立减券包 ↗', url: 'https://kurl05.cn/t9v3vo' },
        { label: '聚合网约车立减券包 ↗', url: 'https://kurl05.cn/t9v3pZ' }
      ]
    },
    {
      id: 'movie',
      re: /猫眼|淘票票|电影票|观影|万达影城/,
      domesticOnly: true,
      links: [{ label: '全国影院特价电影票在线选座 ↗', url: 'https://kurl05.cn/t9v3Cb' }]
    },
    {
      id: 'express',
      re: /顺丰|菜鸟裹裹|寄快递|京东快递|德邦|圆通|中通|韵达|申通/,
      domesticOnly: true,
      links: [{ label: '全国顺丰/通达特价寄快递 5 折起 ↗', url: 'https://kurl04.cn/t9v3Pw' }]
    },
    {
      id: 'fliggy',
      re: /飞猪/,
      links: [
        { label: '领飞猪酒店渠道专享红包 ↗', url: 'https://a.feizhu.com/25j5zj' },
        { label: '飞猪大牌乐园门票券 ↗', url: 'https://a.feizhu.com/3Sg31h' }
      ]
    },
    {
      id: 'tongcheng',
      re: /同程|艺龙/,
      links: [{ label: '领同程特价酒店优惠券 ↗', url: 'https://kurl05.cn/t9v3Yn' }]
    },
    {
      id: 'hotel_cn',
      re: /携程|去哪儿|华住|亚朵|锦江|首旅如家/,
      domesticOnly: true,
      links: [{ label: '领同程/美团/飞猪酒店比价红包 ↗', url: 'https://kurl05.cn/t9v3QW' }]
    },
    {
      id: 'train_12306',
      re: /12306|火车票|高铁/,
      domesticOnly: true,
      links: [{ label: '领火车票与接送站出行补贴券 ↗', url: 'https://kurl04.cn/t9v3Ql' }]
    },
    {
      id: 'flight_cn',
      re: /南航|东航|国航|海航|深航|川航|厦航|吉祥航空|春秋航空/,
      domesticOnly: true,
      links: [{ label: '领国内特价机票立减补贴券 ↗', url: 'https://kurl05.cn/t9v3rF' }]
    },
    {
      id: 'vip_video',
      re: /爱奇艺|腾讯视频|优酷|芒果TV|哔哩哔哩|B站大会员|网易云音乐|QQ音乐|喜马拉雅|百度网盘|视频会员/,
      domesticOnly: true,
      links: [{ label: '大牌视频音乐会员特惠直充 ↗', url: 'https://kurl04.cn/t9v3PH' }]
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
      `联盟推广福利：可先领上方平台优惠券，结账时选择本活动对应银行卡/支付方式享双重叠加省钱。` +
      `</p></div>`
    );
  }

  global.JutuikePartner = {
    matchOffers,
    render
  };
})(window);
