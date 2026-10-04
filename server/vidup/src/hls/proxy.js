import { Buffer } from 'node:buffer'
import { ORIGIN, USER_AGENT } from '../config/defaults.js'

const PROXY = '/api/hls'
const HEADERS = { Referer: `${ORIGIN}/`, Origin: ORIGIN, 'User-Agent': USER_AGENT }

const stripPngTs = (buf) => {
  if (buf.length < 4 || buf[0] === 0x47) return buf
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return buf
  const iend = buf.indexOf(Buffer.from('IEND'))
  if (iend >= 0 && iend + 8 < buf.length) return buf.subarray(iend + 8)
  for (let i = 0; i < Math.min(buf.length, 65536); i++) {
    if (buf[i] === 0x47 && i + 188 < buf.length && buf[i + 188] === 0x47) return buf.subarray(i)
  }
  return buf
}

const buildProxyUrl = (targetUrl, ref, orig) => {
  const params = new URLSearchParams()
  params.set('url', targetUrl)
  if (ref) params.set('referer', ref)
  if (orig) params.set('origin', orig)
  return `${PROXY}?${params.toString()}`
}

const rewriteM3u8 = (text, baseUrl, ref, orig) => {
  const hasEnglishAudio = text.includes('TYPE=AUDIO') && (/NAME=["'][^"']*English[^"']*["']/i.test(text) || /LANGUAGE=["'](eng?|en)["']/i.test(text));

  return text
    .split('\n')
    .map((line) => {
      let modified = line

      // Rewrite Audio tracks: prioritize English as DEFAULT=YES and non-English as DEFAULT=NO
      if (modified.includes('TYPE=AUDIO') && hasEnglishAudio) {
        const isEnglish = /LANGUAGE=["'](eng?|en)["']/i.test(modified) || /NAME=["'][^"']*English[^"']*["']/i.test(modified);
        if (isEnglish) {
          modified = modified
            .replace(/DEFAULT=(NO|YES)/gi, 'DEFAULT=YES')
            .replace(/AUTOSELECT=(NO|YES)/gi, 'AUTOSELECT=YES');
        } else {
          modified = modified
            .replace(/DEFAULT=(NO|YES)/gi, 'DEFAULT=NO')
            .replace(/AUTOSELECT=(NO|YES)/gi, 'AUTOSELECT=NO');
        }
      }

      // Rewrite URI="..." attributes in tags like #EXT-X-KEY and #EXT-X-MEDIA
      if (modified.includes('URI="')) {
        modified = modified.replace(/URI="([^"]+)"/g, (match, uri) => {
          try {
            const absoluteUrl = new URL(uri, baseUrl).href
            return `URI="${buildProxyUrl(absoluteUrl, ref, orig)}"`
          } catch {
            return match
          }
        })
      }

      const trimmed = modified.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        return modified
      }

      try {
        const fullUrl = new URL(trimmed, baseUrl).href
        return buildProxyUrl(fullUrl, ref, orig)
      } catch {
        return modified
      }
    })
    .join('\n')
}

export async function proxyHls(rawTargetUrl, query = {}) {
  let targetUrl = rawTargetUrl
  let customHeaders = {}

  // 1. Unwrap valhalla m3u8-proxy if present
  if (targetUrl.includes('/m3u8-proxy?')) {
    try {
      const parsed = new URL(targetUrl)
      const innerUrl = parsed.searchParams.get('url')
      const innerHeaders = parsed.searchParams.get('headers')
      if (innerUrl) targetUrl = innerUrl
      if (innerHeaders) {
        try {
          customHeaders = { ...customHeaders, ...JSON.parse(innerHeaders) }
        } catch {}
      }
    } catch {}
  }

  // 2. Query overrides
  let ref = query.referer || customHeaders.Referer || customHeaders.referer || ''
  let orig = query.origin || customHeaders.Origin || customHeaders.origin || ''

  // Automatic referer for known edge CDNs
  if (!ref && (targetUrl.includes('rousav.tech') || targetUrl.includes('valhallastream') || targetUrl.includes('animecurx.tech'))) {
    ref = 'https://bingr.one/'
    orig = 'https://bingr.one'
  }

  let requestHeaders = {
    'User-Agent': USER_AGENT,
    Accept: '*/*',
  }

  try {
    const targetOrigin = new URL(targetUrl).origin
    requestHeaders.Referer = ref || `${targetOrigin}/`
    requestHeaders.Origin = orig || targetOrigin
  } catch {
    requestHeaders.Referer = `${ORIGIN}/`
    requestHeaders.Origin = ORIGIN
  }

  if (customHeaders['User-Agent']) requestHeaders['User-Agent'] = customHeaders['User-Agent']
  Object.assign(requestHeaders, customHeaders)

  const res = await fetch(targetUrl, { headers: requestHeaders, redirect: 'follow' })
  if (!res.ok) {
    // If it is an optional subtitle or audio track playlist returning 404 or 403 upstream, return empty valid playlist
    const path = new URL(targetUrl).pathname.toLowerCase()
    if ((res.status === 404 || res.status === 403) && (path.endsWith('.m3u8') || path.endsWith('.vtt') || path.includes('/subtitles_') || path.includes('/track_'))) {
      if (path.endsWith('.vtt')) {
        return {
          status: 200,
          headers: {
            'Content-Type': 'text/vtt; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            'Access-Control-Allow-Origin': '*',
          },
          body: 'WEBVTT\n\n',
        }
      }
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
        body: '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:1\n#EXT-X-ENDLIST\n',
      }
    }

    const body = await res.text().catch(() => '')
    throw new Error(`upstream ${res.status}${body ? `: ${body.slice(0, 80)}` : ''}`)
  }

  const type = res.headers.get('content-type') || ''
  const path = new URL(targetUrl).pathname.toLowerCase()
  const isPlaylist =
    type.includes('mpegurl') ||
    type.includes('m3u8') ||
    path.endsWith('.m3u8') ||
    path.includes('playlist')

  if (isPlaylist) {
    const text = await res.text()
    if (text.startsWith('#EXTM3U')) {
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
        body: rewriteM3u8(text, targetUrl, requestHeaders.Referer, requestHeaders.Origin),
      }
    }
  }

  // Key file
  if (path.endsWith('enc.key') || path.includes('.key')) {
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
      body: Buffer.from(await res.arrayBuffer()),
    }
  }

  // WebVTT Subtitle files (.vtt)
  if (path.endsWith('.vtt') || type.includes('vtt') || path.includes('/subtitle/')) {
    const text = await res.text()
    return {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
      body: text,
    }
  }

  // Segments (MPEG-TS or raw binary / m4s)
  let mimeType = type || (path.endsWith('.m4s') || path.endsWith('.mp4') ? 'video/mp4' : 'video/mp2t')
  if (mimeType.includes('html')) {
    mimeType = path.endsWith('.m4s') ? 'video/mp4' : 'video/mp2t'
  }

  return {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
    body: path.endsWith('.m4s') || path.endsWith('.mp4')
      ? Buffer.from(await res.arrayBuffer())
      : stripPngTs(Buffer.from(await res.arrayBuffer())),
  }
}
