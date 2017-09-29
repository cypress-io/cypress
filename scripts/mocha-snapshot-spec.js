const execa = require('execa-wrap')
const snapshot = require('snap-shot-it')
const { join } = require('path')

function normalize (s) {
  // assuming the test command tests this spec file
  const scriptPath = join('scripts', 'spec.js')
  return s.replace(process.cwd(), '<folder path>')
    .replace(scriptPath, '<spec relative path>')
}

/* eslint-env mocha */
it('captures mocha output', () => {
  return execa('npm', ['run', 'test-mocha'])
    .then(normalize)
    .then(snapshot)
})
