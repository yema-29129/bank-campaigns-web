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

## Telegram 活动更新通知

仓库内置通知脚本和 `.github/workflows/telegram-activity-updates.yml` 工作流。当 `activities/feed.json` 或黑五专题活动发生新增、实质更新或下线并推送到 `main` 后，工作流会对比推送前后的活动数据，并把每项变化发送到 Telegram；只改页面样式或生成时间不会发消息。

在 GitHub 仓库的 Actions secrets 中配置以下两项后自动生效：

- `TELEGRAM_BOT_TOKEN`：Telegram BotFather 创建的机器人令牌。
- `TELEGRAM_CHAT_ID`：目标群或频道 ID；机器人必须已加入并具备发消息权限。

未配置密钥时工作流只给出警告并安全跳过，不会误发。首次启用时应先通过 `workflow_dispatch` 保持 `dry_run=true` 预览消息；确认目标群和文案无误后，再进行一次受监督的真实发送测试。

手动运行 `workflow_dispatch` 时还会调用 `getMe`、`getChat` 和 `getChatMember` 只读核验机器人身份、目标群及成员权限；该步骤不会发送 Telegram 消息。

只有人工将 `send_test_message` 设为 `true` 时才会发送一条明确标注的连接测试消息；默认值为 `false`，避免配置检查误发群消息。

## 更新公开活动详情与站点地图

首页的筛选列表实时读取接口。`activities/` 下的当前活动目录、已结束活动历史目录和详情，以及 `sitemap.xml`、`llms.txt`、`llms-full.txt` 与 `activities/feed.json`，由同一份公开活动数据生成。当前及已结束的完整公开活动都会进入 sitemap 和 AI 数据入口；历史页会醒目标注“已结束”。仅已从公开数据源消失、无法继续核实的旧页面会保留为 `noindex`。发布新一批活动或活动到期后，在网站仓库根目录运行：

```sh
curl --fail --silent --show-error https://mini.vooqqqm.com/api/campaigns.php -o /tmp/bank-public-activities.json
python3 tools/generate-activity-pages.py /tmp/bank-public-activities.json --as-of "$(TZ=Asia/Shanghai date +%F)"
```

使用 `python3 tools/site_topic_menu.py` 检查所有公开页面的专题菜单。手动新增页面时可用 `--apply` 同步旧导航。

检查生成的活动规则、有效期和来源链接，提交到网站仓库的 `main` 分支，GitHub Pages 会部署。确认上线后，可通过 IndexNow 通知参与平台本次新增、更新或退出目录的网址。Google Search Console 使用固定地址 `https://bank.vooqqqm.com/sitemap.xml`，后续更新沿用该地址。搜索引擎和 AI 平台是否最终收录或引用由各平台决定。

生成器会为每项活动创建自然、唯一且与页面正文一致的搜索标题，将常见银行简称规范为用户易懂的名称，并同步更新 `<title>`、页面主标题、描述、Open Graph、结构化数据、站内锚文本和 AI 数据源。不要在生成后的单页里手工堆砌关键词；Google 不使用 `meta keywords` 作为排名依据，标题与描述应准确说明具体活动，完全重复的活动页会合并到一个规范网址。

## 网站专属编辑层

`tools/generate-activity-pages.py` 会在静态活动详情页加入“羊毛助手编辑解读”，把公开数据中已经核验的参与对象、优惠摘要、限制条件、名额次数、费用和退款规则重新组织为快速判断信息。该内容只写入本仓库的 `activities/*.html`，不会写回 `mini.vooqqqm.com` 接口、宝塔数据库或微信小程序。

后续维护时不得为了丰富网页而推测缺失条件、扩大活动适用范围或修改原始规则；遇到币种、资格、名额或金额口径不明确时，保留官方摘要并提示用户核对官方页面。

「海外活动」的收录边界、二级分类和复核流程见 [海外活动筛选规则](docs/overseas-selection.md)。专题从现有网页活动目录筛选合格记录，并沿用原详情网址。

## 广告说明

这个网站前端没有接入“小程序激励广告 / 广告解锁图片”逻辑。

当前仓库只做内容质量、隐私说明和广告接入前准备；未取得真实 AdSense 发布商 ID 前，不添加广告脚本，也不创建带占位 ID 的 `ads.txt`。

- 当前 Google Analytics、百度统计与字节跳动搜索推送默认不加载，只有访问者明确选择“同意统计”后才加载；用户可在页脚“Cookie设置”中更改选择。
- 以后启用 AdSense 时，面向欧洲经济区、英国和瑞士的广告流量必须接入 Google 认证并支持 IAB TCF 的 CMP；站内自建统计同意工具不冒充认证 CMP。
- 广告不得放在筛选抽屉、导航栏、返回/关闭/复制/领取按钮附近，也不得放在无实质内容、错误提示或纯交互页面。优先只在有编辑解读、活动规则和来源核对的正文页或专题正文中测试。
- 不通过 Telegram、微信群或其他社群鼓励用户点击广告，不点击自己的实时广告，不购买来源不明的流量；活动入口与广告在视觉和文案上必须明确区分。
- 每个活动页保留编辑解读、来源、最近核验日期、编辑责任及更正入口；未经人工策划或字段核验的自动生成内容不得作为广告承载页公开。
