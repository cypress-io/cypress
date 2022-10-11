require('../../spec_helper')

const { apiRoutes } = require('../../../lib/cloud/routes')

describe('lib/cloud/routes', () => {
  describe('api routes', () => {
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

    it('projects', () => {
      expect(apiRoutes.projects()).to.eq('http://localhost:1234/projects')
    })

    it('project', () => {
      expect(apiRoutes.project('123-foo')).to.eq('http://localhost:1234/projects/123-foo')
    })

    it('exceptions', () => {
      expect(apiRoutes.exceptions()).to.eq('http://localhost:1234/exceptions')
    })
  })
})
