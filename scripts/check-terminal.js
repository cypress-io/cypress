// checks if the terminal has all the variables set (especially on Linux Docker)

const assert = require('assert')
const isMainLinux = process.platform === 'linux' && process.arch === 'x64'

if (isMainLinux) {
  assert.ok(process.env.TERM === 'xterm', `process.env.TERM=${process.env.TERM} and must be set to "xterm" for Docker to work`)
}

assert.ok(process.env.COLUMNS === '100', `process.env.COLUMNS=${process.env.COLUMNS} must be set to 100 for snapshots to pass`)

console.log('stdout.isTTY?', process.stdout.isTTY)
console.log('stderr.isTTY?', process.stderr.isTTY)
