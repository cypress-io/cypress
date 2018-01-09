const execa = require('execa-wrap')
const snapshot = require('snap-shot-it')

function normalize (s) {
  // assuming the test command tests this spec file
  // and the command is hardcoded in package.json
  // using forward slashes
  return s.replace(process.cwd(), '<folder path>')
  .replace(/passing \(\d+ms\)/, 'passing (<time>ms)')
  .replace(/cypress@(\d+\.\d+\.\d+)/, 'cypress@x.y.z')
  .replace(/✓/g, 'Y') // Mocha check on Mac
  .replace(/√/g, 'Y') // Mocha check on Windows
}

/* eslint-env mocha */
it('captures mocha output', () => {
  return execa('npm', ['run', 'test-mocha'])
  .then(normalize)
  .then(snapshot)
})
