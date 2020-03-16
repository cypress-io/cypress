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
      const names = {
        experimentalFoo: 'experiment foo',
        experimentalBar: 'experiment bar',
        experimentalBaz: 'experiment baz',
      }
      const summaries = {
        experimentalFoo: 'feature foo summary',
        experimentalBar: 'feature bar summary',
        // let the system use the default summary for other features
      }

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
      const result = getExperiments(project, names, summaries)
      const expected = {
        experimentalFoo: {
          value: true,
          enabled: false,
          key: 'experimentalFoo',
          name: 'experiment foo',
          summary: 'feature foo summary',
        },
        experimentalBar: {
          value: true,
          enabled: true,
          key: 'experimentalBar',
          name: 'experiment bar',
          summary: 'feature bar summary',
        },
        experimentalBaz: {
          value: 5,
          enabled: true,
          key: 'experimentalBaz',
          name: 'experiment baz',
          summary: 'top secret',
        },
      }

      expect(result).to.deep.equal(expected)
    })
  })
})
