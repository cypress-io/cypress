import { printDetectedBrowsers } from '../../lib/print'
import * as detect from '../../lib/detect'
import { Browser } from '../../lib/types'

const sinon = require('sinon')
const la = require('lazy-ass')
const is = require('check-more-types')
const snapshot = require('snap-shot-it')

describe('printDetectedBrowsers', () => {
  let sandbox: any

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    const browsers: Browser[] = [{
      name: 'mock browser',
      displayName: 'Mock Browser',
      versionRegex: /foo (S+)/,
      profile: true,
      binary: 'mock',
      version: '1.2.3',
      majorVersion: '1',
      path: '/path/to/mock/browser'
    }]
    sandbox.stub(detect, 'detectBrowsers').resolves(browsers)
    sandbox.stub(console, 'log')
    sandbox.stub(console, 'table')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('is a function', () => {
    la(is.fn(printDetectedBrowsers))
  })

  it('prints detected browsers', () => {
    return printDetectedBrowsers()
      .then(() => {
        expect(console.log).to.have.been.calledWith('detected %s', '1 browser')
        snapshot('first table', console.table.firstCall.args)
        snapshot('second table', console.table.secondCall.args)
      })
  })
})
