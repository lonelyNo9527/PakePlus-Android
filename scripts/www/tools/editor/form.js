/* ═══════════════ 载入 .save ═══════════════ */
async function loadFromFile(file) {
  const text = (await file.text()).trim();
  const plain = await readSaveText(text);
  let payload;
  try { payload = JSON.parse(plain); } catch { setStatus('warn', '解析失败：不是有效的存档密文'); toast('文件无法解密 —— 确认是本游戏导出的 .save 文件'); return; }
  if (payload.game !== 'yunyin-xiuxian' || !payload.data || !payload.data.player || !payload.data.game) {
    setStatus('warn', '解析失败：并非《云隐修仙录》存档');
    return;
  }
  openSave(payload.data);
}

function openSave(data) {
  data.player ??= {}; data.resources ??= {}; data.cultivation ??= {}; data.quests ??= {};
  data.game ??= {}; data.settings ??= {}; data.inventory ??= {}; data.dongfu ??= {};
  data.player.reincarnation ??= { count: 0, daoFruit: 0, talents: [], insight: 0, lives: [], vow: null, trial: null, bonds: [] };
  data.cultivation.learned ??= {}; data.cultivation.subGongfa ??= [];
  data.quests.titlesOwned ??= []; data.quests.achieved ??= [];
  data.inventory.items ??= []; data.inventory.equipped ??= {}; data.inventory.pills ??= {};
  data.inventory.artifacts ??= []; data.inventory.equippedArtifacts ??= [];
  data.dongfu.levels ??= {}; data.dongfu.frac ??= {}; data.dongfu.veinPoints ??= {};
  S.save = data;
  S.backup = JSON.parse(JSON.stringify(data));
  renderAll();
  document.querySelectorAll('.tabs button').forEach(b => { b.disabled = false; });
  $('loadedCard').classList.remove('hide');
  const p = data.player;
  $('loadSummary').innerHTML =
    `<b>${p.name ?? '无名散修'}</b> · ${REALMS[p.major] ?? '?'}·${SUBS[p.sub] ?? '?'} · 道龄 ${Math.floor(num(p.age))} 岁<br>` +
    `${Object.keys(data).length} 个分片 · 成就 ${data.quests.achieved.length} · 名号 ${data.quests.titlesOwned.length} · 存档版本 v${data.game.saveVersion ?? '?'}`;
  setStatus('ok', `已载入：${p.name} —— 改完到「写回」页生成新档`);
  switchTab('load');
  toast('存档已载入');
}

