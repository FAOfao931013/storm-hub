# Storm Hub API

第 1 期后端：把英雄 / 技能 / 天赋 / 中文文本同步进 SQLite，小程序只读这里。

## 本地运行

```bash
cd server
cp .env.example .env
# 把 ADMIN_KEY 改成一段长随机串，不要提交 .env
npm install
npm run sync
npm start
```

验证：

```bash
curl -s http://127.0.0.1:3000/api/health
curl -s http://127.0.0.1:3000/api/heroes | head
curl -s http://127.0.0.1:3000/api/heroes/abathur | head
```

手动同步（需要 `.env` 里的 `ADMIN_KEY`）：

```bash
curl -X POST http://127.0.0.1:3000/api/admin/sync \
  -H "X-Admin-Key: 你的密钥"
```

也可以不走 HTTP：`npm run sync`

## 服务器部署

1. 安装 Node 20+。若 `better-sqlite3` 编译失败：

   ```bash
   sudo apt install -y build-essential python3
   ```

2. 把仓库放到服务器，例如 `/opt/storm-hub`。`data/zhcn` 和 `src/data/franchise.json` 要和 `server/` 在同一仓库里。

3. 配置环境变量：

   ```bash
   cd /opt/storm-hub/server
   cp .env.example .env
   nano .env   # 填写 ADMIN_KEY，HOST 保持 127.0.0.1
   npm install
   npm run sync
   ```

4. systemd 示例 `/etc/systemd/system/storm-hub-api.service`：

   ```ini
   [Unit]
   Description=storm-hub-api
   After=network.target

   [Service]
   Type=simple
   WorkingDirectory=/opt/storm-hub/server
   ExecStart=/usr/bin/npm start
   Restart=always
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now storm-hub-api
   ```

5. Nginx：在现有 `api.fao13578.cn` 的 `server { }` 里**追加**下面这段，原来的 `/openApi/Heroes` 转发先留着做回滚。不要把 `ADMIN_KEY` 写进配置文件。

   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

   然后 `sudo nginx -t && sudo systemctl reload nginx`

6. 线上验证：

   ```bash
   curl -s https://api.fao13578.cn/api/health
   curl -s https://api.fao13578.cn/api/heroes/abathur | head
   ```

`.env`、`*.db`、证书、真实 `ADMIN_KEY` 都不要提交到 GitHub。
