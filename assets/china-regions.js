(() => {
  'use strict';

  // Province and prefecture names from the Ministry of Civil Affairs 2024 register.
  // https://www.mca.gov.cn/mzsj/xzqh/2025/202401xzqh.html
  // Cross-checked at these levels against the archived 2025 register.
  // Taiwan localities are provided as consumer location choices.
  const provinces = [
    ["北京市", ["北京市"]],
    ["天津市", ["天津市"]],
    ["河北省", ["石家庄市", "唐山市", "秦皇岛市", "邯郸市", "邢台市", "保定市", "张家口市", "承德市", "沧州市", "廊坊市", "衡水市"]],
    ["山西省", ["太原市", "大同市", "阳泉市", "长治市", "晋城市", "朔州市", "晋中市", "运城市", "忻州市", "临汾市", "吕梁市"]],
    ["内蒙古自治区", ["呼和浩特市", "包头市", "乌海市", "赤峰市", "通辽市", "鄂尔多斯市", "呼伦贝尔市", "巴彦淖尔市", "乌兰察布市", "兴安盟", "锡林郭勒盟", "阿拉善盟"]],
    ["辽宁省", ["沈阳市", "大连市", "鞍山市", "抚顺市", "本溪市", "丹东市", "锦州市", "营口市", "阜新市", "辽阳市", "盘锦市", "铁岭市", "朝阳市", "葫芦岛市"]],
    ["吉林省", ["长春市", "吉林市", "四平市", "辽源市", "通化市", "白山市", "松原市", "白城市", "延边朝鲜族自治州"]],
    ["黑龙江省", ["哈尔滨市", "齐齐哈尔市", "鸡西市", "鹤岗市", "双鸭山市", "大庆市", "伊春市", "佳木斯市", "七台河市", "牡丹江市", "黑河市", "绥化市", "大兴安岭地区"]],
    ["上海市", ["上海市"]],
    ["江苏省", ["南京市", "无锡市", "徐州市", "常州市", "苏州市", "南通市", "连云港市", "淮安市", "盐城市", "扬州市", "镇江市", "泰州市", "宿迁市"]],
    ["浙江省", ["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "衢州市", "舟山市", "台州市", "丽水市"]],
    ["安徽省", ["合肥市", "芜湖市", "蚌埠市", "淮南市", "马鞍山市", "淮北市", "铜陵市", "安庆市", "黄山市", "滁州市", "阜阳市", "宿州市", "六安市", "亳州市", "池州市", "宣城市"]],
    ["福建省", ["福州市", "厦门市", "莆田市", "三明市", "泉州市", "漳州市", "南平市", "龙岩市", "宁德市"]],
    ["江西省", ["南昌市", "景德镇市", "萍乡市", "九江市", "新余市", "鹰潭市", "赣州市", "吉安市", "宜春市", "抚州市", "上饶市"]],
    ["山东省", ["济南市", "青岛市", "淄博市", "枣庄市", "东营市", "烟台市", "潍坊市", "济宁市", "泰安市", "威海市", "日照市", "临沂市", "德州市", "聊城市", "滨州市", "菏泽市"]],
    ["河南省", ["郑州市", "开封市", "洛阳市", "平顶山市", "安阳市", "鹤壁市", "新乡市", "焦作市", "濮阳市", "许昌市", "漯河市", "三门峡市", "南阳市", "商丘市", "信阳市", "周口市", "驻马店市", "济源市"]],
    ["湖北省", ["武汉市", "黄石市", "十堰市", "宜昌市", "襄阳市", "鄂州市", "荆门市", "孝感市", "荆州市", "黄冈市", "咸宁市", "随州市", "恩施土家族苗族自治州", "仙桃市", "潜江市", "天门市"]],
    ["湖南省", ["长沙市", "株洲市", "湘潭市", "衡阳市", "邵阳市", "岳阳市", "常德市", "张家界市", "益阳市", "郴州市", "永州市", "怀化市", "娄底市", "湘西土家族苗族自治州"]],
    ["广东省", ["广州市", "韶关市", "深圳市", "珠海市", "汕头市", "佛山市", "江门市", "湛江市", "茂名市", "肇庆市", "惠州市", "梅州市", "汕尾市", "河源市", "阳江市", "清远市", "东莞市", "中山市", "潮州市", "揭阳市", "云浮市"]],
    ["广西壮族自治区", ["南宁市", "柳州市", "桂林市", "梧州市", "北海市", "防城港市", "钦州市", "贵港市", "玉林市", "百色市", "贺州市", "河池市", "来宾市", "崇左市"]],
    ["海南省", ["海口市", "三亚市", "三沙市", "儋州市", "五指山市", "琼海市", "文昌市", "万宁市", "东方市"]],
    ["重庆市", ["重庆市"]],
    ["四川省", ["成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市", "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市", "宜宾市", "广安市", "达州市", "雅安市", "巴中市", "资阳市", "阿坝藏族羌族自治州", "甘孜藏族自治州", "凉山彝族自治州"]],
    ["贵州省", ["贵阳市", "六盘水市", "遵义市", "安顺市", "毕节市", "铜仁市", "黔西南布依族苗族自治州", "黔东南苗族侗族自治州", "黔南布依族苗族自治州"]],
    ["云南省", ["昆明市", "曲靖市", "玉溪市", "保山市", "昭通市", "丽江市", "普洱市", "临沧市", "楚雄彝族自治州", "红河哈尼族彝族自治州", "文山壮族苗族自治州", "西双版纳傣族自治州", "大理白族自治州", "德宏傣族景颇族自治州", "怒江傈僳族自治州", "迪庆藏族自治州"]],
    ["西藏自治区", ["拉萨市", "日喀则市", "昌都市", "林芝市", "山南市", "那曲市", "阿里地区"]],
    ["陕西省", ["西安市", "铜川市", "宝鸡市", "咸阳市", "渭南市", "延安市", "汉中市", "榆林市", "安康市", "商洛市"]],
    ["甘肃省", ["兰州市", "嘉峪关市", "金昌市", "白银市", "天水市", "武威市", "张掖市", "平凉市", "酒泉市", "庆阳市", "定西市", "陇南市", "临夏回族自治州", "甘南藏族自治州"]],
    ["青海省", ["西宁市", "海东市", "海北藏族自治州", "黄南藏族自治州", "海南藏族自治州", "果洛藏族自治州", "玉树藏族自治州", "海西蒙古族藏族自治州"]],
    ["宁夏回族自治区", ["银川市", "石嘴山市", "吴忠市", "固原市", "中卫市"]],
    ["新疆维吾尔自治区", ["乌鲁木齐市", "克拉玛依市", "吐鲁番市", "哈密市", "昌吉回族自治州", "博尔塔拉蒙古自治州", "巴音郭楞蒙古自治州", "阿克苏地区", "克孜勒苏柯尔克孜自治州", "喀什地区", "和田地区", "伊犁哈萨克自治州", "塔城地区", "阿勒泰地区", "石河子市", "阿拉尔市", "图木舒克市", "五家渠市", "北屯市", "铁门关市", "双河市", "可克达拉市", "昆玉市", "胡杨河市", "新星市", "白杨市"]],
    ["台湾省", ["台北市", "新北市", "桃园市", "台中市", "台南市", "高雄市", "基隆市", "新竹市", "嘉义市", "新竹县", "苗栗县", "彰化县", "南投县", "云林县", "嘉义县", "屏东县", "宜兰县", "花莲县", "台东县", "澎湖县"]],
    ["香港特别行政区", ["香港特别行政区"]],
    ["澳门特别行政区", ["澳门特别行政区"]],
  ];

  const NON_MAINLAND = new Set(['香港特别行政区', '澳门特别行政区', '台湾省']);
  const TRADITIONAL = { 臺: '台', 灣: '湾', 門: '门', 區: '区', 縣: '县', 園: '园', 蘭: '兰', 蓮: '莲', 義: '义', 雲: '云' };
  const provinceCities = new Map(provinces);

  function clean(value) {
    return String(value || '').normalize('NFKC').replace(/[臺灣門區縣園蘭蓮義雲]/g, letter => TRADITIONAL[letter]).replace(/\s+/g, '');
  }

  function shortName(name) {
    return name
      .replace(/(?:朝鲜族|藏族|羌族|蒙古族?|回族|哈萨克|柯尔克孜|傣族|景颇族|傈僳族|白族|彝族|哈尼族|苗族|布依族|侗族|土家族|壮族|瑶族|傣|德昂族)[^州]*自治州$/, '')
      .replace(/(?:特别行政区|(?:壮族|回族|维吾尔)?自治区|市|省|县|地区|盟)$/, '');
  }

  const names = new Map();
  for (const [province, cities] of provinces) {
    for (const alias of [province, shortName(province)]) names.set(alias, { province });
    for (const city of cities) {
      const alias = shortName(city);
      if (!names.has(city)) names.set(city, { province, city });
      if (!names.has(alias)) names.set(alias, { province, city });
    }
  }
  const namePattern = new RegExp([...names.keys()].sort((a, b) => b.length - a.length).join('|'), 'g');

  function areaNames(text) {
    return [...text.matchAll(namePattern)].map(([name]) => names.get(name));
  }

  function fromLegacyCity(value) {
    const key = clean(value);
    const exact = names.get(key);
    const city = exact?.city || (exact && provinceCities.get(exact.province).length === 1
      ? provinceCities.get(exact.province)[0] : '');
    return exact ? { province: exact.province, city } : null;
  }

  function matches(value, location = {}, { includeOverseas = false } = {}) {
    const region = clean(value);
    const { province, city } = location;
    const overseas = /^(?:境外|全球|海外|港澳台及境外)|中国(?:内地|大陆)(?:以外|境外)/.test(region);
    if (!region || (overseas && (!includeOverseas || !NON_MAINLAND.has(province)))) return false;
    const matchesPlace = area => area.province === province &&
      (!area.city || area.city === city);
    const exclusions = [];
    const removeExclusion = (_, text) => {
      exclusions.push(...areaNames(text));
      return '';
    };
    const included = region
      .replace(/\(([^()]*)除外\)/g, removeExclusion)
      .replace(/\((?:不含|不包括|不适用|排除|除)([^)]*)\)/g, removeExclusion)
      .replace(/(?:不含|不包括|不适用|排除|除(?!外))([^);；。]+?)(?:之外|以外|除外|外(?=[),，;；。]|$)|(?=[);；。]|$))/g, removeExclusion);
    if (exclusions.some(matchesPlace) ||
        (exclusions.length && (!province || (!city && exclusions.some(area => area.province === province))))) return false;

    const places = areaNames(included);
    const limitation = included.match(/(?:仅限|只限)([^)]*)/)?.[1] || '';
    const restricted = /部分(?:城市|地区|省市|省份)|指定(?:城市|地区|省市|省份)|试点城市/.test(included) ||
      areaNames(limitation).length > 0;
    const nationwide = /全国|中国大陆|中国内地/.test(included);
    if (nationwide && !restricted && !NON_MAINLAND.has(province)) return true;
    if (!province) return false;

    const local = places.filter(area => area.province === province);
    if (local.some(area => area.city)) return Boolean(city && local.some(area => area.city === city));
    return !restricted && local.some(area => !area.city);
  }

  window.ChinaRegions = {
    provinces,
    cities: province => provinceCities.get(province) || [],
    fromLegacyCity,
    matches
  };
})();
