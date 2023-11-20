import { spawn } from 'child_process'
import path from 'path'
import * as url from 'url'

// eslint-disable-next-line no-console
console.log('parent', process.pid, process.ppid, process.env.PARENT_CYPRESS_API_URL)

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const proc = spawn('node', ['child.js'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  env: {
    ...process.env,
    CYPRESS_API_URL: process.env.PARENT_CYPRESS_API_URL,
  },
})

const timeout = setTimeout(() => {

}, 1e9)

process.on('SIGTERM', () => {
  clearTimeout(timeout)
  proc.kill()
})
