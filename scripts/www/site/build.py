#!/usr/bin/env python3
"""《云隐修仙录》Wiki 站点构建脚本。

用法（在 wiki 根目录执行）:
    python site/build.py            # 全量构建
    python site/build.py realms     # 只构建指定页

结构:
    site/templates/  head.html / foot.html（__TITLE__ / __PN__ 占位符）
    site/pages/      每页正文片段（不含 <html> 骨架）
    assets/          css / js 静态资源
    输出到仓库根目录的 *.html
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "site" / "templates"
PAGES = ROOT / "site" / "pages"

# (文件名, 标题, 副标题, 页脚上一页/下一页链接)
NAV = [
    ("index",      "云隐修仙录 · Wiki", "",                                  "next:realms"),
    ("realms",     "境界与修炼",        "十境九十层 · 修为灵气 · 突破天劫 · 灵根定命",  "index|gongfa"),
    ("gongfa",     "功法与流派",        "33 部功法 · 77 条悟道分支 · 六大流派 · 组合技", "realms|equipment"),
    ("equipment",  "装备与锻造",        "10 槽位 · 50 模板 · 110 词条 · 9 品质 · 法宝与套装", "gongfa|items"),
    ("items",      "丹药与经济",        "32 种丹药 · 九门技艺 · 灵材谱 · 掉落与资源闭环",  "equipment|adventure"),
    ("adventure",  "历练与战斗",        "20 区域 · 60 敌人 · 51 事件 · 回合制预解算战斗",  "items|life"),
    ("life",       "洞府与社交",        "7 建筑 · 4 灵脉 · 8 灵兽 · 道侣羁绊 · 师承 · 成就任务", "adventure|endgame"),
    ("endgame",    "轮回与终局",        "转世兵解 · 本世之界 · 机缘回响 · 真仙天界规则宇宙", "life|reference"),
    ("reference",  "公式与机制",        "数值公式速查 · 离线存档 · 设计理念 · 常见疑问",   "endgame|tools"),
    ("tools",      "存档工具",          "本地存档修改器 · 使用须知 · 备份指引",        "reference"),
]
LABEL = {name: title for name, title, _, _ in NAV}

def prev_next(spec: str) -> str:
    """'index|gongfa' / 'next:realms' / 'prev:index' → 页脚链接 HTML"""
    links = []
    if spec.startswith("next:"):
        links.append(f'<a href="{spec[5:]}.html">{LABEL[spec[5:]]} →</a>')
    elif spec.startswith("prev:"):
        links.append(f'<a href="{spec[5:]}.html">← {LABEL[spec[5:]]}</a>')
    else:
        prev, _, nxt = spec.partition("|")
        if prev:
            links.append(f'<a href="{prev}.html">← {LABEL[prev]}</a>')
        if nxt:
            links.append(f'<a href="{nxt}.html">{LABEL[nxt]} →</a>')
    return "".join(links)

def build(name: str, title: str, sub: str, pn: str) -> None:
    head = (TEMPLATES / "head.html").read_text(encoding="utf-8").replace("__TITLE__", title)
    body = (PAGES / f"{name}.html").read_text(encoding="utf-8")
    foot = (TEMPLATES / "foot.html").read_text(encoding="utf-8")
    foot = foot.replace("__SUB__", sub).replace("__PN__", prev_next(pn))
    out = ROOT / f"{name}.html"
    out.write_text(head + body + foot, encoding="utf-8")
    print(f"built {out.name} ({out.stat().st_size:,} bytes)")

def main() -> None:
    only = set(sys.argv[1:])
    for name, title, sub, pn in NAV:
        if not only or name in only:
            build(name, title, sub, pn)

if __name__ == "__main__":
    main()