function renderAll() {
  const p = S.save.player, r = S.save.resources, q = S.save.quests, c = S.save.cultivation;
  $('f_name').value = p.name ?? '';
  fillSelect($('f_title'), [['', '（无）'], ...TITLES.map(([id, name]) => [id, name])], p.titleId ?? '');
  fillSelect($('f_pet'), PETS, p.petId ?? '');
  $('f_dead').checked = !!p.dead;
  fillSelect($('f_major'), REALMS.map((n, i) => [i, `${i} · ${n}`]), Math.min(9, num(p.major)));
  fillSelect($('f_sub'), SUBS.map((n, i) => [i, n]), Math.min(9, num(p.sub)));
  const exp = p.exp ?? { m: 0, e: 0 };
  $('f_exp').value = exp.m ? exp.m.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + 'e' + exp.e : '0';
  $('hint_exp').textContent = '当前 ' + gnText(exp);
  $('f_age').value = num(p.age);
  $('f_lifespanBonus').value = num(p.lifespanBonusYears);
  $('f_reinc').value = num(p.reincarnation.count);
  $('f_daoFruit').value = num(p.reincarnation.daoFruit);
  $('f_insight').value = num(p.reincarnation.insight);

  /* 灵根 */
  p.linggen ??= { roots: [{ element: 'metal', aptitude: 60 }], gradeName: '', growthMult: 1 };
  p.linggen.roots ??= [];
  if (!p.linggen.roots.length) p.linggen.roots.push({ element: 'metal', aptitude: 60 });
  lgRender(); lgPreview();

  const stone = r.spiritStone ?? { m: 0, e: 0 };
  $('f_stone').value = stone.m ? stone.m.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + 'e' + stone.e : '0';
  $('hint_stone').textContent = '当前 ' + gnText(stone);
  for (const [id, key] of [['f_wudao', 'wudao'], ['f_qi', 'qi'], ['f_herb', 'herb'], ['f_ore', 'ore'], ['f_page', 'page'], ['f_dust', 'dust']]) {
    $(id).value = Math.floor(num(r[key]));
  }

  /* 名号 */
  const ownedBox = $('f_titlesOwned');
  ownedBox.innerHTML = '';
  const owned = new Set(q.titlesOwned);
  for (const [id, name] of TITLES) {
    ownedBox.append(el('label', {}, el('input', { type: 'checkbox', checked: owned.has(id), dataset: { title: id } }), name));
  }
  $('achCount').textContent = `已解锁 ${q.achieved.length} / ${ACH_IDS.length}`;
  delete $('achCount').dataset.set;

  /* 功法 */
  const tbody = $('gfTable').querySelector('tbody');
  tbody.innerHTML = '';
  const learned = c.learned ?? {}, main = c.mainGongfa ?? null, subs = new Set(c.subGongfa ?? []);
  for (const [id, name, type, minRealm] of GONGFA) {
    const tag = { main: ['主', 'type-m'], sub: ['辅', 'type-s'], secret: ['秘', 'type-x'] }[type];
    tbody.append(el('tr', {},
      el('td', { className: 'tag ' + tag[1], textContent: tag[0] }),
      el('td', {}, `${name} `, el('span', { className: 'gnum-hint', textContent: REALMS[minRealm] + '起' })),
      el('td', { className: 'num' }, el('input', { type: 'number', min: 0, max: type === 'secret' ? 3 : 9, value: num(learned[id]), dataset: { gf: id, max: type === 'secret' ? 3 : 9 } })),
      el('td', {}, el('input', { type: 'radio', name: 'gfMain', checked: main === id, disabled: type !== 'main', dataset: { gfMain: id } })),
      el('td', {}, el('input', { type: 'checkbox', checked: subs.has(id), disabled: type !== 'sub', dataset: { gfSub: id } }))
    ));
  }

  renderBond();
  renderDongfu();
  renderInventory();
  renderMisc();
}

/* ---- 装备洞府 ---- */
function renderDongfu() {
  const d = S.save.dongfu;
  const bZone = $('dfBuildings');
  bZone.innerHTML = '';
  for (const [id, name, maxLv] of BUILDINGS) {
    bZone.append(el('label', { className: 'row' },
      el('span', { className: 'lab', textContent: `${name}（上限 ${maxLv}）` }),
      el('input', { type: 'number', min: 0, max: maxLv, value: num(d.levels?.[id]), dataset: { bld: id, max: maxLv } })));
  }
  fillSelect($('df_veinMain'), VEINS, d.veinMain ?? 'gather');
  const vZone = $('dfVeins');
  vZone.innerHTML = '';
  for (const [id, name] of VEINS) {
    vZone.append(el('label', { className: 'row' },
      el('span', { className: 'lab', textContent: name }),
      el('input', { type: 'number', min: 0, max: VEIN_SIDE_CAP, value: num(d.veinPoints?.[id]), dataset: { vein: id, max: VEIN_SIDE_CAP }, on: { input: updateVeinSum } })));
  }
  updateVeinSum();
  const fZone = $('dfFrac');
  fZone.innerHTML = '';
  for (const [id, name] of FRACS) {
    fZone.append(el('label', { className: 'row' },
      el('span', { className: 'lab', textContent: name }),
      el('input', { type: 'number', min: 0, max: 100, step: 0.1, value: (num(d.frac?.[id]) * 100).toFixed(1), dataset: { frac: id } })));
  }
}
function updateVeinSum() {
  let sum = 0;
  document.querySelectorAll('input[data-vein]').forEach(i => sum += Number(i.value) || 0);
  $('veinSum').textContent = sum;
}

