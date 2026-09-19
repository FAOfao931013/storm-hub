# 风暴枢纽 (Storm Hub)

基于 uni-app + Vue 3 + Vite + TypeScript 构建的风暴英雄(Heroes of the Storm)英雄查询微信小程序。

## 项目简介

风暴枢纽是一款风暴英雄英雄查询工具,提供:
- 🦸 **英雄列表**: 展示所有英雄及其基本信息(中英文名称、角色、类型)
- 🔍 **搜索功能**: 支持中英文名称搜索
- 🏷️ **角色筛选**: 按Tank、Bruiser、Healer、Support、Melee Assassin、Ranged Assassin等角色筛选
- 📖 **英雄详情**: 查看英雄技能(QWER+特质)、天赋树(按等级分组)
- ⭐ **本地收藏**: 收藏喜爱的英雄,数据存储在本地
- 🔄 **下拉刷新**: 列表和详情页支持下拉刷新更新数据
- 🇨🇳 **中文本地化**: 技能和天赋名称/描述完整中文化(基于HeroesToolChest/heroes-data)
- 🔑 **微信登录**: 通过微信授权登录，支持昵称设置
- 🤝 **组队功能**: 发布和加入组队帖，找到志同道合的队友
- 📧 **邮件通知**: 有人加入组队时自动发送邮件通知（可选）

## 数据来源

本应用使用在线API,**不依赖静态JSON文件**:

### Heroes Profile API (免费,无需token)
- **英雄列表**: `GET https://api.heroesprofile.com/openApi/Heroes`
  - 包含英雄名称、角色、类型、中文翻译等信息
  - 支持按角色或名称过滤
- **天赋数据**: `GET https://api.heroesprofile.com/openApi/Heroes/Talents?hero={heroName}`
  - 提供完整的天赋树信息(名称、描述、等级、图标)

### Tencent COS (图标资源)
- **图标基础URL**: `https://mini-pro-1256180448.cos.ap-shanghai.myqcloud.com/storm-hub`
- **英雄头像**: `{base}/heroes/{shortname}.png`
- **技能图标**: `{base}/talents/{iconname}.png` (技能和天赋共用同一目录)
- **天赋图标**: `{base}/talents/{iconname}.png`

### jsDelivr CDN (能力JSON数据 + 中文数据)
- **能力数据**: `https://cdn.jsdelivr.net/gh/heroespatchnotes/heroes-talents@master/hero/{shortname}.json`
- **中文本地化数据**: `https://cdn.jsdelivr.net/gh/FAOfao931013/storm-hub@main/data/zhcn/heroes/{shortname}.json`
  - 技能和天赋的中文名称和描述
  - 来源: HeroesToolChest/heroes-data build 2.55.11.94387 (MIT License)
  - 运行时在线加载,失败时回退到英文

*图片加载失败时会显示本地占位图*

## 最新更新

### UI 重设计 (feature/ui-redesign 分支)

- **全新深色主题**: 采用深紫/蓝色太空渐变背景，提升视觉体验
- **英雄列表重设计**: 
  - 4列圆形头像网格布局
  - 每个英雄头像带有青蓝色光环效果
  - 双徽章系统：左下角显示阵营图标，右下角显示角色图标
  - 中文英雄名称显示
- **图标过滤器**: 
  - 角色过滤：坦克、战士、近战刺客、远程刺客、治疗、辅助
  - 阵营过滤：魔兽争霸、星际争霸、暗黑破坏神、守望先锋、时空枢纽
  - 单选模式，点击切换，可与搜索组合使用
- **搜索功能**: 顶部搜索框，支持英雄名称快速搜索
- **三标签导航**: 英雄 / 收藏 / 关于

### 数据源

- **英雄数据**: Heroes Profile API
- **阵营数据**: HeroesToolChest herodata (通过 `scripts/build-franchise-map.mjs` 生成)
- **中文名称**: 可扩展支持 zhcn 数据覆盖
- **英雄图像**: HeroesToolChest heroes-images

### 重新生成阵营映射

如需更新阵营数据映射：

```bash
node scripts/build-franchise-map.mjs
```

这将从 HeroesToolChest 获取最新的英雄数据并生成 `data/zhcn/franchise.json`。

## 技术栈

- **框架**: uni-app (多端支持)
- **前端**: Vue 3 + TypeScript
- **构建工具**: Vite
- **目标平台**: 微信小程序 (mp-weixin)
- **微信小程序 AppID**: `wxedf6cde732558775`

## 环境要求

- Node.js >= 18.0 (推荐使用 Node.js 18+ 或 20+)
- npm >= 7.0
- 微信开发者工具 (用于预览和调试)

## 安装依赖

```bash
npm install
```

## 开发运行

### 微信小程序开发模式

```bash
npm run dev:mp-weixin
```

运行后,编译产物会生成在 `dist/dev/mp-weixin` 目录。

## 生产构建

### 微信小程序生产构建

```bash
npm run build:mp-weixin
```

构建产物会生成在 `dist/build/mp-weixin` 目录。

## 在微信开发者工具中运行

### 前置配置

