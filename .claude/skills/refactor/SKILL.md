---
name: refactor
description: Guides safe React/TypeScript refactors—splitting components, hooks, utils, and context; reducing nesting and file size. Use when refactoring pages, extracting logic, reorganizing modules, or when the user asks for cleaner structure without changing behavior.
---

# 重构与模块划分（React）

在用户要求重构、拆分页面、抽离逻辑或整理目录时遵循本技能。**默认不改变业务行为**；若用户明确要求改功能再动行为。优先小步、可审查的改动。

## 原则

- 单文件单一职责；命名与职责一致。
- 出现重复、或页面文件过长（建议约 300 行以上）、难以扫读时再抽取。
- 移动/抽取后修正 import，并跑类型检查与 lint。

## 组件（Component）

**定义：** 返回 JSX 的 React 函数（或类），通过 `props` 接收数据与回调。

**典型特征：** 布局、列表、表单、弹窗、按钮区等。关注「长什么样、用户点什么」；完整数据编排放在 Hook。

**路径：**

- 页面入口：`src/pages/<页面>/index.tsx`
- 页面私有：`src/pages/<页面>/components/`
- 多页复用：`src/components/`（按项目约定）

**简单判断：** 主要产出是 JSX → 组件；主要是状态与副作用、JSX 很少 → Hook。

## Hooks

**定义：** 以 `use` 开头、内部可调用 React Hooks，封装可复用的状态与副作用。

**典型职责：** 请求列表/详情、分页、筛选、与 URL/表单同步、定时器、与外部 store 同步等。

**路径：**

- 页面内：`src/pages/<页面>/hooks/useXxx.ts`
- 跨页：`src/hooks/useXxx.ts`

**从组件抽出：** 多组件重复同一段逻辑；或与接口、缓存、分页强绑定而非与 DOM 强绑定。

**命名：** `use` + 领域名，例如 `useMaterialStoreListQuery`。

## Util（工具函数）

**定义：** 与 React 无关（不调用 Hooks、不返回 JSX）的纯函数或小模块；副作用须在函数名中体现。

**典型内容：** 格式化、DTO→展示结构、简单校验、纯计算的权限布尔等。

**路径：**

- 页面内：`src/pages/<页面>/utils/`
- 全局：`src/utils/`

**不要放：** 含 `useState` / `useEffect` → Hook；与组件生命周期强绑定的 API 调用 → Hook 或 service，由 Hook 调用。

**简单判断：** 可在 Node 中单测、不挂 React，语义是「算出一个值」→ util。

## Context

**定义：** `createContext` + `Provider` + `useContext`（可封装为 `useXxxContext`）。

**适合：** 多层级子组件都要读写的页面级/功能级状态，避免 props 钻五六层。

**慎用：** 仅父子两层可 props 解决；或高频变更且树很大导致大范围重渲染（可拆 Context、配合 `useMemo` 或按规范用全局状态库）。

**路径：**

- 与页面绑定：`src/pages/<页面>/context.ts(x)`
- 全应用：`src/contexts/`

## 其他常见模块

| 类型 | 职责 | 常见路径 |
|------|------|----------|
| types | TS 类型、接口、枚举 | `types.ts` 或 `types/` |
| constants | 魔法数字、固定选项、路由名 | `constants.ts` |
| services / api | 封装 fetch/axios，与 UI 无关 | `services/`，由 Hook 调用 |
| 样式 | 页面/组件样式 | 按项目约定（Tailwind / CSS Module 等） |

## 推荐拆分顺序

1. 先定类型与常量（`types`、`constants`），减少来回改。
2. 接口与数据流进 Hook（如 `useXxxQuery`），组件只拿「数据 + loading + 方法」。
3. UI 拆成组件，props 尽量「傻」：展示什么、事件往上抛。
4. 多组件共享且不想钻 props 时，再引入 Context。

## 易混淆时怎么选

| 场景 | 优先 |
|------|------|
| 「算一个值」且与组件无关 | `utils` |
| 「要请求、要跟生命周期走」 | `hooks`（内部可调 `api`） |
| 「一整块界面 + 交互」 | `components` |
| 「很多子组件读写同一份状态」 | `context`（配合 `useXxxContext`） |

## 收尾检查

- [ ] 无用户未要求的业务行为变化。
- [ ] import 与 barrel 已更新。
- [ ] 无新增循环依赖。
- [ ] 类型仍与接口/DTO 一致。
