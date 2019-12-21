// This file exists because mocha doesn't return non-zero value when there is a failed test.
// When https://github.com/mochajs/mocha/issues/3893 is fixed, it will be removed.

const { spawn } = require('child_process')
const Promise = require('bluebird')

// Test result on console.
let log = ''
const proc = spawn(`node`, ['./node_modules/.bin/mocha', 'src/**/*.spec.*'], {})

proc.stdout.on('data', (data) => {
  log += data
})

proc.stdout.on('end', async () => {
  await Promise.delay(500)

  const result = log.match(/\d+ passing.*\n\s*(\d+) failing/)
  const numFailing = result && parseInt(result[1], 10)

  if (!isNaN(numFailing)) {
    process.exit(numFailing)
  }

  process.exit(0)
})

// Show result on console.
spawn(`node`, ['./node_modules/.bin/mocha', '"src/*.spec.*" "src/**/*.spec.*"'], {
  stdio: 'inherit',
  shell: true,
})
