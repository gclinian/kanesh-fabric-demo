#!/usr/bin/env python3
"""靜態 dev server,加上 no-cache 標頭。

用途:前端開發時,一般重新整理就能看到最新的 HTML/CSS/JS,不必每次硬重新整理
(瀏覽器不會快取 assets/js/factory-app.js 等檔)。

用法:  python3 scripts/dev-server.py [port]   # 預設 8000
       (npm run serve 會呼叫本檔)
"""
import sys
import http.server
import socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 開發用:永遠拿最新檔,避免改了前端卻看到舊版
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


# 允許 port 立即重用,避免上一個 server 剛關、socket 還在 TIME_WAIT 時綁不上
socketserver.TCPServer.allow_reuse_address = True

print(f"Dev server (no-cache) → http://localhost:{PORT}/platform.html")
print(f"  factory  → http://localhost:{PORT}/factory.html?stage=spin")
print("  Ctrl+C 結束")
try:
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nstopped.")
except OSError as e:
    print(f"\n無法啟動 (port {PORT} 可能已被佔用): {e}")
    print(f"  查佔用:lsof -nP -iTCP:{PORT} -sTCP:LISTEN")
    print(f"  清掉:  pkill -f 'dev-server.py {PORT}'  或  pkill -f 'http.server {PORT}'")
    sys.exit(1)
