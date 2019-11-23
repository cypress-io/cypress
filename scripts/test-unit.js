// This file exists because mocha doesn't return non-zero value when there is a failed test.
// When https://github.com/mochajs/mocha/issues/3893 is fixed, it will be removed.

const { spawn } = require('child_process')

// Test result on console.
let log = ''
const proc = spawn(`node`, ['./node_modules/.bin/mocha', 'src/**/*.spec.*'], {
})

proc.stdout.on('data', (data) => {
  log += data
})

proc.stdout.on('end', async () => {
  await sleep(500)

  if (log.match(/[0-9]+ passing.*\n\s*[0-9]+ failing/g) !== null) {
    process.exit(1)
  }

  process.exit(0)
})

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Show result on console.
spawn(`node`, ['./node_modules/.bin/mocha', 'src/**/*.spec.*'], {
  stdio: 'inherit',
  shell: true,
})
