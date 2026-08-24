/* ============================================
   欧核精算 · 前端逻辑
   - 加载 data/YYYY-MM-DD.json 渲染今日分析
   - 免费会员看 1 场，其余锁定
   - 输入口令解锁全部（localStorage 记忆）
   ============================================ */

// ── 会员口令（站长自行修改，付费用户发放）──
const VIP_KEY = 'OUHE-2026-666';

// ── 每日数据文件（更新时改这里：date 字段）──
const DATA_FILE = 'data/2026-08-24.json';

const LS_KEY = 'ouhe_vip_unlocked';

function isUnlocked() {
  return localStorage.getItem(LS_KEY) === '1';
}

function setUnlocked() {
  localStorage.setItem(LS_KEY, '1');
}

function fmtOdds(arr) {
  return arr.join(' / ');
}

function render(data) {
  document.title = '欧核精算 · ' + data.title;
  document.getElementById('reportTitle').textContent = data.title;
  document.getElementById('reportMeta').textContent =
    '生成时间：' + data.generatedAt + ' ｜ 免费会员每日可看 ' + data.freeMatches + ' 场';
  document.getElementById('reportNote').textContent = data.note;

  const freeN = data.freeMatches || 1;
  const unlocked = isUnlocked();
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

  // 更新顶部状态
  const status = document.getElementById('vipStatus');
  if (unlocked) {
    status.textContent = 'VIP 会员';
    status.classList.add('vip');
  } else {
    status.textContent = '免费会员';
    status.classList.remove('vip');
  }
}

function unlockAll() {
  setUnlocked();
  document.getElementById('keyErr').textContent = '';
  document.getElementById('vipKey').value = '';
  const data = window.__data;
  if (data) render(data);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function init() {
  document.getElementById('btnUnlock').addEventListener('click', () => {
    document.getElementById('unlockPanel').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('btnSubmitKey').addEventListener('click', () => {
    const k = document.getElementById('vipKey').value.trim();
    if (k === VIP_KEY) {
      unlockAll();
    } else {
      document.getElementById('keyErr').textContent = '口令错误，请核对后重试（联系站长获取）。';
    }
  });
  document.getElementById('vipKey').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btnSubmitKey').click();
  });

  fetch(DATA_FILE)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => { window.__data = data; render(data); })
    .catch(err => {
      document.getElementById('matchList').innerHTML =
        '<div class="match"><h3>数据加载失败</h3><p style="font-size:12px;color:var(--dim)">' +
        err.message + '（请确认 data/ 下存在今日数据文件）</p></div>';
    });
}

init();
