import { jsonBody, supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const db = await supabaseServer()
  if (!db) return Response.json({ configured: false, signedIn: false })
  const { data } = await db.auth.getUser()
  return Response.json({ configured: true, signedIn: Boolean(data.user) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const body = await jsonBody(request)
  if (!body) return Response.json({ error: 'Invalid request.' }, { status: 400 })
  const db = await supabaseServer()
  if (!db) return Response.json({ error: 'Set up Supabase to sign in.' }, { status: 503 })

  if (body.action === 'signout') {
    const { error } = await db.auth.signOut({ scope: 'local' })
    return error ? Response.json({ error: 'Could not sign out.' }, { status: 502 }) : Response.json({ signedIn: false })
  }
  if (body.action !== 'signin' || typeof body.email !== 'string' || typeof body.password !== 'string'
    || body.email.length > 254 || body.password.length > 1024) {
    return Response.json({ error: 'Enter your email and password.' }, { status: 400 })
  }
  const { error } = await db.auth.signInWithPassword({ email: body.email.trim(), password: body.password })
  return error ? Response.json({ error: 'Sign-in failed. Check your credentials and try again.' }, { status: 401 })
    : Response.json({ signedIn: true })
}
