import { courseMaterials } from '../lib/course'

const known = new Set(courseMaterials.map(material => material.id))
const notionId = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/gi
const textEntities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }
const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => textEntities[entity])
export const assetName = /^[a-f0-9]{64}\.[a-z0-9]{1,8}$/
export const courseBucket = 'course-materials'

function linkTitle(title: string) {
  return title.trim().replace(/([\\\[\]])/g, '\\$1').replace(/\s+/g, ' ')
}

function localTarget(href: string) {
  try {
    const target = new URL(href)
    if (!/^https?:$/.test(target.protocol) || target.searchParams.has('X-Amz-Signature')) return ''
    if (!/(^|\.)(notion\.(com|so|site))$/i.test(target.hostname)) return href
    const ids = target.pathname.match(notionId) ?? []
    const id = ids.at(-1)?.replaceAll('-', '').toLowerCase()
    if (id && known.has(id)) return '#course-material=' + id
  } catch { /* Relative links remain plain text. */ }
  return ''
}

export function normalizeCourse(body: string, media: Record<string, string>) {
  const missing = new Set<string>()
  function mediaLink(raw: string, caption: string, image = false) {
    const name = media[raw] ?? media[decode(raw)]
    const title = linkTitle(caption || 'Course attachment')
    if (name && assetName.test(name)) return (image ? '!' : '') + '[' + title + '](/api/course/media/' + name + ')'
    if (!image && /^https?:\/\//i.test(raw) && localTarget(raw) === raw && !/[\s<>]/.test(raw)) return '[' + title + '](<' + raw + '>)'
    missing.add(raw || '(empty media source)')
    return '_' + title + ' unavailable in the source export._'
  }

  const result = body
    .replace(/<(?:page|database|mention-page)\b([^>]*)>([\s\S]*?)<\/(?:page|database|mention-page)>/gi, (_, attributes: string, label: string) => {
      const raw = attributes.match(/\b(?:url|href)="([^"]*)"/)?.[1]
      const href = raw ? localTarget(decode(raw)) : ''
      const title = linkTitle(decode(label.replace(/<[^>]*>/g, '')))
      return '\n\n' + (href ? '[' + title + '](<' + href + '>)' : title) + '\n\n'
    })
    .replace(/<(file|video|audio|pdf|image|embed)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi,
      (_, type: string, attrs: string, caption: string | undefined) => {
        const raw = attrs.match(/\b(?:source|src|url)="([^"]*)"/)?.[1] ?? ''
        return '\n\n' + mediaLink(raw, caption ?? (type === 'embed' ? 'Embedded resource' : ''), type === 'image') + '\n\n'
      })
    .replace(/(!?)\[([^\]\n]*)\]\((<?)((?:https?:\/\/|notion-file-block:\/\/)[^\s)>]+)>?\)/gi,
      (token, image: string, title: string, _opening: string, raw: string) => {
        if (raw.startsWith('notion-file-block:') || media[raw]) return mediaLink(raw, title, image === '!')
        const href = localTarget(raw)
        if (image) return mediaLink(raw, title, true)
        if (href === raw) return token
        return href ? '[' + title + '](<' + href + '>)' : title
      })
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, content: string) => '\n\n' + '#'.repeat(Number(level)) + ' ' + content.trim() + '\n\n')
    .replace(/<(?:callout|toggle)\b[^>]*>/gi, '\n\n')
    .replace(/<\/(?:callout|toggle)>/gi, '\n\n')
    .replace(/<li\b[^>]*>\s*<\/li>/gi, '\n- ____________________')
    .replace(/<li\b[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '')
    .replace(/<\/?(?:ul|ol|columns?|span|u)\b[^>]*>/gi, '')
    .replace(/<\/?(?:p|br)\b[^>]*>/gi, '\n\n')
    .replace(/<\/?(?:b|strong)\b[^>]*>/gi, '**')
    .replace(/<\/?(?:i|em)\b[^>]*>/gi, '*')
    .replace(/<\/?code\b[^>]*>/gi, '`')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { markdown: result || '_This material is a blank template. Apply it in VISIONS to start your own entry._', missing: [...missing] }
}

export function templateMarkdown(title: string, fields: { name: string; type: string }[]) {
  const columns = fields.map(field => '| ' + field.name.replaceAll('|', '\\|').replaceAll('\n', ' ') + ' | ' + field.type.replaceAll('_', ' ') + ' |').join('\n')
  return [
    '## ' + title,
    'Use this template to start your own record. Choose **Apply in VISIONS** to connect it to your framework.',
    ...(fields.length ? ['### Template fields\n\n| Field | Type |\n| --- | --- |\n' + columns] : []),
  ].join('\n\n')
}
