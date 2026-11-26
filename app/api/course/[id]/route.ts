import { courseAccess, courseHeaders } from '@/lib/course-access'
import { courseMaterial } from '@/lib/course'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!courseMaterial(id)) return Response.json({ error: 'Course material not found.' }, { status: 404, headers: courseHeaders })
  const access = await courseAccess()
  if (!access.db) return Response.json({ error: access.error }, { status: access.status, headers: courseHeaders })
  const result = await access.db.from('course_documents').select('markdown').eq('id', id).maybeSingle()
  if (result.error) return Response.json({ error: 'Could not open the material. Try again shortly.' }, { status: 503, headers: courseHeaders })
  if (!result.data) return Response.json({ error: 'This material has not been imported into VISIONS yet.' }, { status: 404, headers: courseHeaders })
  return Response.json(result.data, { headers: courseHeaders })
}
