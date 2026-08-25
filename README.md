# 🐉 欧核精算 · 会员制推荐站

欧核⑬步赔率精算，每日竞彩分析。免费会员看 1 场，VIP 会员（66元/试用7天）看全部。

## 目录结构

```
ouhe-tips/
├── index.html          # 首页（标题/会员区/列表容器）
├── assets/
│   ├── style.css       # 暗黑风格样式
│   └── app.js          # 渲染+口令解锁逻辑（方案A：SHA-256 校验）
├── data/
│   ├── YYYY-MM-DD.json # 每日分析数据（每天新增一个）
│   └── vip-keys.json   # 会员口令哈希表（无明文）
├── scripts/
│   └── manage_keys.js  # 会员管理：add/extend/revoke/newkey/list
└── deploy.ps1          # 一键发布脚本（git commit+push，GitHub Pages 自动部署）
```

## 每日更新流程（小龙自动执行）

1. 用欧核⑬步精算当日 11 场 → 生成 `data/YYYY-MM-DD.json`
2. 修改 `assets/app.js` 里的 `DATA_FILE` 指向新文件
3. 运行 `deploy.ps1` → git push → GitHub Pages 自动部署（1-3分钟生效）

## 会员口令（v1.2 方案A：一人一口令 + 7天到期）

- 口令管理全部走 `scripts/manage_keys.js`（微信登记，SHA-256 哈希存储，无明文）
- `add <微信名>` 添加会员（生成口令，7天有效）→ 把口令私发用户 → deploy 推送
- `extend <微信名>` 续费7天 ｜ `revoke <微信名>` 踢人 ｜ `newkey <微信名>` 换口令
- 到期自动锁回；被踢立即失效；一人一口令不可共用
- 免费用户：每天看第 1 场，其余锁定（`data` 里的 `freeMatches` 控制场数）

## 收款（过渡期）

- 微信/支付宝人工收款（微信：Kuxinguyi888）→ 报微信名 → 小龙 add 生成口令 → 发用户
- 后续可接面包多/虎皮椒自动发货（再升级）

## 注意

- 静态站口令是前端校验，懂技术的人可绕过源码；过渡期够用，正式运营建议升级后端鉴权（方案B）
- 每日数据由小龙生成，格式见 `data/2026-08-24.json`
