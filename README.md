# 枸益补 · 道地本草商城（mall-web）

基于 React + TypeScript + Vite 构建的商城 Web 端（同源小程序商城）。前端通过 `/api` 代理访问后端服务，提供商品展示、分类浏览、商品详情与搜索等能力。

## 技术栈

- [React](https://react.dev/) 18 + [React Router](https://reactrouter.com/) 6
- [TypeScript](https://www.typescriptlang.org/) 5
- [Vite](https://vitejs.dev/) 6

## 目录结构

```
mall-web/
├── index.html              # 入口 HTML
├── vite.config.ts          # Vite 配置（含 /api 代理）
├── package.json
├── tsconfig.json
└── src/
    ├── main.tsx            # 应用入口 & 路由配置
    ├── App.tsx             # 布局（顶栏、导航、轮播、页脚）
    ├── api.ts              # 统一 API 请求层 & 类型定义
    ├── App.css / index.css # 全局样式
    └── pages/
        ├── Home.tsx        # 首页
        ├── ProductList.tsx # 商品列表 / 分类
        ├── ProductDetail.tsx # 商品详情
        └── SearchResult.tsx  # 搜索结果
```

## 快速开始

### 环境要求

- Node.js 18+
- 包管理器：npm（或其他兼容工具）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认运行在 `http://localhost:5173`。

> 后端接口默认通过 Vite 代理转发到 `http://localhost:3000`（见 `vite.config.ts`），请确保后端服务已启动。

### 生产构建

```bash
npm run build
```

### 预览构建产物

```bash
npm run preview
```

## 路由

| 路径 | 说明 |
| --- | --- |
| `/` | 首页 |
| `/products` | 全部商品 / 分类列表（支持 `?cat=` 参数） |
| `/products/:id` | 商品详情 |
| `/search?q=关键词` | 搜索结果 |

## 接口约定

所有请求统一以 `/api` 为前缀，通过 `src/api.ts` 封装。响应格式约定为：

```json
{ "success": true, "data": { ... } }
```

提供的接口包括：

- `GET /api/banners` — 轮播图
- `GET /api/categories` — 商品分类
- `GET /api/products` — 全部商品
- `GET /api/products/:id` — 商品详情
- `GET /api/products/category/:categoryId` — 按分类获取商品
- `GET /api/products/popular` — 热销商品
- `GET /api/products/grouped` — 按分类分组商品
- `GET /api/products/search?q=` — 商品搜索

## 脚本说明

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 本地预览生产构建 |
