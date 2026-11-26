import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { courseMaterials } from '../lib/course'
import { assetName, courseBucket, normalizeCourse, templateMarkdown } from './course-format'

type Entry = {
  id: string
  markdown?: string
  template?: { title: string; fields: { name: string; type: string }[] }
}
const folder = '.course-private'
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/wav': 'wav',
  'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'application/pdf': 'pdf',
}
const assetLimit = 50_000_000
const suffix = (mime: string) => extensions[mime.split(';')[0].trim().toLowerCase()]
const bucketRoot = folder + '/assets'

async function privateJson(path: string, data: unknown) {
  await writeFile(path, JSON.stringify(data), { mode: 0o600 })
  await chmod(path, 0o600)
}

function safeNotionAsset(raw: string) {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && !url.port && !url.username && !url.password
      && /^(?:prod-files-secure|notion-static)(?:\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com|-cdn\.com)$/i.test(url.hostname)
  } catch { return false }
}

async function fetchAsset(url: string) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(90_000) })
  const ext = suffix(response.headers.get('content-type') ?? '')
  if (!response.ok || !ext || Number(response.headers.get('content-length')) > assetLimit || !response.body) {
    throw new Error('Unsupported or oversized Notion attachment.')
  }
  const reader = response.body.getReader()
  let count = 0
  const chunks: Uint8Array[] = []
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    count += value.byteLength
    if (count > assetLimit) {
      await reader.cancel()
      throw new Error('Notion attachment exceeds the import size limit.')
    }
    chunks.push(value)
  }
  const buffer = Buffer.concat(chunks)
  const name = createHash('sha256').update(buffer).digest('hex') + '.' + ext
  await writeFile(bucketRoot + '/' + name, buffer, { mode: 0o600 })
  return name
}

