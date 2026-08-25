#!/usr/bin/env node
/**
 * 会员口令管理脚本（方案A：一人一口令 + 7天到期 + 微信登记）
 *
 * 用法：
 *   node scripts/manage_keys.js add    <微信名> [天数]   # 添加新会员（生成口令，默认7天，可指定天数如20）
 *   node scripts/manage_keys.js extend <微信名> [天数]   # 续费（默认7天，可指定天数；从当前到期日顺延）
 *   node scripts/manage_keys.js revoke <微信名>   # 踢人（删除该会员口令）
 *   node scripts/manage_keys.js list              # 列出所有会员及到期时间
 *   node scripts/manage_keys.js newkey <微信名>   # 换新口令（重新生成，原口令作废）
 *
 * 注意：修改后需推送部署：.\deploy.ps1
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_FILE = path.join(__dirname, '..', 'data', 'vip-keys.json');
const DEFAULT_DAYS = 7;

function load() {
  if (!fs.existsSync(KEYS_FILE)) return { keys: [] };
  return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
}
function save(db) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(db, null, 2), 'utf8');
}
function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function genKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符 0O1I
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return 'TONF-' + seg() + '-' + seg();
}
function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}
function fmt(d) {
  return d.toISOString().replace('T', ' ').slice(0, 16);
}
function findByName(db, name) {
  return db.keys.find(k => k.name === name);
}

const [, , cmd, arg, daysArg] = process.argv;

function parseDays() {
  if (!daysArg) return null;
  const d = parseInt(daysArg, 10);
  return isNaN(d) || d <= 0 ? null : d;
}

if (cmd === 'add' && arg) {
  const db = load();
  if (findByName(db, arg)) { console.log('❌ 该微信已存在，请用 newkey 或 extend'); process.exit(1); }
  const key = genKey();
  const now = new Date();
  const days = parseDays() || DEFAULT_DAYS;
  db.keys.push({ name: arg, hash: sha256(key), expires: fmt(addDays(now, days)), created: fmt(now) });
  save(db);
  console.log('✅ 已添加会员：' + arg);
  console.log('🔑 口令：' + key);
  console.log('⏰ 到期：' + fmt(addDays(now, days)) + '（' + days + '天）');
  console.log('📤 请把口令发给用户，然后运行 .\\deploy.ps1 发布');
} else if (cmd === 'extend' && arg) {
  const db = load();
  const u = findByName(db, arg);
  if (!u) { console.log('❌ 未找到该微信'); process.exit(1); }
  const base = new Date(u.expires.replace(' ', 'T'));
  const now = new Date();
  const from = base > now ? base : now; // 已过期则从今天算
  const days = parseDays() || DEFAULT_DAYS;
  u.expires = fmt(addDays(from, days));
  save(db);
  console.log('✅ 已续费：' + arg + '，新到期 ' + u.expires + '（' + days + '天，原口令不变）');
} else if (cmd === 'revoke' && arg) {
  const db = load();
  const before = db.keys.length;
  db.keys = db.keys.filter(k => k.name !== arg);
  save(db);
  console.log(before === db.keys.length ? '❌ 未找到该微信' : '✅ 已删除：' + arg + '（该口令立即失效）');
} else if (cmd === 'newkey' && arg) {
  const db = load();
  const u = findByName(db, arg);
  if (!u) { console.log('❌ 未找到该微信，请用 add'); process.exit(1); }
  const key = genKey();
  u.hash = sha256(key);
  save(db);
  console.log('✅ 已换新口令：' + arg);
  console.log('🔑 新口令：' + key + '（旧口令已作废）');
} else if (cmd === 'list') {
  const db = load();
  if (!db.keys.length) { console.log('（暂无会员）'); process.exit(0); }
  const now = new Date();
  console.log('当前会员：');
  db.keys.forEach(k => {
    const expired = new Date(k.expires.replace(' ', 'T')) < now;
    console.log('  ' + k.name + ' ｜ 到期 ' + k.expires + (expired ? '  🔴已过期' : '  🟢有效'));
  });
} else {
  console.log('用法：node scripts/manage_keys.js <add|extend|revoke|newkey|list> [微信名]');
}