**重要**: 在微信小程序管理后台配置服务器域名白名单:

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入小程序后台 → 开发 → 开发管理 → 开发设置 → 服务器域名
3. 配置以下域名:
   - **request合法域名**: `https://api.heroesprofile.com`
   - **downloadFile合法域名**: 
     - `https://mini-pro-1256180448.cos.ap-shanghai.myqcloud.com` (图标资源)
     - `https://cdn.jsdelivr.net` (能力JSON + 中文数据)

*没有配置域名会导致网络请求失败!*

### 导入项目

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 运行 `npm run dev:mp-weixin` 或 `npm run build:mp-weixin`
3. 打开微信开发者工具
4. 导入项目:
   - 项目路径选择: `dist/dev/mp-weixin` (开发模式) 或 `dist/build/mp-weixin` (生产构建)
   - AppID: `wxedf6cde732558775` (已在 `src/manifest.json` 中配置)
5. 在详情 → 本地设置中,勾选"不校验合法域名"(仅开发调试时)
6. 点击"编译"即可预览

## 项目结构

```
storm-hub/
├── src/
│   ├── api/                # API服务层
│   │   └── heroes.ts       # 英雄数据API(Heroes Profile + jsDelivr)
│   ├── components/         # 公共组件
│   │   └── HeroCard.vue    # 英雄卡片组件
│   ├── pages/              # 页面目录
│   │   ├── index/          # 英雄列表页(带搜索和筛选)
│   │   │   └── index.vue
│   │   ├── detail/         # 英雄详情页(技能+天赋)
│   │   │   └── detail.vue
│   │   ├── favorites/      # 收藏页
│   │   │   └── favorites.vue
│   │   └── about/          # 关于页
│   │       └── about.vue
│   ├── static/             # 静态资源
│   │   ├── tab-*.png       # TabBar图标
│   │   └── hero-placeholder.png  # 英雄占位图
│   ├── types/              # TypeScript类型定义
│   │   └── hero.ts         # 英雄、技能、天赋类型
│   ├── utils/              # 工具函数
│   │   └── storage.ts      # 本地存储(收藏功能)
│   ├── App.vue             # 应用入口组件
│   ├── main.ts             # 应用入口文件
│   ├── manifest.json       # 应用配置文件
│   ├── pages.json          # 页面路由配置(含TabBar)
│   └── uni.scss            # 全局样式变量
├── dist/                   # 编译输出目录
│   ├── dev/mp-weixin       # 开发模式输出
│   └── build/mp-weixin     # 生产构建输出
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
├── package.json            # 项目依赖配置
└── README.md               # 项目说明文档
```

## 中文本地化系统

