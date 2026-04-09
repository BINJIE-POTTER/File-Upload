---
name: page-structure
description: Enforces React page entry layout and folder roles—thin index.tsx, hooks for data/API, components for UI, no deep JSX nesting. Use when creating or editing pages under src/pages, scaffolding features, or when the user asks for page organization, shell vs logic split, or directory layout.
---

# React 页面结构与职责规范

在用户新建/改造 `src/pages/**` 下的页面时遵循本规范。目标是：**页面入口薄、数据与 UI 分层、可维护**。

## 页面入口（`src/pages/**/index.tsx`）

| 要求 | 说明 |
|------|------|
| 只做装配 | 调用 hooks、组合子组件、传 props、定义页面级布局；不写复杂业务逻辑。 |
| 禁止接口细节 | 不出现请求参数拼接、响应转换等实现；必须放在 `hooks` 或 `services`。 |
| JSX 条件嵌套 | 禁止超过 **2 层**；复杂条件提取为命名函数或子组件。 |
| `useState` 数量 | 超过 **8 个** 时，必须抽成 `useXxxState` 或 `useXxxModal` 等。 |
| 文件长度 | 建议 **≤ 300 行**；超过必须拆到独立模块文件。 |
| 禁止巨型模板 | 禁止把历史大页面整段复制到新页面后只改字段名。 |
| 与历史冲突 | 须先按本规范拆分再实现需求；不允许「先复用后优化」。 |
| AI 复用 | 可复用业务逻辑，**禁止**复用旧的反模式页面结构。 |

## 目录约定

| 目录 | 职责 |
|------|------|
| `hooks/` | 状态、流程、交互编排；可依赖 `services`。 |
| `components/` | 展示组件与轻容器组件。 |
| `types/` | 本模块领域类型与 DTO 类型。 |
| `utils/` | 纯函数：无副作用、不依赖 React 状态。 |
| `constants/` | 状态映射、枚举文案、列宽等常量。 |

## 与「重构」技能的关系

- **page-structure**：规定**页面入口怎么写**、**目录放什么**。
- **refactor**：规定**何时拆、拆成组件/Hook/Util/Context 哪一类**。

二者同时适用时，先满足页面入口与目录约定，再按重构技能做抽取。

## 快速自检（页面改完前）

- [ ] `index.tsx` 无裸 `fetch`/axios 参数拼装与响应转换。
- [ ] 条件渲染未超过两层嵌套，或已提取函数/组件。
- [ ] `useState` 未超过 8 个未拆分。
- [ ] 单文件未无故超过 300 行。
