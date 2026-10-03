export function buildContentPath({ type = 'movie', id, season, episode } = {}) {
  const contentId = String(id ?? '').trim()
  if (!contentId) throw new Error('id required')
  if (type === 'tv') {
    const s = String(season ?? '').trim(), e = String(episode ?? '').trim()
    if (!s || !e) throw new Error('season and episode required for tv')
    return `/tv/${contentId}/${s}/${e}`
  }
  return `/movie/${contentId}`
}

export function parseStreamRequest(q) {
  const id = q.get('id')
  if (!id) return { error: 'id required' }
  const season = q.get('season'), episode = q.get('episode'), explicit = q.get('type')
  const type = explicit === 'tv' || explicit === 'movie' ? explicit : season != null && episode != null ? 'tv' : 'movie'
  if (type === 'tv' && (!season || !episode)) return { error: 'season and episode required for tv' }
  return { type, contentPath: buildContentPath({ type, id, season, episode }) }
}

export function parsePageToken(html) {
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)].map((m) => m[1])
  if (chunks.length) {
    const hit = chunks.join('').replace(/\\n/g, '\n').replace(/\\"/g, '"').match(/"en":"([^"]+)"/)?.[1]
    if (hit) return hit
  }
  return html.match(/\\"en\\":\\"([^\\"]+)\\"/)?.[1] ?? html.match(/"en":"([^"]+)"/)?.[1] ?? html.match(/"en":\\"([^\\"]+)\\"/)?.[1]
}