**构建脚本 (`scripts/build-zhcn.mjs`)**
- 从 [HeroesToolChest/heroes-data](https://github.com/HeroesToolChest/heroes-data) 下载游戏数据(MIT License)
- 通过游戏内部键将中文字符串(`gamestrings_zhcn.json`)与英雄技能/天赋关联
- 清理游戏标记: `<n/>` → 换行, 移除 `<img>`, `~~0.04~~` → `(+4%每级)`
- **映射内部英雄键到Heroes Profile short_name** (如 `NexusHunter` → `qhira`, `Amazon` → `cassia`) 确保与API/CDN一致
- 输出精简的单英雄JSON到 `data/zhcn/heroes/{short_name}.json`

**运行时覆盖 (`src/utils/zhcn.ts`)**
- 详情页加载时从jsDelivr获取中文数据
- 使用 `@main` 分支获得稳定的CDN URL
- 将中文文本合并到英文数据上,获取失败时回退到英文
- UI控件本地化(搜索占位符、区块标签、角色/类型名称)

**数据输出:**
- `data/zhcn/meta.json` - 构建元数据
- `data/zhcn/heroes/*.json` - 90个英雄文件,包含中文技能/天赋
- 文件名匹配Heroes Profile `short_name` 格式以保证URL一致性

## 功能说明

### 英雄列表页 (pages/index)
- 展示所有英雄卡片(头像、中文名、英文名、角色、类型)
- 顶部搜索框:支持中英文模糊搜索
- 横向滚动筛选栏:按角色筛选(全部/Tank/Bruiser/等)
- 下拉刷新:清除缓存重新加载
- 点击卡片:跳转到英雄详情页
- 点击星标:收藏/取消收藏

### 英雄详情页 (pages/detail)
- 英雄头像和基本信息
- **技能模块**:展示QWER技能和特质(包含冷却时间、法力消耗、描述)
- **天赋模块**:按等级分组展示天赋树(1/4/7/10/13/16/20级)
- 右上角收藏按钮
- 下拉刷新:重新加载天赋和技能数据

### 收藏页 (pages/favorites)
- 展示已收藏的英雄列表
- 空状态提示
- 点击卡片跳转详情
- 点击星标取消收藏

### 关于页 (pages/about)
- 应用介绍
- 数据源说明
- 免责声明(粉丝工具,版权归暴雪所有)
- 版本信息

## 缓存策略

- 英雄列表缓存5分钟(内存级),减少API调用
- 下拉刷新可手动清除缓存
- 收藏数据持久化到本地存储(`uni.storage`)

## 类型检查

```bash
npm run type-check
```

## 常见问题

### 1. 网络请求失败 / 图片加载失败

**原因**: 微信小程序未配置服务器域名白名单

**解决方法**:
- 开发阶段:在微信开发者工具中勾选"不校验合法域名"
- 正式发布前:必须在小程序后台配置以下域名:
  - request: `https://api.heroesprofile.com`
  - downloadFile: 
    - `https://mini-pro-1256180448.cos.ap-shanghai.myqcloud.com` (图标资源)
    - `https://cdn.jsdelivr.net` (能力JSON + 中文数据)

### 2. TabBar图标显示异常

**原因**: 当前使用的是1x1像素的占位图标

**解决方法**: 替换 `src/static/` 下的图标文件为实际设计的图标(81x81px):
- `tab-hero.png / tab-hero-active.png` (英雄图标)
- `tab-favorite.png / tab-favorite-active.png` (收藏图标)
- `tab-about.png / tab-about-active.png` (关于图标)

推荐图标来源: [iconfont.cn](https://www.iconfont.cn/)

### 3. 某些英雄技能数据缺失

**原因**: Heroes Profile openApi可能不提供完整技能数据,jsDelivr仓库中部分英雄JSON可能缺失

**解决方法**: 正常现象,会显示"暂无详细数据"。可考虑补充其他数据源或提交Issue到 `heroespatchnotes/heroes-talents` 仓库

### 4. AppID 配置

项目已配置微信小程序 AppID 为 `wxedf6cde732558775`,位于 `src/manifest.json` 文件的 `mp-weixin.appid` 字段。

## 免责声明

本应用为粉丝自制工具,不隶属于暴雪娱乐(Blizzard Entertainment)。

风暴英雄(Heroes of the Storm)及相关内容的版权归暴雪娱乐所有。

数据来源:
- [Heroes Profile](https://www.heroesprofile.com/) - 社区维护的英雄数据API
- [heroes-talents](https://github.com/heroespatchnotes/heroes-talents) - 开源的英雄图标资源

## 相关文档

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [Vue 3 文档](https://cn.vuejs.org/)
- [Vite 文档](https://cn.vitejs.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/zh/)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Heroes Profile API](https://www.heroesprofile.com/)

## License

MIT

---

## 后端部署说明

后端服务需要配置以下环境变量（见 `server/.env.example`）：

### 必需配置
- `ADMIN_KEY` - 管理员密钥，用于触发数据同步
- `WECHAT_APPID` - 微信小程序 AppID
- `WECHAT_SECRET` - 微信小程序 AppSecret
- `JWT_SECRET` - JWT 密钥，用于生成用户会话令牌

### 可选配置（邮件通知功能）
- `SMTP_HOST` - SMTP 服务器地址（默认 smtp.gmail.com）
- `SMTP_PORT` - SMTP 端口（默认 587）
- `SMTP_SECURE` - 是否使用 SSL（默认 false）
- `SMTP_USER` - SMTP 用户名
- `SMTP_PASS` - SMTP 密码

**重要提醒**：
- 所有敏感信息（AppSecret、密钥、密码）都必须配置在 `.env` 文件中
- 不要将 `.env` 文件提交到版本控制
- `.env.example` 仅包含空白占位符，用于示例
- 部署到生产环境前请确保所有密钥已正确配置

详见 `server/README.md`

## 微信小程序域名配置

在微信小程序管理后台添加以下服务器域名：

### request合法域名
- `https://api.fao13578.cn` (后端 API)
- `https://api.heroesprofile.com` (英雄数据)

### downloadFile合法域名
- `https://mini-pro-1256180448.cos.ap-shanghai.myqcloud.com` (图标资源)
- `https://cdn.jsdelivr.net` (能力JSON + 中文数据)

## 开发日志

### v1.1.0 (2026-09) - Phase 1: 微信登录 + 组队功能
- ✅ 微信登录（后端 `jscode2session`，前端 `uni.login`）
- ✅ 用户会话管理（JWT token）
- ✅ 昵称设置功能
- ✅ 组队系统（LFG）
  - 创建组队帖（模式、人数、战网ID、备注、邮箱）
  - 浏览组队列表
  - 加入组队
  - 关闭组队帖（仅队长）
- ✅ 邮件通知（SMTP，有人加入时通知队长）
- ✅ 隐私保护（邮箱不公开显示）
- ✅ 速率限制（防止滥用）
- ✅ 「我的」页面重构（登录/退出/昵称）
- ✅ 「组队」页面重构（列表/创建/详情）
- ✅ 免责声明更新（联系信息使用说明）

### v1.0.0 (2026-09) - MVP版本
- ✅ 英雄列表展示(中英文名称、角色、类型)
- ✅ 搜索功能(支持中英文)
- ✅ 角色筛选(Tank/Bruiser/Healer/Support/Assassin)
- ✅ 英雄详情页(技能+天赋树)
- ✅ 本地收藏功能
- ✅ 下拉刷新
- ✅ TabBar导航(英雄/收藏/关于)
- ✅ 在线API数据获取(Heroes Profile + jsDelivr)

