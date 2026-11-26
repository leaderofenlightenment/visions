import { courseAccess, COURSE_ASSET_NAME, courseBucket, courseHeaders } from '@/lib/course-access'

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!COURSE_ASSET_NAME.test(name)) return new Response(null, { status: 404, headers: courseHeaders })
  const access = await courseAccess()
  if (!access.db) return new Response(null, { status: access.status, headers: courseHeaders })
  const streamable = /\.(png|jpg|jpeg|gif|webp|mp4|webm|mp3|wav|ogg|m4a)$/.test(name)
  const result = await access.db.storage.from(courseBucket).createSignedUrl(name, 900, streamable ? undefined : { download: true })
  if (result.error) {
    if (name.endsWith('.pdf')) {
      const attachment = await access.db.from('course_small_attachments').select('bytes').eq('name', name).maybeSingle()
      const hex: unknown = attachment.data?.bytes
      if (typeof hex === 'string' && /^\\x(?:[0-9a-f]{2})+$/i.test(hex)) {
        return new Response(Buffer.from(hex.slice(2), 'hex'), {
          headers: { ...courseHeaders, 'Content-Type': 'application/pdf', 'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'attachment; filename="visions-course.pdf"' },
        })
      }
    }
    return new Response(null, { status: 404, headers: courseHeaders })
  }
  return new Response(null, { status: 307, headers: { ...courseHeaders, Location: result.data.signedUrl } })
}
