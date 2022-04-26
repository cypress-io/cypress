const fs = require('fs').promises
const sinon = require('sinon')
const { expect } = require('chai')
const { _checkCanaries } = require('../circle-env')

describe('circle-env', () => {
  let cachedEnv = { ...process.env }

  afterEach(() => Object.assign(process.env, cachedEnv))

  beforeEach(() => {
    process.env.CI = 'true'
    process.env.CIRCLE_INTERNAL_CONFIG = '/foo.json'
  })

  it('fails with missing canaries', async () => {
    sinon.stub(fs, 'readFile')
    .withArgs('/foo.json').resolves(JSON.stringify({
      Dispatched: { TaskInfo: { Environment: { somekey: 'someval' } } },
    }))

    try {
      await _checkCanaries()
      throw new Error('should not reach')
    } catch (err) {
      expect(err.message).to.include('Missing MAIN_CANARY')
    }
  })

  it('passes with canaries', async () => {
    sinon.stub(fs, 'readFile')
    .withArgs('/foo.json').resolves(JSON.stringify({
      Dispatched: { TaskInfo: { Environment: { MAIN_CANARY: 'true', CONTEXT_CANARY: 'true' } } },
    }))

    await _checkCanaries()
  })
})
