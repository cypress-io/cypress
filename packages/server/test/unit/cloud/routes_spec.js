require('../../spec_helper')

describe('lib/cloud/routes', () => {
  const routes = () => {
    delete require.cache[require.resolve(`../../../lib/cloud/routes`)]

    return require(`../../../lib/cloud/routes`)
  }

  describe('api routes', () => {
    const apiRoutes = routes().apiRoutes

    it('api', () => {
      expect(apiRoutes.api()).to.eq('http://localhost:1234/')
    })

    it('auth', () => {
      expect(apiRoutes.auth()).to.eq('http://localhost:1234/auth')
    })

    it('ping', () => {
      expect(apiRoutes.ping()).to.eq('http://localhost:1234/ping')
    })

    it('runs', () => {
      expect(apiRoutes.runs()).to.eq('http://localhost:1234/runs')
    })

    it('instances', () => {
      expect(apiRoutes.instances(123)).to.eq('http://localhost:1234/runs/123/instances')
    })

    it('instanceTests', () => {
      expect(apiRoutes.instanceTests(123)).to.eq('http://localhost:1234/instances/123/tests')
    })

    it('instanceResults', () => {
      expect(apiRoutes.instanceResults(123)).to.eq('http://localhost:1234/instances/123/results')
    })

    it('exceptions', () => {
      expect(apiRoutes.exceptions()).to.eq('http://localhost:1234/exceptions')
    })
  })

  describe('api url', () => {
    let oldCypressInternalEnv

    beforeEach(() => {
      oldCypressInternalEnv = process.env.CYPRESS_INTERNAL_ENV
    })

    afterEach(() => {
      process.env.CYPRESS_INTERNAL_ENV = oldCypressInternalEnv
    })

    it('supports development environment', () => {
      process.env.CYPRESS_INTERNAL_ENV = 'development'

      expect(routes().apiRoutes.api()).to.eq('http://localhost:1234/')
    })

    it('supports staging environment', () => {
      process.env['CYPRESS_INTERNAL_ENV'] = 'staging'

      expect(routes().apiRoutes.api()).to.eq('https://api-staging.cypress.io/')
    })

    it('supports production environment', () => {
      process.env.CYPRESS_INTERNAL_ENV = 'production'

      expect(routes().apiRoutes.api()).to.eq('https://api.cypress.io/')
    })

    it('supports test environment', () => {
      process.env.CYPRESS_INTERNAL_ENV = 'test'

      expect(routes().apiRoutes.api()).to.eq('http://localhost:1234/')
    })

    it('defaults to development', () => {
      process.env.CYPRESS_CONFIG_ENV = undefined
      process.env.CYPRESS_INTERNAL_ENV = undefined

      expect(routes().apiRoutes.api()).to.eq('http://localhost:1234/')
    })

    it('honors CYPRESS_CONFIG_ENV', () => {
      process.env.CYPRESS_CONFIG_ENV = 'staging'
      process.env.CYPRESS_INTERNAL_ENV = 'test'

      expect(routes().apiRoutes.api()).to.eq('https://api-staging.cypress.io/')
    })
  })
})
