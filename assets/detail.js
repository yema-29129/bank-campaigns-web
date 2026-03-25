<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>活动详情</title>
  <meta name="description" content="银行活动详情页" />
  <link rel="stylesheet" href="./assets/style.css" />

  <style>
    body {
      margin: 0;
      background: linear-gradient(180deg, #eef4ff 0%, #f8fbff 100%);
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
        "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    }

    .topbar {
      background: rgba(255, 255, 255, 0.92);
      border-bottom: 1px solid rgba(148, 163, 184, 0.18);
      backdrop-filter: blur(18px);
    }

    .topbar-inner {
      max-width: 1240px;
      margin: 0 auto;
      padding: 18px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }

    .brand-badge {
      width: 48px;
      height: 48px;
      border-radius: 18px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 28px;
      box-shadow: 0 14px 28px rgba(37, 99, 235, 0.28);
      flex-shrink: 0;
    }

    .brand-text {
      min-width: 0;
    }

    .brand-title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }

    .brand-subtitle {
      margin-top: 2px;
      color: #64748b;
      font-size: 14px;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: 22px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .nav a {
      text-decoration: none;
      color: #334155;
      font-size: 14px;
      font-weight: 700;
    }

    .nav a:hover {
      color: #2563eb;
    }

    .hero-wrap {
      max-width: 1240px;
      margin: 0 auto;
      padding: 28px;
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 22px;
      border-radius: 999px;
      text-decoration: none;
      color: #2563eb;
      background: rgba(224, 236, 255, 0.88);
      border: 1px solid rgba(37, 99, 235, 0.12);
      font-weight: 700;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
    }

    .hero-page-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }

    .loading-box,
    .error-box {
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.12);
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      padding: 22px 24px;
      font-size: 15px;
    }

    .loading-box {
      color: #64748b;
    }

    .error-box {
      color: #dc2626;
      display: none;
    }

    .hidden {
      display: none !important;
    }

    .detail-shell {
      display: none;
      max-width: 1240px;
      margin: 0 auto 34px;
      padding: 0 28px 28px;
    }

    .hero-card {
      border-radius: 30px;
      background: linear-gradient(135deg, #183566, #2563eb);
      color: #fff;
      padding: 26px;
      box-shadow: 0 24px 60px rgba(37, 99, 235, 0.18);
      display: grid;
      grid-template-columns: 1.25fr 0.95fr;
      gap: 26px;
      margin-bottom: 20px;
    }

    .hero-left {
      min-width: 0;
    }

    .hero-bank {
      display: inline-flex;
      align-items: center;
      padding: 7px 14px;
      border-radius: 999px;
      background: rgba(255, 236, 179, 0.95);
      color: #92400e;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 18px;
    }

    .hero-title {
      font-size: 44px;
      line-height: 1.15;
      font-weight: 900;
      margin: 0 0 18px;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .hero-desc {
      font-size: 17px;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 22px;
      min-height: 72px;
      white-space: pre-line;
    }

    .hero-channel-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 94px;
      min-height: 94px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
      font-size: 18px;
      font-weight: 800;
      padding: 14px;
      text-align: center;
    }

    .hero-right {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .metric-card {
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px 18px;
      min-height: 84px;
      box-sizing: border-box;
    }

    .metric-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 10px;
      font-weight: 700;
    }

    .metric-value {
      font-size: 26px;
      color: #fff;
      font-weight: 800;
      line-height: 1.3;
      word-break: break-word;
      white-space: pre-line;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1.65fr 0.9fr;
      gap: 20px;
    }

    .stack {
      display: grid;
      gap: 16px;
    }

    .section-card {
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.12);
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
      padding: 20px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 14px;
    }

    .section-text {
      font-size: 15px;
      color: #475569;
      line-height: 1.9;
      white-space: pre-line;
      word-break: break-word;
    }

    .quick-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .quick-item {
      border-radius: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 14px 14px 16px;
      min-height: 82px;
      box-sizing: border-box;
    }

    .quick-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .quick-value {
      font-size: 18px;
      color: #0f172a;
      font-weight: 800;
      line-height: 1.5;
      white-space: pre-line;
      word-break: break-word;
    }

    .hint-card {
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.12);
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
      padding: 18px 20px;
    }

    .hint-title {
      font-size: 12px;
      color: #64748b;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .hint-text {
      font-size: 15px;
      color: #475569;
      line-height: 1.8;
      white-space: pre-line;
    }

    .link-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 14px;
      border-radius: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .link-text {
      flex: 1;
      min-width: 0;
      color: #0f172a;
      font-size: 15px;
      font-weight: 700;
      word-break: break-all;
      white-space: pre-line;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 42px;
      padding: 0 18px;
      border: none;
      border-radius: 999px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
      white-space: nowrap;
    }

    .action-btn[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }

    .poster-tip {
      margin-top: 12px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.7;
    }

    .community-card {
      border-radius: 24px;
      background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
      border: 1px solid rgba(148, 163, 184, 0.14);
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
      padding: 20px;
    }

    .community-caption {
      font-size: 12px;
      color: #64748b;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .community-title {
      font-size: 18px;
      line-height: 1.6;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 10px;
    }

    .community-desc {
      font-size: 15px;
      line-height: 1.8;
      color: #475569;
      margin-bottom: 14px;
    }

    .footer-tip {
      margin-top: 18px;
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.03);
      padding: 14px 16px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.8;
    }

    .site-footer {
      margin-top: 26px;
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.12);
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
      padding: 22px 24px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.9;
    }

    @media (max-width: 1080px) {
      .hero-card {
        grid-template-columns: 1fr;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .topbar-inner,
      .hero-wrap,
      .detail-shell {
        padding-left: 16px;
        padding-right: 16px;
      }

      .hero-top {
        align-items: flex-start;
        flex-direction: column;
      }

      .hero-title {
        font-size: 30px;
      }

      .hero-channel-chip {
        min-width: 82px;
        min-height: 82px;
        font-size: 16px;
      }

      .quick-grid {
        grid-template-columns: 1fr;
      }

      .link-row {
        align-items: flex-start;
      }

      .action-btn {
        width: 100%;
      }

      .nav {
        gap: 14px;
      }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="brand-badge">薅</div>
        <div class="brand-text">
          <h1 class="brand-title">好羊毛银行活动站</h1>
          <div class="brand-subtitle">微信立减金 / 信用卡返现 / 现金红包</div>
        </div>
      </div>

      <nav class="nav">
        <a href="./index.html">首页</a>
        <a href="./index.html#discover">发现活动</a>
        <a href="./index.html#credit">信用卡活动</a>
        <a href="./index.html#contact">联系方式</a>
      </nav>
    </div>
  </header>

  <div class="hero-wrap">
    <div class="hero-top">
      <a href="./index.html" class="back-btn" id="backBtn">返回列表</a>
      <div class="hero-page-title" id="detailPageTitle">活动详情</div>
    </div>

    <div class="loading-box" id="loadingState">正在加载活动详情...</div>
    <div class="error-box hidden" id="errorState">加载失败，请稍后再试</div>
  </div>

  <main class="detail-shell hidden" id="detailContent">
    <section class="hero-card">
      <div class="hero-left">
        <div class="hero-bank" id="bankBadge">银行活动</div>
        <h2 class="hero-title" id="mainTitle">活动详情</h2>
        <div class="hero-desc" id="mainDesc">暂无活动描述</div>
        <div class="hero-channel-chip" id="heroChannel">--</div>
      </div>

      <div class="hero-right">
        <div class="metric-card">
          <div class="metric-label">立减金额</div>
          <div class="metric-value" id="heroDiscount">--</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">最低门槛</div>
          <div class="metric-value" id="heroMinAmount">--</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">活动时间</div>
          <div class="metric-value" id="heroDate">--</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">适用地区</div>
          <div class="metric-value" id="heroRegion">--</div>
        </div>
      </div>
    </section>

    <section class="detail-grid">
      <div class="stack">
        <div class="section-card">
          <div class="section-title">获奖内容</div>
          <div class="section-text" id="awardDesc">--</div>
        </div>

        <div class="section-card">
          <div class="section-title">活动路径</div>
          <div class="section-text" id="pathDesc">--</div>
        </div>

        <div class="section-card">
          <div class="section-title">活动图片路径</div>

          <div class="link-row">
            <div class="link-text">活动路径/二维码</div>
            <button class="action-btn" id="posterBtn" type="button">暂无图片</button>
          </div>

          <div class="poster-tip" id="posterHint">当前活动暂无图片</div>
        </div>
      </div>

      <div class="stack">
        <div class="section-card">
          <div class="section-title">快速查看</div>

          <div class="quick-grid">
            <div class="quick-item">
              <div class="quick-label">适用地区</div>
              <div class="quick-value" id="quickRegion">--</div>
            </div>

            <div class="quick-item">
              <div class="quick-label">消费渠道</div>
              <div class="quick-value" id="quickChannel">--</div>
            </div>

            <div class="quick-item">
              <div class="quick-label">最低门槛金额</div>
              <div class="quick-value" id="quickMinAmount">--</div>
            </div>

            <div class="quick-item">
              <div class="quick-label">立减金额</div>
              <div class="quick-value" id="quickDiscount">--</div>
            </div>

            <div class="quick-item">
              <div class="quick-label">返现比例</div>
              <div class="quick-value" id="quickCashback">--</div>
            </div>

            <div class="quick-item">
              <div class="quick-label">活动时间</div>
              <div class="quick-value" id="quickDate">--</div>
            </div>

            <div class="quick-item">
              <div class="quick-label">重复规则</div>
              <div class="quick-value" id="quickRecurring">--</div>
            </div>

            <div class="quick-item">
              <div class="quick-label">最近更新</div>
              <div class="quick-value" id="quickUpdated">--</div>
            </div>
          </div>
        </div>

        <div class="hint-card">
          <div class="hint-title">提示</div>
          <div class="hint-text">活动规则、名称、页面入口都可能变化，实际请以银行官方页面为准。</div>
        </div>

        <div class="community-card">
          <div class="community-caption">社群福利</div>
          <div class="community-title">加入「薅羊毛微信群 · 每月最少薅500元」</div>
          <div class="community-desc">点击下方按钮即可查看固定微信群二维码，后续扫码进群即可获取更多羊毛线报。</div>
          <button class="action-btn" id="communityBtn" type="button">查看群二维码</button>
        </div>
      </div>
    </section>

    <div class="site-footer">
      活动内容归所属机构所有，活动奖品随时间推移可能变化，一切活动请以机构官方规则为准。网站端展示仅作信息整理，不构成保证。
    </div>
  </main>

  <script src="./assets/detail.js?v=20260326"></script>
</body>
</html>
