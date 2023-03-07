const fs = require('fs').promises
const sinon = require('sinon')
const { expect } = require('chai')
const { _checkCanaries } = require('../circle-env')

describe('circle-env', () => {
  let cachedEnv = { ...process.env }

  afterEach(() => {
    sinon.restore()
    Object.assign(process.env, cachedEnv)
  })

  beforeEach(() => {
    delete process.env.COPY_CIRCLE_ARTIFACTS
    process.env.CI = 'true'
    process.env.CIRCLE_INTERNAL_CONFIG = '/foo.json'
  })

  context('with missing canaries', () => {
    it('fails', async () => {
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

    context('with no circleEnv', () => {
      beforeEach(() => {
        sinon.stub(fs, 'readFile')
        .withArgs('/foo.json').resolves(JSON.stringify({
          Dispatched: { TaskInfo: { Environment: {} } },
        }))
      })

      it('passes', async () => {
        await _checkCanaries()
      })

      it('fails if COPY_CIRCLE_ARTIFACTS does exist', async () => {
        process.env.COPY_CIRCLE_ARTIFACTS = 'foo'

        try {
          await _checkCanaries()
          throw new Error('should not reach')
        } catch (err) {
          expect(err.message).to.include('COPY_CIRCLE_ARTIFACTS is set, but circleEnv is empty')
        }
      })
    })
  })

  it('passes with canaries', async () => {
    sinon.stub(fs, 'readFile')
    .withArgs('/foo.json').resolves(JSON.stringify({
      Dispatched: { TaskInfo: { Environment: { MAIN_CANARY: 'true', CONTEXT_CANARY: 'true' } } },
    }))

    await _checkCanaries()
  })
})
