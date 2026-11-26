import { courseAccess, COURSE_ASSET_NAME, courseBucket, courseHeaders } from '@/lib/course-access'

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!COURSE_ASSET_NAME.test(name)) return new Response(null, { status: 404, headers: courseHeaders })
  const access = await courseAccess()
  if (!access.db) return new Response(null, { status: access.status, headers: courseHeaders })
  const streamable = /\.(png|jpg|jpeg|gif|webp|mp4|webm|mp3|wav|ogg|m4a)$/.test(name)
  const result = await access.db.storage.from(courseBucket).createSignedUrl(name, 900, streamable ? undefined : { download: true })
  if (result.error) return new Response(null, { status: 404, headers: courseHeaders })
  return new Response(null, { status: 307, headers: { ...courseHeaders, Location: result.data.signedUrl } })
}
