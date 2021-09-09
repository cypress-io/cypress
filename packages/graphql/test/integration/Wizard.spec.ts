import snapshot from 'snap-shot-it'
import { expect } from 'chai'
import { Wizard } from '../../src'
import { initGraphql, makeRequest, TestContext } from './utils'

describe('Wizard', () => {
  describe('sampleCode', () => {
    it('returns null when bundler is set but framework is null', async () => {
      const wizard = new Wizard(new TestContext())

      wizard.setTestingType('component')
      wizard.setBundler('webpack')

      const context = new TestContext({ wizard })
      const { endpoint } = await initGraphql(context)

      const result = await makeRequest(endpoint, `
        {
          wizard {
            sampleCode(lang: ts)
          }
        }
      `)

      expect(result.wizard.sampleCode).to.be.null
    })

    it('returns null when framework is set but bundler is null', async () => {
      const wizard = new Wizard(new TestContext())

      wizard.setTestingType('component')
      wizard.setFramework('react')

      const context = new TestContext({ wizard })
      const { endpoint } = await initGraphql(context)

      const result = await makeRequest(endpoint, `
        {
          wizard {
            sampleCode(lang: ts)
          }
        }
      `)

      expect(result.wizard.sampleCode).to.be.null
    })

    it('returns sampleCode when framework and bundler is set', async () => {
      const wizard = new Wizard(new TestContext())

      wizard.setTestingType('component')
      wizard.setFramework('cra')
      wizard.setBundler('webpack')

      const context = new TestContext({ wizard })
      const { endpoint } = await initGraphql(context)

      const result = await makeRequest(endpoint, `
        {
          wizard {
            sampleCode(lang: ts)
          }
        }
      `)

      snapshot(result)
    })
  })
})
