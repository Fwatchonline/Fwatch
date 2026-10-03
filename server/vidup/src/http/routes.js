import { createReadStream } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseStreamRequest } from '../resolve/paths.js'
import { proxyHls } from '../hls/proxy.js'
import { resolveStreamLive } from '../resolve/resolver.js'

const publicRoot = join(dirname(fileURLToPath(import.meta.url)), '../../public')
const cors = { 'Access-Control-Allow-Origin': '*' }
const staticFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'application/javascript; charset=utf-8'],
  '/hls.min.js': ['hls.min.js', 'application/javascript; charset=utf-8'],
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...cors })
  res.end(JSON.stringify(body))
}

const serveStatic = (pathname, res) => {
  const file = staticFiles[pathname]
  if (!file) return false
  res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' })
  createReadStream(join(publicRoot, file[0])).pipe(res)
  return true
}

export async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  try {
    if (url.pathname === '/api/hls') {
      const target = url.searchParams.get('url')
      if (!target) return json(res, 400, { error: 'url required' })
      try {
        const proxied = await proxyHls(target)
        res.writeHead(proxied.status, proxied.headers)
        res.end(proxied.body)
      } catch (err) {
        console.error('[hls]', target.slice(0, 80), err.message)
        res.writeHead(502, { 'Content-Type': 'text/plain' })
        res.end('upstream error')
      }
      return
    }
    if (url.pathname === '/api/stream/live') {
      const parsed = parseStreamRequest(url.searchParams)
      if (parsed.error) return json(res, 400, { error: parsed.error })
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', ...cors })
      const push = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      try {
        await resolveStreamLive(parsed, push)
      } catch (err) {
        push('fail', { ok: false, error: String(err.message || err) })
      }
      res.end()
      return
    }
    if (serveStatic(url.pathname, res)) return
    res.writeHead(404)
    res.end('not found')
  } catch (err) {
    json(res, 500, { ok: false, error: String(err.message || err) })
  }
}
