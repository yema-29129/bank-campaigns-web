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

## 广告说明

这个网站前端没有接入“小程序激励广告 / 广告解锁图片”逻辑。

如果后续要接入 Google AdSense，建议使用标准展示广告位或 Auto ads，不要做“看广告解锁内容”的交互。
