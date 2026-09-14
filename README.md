# 风暴枢纽 (Storm Hub)

基于 uni-app + Vue 3 + Vite + TypeScript 构建的微信小程序项目。

## 项目信息

- **中文名称**: 风暴枢纽
- **英文名称**: Storm Hub
- **主要目标**: 微信小程序 (mp-weixin)
- **多端支持**: 保留 H5、App 等多端扩展能力

## 技术栈

- **框架**: uni-app
- **前端**: Vue 3 + TypeScript
- **构建工具**: Vite
- **目标平台**: 微信小程序 (mp-weixin)
- **微信小程序 AppID**: `wxedf6cde732558775`

## 环境要求

- Node.js >= 18.0 (推荐使用 Node.js 18+ 或 20+)
- npm >= 7.0

## 安装依赖

```bash
npm install
```

## 开发运行

### 微信小程序开发模式

```bash
npm run dev:mp-weixin
```

运行后，编译产物会生成在 `dist/dev/mp-weixin` 目录。

### 其他平台开发模式

```bash
# H5
npm run dev:h5

# 支付宝小程序
npm run dev:mp-alipay

# 百度小程序
npm run dev:mp-baidu

# 字节跳动小程序
npm run dev:mp-toutiao

# QQ 小程序
npm run dev:mp-qq
```

## 生产构建

### 微信小程序生产构建

```bash
npm run build:mp-weixin
```

构建产物会生成在 `dist/build/mp-weixin` 目录。

### 其他平台生产构建

```bash
# H5
npm run build:h5

# 支付宝小程序
npm run build:mp-alipay

# 百度小程序
npm run build:mp-baidu

# 字节跳动小程序
npm run build:mp-toutiao

# QQ 小程序
npm run build:mp-qq
```

## 在微信开发者工具中运行

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 运行 `npm run dev:mp-weixin` 或 `npm run build:mp-weixin`
3. 打开微信开发者工具
4. 导入项目：
   - 项目路径选择：`dist/dev/mp-weixin` (开发模式) 或 `dist/build/mp-weixin` (生产构建)
   - AppID: `wxedf6cde732558775` (已在 `src/manifest.json` 中配置)
5. 点击"编译"即可预览

## 项目结构

```
storm-hub/
├── src/                    # 源代码目录
│   ├── pages/             # 页面目录
│   │   └── index/         # 首页
│   │       └── index.vue
│   ├── static/            # 静态资源
│   │   └── logo.png
│   ├── App.vue            # 应用入口组件
│   ├── main.ts            # 应用入口文件
│   ├── manifest.json      # 应用配置文件
│   ├── pages.json         # 页面路由配置
│   └── uni.scss           # 全局样式变量
├── dist/                   # 编译输出目录 (由构建生成)
├── index.html             # H5 入口 HTML
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── package.json           # 项目依赖配置
└── README.md              # 项目说明文档
```

## 类型检查

```bash
npm run type-check
```

## 常见问题

### 1. 微信开发者工具无法导入项目

确保已经运行过 `npm run dev:mp-weixin` 或 `npm run build:mp-weixin`，并且导入的路径是 `dist/dev/mp-weixin` 或 `dist/build/mp-weixin`。

### 2. AppID 配置

项目已配置微信小程序 AppID 为 `wxedf6cde732558775`，位于 `src/manifest.json` 文件的 `mp-weixin.appid` 字段。

### 3. Node.js 版本要求

Vue 3 + Vite 版本要求 Node.js 18+ 或 20+，如使用较低版本可能会遇到兼容性问题。

## 相关文档

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [Vue 3 文档](https://cn.vuejs.org/)
- [Vite 文档](https://cn.vitejs.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/zh/)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

## License

MIT
