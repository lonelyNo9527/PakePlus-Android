/* ═══════════════ 静态数据（与游戏 v1.33 数据表同步） ═══════════════ */
const TITLES = [
  ['ti_churu', '初入仙途'], ['ti_lianqi', '炼气修士'], ['ti_zhuji', '筑基真人'],
  ['ti_jindan', '金丹老祖'], ['ti_yuanying', '元婴大能'], ['ti_slayer', '百兽辟易'],
  ['ti_wanfa', '一剑破万法'], ['ti_tianjiao', '天命之人'], ['ti_baolian', '百炼成钢'],
  ['ti_danwang', '丹道圣手'], ['ti_zhuanshi', '轮回行者'], ['ti_changsheng', '万古长生']
];
const REALMS = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙'];
const SUBS = ['一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层', '圆满'];
/* 灵根元素 —— 与游戏 ElementId 对齐 */
const LG_ELEMENTS = [
  ['metal', '金'], ['wood', '木'], ['water', '水'], ['fire', '火'], ['earth', '土'],
  ['wind', '风'], ['thunder', '雷'], ['ice', '冰'], ['light', '光'], ['dark', '暗'], ['chaos', '混沌']
];
const LG_SPECIAL = new Set(['wind', 'thunder', 'ice', 'light', 'dark', 'chaos']);
const LG_COUNT_FACTOR = { 1: 1.6, 2: 1.35, 3: 1.15, 4: 1.0, 5: 0.9 };
/* 修炼速度倍率的游戏内合理范围：资质 30~100、根数 1~5 推出的极值约 0.4~3.2（混沌单根最高 4.0） */
const LG_GROWTH_MIN = 0.4, LG_GROWTH_MAX = 4.0;
/* 道侣 —— 与游戏 DAOLU 对齐；major 为她出现的最低大境界 */
const DAOLU = [
  ['dl_qingli', '沈青璃 · 寡言女修，袖口常沾药渣', 1], ['dl_zhaoyan', '赵砚 · 养剑的剑痴', 2],
  ['dl_muyan', '慕烟 · 好奇未知之物', 1], ['dl_hanzheng', '韩峥 · 寻仇的孤客', 3],
  ['dl_yunshu', '云舒 · 求长生的稳者', 2], ['dl_ligu', '厉孤 · 复原古器的器师', 2],
  ['dl_baiwei', '白薇 · 谨慎的济世医者', 1], ['dl_zhongli', '钟离越 · 问心的执律者', 3],
  ['dl_xuewu', '雪无痕 · 剑意凌厉的独行者', 3], ['dl_cangming', '苍冥 · 参悟混沌的求道者', 4]
];
const STAGES = [
  ['none', '素昧平生'], ['met', '萍水相逢'], ['known', '相识'],
  ['together', '同行'], ['confidant', '知交'], ['pledged', '结契（立下共同的道）'], ['daolv', '道侣']
];
/* 各阶段的关系门槛（缘分/信任/契合/共历）——写回时把数值顶到门槛之上 */
const STAGE_GATES = {
  none: [0, 0, 0, 0], met: [0, 0, 0, 0], known: [20, 0, 0, 0],
  together: [35, 20, 0, 1], confidant: [50, 45, 0, 2],
  pledged: [65, 60, 55, 3], daolv: [80, 75, 65, 4]
};
/* 师承 */
const MENTORS = [
  ['', '（无师承）'], ['swordsman', '剑修 · 一剑破万法'], ['alchemist', '丹修 · 草木通神'],
  ['arraymaster', '阵修 · 定鼎乾坤'], ['hunter', '猎修 · 踏遍山河']
];

