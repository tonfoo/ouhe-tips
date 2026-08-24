# 🐉 欧核精算 · 会员制推荐站

欧核⑬步独立赔率精算，每日竞彩分析。免费会员看 1 场，VIP 会员（666元/月）看全部。

## 目录结构

```
ouhe-tips/
├── index.html          # 首页（标题/会员区/列表容器）
├── assets/
│   ├── style.css       # 暗黑风格样式
│   └── app.js          # 渲染+口令解锁逻辑（改口令在这里：VIP_KEY）
├── data/
│   └── 2026-08-24.json # 每日分析数据（每天新增一个）
└── deploy.ps1          # 一键发布脚本（在仓库根目录）
```

## 每日更新流程（小龙自动执行）

1. 用欧核⑬步精算当日 11 场 → 生成 `data/YYYY-MM-DD.json`
2. 修改 `assets/app.js` 里的 `DATA_FILE` 指向新文件
3. 运行 `deploy.ps1` → git push → Cloudflare Pages 自动部署（1-3分钟生效）

## 会员口令

- 口令在 `assets/app.js` 顶部 `VIP_KEY = 'OUHE-2026-666'`（站长自行修改）
- 免费用户：每天看第 1 场，其余锁定（`data` 里的 `freeMatches` 控制场数）
- 付费用户：收到口令 → 网页输入 → localStorage 记住，解锁全部

## 上线步骤（一次性）

1. **注册 GitHub**（https://github.com）：创建仓库 `ouhe-tips`（Public）
2. 本机推代码：
   ```bash
   git init && git add -A && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的用户名/ouhe-tips.git
   git push -u origin main
   ```
   （Windows 推送时会弹窗登录 GitHub 授权，或配置 Personal Access Token）
3. **注册 Cloudflare**（https://dash.cloudflare.com）→ Workers & Pages → Create → 连接 GitHub 仓库 `ouhe-tips` → 构建命令留空、输出目录留空 → Deploy
4. 部署完成后访问 `https://ouhe-tips.pages.dev`

## 收款（过渡期）

- 微信/支付宝人工收款 → 私发口令
- 后续可接面包多/虎皮椒自动发货（再升级）

## 注意

- 静态站口令是前端校验，懂技术的人可绕过源码；过渡期够用，正式运营建议升级后端鉴权（方案B）
- 每日数据由小龙生成，格式见 `data/2026-08-24.json`
