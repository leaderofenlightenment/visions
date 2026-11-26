import type { Metadata } from 'next'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600-italic.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Nexus | VISIONS Reality Codex',
  description: 'The Digital Liturgy Masterplan. Ancient wisdom. Modern intelligence.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