function lgGradeName(count, hasSpecial, avg, isChaos) {
  if (isChaos) return '混沌灵根';
  if (hasSpecial) return '变异灵根';
  if (count === 1) return avg >= 80 ? '天灵根' : '异灵根';
  if (count === 2) return '真灵根';
  if (count === 3) return avg >= 70 ? '上灵根' : '伪灵根';
  return '杂灵根';
}
/** 与游戏 rollLinggen 一致：growthMult = round2(avg/60 × 根数系数 ×(特殊根?1.2:1))；混沌 = round2(1.6×资质/60×1.5) */
function lgCalcGrowth(roots) {
  if (!roots.length) return 0;
  if (roots.length === 1 && roots[0].element === 'chaos') {
    return Math.round(1.6 * (roots[0].aptitude / 60) * 1.5 * 100) / 100;
  }
  const avg = roots.reduce((s, r) => s + r.aptitude, 0) / roots.length;
  const hasSpecial = roots.some(r => LG_SPECIAL.has(r.element));
  return Math.round((avg / 60) * (LG_COUNT_FACTOR[roots.length] ?? 1) * (hasSpecial ? 1.2 : 1) * 100) / 100;
}
function lgCurrent() {
  const p = S.save?.player;
  return (p && Array.isArray(p.linggen?.roots) && p.linggen.roots.length) ? p.linggen.roots : [{ element: 'metal', aptitude: 60 }];
}
function lgRender() {
  const box = $('lgRows');
  box.innerHTML = '';
  lgCurrent().forEach((root, i) => {
    const row = el('div', { className: 'grid2', style: 'gap:8px;margin-bottom:6px' });
    const sel = el('select', { dataset: { lgEl: i } });
    LG_ELEMENTS.forEach(([id, name]) => sel.add(el('option', { value: id, textContent: name })));
    sel.value = root.element ?? 'metal';
    sel.addEventListener('change', lgApply);
    const num = el('input', { type: 'number', min: 30, max: 100, value: root.aptitude ?? 60, dataset: { lgAp: i }, style: 'direction:ltr' });
    num.addEventListener('input', lgApply);
    row.append(el('label', { className: 'row' }, el('span', { className: 'lab', textContent: `根 ${i + 1} 属性` }), sel));
    row.append(el('label', { className: 'row' }, el('span', { className: 'lab', textContent: '资质' }), num));
    box.append(row);
  });
}
function lgRead() {
  const roots = [];
  document.querySelectorAll('#lgRows select[data-lg-el]').forEach(s => {
    const ap = document.querySelector(`#lgRows input[data-lg-ap="${s.dataset.lgEl}"]`);
    /* 资质游戏内范围 30~100，写回时统一钳制 */
    roots.push({ element: s.value, aptitude: Math.max(30, Math.min(100, Math.floor(Number(ap.value) || 60))) });
  });
  return roots;
}
function lgPreview() {
  const roots = lgRead();
  const isChaos = roots.length === 1 && roots[0].element === 'chaos';
  $('f_lgGrade').value = roots.length ? lgGradeName(roots.length, roots.some(r => LG_SPECIAL.has(r.element)), roots.reduce((s, r) => s + r.aptitude, 0) / roots.length, isChaos) : '—';
  /* 若倍率输入框并非跟随自动值（用户手改过），保留手改值；否则填入公式值 */
  const auto = lgCalcGrowth(roots);
  const cur = Number($('f_lgGrowth').value);
  if (!$('f_lgGrowth').dataset.manual || $('f_lgGrowth').dataset.auto === '1') {
    $('f_lgGrowth').value = auto.toFixed(2);
    $('f_lgGrowth').dataset.auto = '1';
  }
  $('hint_lgGrowth').textContent = '自动值 ' + auto.toFixed(2);
  const old = S.save?.player?.linggen?.growthMult;
$('hint_linggen').textContent = old ? `当前修速加成 +${Math.round((old - 1) * 100)}%` : '';
}
function lgGrowthClamp() {
  this.dataset.manual = '1'; this.dataset.auto = '0';
  const v = Number(this.value);
  if (!v || v < LG_GROWTH_MIN) { this.value = LG_GROWTH_MIN; }
  else if (v > LG_GROWTH_MAX) { this.value = LG_GROWTH_MAX; }
}

