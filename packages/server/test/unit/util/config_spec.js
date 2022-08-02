require('../../spec_helper')

const configUtil = require(`../../../lib/util/config`)

describe('lib/util/config', () => {
  context('.isDefault', () => {
    it('returns true if value is default value', () => {
      const options = {
        resolved: {
          baseUrl: { from: 'default' },
        },
      }

      expect(configUtil.isDefault(options, 'baseUrl')).to.be.true
    })

    it('returns false if value is not default value', () => {
      const options = {
        resolved: {
          baseUrl: { from: 'cli' },
        },
      }

      expect(configUtil.isDefault(options, 'baseUrl')).to.be.false
    })
  })

  context('.getProcessEnvVars', () => {
    it('returns process envs prefixed with cypress', () => {
      const envs = {
        CYPRESS_BASE_URL: 'value',
        RANDOM_ENV: 'ignored',
      }

      expect(configUtil.getProcessEnvVars(envs)).to.deep.eq({
        BASE_URL: 'value',
      })
    })

    it('does not return CYPRESS_RESERVED_ENV_VARS', () => {
      const envs = {
        CYPRESS_INTERNAL_ENV: 'value',
      }

      expect(configUtil.getProcessEnvVars(envs)).to.deep.eq({})
    })
  })
})
