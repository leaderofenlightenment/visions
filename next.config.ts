import type { NextConfig } from 'next'

const config: NextConfig = {
  poweredByHeader: false,
  // Use the TypeScript 5 compiler API for build-time checks.
  experimental: { useTypeScriptCli: false },
}

export default config