function lgApply() { lgPreview(); }
function lgAdd() { const p = S.save.player; p.linggen ??= { roots: [], gradeName: '', growthMult: 1 }; p.linggen.roots = lgRead(); if (p.linggen.roots.length >= 5) { toast('至多 5 根'); return; } p.linggen.roots.push({ element: 'earth', aptitude: 60 }); lgRender(); lgPreview(); }
function lgDel() { const p = S.save.player; p.linggen ??= { roots: [], gradeName: '', growthMult: 1 }; p.linggen.roots = lgRead(); if (p.linggen.roots.length <= 1) { toast('至少保留 1 根'); return; } p.linggen.roots.pop(); lgRender(); lgPreview(); }
function lgRoll() {
  const count = [1, 2, 2, 3, 3, 3, 4, 5][Math.floor(Math.random() * 8)];
  const pool = LG_ELEMENTS.slice(0, 5); const roots = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    roots.push({ element: pool.splice(idx, 1)[0][0], aptitude: 40 + Math.floor(Math.random() * 61) });
  }
  if (Math.random() < 0.1) { roots[Math.floor(Math.random() * roots.length)] = { element: LG_ELEMENTS.slice(5)[Math.floor(Math.random() * 5)][0], aptitude: roots[0].aptitude }; }
  S.save.player.linggen = { roots, gradeName: '', growthMult: 0 };
  $('f_lgGrowth').dataset.auto = '1';
  lgRender(); lgPreview();
}
/* ---------- 道侣 / 师承 / 陪行灵兽 ---------- */
function renderBond() {
  const p = S.save.player;
  const growthInput = $('f_lgGrowth');
  if (growthInput && !growthInput.dataset.bound) {
    growthInput.dataset.bound = '1';
    growthInput.addEventListener('input', lgGrowthClamp);
  }
  fillSelect($('f_daolu'), [['', '（尚未遇见）'], ...DAOLU.map(([id, name]) => [id, name])], p.bond?.daoluId ?? '');
  fillSelect($('f_bondStage'), STAGES, p.bond?.stage ?? 'none');
  fillSelect($('f_beast'), [['', '（无）'], ...PETS.slice(1)], p.companionBeastId ?? '');
  fillSelect($('f_mentor'), MENTORS, p.mentor ?? '');
  $('f_bondShared').value = num(p.bond?.shared ?? 0);
  $('f_bondFate').value = Math.round(num(p.bond?.fate ?? 0));
  $('f_bondTrust').value = Math.round(num(p.bond?.trust ?? 0));
  $('f_bondAccord').value = Math.round(num(p.bond?.accord ?? 0));
}
function collectBond() {
  const p = S.save.player;
  const daoluId = $('f_daolu').value || null;
  p.mentor = $('f_mentor').value || null;
  p.companionBeastId = $('f_beast').value || null;
  if (!daoluId) { p.bond = null; return; }
  const stage = $('f_bondStage').value;
  const [gFate, gTrust, gAccord, gShared] = STAGE_GATES[stage] ?? [0, 0, 0, 0];
  const clamp = v => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  /* 阶段门槛保护：三项数值与共历次数不得低于所选阶段的门槛 */
  const fate = Math.max(clamp($('f_bondFate').value), gFate);
  const trust = Math.max(clamp($('f_bondTrust').value), gTrust);
  const accord = Math.max(clamp($('f_bondAccord').value), gAccord);
  const shared = Math.min(999, Math.max(Math.max(0, Math.floor(Number($('f_bondShared').value) || 0)), gShared));
  const existing = p.bond?.daoluId === daoluId ? p.bond : {};
  const def = DAOLU.find(([id]) => id === daoluId);
  const playerMajor = num(p.major);
  if (def && playerMajor < def[2]) toast(`提示：${def[1].split(' ')[0]} 通常在${REALMS[def[2]]}之后才会出现，现在写入一般仍可正常相处`);
  p.bond = {
    ...existing,
    daoluId,
    stage,
    fate, trust, accord, shared,
    metAt: existing.metAt ?? Date.now(),
    fallen: existing.fallen ?? false,
    doneEvents: existing.doneEvents ?? [],
    pendingEventId: existing.pendingEventId ?? null,
    opportunities: Math.max(num(existing.opportunities ?? 0), 0),
    nextEventAt: existing.nextEventAt ?? 6,
    departed: false,
    intent: existing.intent ?? null,
    intentPending: existing.intentPending ?? false
  };
}


