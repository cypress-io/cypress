require('../spec_helper')

const { getExperiments, formatExperiments } = require(`${root}lib/experiments.ts`)

describe('experiments', () => {
  context('#formatExperiments', () => {
    it('forms single string with all values', () => {
      const exp = {
        featureA: { value: true },
        featureB: { value: false },
        featureC: { value: true },
      }
      const result = formatExperiments(exp)

      expect(result).to.equal('featureA=true,featureB=false,featureC=true')
    })
  })

  context('#getExperiments', () => {
    it('returns enabled experiments', () => {
      const project = {
        resolvedConfig: {
          // nope, experiment is not enabled
          experimentalFoo: {
            value: true,
            from: 'default',
          },
          // enabled
          experimentalBar: {
            value: true,
            from: 'config',
          },
          // enabled
          experimentalBaz: {
            value: 5,
            from: 'plugins',
          },
        },
      }
      const result = getExperiments(project)
      const expected = {
        experimentalFoo: {
          value: true,
          enabled: false,
        },
        experimentalBar: {
          value: true,
          enabled: true,
        },
        experimentalBaz: {
          value: 5,
          enabled: true,
        },
      }

      expect(result).to.deep.equal(expected)
    })
  })
})
