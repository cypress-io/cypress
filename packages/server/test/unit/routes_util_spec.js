require('../spec_helper')

const { apiRoutes, onRoutes } = require(`${root}/lib/util/routes`)

describe('lib/util/routes', () => {
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

    it('instance', () => {
      expect(apiRoutes.instance(123)).to.eq('http://localhost:1234/instances/123')
    })

    it('projects', () => {
      expect(apiRoutes.projects()).to.eq('http://localhost:1234/projects')
    })

    it('project', () => {
      expect(apiRoutes.project('123-foo')).to.eq('http://localhost:1234/projects/123-foo')
    })

    it('projectRuns', () => {
      expect(apiRoutes.projectRuns('123-foo')).to.eq('http://localhost:1234/projects/123-foo/runs')
    })

    it('projectToken', () => {
      expect(apiRoutes.projectToken('123-foo')).to.eq('http://localhost:1234/projects/123-foo/token')
    })

    it('exceptions', () => {
      expect(apiRoutes.exceptions()).to.eq('http://localhost:1234/exceptions')
    })
  })

  describe('on routes', () => {
    it('releaseNotes', () => {
      expect(onRoutes.releaseNotes('1.2.3')).to.eq('http://localhost:8080/release-notes/1.2.3')
    })
  })
})
