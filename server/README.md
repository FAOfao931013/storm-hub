# Storm Hub API

风暴枢纽后端服务：提供英雄数据查询、微信登录、组队功能和邮件通知。

## 功能特性

### 第 1 期：英雄数据同步
- 把英雄 / 技能 / 天赋 / 中文文本同步进 SQLite
- 小程序直接读取本地数据

### Phase 1：微信登录 + 组队 + 邮件通知
- **微信登录**：通过 `jscode2session` 获取用户 openid，签发 JWT 会话令牌
- **组队系统 (LFG)**：创建、浏览、加入组队帖，支持快速匹配、排位赛等模式
- **邮件通知**：当有人加入组队时，通过 SMTP 向队长发送邮件通知
- **隐私保护**：邮箱地址不会在 API 中公开显示

## 本地运行

```bash
cd server
cp .env.example .env
# 配置必要的环境变量：
# - ADMIN_KEY：改成一段长随机串
# - WECHAT_APPID 和 WECHAT_SECRET：微信小程序凭证
# - JWT_SECRET：JWT密钥，用于生成用户会话令牌
# - SMTP_*：邮件服务配置（可选，用于组队通知）
# 不要提交 .env 文件！
npm install
npm run sync
npm start
```

验证：

```bash
curl -s http://127.0.0.1:3000/api/health
curl -s http://127.0.0.1:3000/api/heroes | head
curl -s http://127.0.0.1:3000/api/heroes/abathur | head
curl -s http://127.0.0.1:3000/api/lfg | head
```

手动同步（需要 `.env` 里的 `ADMIN_KEY`）：

```bash
curl -X POST http://127.0.0.1:3000/api/admin/sync \
  -H "X-Admin-Key: 你的密钥"
```

也可以不走 HTTP：`npm run sync`

## API 端点

### 英雄数据
- `GET /api/health` - 健康检查
- `GET /api/heroes` - 获取所有英雄列表
- `GET /api/heroes/:shortName` - 获取英雄详情

### 微信登录
- `POST /api/auth/wechat` - 微信登录，传入 `{ code }` 返回 JWT token
- `GET /api/auth/me` - 获取当前用户信息（需要 Authorization 头）
- `POST /api/auth/nickname` - 修改昵称，传入 `{ nickname }`（需要登录）

### 组队 (LFG)
- `GET /api/lfg` - 获取组队列表（公开，不显示邮箱）
- `GET /api/lfg/:id` - 获取组队详情（公开，不显示邮箱）
- `POST /api/lfg` - 创建组队帖（需要登录），传入 `{ mode, party_size, note, battlenet_id, email? }`
- `POST /api/lfg/:id/join` - 加入组队（需要登录），传入 `{ battlenet_id, email? }`
- `POST /api/lfg/:id/close` - 关闭组队帖（仅队长，需要登录）

### 认证方式
需要登录的接口请在 HTTP 头中携带：
```
Authorization: Bearer <token>
```

## 服务器部署

**推荐方式：Docker Compose (从本地 Mac 同步)**

这是推荐的生产部署方式，支持：
- ✅ 从本地开发机直接部署到服务器（无需 GitHub）
- ✅ 自动处理 `better-sqlite3` 原生依赖编译
- ✅ SQLite 数据持久化
- ✅ 容器健康检查和自动重启
- ✅ 针对中国 VPS 优化（使用腾讯云镜像源加速 apt 包安装）

**源代码管理说明：** 源代码可以在本地、GitHub 或任何地方。部署流程是 **本地 → rsync → 服务器**，GitHub 是可选的，推送代码不会触发部署。

### 前置要求

1. **服务器上安装 Docker 和 Docker Compose**

   ```bash
   # 在 Lighthouse 上 (Ubuntu)
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo systemctl enable --now docker
   sudo usermod -aG docker ubuntu
   # 重新登录以应用 docker 组权限
   ```

2. **本地 Mac 配置 SSH 访问**

   在 `~/.ssh/config` 添加（可选，方便快捷）：

   ```
   Host storm-hub
       HostName 124.223.113.122
       User ubuntu
       IdentityFile ~/.ssh/your-key
   ```

