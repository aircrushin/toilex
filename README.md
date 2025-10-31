# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

**注意**: Docker 部署会自动同时运行 React Router 应用和 Socket.IO 服务器。

#### 构建和运行

```bash
# 构建镜像
docker build -t powpdr .

# 运行容器（需要映射两个端口）
docker run -p 3000:3000 -p 3001:3001 \
  -e PORT=3000 \
  -e SOCKET_PORT=3001 \
  -e VITE_SOCKET_URL=http://localhost:3001 \
  -e OPENAI_API_KEY=your-api-key \
  powpdr
```

#### 使用 docker-compose（推荐）

```bash
# 复制示例文件并修改环境变量
cp docker-compose.example.yml docker-compose.yml
# 编辑 docker-compose.yml，设置你的 OPENAI_API_KEY

# 启动服务
docker-compose up -d
```

#### 环境变量说明

- `PORT` - React Router 应用端口（默认: 3000）
- `SOCKET_PORT` - Socket.IO 服务器端口（默认: PORT + 1，即 3001）
- `VITE_SOCKET_URL` - Socket.IO 服务器 URL（前端连接使用）
- `OPENAI_API_KEY` - OpenAI API 密钥（用于 Turd Analyzer 功能）
- `OPENAI_BASE_URL` - （可选）自定义 OpenAI 端点

#### 支持的部署平台

容器化应用可以部署到任何支持 Docker 的平台，包括：

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway
- Render

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