const PETS = [
  ['', '（无）'], ['pet_qingyu', '青羽灵狐'], ['pet_xuegui', '雪背小龟'], ['pet_huoque', '赤火雀'],
  ['pet_yueying', '月影狸'], ['pet_jinchan', '三足金蟾'], ['pet_yaoguang', '摇光鹿'],
  ['pet_leihou', '御雷猴'], ['pet_longzi', '螭龙幼子']
];
const GONGFA = [
  ['m_taixuan', '太玄引气诀', 'main', 0], ['m_qingmu', '青木长生功', 'main', 0],
  ['m_lihuo', '离火焚天诀', 'main', 0], ['m_xuanshui', '玄水凝真经', 'main', 0],
  ['m_gengjin', '庚金剑典', 'main', 1], ['m_houtu', '厚土不动明王功', 'main', 1],
  ['m_zixiao', '紫霄神雷诀', 'main', 2], ['m_gangfeng', '罡风渡虚法', 'main', 2],
  ['m_xuanbing', '玄冰道典', 'main', 3], ['m_guangming', '大光明普照经', 'main', 4],
  ['m_youming', '幽冥噬魂录', 'main', 4], ['m_hundun', '混沌一气功', 'main', 6],
  ['s_tuna', '龟灵吐纳术', 'sub', 0], ['s_lianti', '百炼锻体术', 'sub', 0],
  ['s_yufeng', '御风步', 'sub', 0], ['s_lianxi', '敛息诀', 'sub', 1],
  ['s_juling', '聚灵阵法初解', 'sub', 1], ['s_mingxin', '明心见性篇', 'sub', 1],
  ['s_tiegu', '铁骨铮铮功', 'sub', 2], ['s_lingxi', '灵犀一指', 'sub', 2],
  ['s_dianshi', '点石成金术', 'sub', 3], ['s_guixi', '龟息养寿功', 'sub', 3],
  ['s_zhoutian', '周天星辰图', 'sub', 5], ['s_wanjian', '万剑归宗图', 'sub', 5],
  ['s_budong', '不动如山章', 'sub', 1],
  ['x_tianyan', '天眼通', 'secret', 2], ['x_jingang', '金刚不坏身', 'secret', 3],
  ['x_jianxin', '剑心通明', 'secret', 3], ['x_xiangsi', '向死而生诀', 'secret', 2],
  ['x_fanzhen', '天罡反震诀', 'secret', 3], ['x_sanqing', '一气化三清', 'secret', 5],
  ['x_woxuan', '斡旋造化', 'secret', 6], ['x_nitian', '逆天改命经', 'secret', 7]
];
const ACH_IDS = ['a_r0','a_r1','a_r2','a_r3','a_r4','a_r5','a_r6','a_r7','a_r8','a_r9',
  'a_bt10','a_bt30','a_bt60','a_btf5','a_trib3','a_k50','a_k300','a_k1000','a_k5000',
  'a_boss10','a_boss20','a_eq10','a_eq100','a_eq500','a_q4','a_q6','a_q7','a_q8',
  'a_up30','a_up100','a_dec50','a_ex10','a_ex50','a_ev20','a_ev100','a_pill20','a_pill100',
  'a_craft30','a_craft100','a_gf5','a_gf15','a_bd10','a_bd40','a_re1','a_re3',
  'a_off5','a_off30','a_lifelow','a_lifespan','a_rich'];
