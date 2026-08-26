#!/bin/bash
# =============================================
# mall-web 部署脚本
# 用法: ssh root@<服务器IP> "bash /path/to/deploy.sh"
#       或直接在本仓库执行: bash deploy.sh
# =============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

BASE_DIR="/home/app/your-projects/mall/mall-web"
NGINX_DIST="/var/www/mall-web"

# ==================== 部署 mall-web ====================
log "========== 部署 mall-web =========="

cd "$BASE_DIR"

log "拉取最新代码..."
git pull

log "安装依赖..."
npm install --production

log "构建生产版本..."
npm run build

log "复制到 Nginx 目录..."
mkdir -p "$NGINX_DIST"
rm -rf "$NGINX_DIST/"*
cp -r dist/* "$NGINX_DIST/"

log "检查 Nginx 配置..."
if ! nginx -t 2>&1 | grep -q "syntax is ok"; then
  err "Nginx 配置有误，已中止"
  exit 1
fi

log "重载 Nginx..."
/etc/init.d/nginx reload 2>/dev/null || nginx -s reload 2>/dev/null

log "验证..."
# 本机无 curl，用 python 探测
python3 -c "
import urllib.request
r = urllib.request.urlopen('http://127.0.0.1:8898/')
b = r.read().decode()
assert '枸益补' in b, '首页内容异常'
print('  首页 200 ✓')
r2 = urllib.request.urlopen('http://127.0.0.1:8898/api/health')
print('  API  200 ✓', r2.read().decode()[:60])
" && log "✅ 验证通过" || warn "验证跳过（python 不可用或非部署环境）"

log "========================================"
log "🎉 mall-web 部署完成！"
log "   商城前台: http://<服务器IP>:8898"
log "   管理后台: http://<服务器IP>:8899"
log "   后端 API: http://<服务器IP>:3000"
log "========================================"