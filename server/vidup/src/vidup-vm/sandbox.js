import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ORIGIN, USER_AGENT } from '../config/defaults.js'
import { VM_PRELUDE, VM_RUNNER, sliceVidupChunk } from './chunk.js'

const CHUNK = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../vendor/vidup-client-chunk-294.js')
const VM_CODE = `${VM_PRELUDE}\n${sliceVidupChunk(fs.readFileSync(CHUNK, 'utf8'))}\n${VM_RUNNER}; return globalThis.__vidup;`
const VM_ARGS = ['globalThis', 'window', 'self', 'document', 'navigator', 'localStorage', 'screen', '__crypto', 'fetch', 'atob', 'btoa', '__Buffer', 'TextEncoder', 'TextDecoder', 'location', 'performance']

const stubFetch = (origin, contentPath) => async (input, init = {}) => {
  let url = typeof input === 'string' ? input : input.url
  if (url.startsWith('/')) url = `${origin}${url}`
  const headers = new Headers(init.headers || {})
  if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT)
  if (!headers.has('Origin')) headers.set('Origin', origin)
  if (!headers.has('Referer')) headers.set('Referer', `${origin}${contentPath}`)
  console.log("[VM FETCH]", url, init.method, init.headers); const r = await fetch(url, { ...init, headers }); console.log("[VM FETCH RES]", r.status, (await r.clone().text()).slice(0, 300)); return r;
}

export function createVidupSandbox({ Buffer, origin = ORIGIN, contentPath = '/movie/0' } = {}) {
  const dbg = function debug() {}
  dbg.toString = () => 'function debug() { [native code] }'
  const page = `${origin}${contentPath}`
  const sandbox = {
    Buffer,
    crypto,
    fetch: stubFetch(origin, contentPath),
    atob: globalThis.atob,
    btoa: globalThis.btoa,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    performance: { now: () => Date.now() },
    navigator: { userAgent: USER_AGENT, language: 'en-US', platform: 'MacIntel', hardwareConcurrency: 8, webdriver: false, maxTouchPoints: 0 },
    console: { ...console, debug: dbg },
    document: {
      createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, contentWindow: { postMessage() {} }, tagName: 'DIV' }),
      cookie: '',
      location: { href: page },
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    screen: { width: 1920, height: 1080 },
    location: { hostname: 'vidup.to', host: 'vidup.to', origin, href: page, pathname: contentPath, search: '', hash: '' },
  }
  sandbox.window = sandbox.globalThis = sandbox.self = sandbox.parent = sandbox.top = sandbox
  const run = new Function(...VM_ARGS, VM_CODE)
  return run(sandbox, sandbox, sandbox, sandbox.document, sandbox.navigator, sandbox.localStorage, sandbox.screen, sandbox.crypto, sandbox.fetch, sandbox.atob, sandbox.btoa, sandbox.Buffer, sandbox.TextEncoder, sandbox.TextDecoder, sandbox.location, sandbox.performance)
}
