# 《云隐修仙录》Wiki

面向玩家的本地 Wiki 站点 + 存档修改器，无需服务器，浏览器直接打开 `index.html` 即可。
数据提取自游戏 v1.33.0（作者 谦君 / setube，CC BY-NC 4.0），若与最新版有出入以游戏内实装为准。

## 目录结构

```
wiki/
├── index.html … tools.html   构建产物：10 个 Wiki 页面（入口 index.html）
├── assets/                   站点静态资源
│   ├── css/base.css          主题变量、排版、布局骨架、动效、响应式
│   ├── css/components.css    页头/目录/表格/提示/卡片/页脚等复用组件
│   └── js/site.js            侧栏高亮、移动端抽屉、滚动入场动效、回顶
├── site/                     站点源码（改这里，不要直接改根目录 *.html）
│   ├── templates/            head.html / foot.html（__TITLE__、__PN__ 占位符）
│   ├── pages/                每页正文片段（p-*.html 内容在 site/pages/<name>.html）
│   └── build.py              构建脚本：模板 + 片段 → 根目录 *.html
├── tools/
│   ├── save-editor.html      存档修改器入口
│   └── editor/               修改器源码（crypto/gnum/gamedata/common/form/writeback，
│                              详见 tools/editor/README.md）
└── README.md
```

## 构建与修改

```bash
python site/build.py          # 全量构建 10 页到根目录
python site/build.py realms   # 只构建某一页
```

- **改内容** → 编辑 `site/pages/<页面名>.html`，重新构建；
- **改导航/标题/页脚链接** → 编辑 `site/build.py` 顶部的 `NAV` 注册表；
- **改样式** → 全局/布局在 `assets/css/base.css`，组件在 `assets/css/components.css`；
- **改修改器** → `tools/editor/` 下各模块（说明见该目录 README）。

## 页面一览

| 页面 | 内容 |
| --- | --- |
| index | 游戏概览、快速上手、界面说明、工具与存档入口 |
| realms | 十境九十层、修为公式、天时、突破与天劫、灵根、天赋 |
| gongfa | 33 部功法、77 条悟道分支、六大流派、组合技 |
| equipment | 装备槽位与品质、词条库、套装、法宝、锻造规则 |
| items | 丹药配方、九门技艺、灵材、掉落与资源闭环 |
| adventure | 历练模式、20 区域、敌人、事件、秘境、掉落率速查、战斗系统 |
| life | 洞府建筑、灵脉、灵兽、道侣、师承、称号成就任务 |
| endgame | 转世轮回、本世之界、机缘、真仙终局 |
| reference | 数值公式速查、离线与存档、设计理念、常见疑问 |
| tools | 存档修改器的风险说明、备份指引与入口 |

## 许可与致谢

- 游戏及素材版权归 [谦君（setube）](https://github.com/setube/yunyin-xiuxian) 所有，采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans) 许可；
- 在线试玩：[yunyin.wenzi.games](https://yunyin.wenzi.games)。
