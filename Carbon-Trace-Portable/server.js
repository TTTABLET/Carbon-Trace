/**
 * 碳迹 Carbon Trace — 便携静态服务器
 *
 * 仅使用 Node.js 内置模块, 无任何第三方依赖。
 * 启动后自动打开浏览器, 按 Ctrl+C 停止。
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const ROOT = path.join(__dirname, 'dist')
const START_PORT = Number(process.env.PORT) || 5173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers })
  res.end(body)
}

function createServer() {
  return http.createServer((req, res) => {
    let urlPath
    try {
      urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    } catch {
      return send(res, 400, 'Bad Request')
    }

    if (urlPath === '/') urlPath = '/index.html'

    // 阻止路径穿越
    const filePath = path.join(ROOT, urlPath)
    if (!filePath.startsWith(ROOT)) {
      return send(res, 403, 'Forbidden')
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        // SPA 回退: 未命中的路径一律返回 index.html
        return fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
          if (e2) return send(res, 404, 'Not Found')
          send(res, 200, html, { 'Content-Type': MIME['.html'] })
        })
      }
      const ext = path.extname(filePath).toLowerCase()
      fs.readFile(filePath, (e3, data) => {
        if (e3) return send(res, 500, 'Internal Server Error')
        send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      })
    })
  })
}

function openBrowser(url) {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`
  exec(cmd, () => {})
}

function listen(port, attempt = 0) {
  const server = createServer()

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 20) {
      listen(port + 1, attempt + 1)
    } else {
      console.error('\n启动失败:', err.message)
      process.exit(1)
    }
  })

  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}/`
    console.log('')
    console.log('  🌱 碳迹 Carbon Trace 已启动')
    console.log('')
    console.log(`     访问地址: ${url}`)
    console.log('')
    console.log('     关闭此窗口即可停止服务')
    console.log('')
    openBrowser(url)
  })
}

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('\n找不到 dist/index.html, 请先执行构建: npm run build\n')
  process.exit(1)
}

listen(START_PORT)
