---
name: node-backend
description: Enforces Node.js/Express backend structure and coding standards—layered architecture, consistent error handling, typed middleware, clean routing. Use when creating or editing files under backend/, scaffolding API features, writing Express routes, or when the user asks for backend organization, API design, or server-side code quality.
---

# Node.js Backend 结构与编码规范

在用户新建/改造 `backend/` 下的服务端代码时遵循本规范。目标是：**入口薄、分层清晰、错误统一、可维护**。

## 技术栈

- Runtime: Node.js (ESM, `"type": "module"`)
- Framework: Express
- File uploads: multer
- Environment: dotenv

## 目录约定

```
backend/
├── server.js              # 入口：只做 app 装配与启动
├── routes/                # 路由注册，不含业务逻辑
│   └── upload.js
├── controllers/           # 请求/响应处理：参数校验、调用 service、返回结果
│   └── uploadController.js
├── services/              # 核心业务逻辑：纯函数或有副作用的业务操作
│   └── uploadService.js
├── middleware/            # Express 中间件：错误处理、鉴权、日志等
│   └── errorHandler.js
├── utils/                 # 纯工具函数：无业务语义
│   └── response.js
├── config/                # 配置常量：端口、路径、限制值
│   └── index.js
└── uploads/               # 运行时生成的文件目录（.gitignore）
```

## 分层职责

| 层 | 职责 | 禁止 |
|----|------|------|
| **server.js** | 挂载 middleware、注册 routes、启动监听 | 不写路由处理函数、不写业务逻辑 |
| **routes/** | 定义路径 + HTTP 方法，绑定 controller | 不校验参数、不调用 service |
| **controllers/** | 读取 `req` 参数、调用 service、用统一响应格式返回 | 不直接操作文件系统/数据库 |
| **services/** | 实现业务：文件读写、哈希计算、数据聚合等 | 不引用 `req`/`res` |
| **middleware/** | 横切关注点：错误捕获、日志、鉴权 | 不含特定路由逻辑 |
| **utils/** | 纯函数：响应封装、路径拼接、格式化 | 不含业务语义 |

## 统一响应格式

所有 API 返回统一 JSON 结构：

```js
// utils/response.js
export const success = (res, data, message = "ok") =>
  res.json({ code: 0, message, data });

export const fail = (res, status, message, code = status) =>
  res.status(status).json({ code, message, data: null });
```

## 错误处理

### AppError 自定义错误

```js
// utils/AppError.js
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
```

### 全局错误中间件

```js
// middleware/errorHandler.js — 必须注册为最后一个 middleware
export const errorHandler = (err, _req, res, _next) => {
  const status = err.status ?? 500;
  const message = err.message ?? "Internal Server Error";
  if (status === 500) console.error(err);
  res.status(status).json({ code: status, message, data: null });
};
```

### Controller 中抛错

```js
if (!uploadId) throw new AppError(400, "uploadId is required");
```

### 异步路由包装

Express 不会自动捕获 async 错误，用包装函数处理：

```js
// utils/asyncHandler.js
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

路由中使用：

```js
router.post("/check", asyncHandler(uploadController.check));
```

## 编码规范

| 规则 | 说明 |
|------|------|
| ESM | 使用 `import/export`，不用 `require`。 |
| 命名 | 文件 camelCase；常量 UPPER_SNAKE；函数 camelCase + 动词前缀（`getXxx`、`handleXxx`）。 |
| 早返回 | 校验失败立即 `throw` 或 `return`，减少嵌套。 |
| 无 magic number | 大小限制、并发数等放 `config/`。 |
| 幂等 | 同一请求重复调用不产生副作用（分片重传、合并重试）。 |
| 日志 | 错误用 `console.error`；关键流程用 `console.log`；不打印敏感信息。 |
| 环境变量 | 通过 `dotenv` 加载，集中在 `config/` 读取并导出，其他文件不直接读 `process.env`。 |

## Router 写法

```js
// routes/upload.js
import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as uploadController from "../controllers/uploadController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/check", asyncHandler(uploadController.check));
router.post("/chunk", upload.single("chunkData"), asyncHandler(uploadController.uploadChunk));
router.post("/merge", asyncHandler(uploadController.merge));
router.post("/terminate", asyncHandler(uploadController.terminate));

export default router;
```

## Controller 写法

```js
// controllers/uploadController.js
import { AppError } from "../utils/AppError.js";
import * as uploadService from "../services/uploadService.js";
import { success } from "../utils/response.js";

export const check = async (req, res) => {
  const { md5, filename, fileSize, chunkSize, totalChunks } = req.body;
  if (!md5 || !filename) throw new AppError(400, "md5 and filename are required");
  const result = await uploadService.checkFile(md5, filename, fileSize, chunkSize, totalChunks);
  success(res, result);
};
```

## Server 入口

```js
// server.js
import express from "express";
import cors from "cors";
import uploadRouter from "./routes/upload.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/api/upload", uploadRouter);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on :${PORT}`));
```

## 快速自检

- [ ] `server.js` 无路由处理函数，只做装配。
- [ ] Controller 不直接操作文件系统/数据库，通过 service 调用。
- [ ] Service 不引用 `req`/`res`。
- [ ] 所有 async 路由使用 `asyncHandler` 包装。
- [ ] 全局 `errorHandler` 注册为最后一个 middleware。
- [ ] 响应格式统一使用 `success()`/`fail()`。
- [ ] 无 magic number，配置集中在 `config/`。
- [ ] 单文件不超过 200 行。
