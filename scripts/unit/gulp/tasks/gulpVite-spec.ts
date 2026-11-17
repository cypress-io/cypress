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

    it('waits for the vite ready line with the two spaces vite prints', () => {
      expect('  VITE v5.4.10  ready in 312 ms').to.match(readyLine)
    })

    it('waits for the vite ready line with a single space', () => {
      expect('VITE v5.4.10 ready in 312 ms').to.match(readyLine)
    })

    it('accepts single and double digit version parts', () => {
      expect('  VITE v6.0.0  ready in 1200 ms').to.match(readyLine)
      expect('  VITE v10.12.3  ready in 5 ms').to.match(readyLine)
    })

    it('does not match vite output that is not the ready line', () => {
      expect('  VITE v5.4.10  building for development...').not.to.match(readyLine)
      expect('ready in 312 ms').not.to.match(readyLine)
      expect('  VITE v  ready in 312 ms').not.to.match(readyLine)
      expect('  VITE v5.4.10  ready in ms').not.to.match(readyLine)
    })
  })
})