const QUALITIES = [
  ['mortal', '凡品', '#857F70'], ['fine', '良品', '#6E8B74'], ['excellent', '精品', '#4F7699'],
  ['spirit', '灵品', '#7B5EA7'], ['profound', '玄品', '#A85C3F'], ['earth', '地品', '#B07D2B'],
  ['heaven', '天品', '#C9A227'], ['immortal', '仙品', '#3E8E8B'], ['divine', '神品', '#A83F39']
];
/* 游戏内各项硬上限（与游戏 constants.ts 同步） */
const VEIN_TOTAL_CAPACITY = 100;   // 灵脉总点数
const VEIN_MAIN_CAPACITY = 70;     // 主灵脉单条上限
const VEIN_SIDE_CAP = 30;          // 副灵脉单条上限
const EQUIP_MAX_LEVEL_BASE = 10;   // 装备强化基础上限
const FORGE_LEVEL_PER_CAP = 2;     // 炼器台每 2 级提高强化上限 1
const ARTIFACT_MAX_LEVEL = 9;      // 法宝等级上限
const SLOT_NAMES = { weapon: '武器', head: '头冠', body: '护甲', wrist: '护腕', belt: '腰带', boots: '履靴', necklace: '项饰', ring: '戒指', talisman: '符箓' };
const EQUIP_TPL = {
  w_zhuqing: ['青竹剑', 'weapon'], w_xuantie: ['玄铁重剑', 'weapon'], w_hanfeng: ['寒锋剑', 'weapon'], w_chiyan: ['赤焰刀', 'weapon'], w_zidian: ['紫电长枪', 'weapon'], w_zhuxian: ['诛仙剑胚', 'weapon'], w_shishen: ['弑神戟', 'weapon'], w_hongmeng: ['鸿蒙剑', 'weapon'],
  h_muzan: ['桃木簪', 'head'], h_xuantie: ['玄铁冠', 'head'], h_xingchen: ['星辰冠', 'head'], h_zijin: ['紫金冠', 'head'], h_jiuxiao: ['九霄冠', 'head'],
  b_mabu: ['麻布道袍', 'body'], b_qingyun: ['青云道袍', 'body'], b_xuanwu: ['玄武甲', 'body'], b_liuyun: ['流云仙衣', 'body'], b_xingluo: ['星罗法衣', 'body'], b_hundun: ['混沌天衣', 'body'],
  wr_tengwen: ['藤纹护腕', 'wrist'], wr_tiebi: ['铁臂缚', 'wrist'], wr_longlin: ['龙鳞腕甲', 'wrist'], wr_xianjin: ['仙金护臂', 'wrist'],
  bl_cubu: ['粗布腰带', 'belt'], bl_shoupi: ['兽皮腰带', 'belt'], bl_mangwen: ['蟒纹玉带', 'belt'], bl_qiankun: ['乾坤绦', 'belt'],
  bo_caoxie: ['芒鞋', 'boots'], bo_kuaixue: ['快靴', 'boots'], bo_tayun: ['踏云靴', 'boots'], bo_zhuixing: ['追星履', 'boots'], bo_xukong: ['虚空步靴', 'boots'],
  n_muzhu: ['木珠串', 'necklace'], n_lingyu: ['灵玉坠', 'necklace'], n_xingsui: ['星髓链', 'necklace'], n_longhun: ['龙魂坠', 'necklace'], n_hunyuan: ['混元珠链', 'necklace'],
  r_tongjie: ['铜戒', 'ring'], r_xuanguang: ['玄光戒', 'ring'], r_juling: ['聚灵戒', 'ring'], r_zixia: ['紫霞戒', 'ring'], r_qianji: ['千机戒', 'ring'], r_daozu: ['道祖戒', 'ring'],
  tl_pingan: ['平安符', 'talisman'], tl_juqi: ['聚气符', 'talisman'], tl_hushen: ['护身符', 'talisman'], tl_wulei: ['五雷符', 'talisman'], tl_jinguang: ['金光符', 'talisman'], tl_taiyi: ['太乙符', 'talisman'], tl_dadao: ['大道符', 'talisman']
};
const BUILDINGS = [
  ['mansion', '洞府', 4], ['array', '聚灵阵', 20], ['alchemy', '炼丹炉', 10],
  ['forge', '炼器台', 10], ['field', '灵田', 15], ['library', '藏经阁', 12], ['beast', '灵兽园', 8]
];
const VEINS = [['gather', '青木灵脉'], ['craft', '赤炎灵脉'], ['alchemy', '玉髓灵脉'], ['insight', '寒冥灵脉']];
const FRACS = [['herb', '灵田进度'], ['ore', '矿脉进度'], ['wudao', '藏经阁进度']];
const ARTIFACTS = [
  ['af_muyu', '墨玉葫芦', 1], ['af_lihuo', '离火珠', 2], ['af_xuantian', '玄天镜', 3], ['af_fuyao', '缚妖索', 4],
  ['af_leiyin', '雷音锤', 5], ['af_yujing', '玉净瓶', 6], ['af_bagua', '八卦炉', 7], ['af_dinghai', '定海珠', 8],
  ['af_youming', '幽冥幡', 9], ['af_qianji', '千机伞', 10], ['af_zhenyue', '镇岳印', 11], ['af_shehun', '摄魂铃', 12],
  ['af_xingpan', '周天星盘', 13], ['af_chixiao', '赤霄鼎', 14], ['af_bishui', '碧水珠', 15], ['af_shiling', '噬灵幡', 16],
  ['af_taixu', '太虚镜', 17], ['af_zhanxian', '斩仙飞刀', 18], ['af_hundun', '混沌钟', 19], ['af_zaohua', '造化玉碟', 20]
];
const PILLS = [
  ['p_jvqisan', '聚气散'], ['p_jvqidan', '聚气丹'], ['p_huichun', '回灵丹'], ['p_wudaocha', '悟道茶'],
  ['p_ningshen', '凝神丹'], ['p_juling', '聚灵丹'], ['p_zhanling', '战灵丹'], ['p_huxin', '护心丹'],
  ['p_shenxing', '神行丹'], ['p_pojing', '破境丹'], ['p_xuanyuan', '玄元丹'], ['p_jingang', '金刚液'],
  ['p_tianyun', '天运丹'], ['p_xuanming', '玄冥护体丹'], ['p_yanshou', '延寿丹'], ['p_lingru', '灵乳'],
  ['p_dahuan', '大还丹'], ['p_wudaodan', '悟道丹'], ['p_qianshou', '千年延寿丹'], ['p_taixu', '太虚丹'],
  ['p_wanshou', '万寿金丹'], ['p_jiuzhuan', '九转还魂丹'], ['p_gangqisan', '罡气散'], ['p_pofudan', '破釜丹'],
  ['p_yaoxue', '妖血丹'], ['p_leiling', '雷灵丹'], ['p_fengsui', '凤髓膏'], ['p_longqi', '龙气丹'],
  ['p_xianchen', '仙尘散'], ['p_pantao', '蟠桃'], ['p_zaohua', '造化丹'], ['p_hundun', '混沌丹']
];

