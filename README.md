# 枸益补 · 道地本草商城（mall-web）v1.0.0

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

## 部署

### 生产环境

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| 商城前台 | 8898 | Nginx 托管静态文件，`/api/` 反代到后端 |
| 管理后台 | 8899 | 已有（mall-manage） |
| 后端 API | 3000 | 已有（mall-server，PM2 托管） |

### 快速部署

```bash
bash deploy.sh
```

部署脚本（`deploy.sh`）会依次执行：`git pull` → `npm install --production` → `npm run build` → 复制 `dist/` 到 Nginx 目录 → 重载 Nginx → 自动验证。

### 从零部署（服务器环境）

> 服务器：腾讯云海外 VPS · OpenCloudOS 9.4 · 宝塔面板 + Nginx
>
> 前提：Node.js 20+、npm、Nginx 已安装（`curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && dnf install -y nodejs`）

**1. 克隆仓库并构建**

```bash
cd /home/app/your-projects/mall
git clone git@github.com:yoy-aww/mall-web.git
cd mall-web
npm install
npm run build
```

**2. 复制构建产物到 Nginx 目录**

```bash
mkdir -p /var/www/mall-web
cp -r dist/* /var/www/mall-web/
```

**3. 添加 Nginx 反向代理配置**

创建 `/www/server/panel/vhost/nginx/mall-web.conf`（宝塔面板）或 `/etc/nginx/conf.d/mall-web.conf`：

```nginx
server {
    listen 8898;
    server_name 43.153.148.187;

    root /var/www/mall-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> `try_files $uri $uri/ /index.html` 是 SPA 路由必备，否则刷新详情页会 404。
> `/api/` 反代到后端的 3000 端口，与 mall-manage 共用同一后端。

**4. 放行端口**

```bash
echo "8898" >> /www/server/panel/data/port.pl   # 宝塔端口白名单
# 同时确认腾讯云安全组已放行 TCP 8898
```

**5. 重载 Nginx**

```bash
/etc/init.d/nginx reload
# 验证
curl http://127.0.0.1:8898/      # 应返回商城首页 HTML
curl http://127.0.0.1:8898/api/health  # 应返回 {"status":"ok"}
```

### SSL（推荐）

当前为纯 HTTP。商城面向真实用户时建议：
- 申请域名并将 DNS A 记录指向服务器 IP
- 通过宝塔面板「SSL」一键申请 Let's Encrypt 证书
- 修改 Nginx 配置将 8898 改为 443 并启用 `ssl_certificate` / `ssl_certificate_key`

### 日常更新

```bash
cd /home/app/your-projects/mall/mall-web
bash deploy.sh
```

单次提交推送后，执行以上命令即可自动拉取、构建、重载。