function renderInventory() {
  const inv = S.save.inventory;
  const equippedUid = new Set(Object.values(inv.equipped ?? {}));
  const tbody = $('equipTable').querySelector('tbody');
  tbody.innerHTML = '';
  const qSel = QUALITIES.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
  for (const it of inv.items) {
    const tpl = EQUIP_TPL[it.templateId] ?? [it.templateId, ''];
    const qColor = (QUALITIES.find(([id]) => id === it.quality) ?? ['', '', '#888'])[2];
    /* 强化上限：基础 10 级，炼器台每 2 级 +1（与游戏 EQUIP_MAX_LEVEL_BASE/FORGE_LEVEL_PER_CAP 一致） */
    const forgeLv = num(S.save.dongfu?.levels?.forge);
    const maxEnh = EQUIP_MAX_LEVEL_BASE + Math.floor(forgeLv / FORGE_LEVEL_PER_CAP);
    const row = el('tr', {},
      el('td', { innerHTML: `<span style="color:${qColor}">${tpl[0]}</span> <span class="gnum-hint">${SLOT_NAMES[tpl[1]] ?? ''}</span>` }),
      el('td', {}, el('select', { dataset: { eqq: it.uid }, innerHTML: qSel, value: it.quality })),
      el('td', { className: 'num' }, el('input', { type: 'number', min: 1, max: 20, value: num(it.tier), dataset: { eqt: it.uid } })),
      el('td', { className: 'num' }, el('input', { type: 'number', min: 0, max: maxEnh, value: num(it.level), dataset: { eql: it.uid, max: maxEnh } })),
      el('td', {}, el('input', { type: 'checkbox', checked: equippedUid.has(it.uid), dataset: { eqw: it.uid, slot: tpl[1] }, on: { change: onEquipToggle } }))
    );
    row.querySelector('select').value = it.quality;
    tbody.append(row);
  }
  $('equipCount').textContent = inv.items.length;

  const afSet = new Set(inv.equippedArtifacts ?? []);
  const afMap = new Map((inv.artifacts ?? []).map(a => [a.defId, num(a.level)]));
  const playerMajor = num(S.save.player.major);
  const slotCount = playerMajor >= 3 ? 2 : 1;
  $('afSlotHint').textContent = `法宝位 ${afSet.size}/${slotCount}` + (slotCount < 2 ? ' · 元婴境开启第二法宝位' : '');
  const afBody = $('afTable').querySelector('tbody');
  afBody.innerHTML = '';
  for (const [id, name, minTier] of ARTIFACTS) {
    const tooHigh = minTier > num(S.save.player.major) + 2 && minTier > 4;
    afBody.append(el('tr', {},
      el('td', { innerHTML: `${name} <span class="gnum-hint">${minTier} 阶起现世${tooHigh ? ' · 超前佩戴可能无加成' : ''}</span>` }),
      el('td', { className: 'num' }, el('input', { type: 'number', min: 0, max: 9, value: afMap.get(id) ?? 0, dataset: { afl: id } })),
      el('td', {}, el('input', { type: 'checkbox', checked: afSet.has(id), dataset: { afw: id }, on: { change: onArtifactToggle } }))
    ));
  }

  const pZone = $('pillZone');
  pZone.innerHTML = '';
  const pills = inv.pills ?? {};
  const ownedPills = PILLS.filter(([id]) => num(pills[id]) > 0);
  if (!ownedPills.length) { pZone.append(el('p', { className: 'hint', textContent: '背包里暂无丹药 —— 可点上方「所有丹药 ×99」' })); return; }
  for (const [id, name] of ownedPills) {
    pZone.append(el('label', { className: 'row' },
      el('span', { className: 'lab', textContent: name }),
      el('input', { type: 'number', min: 0, value: num(pills[id]), dataset: { pill: id } })));
  }
}
function onEquipToggle(e) {
  const cb = e.target;
  if (cb.checked) {
    /* 同一部位只能穿一件 —— 勾选时自动取消该部位其它件 */
    document.querySelectorAll(`input[data-eqw][slot="${cb.dataset.slot}"]`).forEach(o => { if (o !== cb) o.checked = false; });
  }
}
function onArtifactToggle(e) {
  /* 法宝位：炼气~金丹 1 件、元婴起 2 件 —— 超出时替换最早勾选的一件，与游戏行为一致 */
  const cb = e.target;
  if (!cb.checked) return;
  const maxSlots = num(S.save.player.major) >= 3 ? 2 : 1;
  const boxes = [...document.querySelectorAll('input[data-afw]')].filter(b => b.checked);
  if (boxes.length > maxSlots) {
    boxes.find(b => b !== cb).checked = false;
    toast(maxSlots < 2 ? '法宝位已满（当前境界仅 1 件），已替换' : '法宝位已满（2 件），已替换最早的一件');
  }
}
function equipAllLevel(lv) {
  const forgeLv = num(S.save.dongfu?.levels?.forge);
  const maxEnh = EQUIP_MAX_LEVEL_BASE + Math.floor(forgeLv / FORGE_LEVEL_PER_CAP);
  const target = Math.min(lv, maxEnh);
  document.querySelectorAll('input[data-eql]').forEach(i => { i.value = target; i.dataset.manual = '1'; });
  toast(target ? `全部装备强化已置 ${target}` + (target < lv ? `（受炼器台 ${forgeLv} 级上限约束）` : '') : '强化已归零');
}
function pillAll(n) {
  const zone = $('pillZone');
  zone.innerHTML = '';
  for (const [id, name] of PILLS) {
    zone.append(el('label', { className: 'row' },
      el('span', { className: 'lab', textContent: name }),
      el('input', { type: 'number', min: 0, value: n, dataset: { pill: id } })));
  }
  toast('已为全部 32 味丹药置数 ' + n);
}

