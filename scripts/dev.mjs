import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Accept the managed preview launcher's Vite-style host and port arguments.
const args = process.argv.slice(2)
  .filter(argument => argument !== '--strictPort')
  .map(argument => argument === '--host' ? '--hostname' : argument)

const cli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url))
const child = spawn(process.execPath, [cli, 'dev', ...args], { stdio: 'inherit' })
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => child.kill(signal))
}
child.on('exit', code => { process.exitCode = code ?? 1 })
