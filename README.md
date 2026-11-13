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

首页的筛选列表实时读取接口。`activities/` 下的公开活动目录和详情，以及 `sitemap.xml`，由同一份公开活动数据生成。发布新一批活动或活动到期后，在网站仓库根目录运行：

```sh
curl --fail --silent --show-error https://mini.vooqqqm.com/api/campaigns.php -o /tmp/bank-public-activities.json
python3 tools/generate-activity-pages.py /tmp/bank-public-activities.json --as-of "$(TZ=Asia/Shanghai date +%F)"
```

检查生成的活动规则、有效期和来源链接，提交到网站仓库的 `main` 分支，GitHub Pages 会部署。确认上线后，可通过 IndexNow 通知参与平台本次新增、更新或退出目录的网址。Google Search Console 已提交固定地址 `https://bank.vooqqqm.com/sitemap.xml`，后续更新沿用该地址。

## 广告说明

这个网站前端没有接入“小程序激励广告 / 广告解锁图片”逻辑。

如果后续要接入 Google AdSense，建议使用标准展示广告位或 Auto ads，不要做“看广告解锁内容”的交互。
