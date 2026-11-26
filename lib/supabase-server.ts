import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  const jar = await cookies()
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: updates => updates.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  })
}

export async function jsonBody(request: Request): Promise<Record<string, unknown> | null> {
  if (request.headers.get('origin') !== new URL(request.url).origin) return null
  if (!request.headers.get('content-type')?.startsWith('application/json')) return null
  const reader = request.body?.getReader()
  if (!reader) return null
  let size = 0
  let text = ''
  const decoder = new TextDecoder()
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 65536) {
        await reader.cancel()
        return null
      }
      text += decoder.decode(value, { stream: true })
    }
    const data: unknown = JSON.parse(text + decoder.decode())
    return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : null
  } catch {
    return null
  }
}
