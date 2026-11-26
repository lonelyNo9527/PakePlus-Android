/* ═══════════════ 状态与工具 ═══════════════ */
const S = { save: null, backup: null };
const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else n[k] = v;
  }
  n.append(...kids);
  return n;
};
function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}
function setStatus(cls, text) { $('statusBar').className = 'status ' + cls; $('statusBar').textContent = text; }
function num(v) { return Number.isFinite(v) ? v : 0; }
function fillSelect(sel, pairs, value) {
  sel.innerHTML = '';
  for (const [v, label] of pairs) sel.add(el('option', { value: v, textContent: label }));
  sel.value = value ?? '';
}

/* ═══════════════ Tab 切换 ═══════════════ */
function switchTab(id) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  for (const s of document.querySelectorAll('section[id^=tab-]')) s.classList.toggle('hide', s.id !== 'tab-' + id);
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

