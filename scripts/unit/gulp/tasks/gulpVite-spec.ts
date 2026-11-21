import { expect } from 'chai'
import util from 'util'

import { VITE_READY } from '../../../gulp/tasks/gulpVite'

// The startup banner `vite` prints for packages/launchpad, escape codes included.
const VITE_BANNER = '\n  \u001b[32m\u001b[1mVITE\u001b[22m v8.1.5\u001b[39m  \u001b[2mready in \u001b[0m\u001b[1m1139\u001b[22m\u001b[2m\u001b[0m ms\u001b[22m\n\n'

const OLD_VITE_READY = /VITE v(\d+.)+ ready in \d+/

describe('gulpVite VITE_READY', () => {
  // spawnUntilMatch strips escape codes before matching.
  const stripped = util.stripVTControlCharacters(VITE_BANNER)

  ;[
    ['the stripped banner', stripped, true],
    ['a two-part version', '  VITE v8.1  ready in 312 ms', true],
    ['a major-only version', '  VITE v8  ready in 312 ms', true],
    ['the banner with escape codes left in', VITE_BANNER, false],
    ['the local URL line', '  ➜  Local:   http://localhost:3333/', false],
    ['a prerelease version', '  VITE v8.0.0-beta.1  ready in 312 ms', false],
    ['an empty chunk', '', false],
  ].forEach(([label, chunk, expected]) => {
    it(`${expected ? 'matches' : 'does not match'} ${label}, like the previous pattern`, () => {
      expect(VITE_READY.test(chunk as string)).to.equal(expected)
      expect(OLD_VITE_READY.test(chunk as string)).to.equal(expected)
    })
  })

  it('matches a banner with a single space before "ready", which the previous pattern missed', () => {
    expect(VITE_READY.test('VITE v8.1.5 ready in 312 ms')).to.be.true
  })

  it('rejects a 50,000-character version that never reaches "ready" in linear time', () => {
    const chunk = `VITE v0${'E000'.repeat(12_500)}`
    const start = performance.now()

    expect(VITE_READY.test(chunk)).to.be.false
    expect(performance.now() - start).to.be.lessThan(200)
  })
})
