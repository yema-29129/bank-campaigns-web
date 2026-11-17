# 网站端说明

这个 `website/` 目录是独立的网站前端，直接读取你现有的宝塔接口：

- `https://mini.vooqqqm.com/api/campaigns.php`
- `https://mini.vooqqqm.com/api/campaign_detail.php?id=活动ID`

## 部署方法

1. 把整个 `website/` 目录里的文件上传到宝塔网站根目录。
2. 访问 `index.html` 或将其设为默认首页。
3. 确保网站域名能访问上面的两个接口。

## 内容更新方式

不需要改网站前端的数据来源：

1. 在宝塔数据库里更新 `campaigns` 表内容。
2. 如果有活动图片，继续上传图片到服务器目录。
3. 在 `campaigns.posterUrl` 写入图片 URL。
4. 网站和小程序都会同步显示。

## 更新公开活动详情与站点地图

首页的筛选列表实时读取接口。`activities/` 下的当前活动目录、已结束活动历史目录和详情，以及 `sitemap.xml`、`llms.txt`、`llms-full.txt` 与 `activities/feed.json`，由同一份公开活动数据生成。当前及已结束的完整公开活动都会进入 sitemap 和 AI 数据入口；历史页会醒目标注“已结束”。仅已从公开数据源消失、无法继续核实的旧页面会保留为 `noindex`。发布新一批活动或活动到期后，在网站仓库根目录运行：

```sh
curl --fail --silent --show-error https://mini.vooqqqm.com/api/campaigns.php -o /tmp/bank-public-activities.json
python3 tools/generate-activity-pages.py /tmp/bank-public-activities.json --as-of "$(TZ=Asia/Shanghai date +%F)"
```

检查生成的活动规则、有效期和来源链接，提交到网站仓库的 `main` 分支，GitHub Pages 会部署。确认上线后，可通过 IndexNow 通知参与平台本次新增、更新或退出目录的网址。Google Search Console 使用固定地址 `https://bank.vooqqqm.com/sitemap.xml`，后续更新沿用该地址。搜索引擎和 AI 平台是否最终收录或引用由各平台决定。

生成器会为每项活动创建自然、唯一且与页面正文一致的搜索标题，将常见银行简称规范为用户易懂的名称，并同步更新 `<title>`、页面主标题、描述、Open Graph、结构化数据、站内锚文本和 AI 数据源。不要在生成后的单页里手工堆砌关键词；Google 不使用 `meta keywords` 作为排名依据，标题与描述应准确说明具体活动，完全重复的活动页会合并到一个规范网址。

## 网站专属编辑层

`tools/generate-activity-pages.py` 会在静态活动详情页加入“羊毛助手编辑解读”，把公开数据中已经核验的参与对象、优惠摘要、限制条件、名额次数、费用和退款规则重新组织为快速判断信息。该内容只写入本仓库的 `activities/*.html`，不会写回 `mini.vooqqqm.com` 接口、宝塔数据库或微信小程序。

后续维护时不得为了丰富网页而推测缺失条件、扩大活动适用范围或修改原始规则；遇到币种、资格、名额或金额口径不明确时，保留官方摘要并提示用户核对官方页面。

## 广告说明

这个网站前端没有接入“小程序激励广告 / 广告解锁图片”逻辑。

如果后续要接入 Google AdSense，建议使用标准展示广告位或 Auto ads，不要做“看广告解锁内容”的交互。
