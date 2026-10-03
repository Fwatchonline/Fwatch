import { Buffer } from 'node:buffer'
import { ORIGIN, USER_AGENT } from '../config/defaults.js'
import { buildContentPath, parsePageToken } from './paths.js'
import { createVidupSandbox } from '../vidup-vm/sandbox.js'

const WORKERS = 8
const fail = (stage, error, extra = {}) => ({ ok: false, stage, error, ...extra })

const pubServer = ({ server, streamUrl, ms }) => ({
  name: server.name,
  description: server.description,
  streamUrl,
  ...(ms != null && { ms }),
})

const toResponse = (data) => {
  if (!data.ok) {
    return {
      ok: false,
      stage: data.stage,
      error: data.error,
      ...(data.type && { type: data.type }),
      ...(data.contentPath && { contentPath: data.contentPath }),
      ...(data.servers && { servers: data.servers }),
    }
  }
  return {
    ok: true,
    type: data.type,
    contentPath: data.contentPath,
    streamUrl: data.streamUrl,
    ...(data.servers && { servers: data.servers }),
    ...(data.source && { source: data.source }),
  }
}

const requestCtx = (request) => {
  const contentPath = typeof request === 'string' ? request : request.contentPath || buildContentPath(request)
  const type = typeof request === 'object' ? request.type || 'movie' : 'movie'
  return { base: ORIGIN, contentPath, type, meta: { type, contentPath } }
}

const loadSandbox = (base, contentPath, extra) => {
  try {
    return { vm: createVidupSandbox({ Buffer, origin: base, contentPath }) }
  } catch (err) {
    return fail('vm-load', String(err.message || err), extra)
  }
}

const decodeWithVm = async (vm, serverData) => {
  const decoded = await vm.runStream(serverData)
  const streamUrl = typeof decoded === 'string' ? decoded : decoded?.url
  if (!streamUrl) throw new Error('decode returned empty url')
  const title = typeof decoded === 'object' && decoded.title ? decoded.title : undefined
  return { streamUrl, source: title ? { title } : undefined }
}

export async function resolveStreamLive(request, emit) {
  const { base, contentPath, type, meta } = requestCtx(request)

  emit('status', { step: 1, text: 'Reading VidUP page…' })
  const pageToken = parsePageToken(await (await fetch(`${base}${contentPath}`, { headers: { 'User-Agent': USER_AGENT } })).text())
  if (!pageToken) return emit('fail', toResponse(fail('page-token', 'en token missing', meta)))

  emit('status', { step: 2, text: 'Loading stream VM…' })
  const loaded = loadSandbox(base, contentPath, meta)
  if (!loaded.vm) return emit('fail', toResponse(loaded))
  const vm = loaded.vm

  emit('status', { step: 3, text: 'Fetching stream hosts…' })
  let allServers
  try {
    allServers = await vm.runServers(pageToken)
  } catch (err) {
    return emit('fail', toResponse(fail('servers', String(err.message || err), meta)))
  }
  if (!allServers?.length) return emit('fail', toResponse(fail('servers', 'no servers returned', meta)))

  emit('status', { step: 4, text: 'Resolving all servers…' })
  const resolved = []
  let next = 0, readySent = false
  const workers = Math.min(WORKERS, allServers.length)

  await Promise.all(Array.from({ length: workers }, async () => {
    while (next < allServers.length) {
      const server = allServers[next++]
      if (!server?.data) continue
      const started = Date.now()
      try {
        const { streamUrl, source } = await decodeWithVm(vm, server.data)
        const entry = { server, streamUrl, ms: Date.now() - started }
        resolved.push(entry)
        emit('found', pubServer(entry))
        if (!readySent) {
          readySent = true
          emit('ready', toResponse({
            ok: true,
            type,
            contentPath,
            streamUrl,
            source,
            servers: resolved.map(pubServer),
          }))
        }
      } catch {}
    }
  }))

  const servers = resolved.map(pubServer)
  if (!readySent) emit('fail', toResponse(fail('probe', 'no playable stream', { ...meta, servers })))
  emit('done', { servers })
}
