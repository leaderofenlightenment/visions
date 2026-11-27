import { courseAccess, courseHeaders } from '@/lib/course-access'
import { courseMaterial } from '@/lib/course'
import { extractWorksheet } from '@/lib/course-worksheet'
import { guideAnswerLimit } from '@/lib/guided'
import { jsonBody } from '@/lib/supabase-server'

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: courseHeaders })
type Context = { params: Promise<{ id: string }> }

async function openMaterial(id: string) {
  if (!courseMaterial(id)) return { error: 'Course material not found.', status: 404 } as const
  const access = await courseAccess()
  if (!access.db) return access
  const result = await access.db.from('course_documents').select('markdown').eq('id', id).maybeSingle()
  if (result.error) return { error: 'Could not open the material. Try again shortly.', status: 503 } as const
  if (!result.data) return { error: 'This material has not been imported into VISIONS yet.', status: 404 } as const
  return { ...access, markdown: result.data.markdown as string } as const
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  const access = await openMaterial(id)
  if ('error' in access) return reply({ error: access.error }, access.status)
  const parts = extractWorksheet(access.markdown)
  if (!parts.some(part => part.prompt)) return reply({ parts, answers: [] })
  const result = await access.db.from('course_responses').select('prompt_id,answer').eq('owner_id', access.userId).eq('material_id', id)
  return reply({ parts, answers: result.data?.map(row => ({ promptId: row.prompt_id, answer: row.answer })) ?? [], writable: !result.error })
}

export async function POST(request: Request, { params }: Context) {
  const body = await jsonBody(request, 16000)
  const promptId = body?.promptId
  const answer = typeof body?.answer === 'string' ? body.answer.trim() : ''
  if (typeof promptId !== 'string' || !/^[a-f0-9]{24}$/.test(promptId)
    || typeof body?.answer !== 'string' || answer.length > guideAnswerLimit) return reply({ error: 'Invalid course answer.' }, 400)
  const { id } = await params
  const access = await openMaterial(id)
  if ('error' in access) return reply({ error: access.error }, access.status)
  if (!extractWorksheet(access.markdown).some(part => part.prompt?.id === promptId)) return reply({ error: 'This response space is no longer available.' }, 404)

  const write = answer
    ? await access.db.from('course_responses').upsert({
      owner_id: access.userId, material_id: id, prompt_id: promptId, answer, updated_at: new Date().toISOString(),
    }, { onConflict: 'owner_id,material_id,prompt_id' })
    : await access.db.from('course_responses').delete().eq('owner_id', access.userId).eq('material_id', id).eq('prompt_id', promptId)
  if (write.error) return reply({ error: 'Could not save your answer. Try again shortly.' }, 503)
  return reply({ promptId, answer })
}