/* ---- 杂项 + 只读摘要 ---- */
function renderMisc() {
  const g = S.save.game, st = S.save.settings ?? {};
  $('m_playHours').value = (num(g.totalPlaySec) / 3600).toFixed(1);
  $('m_musicOn').checked = !!st.musicOn;
  $('m_sfxOn').checked = !!st.sfxOn;
  $('m_musicVol').value = num(st.musicVol);
  $('m_sfxVol').value = num(st.sfxVol);
  $('m_theme').value = st.theme ?? 'auto';
  $('m_battleSpeed').value = String(num(st.battleSpeed) || 1);

  const adv = S.save.adventure, lore = S.save.lore;
  const parts = [];
  try {
    const chain = adv?.mortalWorld?.chain;
    if (Array.isArray(chain)) parts.push(`历练世界：已生成 ${chain.length} 个节点（种子 ${adv.mortalWorld.seed}）`);
  } catch { }
  try {
    if (lore?.materialLore) parts.push(`见闻：识得药材 ${Object.keys(lore.materialLore).length} 味 · 丹方 ${Object.keys(lore.recipeLore ?? {}).length} 张`);
  } catch { }
  $('roSummary').textContent = parts.join('；') || '（无历练/见闻数据）';
}

/* ---- 功法/成就一键 ---- */
function gfAll(lv) {
  $('gfTable').querySelectorAll('input[type=number]').forEach(i => { i.value = Math.min(lv, Number(i.dataset.max)); });
  toast(lv ? '全部功法已置满级（等级>0 即视为习得）' : '全部功法已遗忘');
}
function achAll(on) {
  $('achCount').textContent = `已解锁 ${on ? ACH_IDS.length : 0} / ${ACH_IDS.length}`;
  $('achCount').dataset.set = on ? 'all' : 'none';
  toast(on ? '写回时将标记全部成就为已达成' : '写回时将清空成就');
}

