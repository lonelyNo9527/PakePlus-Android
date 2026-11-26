/* ═══════════════ 写回 ═══════════════ */
async function encryptAllSlices() {
  const out = {};
  for (const id of STORE_IDS) {
    if (S.save[id] === undefined) continue;
    out[SAVE_PREFIX + id] = await aesEncrypt(JSON.stringify(S.save[id]));
  }
  return out;
}

async function downloadSave() {
  collectForm();
  const payload = { game: 'yunyin-xiuxian', version: 2, exportedAt: Date.now(), data: S.save };
  const cipher = await aesEncrypt(JSON.stringify(payload));
  const blob = new Blob([cipher], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `云隐修仙录存档-修改于${new Date().toISOString().slice(0, 10)}.save` });
  a.click();
  URL.revokeObjectURL(a.href);
  toast('新 .save 已下载 —— 导入方式与原档相同');
}

async function genInjectScript() {
  collectForm();
  const slices = await encryptAllSlices();
  const json = JSON.stringify(slices);
  const script = `/* 云隐存档修改器 · 注入脚本 —— 在游戏页 F12 Console 粘贴运行 */
(async () => {
  const data = ${json};
  try {
    const old = {};
    for (const k of Object.keys(data)) { const v = localStorage.getItem(k); if (v !== null) old[k] = v; }
    if (Object.keys(old).length) localStorage.setItem('yunyin-editor-backup', JSON.stringify(old));
  } catch (e) {}
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
  alert('存档已写入(原档已备份到 yunyin-editor-backup),点确定后刷新生效');
  location.reload();
})();`;
  await copyText(script);
  const blob = new Blob([script], { type: 'text/plain' });
  const a = el('a', { href: URL.createObjectURL(blob), download: '云隐存档注入脚本.txt' });
  a.click();
  URL.revokeObjectURL(a.href);
  toast('注入脚本已复制到剪贴板 + 另存 txt —— 在游戏页 F12 粘贴运行');
}

function downloadBackup() {
  if (!S.backup) { toast('还没有载入过存档'); return; }
  const blob = new Blob([JSON.stringify(S.backup, null, 1)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: '云隐存档备份-原始明文.json' });
  a.click();
  URL.revokeObjectURL(a.href);
  toast('原始备份已下载');
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = el('textarea', { value: text });
    document.body.append(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
}

/* ═══════════════ 事件绑定 ═══════════════ */
$('dropzone').addEventListener('click', () => fileInput.click());
$('fileInput').addEventListener('change', e => { if (e.target.files[0]) loadFromFile(e.target.files[0]); });
window.addEventListener('dragover', e => { e.preventDefault(); $('dropzone').classList.add('over'); });
window.addEventListener('dragleave', () => $('dropzone').classList.remove('over'));
window.addEventListener('drop', e => {
  e.preventDefault();
  $('dropzone').classList.remove('over');
  const f = e.dataTransfer?.files?.[0];
  if (f) loadFromFile(f);
});
$('btnDownload').addEventListener('click', downloadSave);
$('btnInjectScript').addEventListener('click', genInjectScript);
$('btnBackup').addEventListener('click', downloadBackup);
$('f_exp').addEventListener('input', () => { $('hint_exp').textContent = '→ ' + gnText(gnParse($('f_exp').value)); });
$('f_stone').addEventListener('input', () => { $('hint_stone').textContent = '→ ' + gnText(gnParse($('f_stone').value)); });