3. **服务器上创建部署目录和环境变量**

   ```bash
   # SSH 登录到服务器
   ssh ubuntu@124.223.113.122
   
   # 创建部署目录
   sudo mkdir -p /opt/storm-hub
   sudo chown ubuntu:ubuntu /opt/storm-hub
   
   # 先手动同步一次（从本地 Mac 运行，见下文）
   # 然后配置环境变量
   cd /opt/storm-hub/server
   cp .env.example .env
   nano .env   # 填写 ADMIN_KEY（长随机字符串）
   ```

### 部署步骤

**从本地 Mac 部署到服务器：**

```bash
# 在本地 storm-hub 仓库目录
cd server/scripts
./deploy-remote.sh
```

脚本会自动：
1. 通过 rsync 同步代码到服务器（排除 `node_modules`、`.env`、`*.db`）
2. SSH 到服务器执行 `docker compose up -d --build`
3. 检查健康端点

**首次部署前：** 编辑 `server/scripts/deploy-remote.sh`，确认 SSH 目标和远程路径正确：

```bash
SSH_TARGET="ubuntu@124.223.113.122"  # 或使用 SSH config 别名
REMOTE_DIR="/opt/storm-hub"
```

### 在服务器上手动操作

如果已经通过其他方式（如 `git pull`）把代码放到服务器，可以直接运行：

```bash
cd /opt/storm-hub/server
./scripts/deploy.sh  # 或直接 docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f
```

重启服务：

```bash
docker compose restart
```

停止服务：

```bash
docker compose down
```

### 首次同步和初始化

**首次运行时**需要先同步数据：

```bash
# SSH 到服务器
ssh ubuntu@124.223.113.122
cd /opt/storm-hub/server

# 进入容器执行同步
docker compose exec storm-hub-api npm run sync

# 或者在容器外用临时容器运行
docker compose run --rm storm-hub-api npm run sync
```

### Nginx 配置

在现有 `api.fao13578.cn` 的 `server { }` 块里**追加** `/api/` 转发。

快捷方式（使用提供的配置片段）：

```bash
# 在服务器上
sudo nano /etc/nginx/sites-available/api.fao13578.cn
# 添加这行到 server { } 块内：
# include /opt/storm-hub/deploy/nginx-api.snippet.conf;

sudo nginx -t && sudo systemctl reload nginx
```

或手动添加：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**注意：** Docker 容器绑定到 `127.0.0.1:3000`，只能从本机访问，外部流量必须通过 Nginx 转发。

### 验证部署

```bash
# 从服务器本地测试
curl -s http://127.0.0.1:3000/api/health

# 从外部测试（通过 Nginx）
curl -s https://api.fao13578.cn/api/health
curl -s https://api.fao13578.cn/api/heroes/abathur | head
```

### 故障排查

查看容器状态：

```bash
docker compose ps
```

查看实时日志：

```bash
docker compose logs -f
```

进入容器 shell：

```bash
docker compose exec storm-hub-api sh
```

重新构建（清理缓存）：

```bash
docker compose build --no-cache
docker compose up -d
```

---

## 备选方案：Bare Metal 部署

如果不使用 Docker，可以用 systemd 直接运行（需要手动处理 `better-sqlite3` 编译）：

<details>
<summary>点击展开 Bare Metal 部署步骤</summary>

1. 安装 Node 20+ 和编译工具：

   ```bash
   sudo apt install -y build-essential python3
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. 安装依赖并初始化：

   ```bash
   cd /opt/storm-hub/server
   npm install
   npm run sync
   ```

3. systemd 服务文件 `/etc/systemd/system/storm-hub-api.service`：

   ```ini
   [Unit]
   Description=storm-hub-api
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/opt/storm-hub/server
   ExecStart=/usr/bin/npm start
   Restart=always
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

4. 启用服务：

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now storm-hub-api
   sudo systemctl status storm-hub-api
   ```

</details>

---

**安全提醒：** `.env`、`*.db`、证书、真实 `ADMIN_KEY` 都不要提交到版本控制。