/* ═══════════════ 收集表单 ═══════════════ */
function collectForm() {
  const p = S.save.player, r = S.save.resources, q = S.save.quests, c = S.save.cultivation, d = S.save.dongfu, inv = S.save.inventory;
  p.name = $('f_name').value.trim() || '无名散修';
  p.titleId = $('f_title').value || null;
  p.petId = $('f_pet').value || null;
  p.dead = $('f_dead').checked;
  p.major = Math.max(0, Math.min(9, Number($('f_major').value) || 0));
  p.sub = Math.max(0, Math.min(9, Number($('f_sub').value) || 0));
  p.exp = gnParse($('f_exp').value);
  p.age = Math.max(0, Math.min(99999, Number($('f_age').value) || 0));
  p.lifespanBonusYears = Math.max(0, Math.min(999999, Math.floor(Number($('f_lifespanBonus').value) || 0)));
  p.reincarnation.count = Math.max(0, Math.min(9999, Math.floor(Number($('f_reinc').value) || 0)));
  p.reincarnation.daoFruit = Math.max(0, Math.min(99999, Math.floor(Number($('f_daoFruit').value) || 0)));
  p.reincarnation.insight = Math.max(0, Math.min(999999, Math.floor(Number($('f_insight').value) || 0)));

  /* 灵根 —— 品名按公式重算；倍率以输入框为准（手改过用手改值，否则用公式值），并夹在游戏内合理范围 */
  const lgRoots = lgRead();
  if (lgRoots.length) {
    const hasSpecial = lgRoots.some(r => LG_SPECIAL.has(r.element));
    const avg = lgRoots.reduce((s, r) => s + r.aptitude, 0) / lgRoots.length;
    const chaos = lgRoots.length === 1 && lgRoots[0].element === 'chaos';
    const manual = Number($('f_lgGrowth').value);
    const auto = lgCalcGrowth(lgRoots);
    const growth = (manual && Math.abs(manual - auto) > 0.005)
      ? Math.max(LG_GROWTH_MIN, Math.min(LG_GROWTH_MAX, manual))
      : auto;
    S.save.player.linggen = {
      roots: lgRoots,
      gradeName: chaos ? '混沌灵根' : lgGradeName(lgRoots.length, hasSpecial, avg, chaos),
      growthMult: Math.round(growth * 100) / 100
    };
  }

  /* 道侣 / 师承 / 陪行灵兽（含阶段门槛保护） */
  collectBond();

  r.spiritStone = gnParse($('f_stone').value);
  for (const [id, key] of [['f_wudao', 'wudao'], ['f_qi', 'qi'], ['f_herb', 'herb'], ['f_ore', 'ore'], ['f_page', 'page'], ['f_dust', 'dust']]) {
    r[key] = Math.max(0, Math.min(99999999, Math.floor(Number($(id).value) || 0)));
  }

  q.titlesOwned = [...$('f_titlesOwned').querySelectorAll('input:checked')].map(i => i.dataset.title);
  if (p.titleId && !q.titlesOwned.includes(p.titleId)) q.titlesOwned.push(p.titleId);
  const achSet = $('achCount').dataset.set;
  if (achSet === 'all') q.achieved = [...ACH_IDS];
  else if (achSet === 'none') q.achieved = [];

  const learned = {}, subs = [];
  let main = null;
  $('gfTable').querySelectorAll('tbody input[type=number]').forEach(i => {
    const lv = Math.max(0, Math.min(Number(i.dataset.max), Math.floor(Number(i.value) || 0)));
    if (lv > 0) learned[i.dataset.gf] = lv;
  });
  const mainRadio = document.querySelector('input[data-gf-main]:checked');
  if (mainRadio && learned[mainRadio.dataset.gfMain]) main = mainRadio.dataset.gfMain;
  document.querySelectorAll('input[data-gf-sub]:checked').forEach(i => { if (learned[i.dataset.gfSub]) subs.push(i.dataset.gfSub); });
  c.learned = learned; c.mainGongfa = main; c.subGongfa = subs;

  /* 洞府 —— 建筑等级按各自上限钳制；灵脉主脉 ≤70、副脉 ≤30、总计 ≤100（游戏 VEIN_* 常量） */
  d.levels = {};
  document.querySelectorAll('input[data-bld]').forEach(i => { const b = BUILDINGS.find(([id]) => id === i.dataset.bld); d.levels[i.dataset.bld] = Math.max(0, Math.min(b ? b[2] : 99, Math.floor(Number(i.value) || 0))); });
  d.veinMain = $('df_veinMain').value;
  d.veinPoints = {};
  document.querySelectorAll('input[data-vein]').forEach(i => { d.veinPoints[i.dataset.vein] = Math.max(0, Math.min(VEIN_SIDE_CAP, Math.floor(Number(i.value) || 0))); });
  if (d.veinPoints[d.veinMain] > VEIN_MAIN_CAPACITY) d.veinPoints[d.veinMain] = VEIN_MAIN_CAPACITY;
  {
    let total = Object.values(d.veinPoints).reduce((s, v) => s + v, 0);
    if (total > VEIN_TOTAL_CAPACITY) {
      for (const id of Object.keys(d.veinPoints)) {
        if (total <= VEIN_TOTAL_CAPACITY) break;
        const over = total - VEIN_TOTAL_CAPACITY;
        const cut = Math.min(d.veinPoints[id], over);
        d.veinPoints[id] -= cut; total -= cut;
      }
      toast(`灵脉总点数超出 ${VEIN_TOTAL_CAPACITY}，已自动削减`);
    }
  }
  d.frac = {};
  document.querySelectorAll('input[data-frac]').forEach(i => { d.frac[i.dataset.frac] = Math.max(0, Math.min(100, Number(i.value) || 0)) / 100; });

  /* 装备 —— 层级 1~20；强化上限 = 10 + 炼器台等级÷2（与游戏一致） */
  const forgeLv = num(d.levels.forge);
  const maxEnh = EQUIP_MAX_LEVEL_BASE + Math.floor(forgeLv / FORGE_LEVEL_PER_CAP);
  const byUid = new Map(inv.items.map(it => [it.uid, it]));
  document.querySelectorAll('select[data-eqq]').forEach(s => { const it = byUid.get(s.dataset.eqq); if (it && QUALITIES.some(([id]) => id === s.value)) it.quality = s.value; });
  document.querySelectorAll('input[data-eqt]').forEach(i => { const it = byUid.get(i.dataset.eqt); if (it) it.tier = Math.max(1, Math.min(20, Math.floor(Number(i.value) || 1))); });
  document.querySelectorAll('input[data-eql]').forEach(i => {
    const it = byUid.get(i.dataset.eql); if (!it) return;
    it.level = Math.max(0, Math.min(maxEnh, Math.floor(Number(i.value) || 0)));
  });
  const equipped = {};
  document.querySelectorAll('input[data-eqw]:checked').forEach(i => { const it = byUid.get(i.dataset.eqw); if (it && i.dataset.slot) equipped[i.dataset.slot] = it.uid; });
  inv.equipped = equipped;

  const afMap = new Map((inv.artifacts ?? []).map(a => [a.defId, a]));
  document.querySelectorAll('input[data-afl]').forEach(i => {
    const lv = Math.max(0, Math.min(ARTIFACT_MAX_LEVEL, Math.floor(Number(i.value) || 0)));
    if (afMap.has(i.dataset.afl)) afMap.get(i.dataset.afl).level = lv;
    else if (lv > 0) { const rec = { defId: i.dataset.afl, level: lv }; inv.artifacts.push(rec); afMap.set(i.dataset.afl, rec); }
  });
  inv.equippedArtifacts = [...document.querySelectorAll('input[data-afw]:checked')].map(i => i.dataset.afw);

  const pills = {};
  document.querySelectorAll('input[data-pill]').forEach(i => {
    const n = Math.max(0, Math.floor(Number(i.value) || 0));
    if (n > 0) pills[i.dataset.pill] = n;
  });
  inv.pills = pills;

  /* 杂项 */
  if (S.save.game) {
    S.save.game.totalPlaySec = Math.max(0, (Number($('m_playHours').value) || 0) * 3600);
    if ($('f_resetActive').checked) S.save.game.lastActiveAt = Date.now();
  }
  S.save.settings ??= {};
  const st = S.save.settings;
  st.musicOn = $('m_musicOn').checked;
  st.sfxOn = $('m_sfxOn').checked;
  st.musicVol = Math.max(0, Math.min(100, Math.floor(Number($('m_musicVol').value) || 0)));
  st.sfxVol = Math.max(0, Math.min(100, Math.floor(Number($('m_sfxVol').value) || 0)));
  st.theme = $('m_theme').value;
  st.battleSpeed = Number($('m_battleSpeed').value) || 1;
  return true;
}

