import { supabaseServer } from './supabase-server'

export const courseBucket = 'course-materials'
export const COURSE_ASSET_NAME = /^[a-f0-9]{64}\.[a-z0-9]{1,8}$/
export const courseHeaders = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }

export async function courseAccess() {
  const db = await supabaseServer()
  if (!db) return { error: 'Course hosting is not configured.', status: 503 } as const
  const { data } = await db.auth.getUser()
  if (!data.user) return { error: 'Sign in to read the course in VISIONS.', status: 401 } as const

  const enrollment = await db.from('course_enrollments').select('user_id')
    .eq('user_id', data.user.id).maybeSingle()
  if (enrollment.error) return { error: 'Course access could not be checked. Try again shortly.', status: 503 } as const
  if (!enrollment.data) return { error: 'Your account is not enrolled. Contact the course owner for access.', status: 403 } as const
  return { db, userId: data.user.id } as const
}