async function stage() {
  const token = process.env.NOTION_API_KEY
  if (!token) throw new Error('Set NOTION_API_KEY in the private owner environment file.')
  async function notion(path: string): Promise<Response> {
    const headers = { Authorization: 'Bearer ' + token, 'Notion-Version': '2026-03-11' }
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch('https://api.notion.com/v1/' + path, {
        headers, redirect: 'error', signal: AbortSignal.timeout(30_000),
      })
      if (response.status !== 429 || attempt === 3) return response
      await new Promise(resolve => setTimeout(resolve, Math.min(10, Number(response.headers.get('retry-after')) || 1) * 1000))
    }
    throw new Error('Notion rate limit.')
  }

  const entries: Entry[] = []
  const media: Record<string, string> = {}
  for (const material of courseMaterials) {
    const page = await notion('pages/' + material.id + '/markdown')
    if (page.ok) {
      const document = await page.json() as { markdown?: string; truncated?: boolean; unknown_block_ids?: string[] }
      if (document.truncated || document.unknown_block_ids?.length || typeof document.markdown !== 'string') {
        throw new Error(material.title + ' could not be exported in full. Check the integration grants or use a reviewed private source snapshot.')
      }
      const markdown = document.markdown
      const referenced = [...markdown.matchAll(/https:\/\/[^\s"<>\)]+/g)].map(item => item[0].replaceAll('&amp;', '&'))
      for (const url of new Set(referenced.filter(safeNotionAsset))) {
        if (!media[url]) {
          try { media[url] = await fetchAsset(url) }
          catch { throw new Error('Could not copy an attachment for ' + material.title + '. No course content was published.') }
        }
      }
      entries.push({ id: material.id, markdown })
      continue
    }
    if (page.status !== 400 && page.status !== 404) throw new Error('Could not export ' + material.title + ' (Notion HTTP ' + page.status + ').')
    const database = await notion('databases/' + material.id)
    if (!database.ok) throw new Error('Notion integration cannot read ' + material.title + '.')
    const schema = await database.json() as { data_sources?: { id: string }[] }
    const fields: { name: string; type: string }[] = []
    for (const source of schema.data_sources ?? []) {
      const response = await notion('data_sources/' + source.id)
      if (!response.ok) throw new Error('Could not read the template fields for ' + material.title + '.')
      const body = await response.json() as { properties?: Record<string, { name: string; type: string }> }
      for (const { name, type } of Object.values(body.properties ?? {})) fields.push({ name, type })
    }
    entries.push({ id: material.id, template: { title: material.title, fields } })
  }
  await privateJson(folder + '/source.json', entries)
  await privateJson(folder + '/media.json', media)
  console.log('Staged ' + entries.length + ' course documents and templates.')
}

async function prepare() {
  const source = JSON.parse(await readFile(folder + '/source.json', 'utf8')) as Entry[]
  const media = JSON.parse(await readFile(folder + '/media.json', 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '{}'
    throw error
  })) as Record<string, string>
  const entries = new Map(source.map(entry => [entry.id, entry]))
  const missingMedia: { title: string; count: number }[] = []
  const updatedAt = new Date().toISOString()
  const documents = courseMaterials.map(material => {
    const entry = entries.get(material.id)
    if (!entry || (!entry.template && typeof entry.markdown !== 'string')) throw new Error('Missing source: ' + material.title)
    const normalized = entry.template ? { markdown: templateMarkdown(entry.template.title, entry.template.fields), missing: [] }
      : normalizeCourse(entry.markdown!, media)
    if (normalized.missing.length) missingMedia.push({ title: material.title, count: normalized.missing.length })
    if (normalized.markdown.length > 500000) throw new Error('Course document is too long: ' + material.title)
    return { id: material.id, markdown: normalized.markdown, updated_at: updatedAt }
  })
  const assetPaths = new Set<string>()
  for (const document of documents) {
    for (const match of document.markdown.matchAll(/\/api\/course\/media\/([a-f0-9]{64}\.[a-z0-9]{1,8})/g)) assetPaths.add(match[1])
  }
  const assets = await Promise.all([...assetPaths].map(async name => {
    if (!assetName.test(name) || basename(name) !== name) throw new Error('Invalid course attachment name.')
    const bytes = await readFile(bucketRoot + '/' + name)
    const [digest, ext] = name.split('.')
    if (createHash('sha256').update(bytes).digest('hex') !== digest) throw new Error('A course attachment checksum failed.')
    const contentType = Object.entries(extensions).find(([, value]) => ext === value)?.[0]
    if (!contentType) throw new Error('Unsupported course attachment type.')
    return { name, bytes, contentType }
  }))
  await privateJson(folder + '/documents.json', documents)
  console.log('Prepared ' + documents.length + ' documents and ' + assets.length + ' attachments.')
  for (const item of missingMedia) console.warn(item.title + ': ' + item.count + ' media source(s) could not be imported.')
  return { documents, assets }
}

async function publish() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_COURSE_ADMIN_KEY
  if (!url || !secret) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_COURSE_ADMIN_KEY in the private owner environment file.')
  const { documents, assets } = await prepare()
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  const bucket = await db.storage.getBucket(courseBucket)
  if (bucket.error || bucket.data.public) throw new Error('Apply the course migration and verify the course-materials bucket is private.')
  for (const { name, bytes, contentType } of assets) {
    const upload = await db.storage.from(courseBucket).upload(name, bytes, { contentType, upsert: true })
    if (upload.error) throw new Error('A course attachment upload failed. Course documents were not changed.')
  }
  const write = await db.from('course_documents').upsert(documents, { onConflict: 'id' })
  if (write.error) throw new Error('Could not save course documents. Check the migration and owner key permissions.')
  const saved = await db.from('course_documents').select('id').in('id', documents.map(entry => entry.id))
  if (saved.error || saved.data.length !== documents.length) throw new Error('The uploaded course could not be verified.')
  console.log('Published and verified ' + saved.data.length + ' private course documents.')
}

try {
  process.umask(0o077)
  await mkdir(bucketRoot, { recursive: true, mode: 0o700 })
  await chmod(folder, 0o700)
  if (process.argv[2] === '--stage') await stage()
  else if (process.argv[2] === '--publish') await publish()
  else if (process.argv[2] === '--prepare') await prepare()
  else throw new Error('Choose --stage, --prepare, or --publish.')
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Course import failed.')
  process.exitCode = 1
}
