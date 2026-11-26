# 存档修改器（tools/save-editor.html）

本目录是修改器的完整源码，已按职责拆分为独立文件。

## 文件结构

```
tools/
├── save-editor.html    页面入口（纯 HTML 骨架，按序加载下列模块）
└── editor/
    ├── editor.css      修改器自有样式（水墨风，与 wiki 站点样式独立）
    ├── crypto.js       AES-CBC 加解密（与游戏 crypto-js 口令模式逐字节兼容）
    ├── gnum.js         GNum 大数 {m, e} = m×10^e 的解析 / 格式化
    ├── gamedata.js     静态数据表（称号/境界/功法/丹药/法宝/道侣/师承/灵根元素）
    │                   以及灵根品名、修炼速度倍率的公式（与游戏 linggenGen 同步）
    ├── common.js       状态容器 S、$ 助手、toast、页签切换
    ├── form.js         载入存档 → 渲染各页签 → 收集表单（含灵根/道侣/师承编辑，
    │                   写回时做阶段门槛与数值范围保护）
    └── writeback.js    重新加密分片、下载 .save、生成注入脚本、原始档留底
```

## 加载顺序（save-editor.html 中固定）

crypto → gnum → gamedata → common → form → writeback
（后加载的模块依赖先加载的常量与函数；均为顶层声明，无打包需求）

## 与游戏版本的同步点

升级游戏版本后需要核对 `gamedata.js`：
- 静态数据表与 `src/data/*.ts` 一一对应；
- 灵根倍率公式对应 `src/core/linggenGen.ts`；
- 道侣关系阶段门槛对应 `src/data/daolu.ts` 的 STAGE_GATES；
- 法宝佩戴上限对应 `src/views/InventoryView.vue` 的 artifactSlots（元婴起 2 件）。
