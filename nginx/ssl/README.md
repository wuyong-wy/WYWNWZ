# SSL 证书目录

将 SSL 证书文件放置在此目录下：

- `fullchain.pem` — 完整证书链
- `privkey.pem` — 私钥

## 获取证书

### Let's Encrypt (推荐)

```bash
# 停止 Nginx 以释放 80 端口
docker compose stop nginx

# 获取证书
certbot certonly --standalone -d api.yourdomain.com

# 复制证书
cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem ./nginx/ssl/

# 重启 Nginx
docker compose start nginx
```

### 自动续期

```bash
# 添加 cron 任务
echo "0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/api.yourdomain.com/*.pem /opt/wywmwz/nginx/ssl/ && docker compose exec nginx nginx -s reload" | crontab -
```

## 注意

- 证书文件已被 `.gitignore` 排除，不会提交到代码仓库
- `docker-compose.yml` 将此目录挂载到 Nginx 容器的 `/etc/nginx/ssl/`
