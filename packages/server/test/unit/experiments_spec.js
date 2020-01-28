require('../spec_helper')

const { parseFlags, getExperiments, EXPERIMENTS_ENV_FLAG_NAME, formatExperiments } = require(`${root}lib/experiments.ts`)
const mockedEnv = require('mocked-env')

describe('experiments', () => {
  context('#parseFlags', () => {
    it('parses multiple flags correctly', () => {
      const s = 'flagA,flagB=false,flagC=true'
      const parsed = parseFlags(s)
      const expected = [
        { name: 'flagA', value: true },
        { name: 'flagB', value: false },
        { name: 'flagC', value: true },
      ]

      expect(parsed).to.deep.equal(expected)
    })

    it('parses flags with spaces correctly', () => {
      const s = 'flagA, flagB = false, flagC = true'
      const parsed = parseFlags(s)
      const expected = [
        { name: 'flagA', value: true },
        { name: 'flagB', value: false },
        { name: 'flagC', value: true },
      ]

      expect(parsed).to.deep.equal(expected)
    })
  })

  context('#formatExperiments', () => {
    it('forms single string with all values', () => {
      const exp = {
        featureA: true,
        featureB: false,
        featureC: true,
      }
      const result = formatExperiments(exp)

      expect(result).to.equal('featureA=true,featureB=false,featureC=true')
    })
  })

  context('#getExperiments', () => {
    it('is a string env variable name', () => {
      expect(EXPERIMENTS_ENV_FLAG_NAME).to.be.a('string').and.be.not.empty
    })

    it('returns defaults if there are no experiments', () => {
      const restore = mockedEnv({
        [EXPERIMENTS_ENV_FLAG_NAME]: undefined,
      })

      const experiments = getExperiments()

      expect(experiments).to.deep.equal({
        componentTesting: false,
      })

      restore()
    })

    it('enables component testing and ignores other flags', () => {
      const restore = mockedEnv({
        [EXPERIMENTS_ENV_FLAG_NAME]: 'componentTesting,foo,bar=true',
      })

      const experiments = getExperiments()

      expect(experiments).to.deep.equal({
        componentTesting: true,
      })

      restore()
    })

    it('allows boolean value', () => {
      const restore = mockedEnv({
        [EXPERIMENTS_ENV_FLAG_NAME]: 'componentTesting=true,foo,bar=true',
      })

      const experiments = getExperiments()

      expect(experiments).to.deep.equal({
        componentTesting: true,
      })

      restore()
    })
  })
})
