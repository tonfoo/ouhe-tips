/* ============================================
   欧核精算 · 前端逻辑（方案A：一人一口令+7天到期）
   - 加载 data/YYYY-MM-DD.json 渲染今日分析
   - 免费会员看 1 场，其余锁定
   - 输入独立口令 → SHA-256 验证 → 解锁全部
   - 口令 7 天到期，过期自动锁回
   ============================================ */

// ── 每日数据文件（更新时改这里：date 字段）──
const DATA_FILE = 'data/2026-08-25.json';
const KEYS_FILE = 'data/vip-keys.json';

const LS_KEY = 'ouhe_vip_v1';

function getStored() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return null; }
}
function setStored(obj) { localStorage.setItem(LS_KEY, JSON.stringify(obj)); }
function clearStored() { localStorage.removeItem(LS_KEY); }

function isUnlocked(keysDb) {
  const s = getStored();
  if (!s || !s.hash) return false;
  // 检查口令是否仍在有效名单中（被踢则失效）
  const hit = (keysDb || []).find(k => k.hash === s.hash);
  if (!hit) { clearStored(); return false; }
  // 检查是否过期
  if (Date.parse(s.expiresAt) < Date.now()) { clearStored(); return false; }
  return true;
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fmtOdds(arr) { return arr.join(' / '); }

function render(data, unlocked) {
  document.title = '欧核精算 · ' + data.title;
  document.getElementById('reportTitle').textContent = data.title;
  document.getElementById('reportMeta').textContent =
    '生成时间：' + data.generatedAt + ' ｜ 免费会员每日可看 ' + data.freeMatches + ' 场';
  document.getElementById('reportNote').textContent = data.note;

  const freeN = data.freeMatches || 1;
  const list = document.getElementById('matchList');
  list.innerHTML = '';

  data.matches.forEach((m, i) => {
    const locked = !unlocked && i >= freeN;
    const card = document.createElement('div');
    card.className = 'match' + (locked ? ' locked' : '');
    const confClass = (m.confidence === '高' || m.confidence === '中高') ? '' : ' low';
    let html = '<span class="no">' + m.no + '</span>';
    html += '<div class="league">' + m.league + ' ｜ ' + m.system + '</div>';
    html += '<h3>' + m.home + ' <span style="color:var(--dim);font-size:12px">vs</span> ' + m.away + '</h3>';
    html += '<div class="odds">合理区间：<b>' + m.fair + '</b></div>';
    html += '<div class="odds">威廉希尔 初 ' + m.whInit + ' → 即 ' + m.whLive + '</div>';
    html += '<div class="odds lb">立　博　 初 ' + m.lbInit + ' → 即 ' + m.lbLive + '</div>';
    html += '<div class="verdict' + confClass + '">方向：' + m.direction + '</div>';
    html += '<div class="conf">信心：' + m.confidence + '</div>';
    html += '<div class="analysis">' + m.analysis + '</div>';
    card.innerHTML = html;
    if (locked) {
      const badge = document.createElement('div');
      badge.className = 'lock-badge';
      badge.innerHTML = '<span class="lock-ico">🔒</span>VIP 专属<br>输入口令解锁全部';
      card.appendChild(badge);
    }
    list.appendChild(card);
  });

  const status = document.getElementById('vipStatus');
  if (unlocked) { status.textContent = 'VIP 会员'; status.classList.add('vip'); }
  else { status.textContent = '免费会员'; status.classList.remove('vip'); }
}

function showErr(msg) { document.getElementById('keyErr').textContent = msg; }

function init() {
  const unlockPanel = document.getElementById('unlockPanel');
  document.getElementById('btnUnlock').addEventListener('click', () => unlockPanel.scrollIntoView({ behavior: 'smooth' }));

  let keysDb = [];

  Promise.all([
    fetch(DATA_FILE).then(r => { if (!r.ok) throw new Error('数据文件 HTTP ' + r.status); return r.json(); }),
    fetch(KEYS_FILE).then(r => { if (!r.ok) throw new Error('口令文件 HTTP ' + r.status); return r.json(); })
  ]).then(([data, keys]) => {
    keysDb = (keys && keys.keys) || [];
    window.__data = data;
    render(data, isUnlocked(keysDb));
  }).catch(err => {
    document.getElementById('matchList').innerHTML =
      '<div class="match"><h3>数据加载失败</h3><p style="font-size:12px;color:var(--dim)">' +
      err.message + '（请确认 data/ 下存在今日数据文件）</p></div>';
  });

  document.getElementById('btnSubmitKey').addEventListener('click', async () => {
    const input = document.getElementById('vipKey').value.trim();
    if (!input) { showErr('请输入口令'); return; }
    const hash = await sha256(input);
    const hit = keysDb.find(k => k.hash === hash);
    if (!hit) { showErr('口令无效，请核对后重试（联系站长获取）。'); return; }
    const expiresAt = Date.parse(hit.expires.replace(' ', 'T'));
    if (expiresAt < Date.now()) { showErr('该口令已过期，请联系站长续费。'); return; }
    // 解锁成功：记录口令哈希 + 到期时间
    setStored({ hash, expiresAt });
    showErr('');
    document.getElementById('vipKey').value = '';
    render(window.__data, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('vipKey').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnSubmitKey').click();
  });

  // 页面可见时检查到期（从后台切回来自动锁）
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.__data) render(window.__data, isUnlocked(keysDb));
  });
}

init();
