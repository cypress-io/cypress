import { expect } from 'chai'
import sinon from 'sinon'

const proxyquire = require('proxyquire').noCallThru()

describe('gulpVite', () => {
  context('viteApp in vite dev mode', () => {
    let readyLine: RegExp

    before(async () => {
      const spawnUntilMatch = sinon.stub().resolves()
      const { viteApp } = proxyquire('../../../gulp/tasks/gulpVite', {
        '../utils/childProcessUtils': { spawned: sinon.stub(), spawnUntilMatch },
      })

      const previous = process.env.CYPRESS_INTERNAL_VITE_DEV

      process.env.CYPRESS_INTERNAL_VITE_DEV = '1'

      try {
        await viteApp()
      } finally {
        if (previous === undefined) {
          delete process.env.CYPRESS_INTERNAL_VITE_DEV
        } else {
          process.env.CYPRESS_INTERNAL_VITE_DEV = previous
        }
      }

      readyLine = spawnUntilMatch.firstCall.args[1].match
    })

    // Captured from the repo's Vite (8.1.5) by running `vite --port 0 --clearScreen false` against an
    // empty index.html, with the ANSI codes stripped by util.stripVTControlCharacters as spawnUntilMatch does
    it('waits for the ready line vite prints', () => {
      expect('  VITE v8.1.5  ready in 380 ms').to.match(readyLine)
    })

    // The two lines after the ready line in the same `vite` dev capture, and the first line of `vite build`
    it('does not match other lines vite prints', () => {
      expect('  ➜  Local:   http://localhost:5173/').not.to.match(readyLine)
      expect('  ➜  Network: use --host to expose').not.to.match(readyLine)
      expect('vite v8.1.5 building client environment for production...').not.to.match(readyLine)
    })

    context('synthetic lines that only follow the ready line format', () => {
      it('accepts a single space before ready', () => {
        expect('VITE v5.4.10 ready in 312 ms').to.match(readyLine)
      })

      it('accepts single and double digit version parts', () => {
        expect('  VITE v6.0.0  ready in 1200 ms').to.match(readyLine)
        expect('  VITE v10.12.3  ready in 5 ms').to.match(readyLine)
      })

      it('rejects a ready line without a version or a duration', () => {
        expect('ready in 380 ms').not.to.match(readyLine)
        expect('  VITE v  ready in 380 ms').not.to.match(readyLine)
        expect('  VITE v8.1.5  ready in ms').not.to.match(readyLine)
      })
    })
  })
})
