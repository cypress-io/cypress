require('../spec_helper')
require(`../../lib/cwd`)

const Promise = require('bluebird')
const cache = require(`../../lib/cache`).cache
const { fs } = require(`../../lib/util/fs`)

describe('lib/cache', () => {
  beforeEach(async () => {
    await cache.remove()
  })

  context('projects', () => {
    describe('#insertProject', () => {
      it('inserts project by path', async () => {
        await cache.insertProject('foo/bar')
        const projects = await cache.__get('PROJECTS')

        expect(projects).to.deep.eq(['foo/bar'])
      })

      it('inserts project at the start', async () => {
        await cache.insertProject('foo')
        await cache.insertProject('bar')
        const projects = await cache.__get('PROJECTS')

        expect(projects).to.deep.eq(['bar', 'foo'])
      })

      it('can insert multiple projects in a row', async () => {
        await cache.insertProject('baz')
        await cache.insertProject('bar')
        await cache.insertProject('foo')
        const projects = await cache.__get('PROJECTS')

        expect(projects).to.deep.eq(['foo', 'bar', 'baz'])
      })

      it('moves project to start if it already exists', async () => {
        await cache.insertProject('foo')
        await cache.insertProject('bar')
        await cache.insertProject('baz')
        await cache.insertProject('bar')
        const projects = await cache.__get('PROJECTS')

        expect(projects).to.deep.eq(['bar', 'baz', 'foo'])
      })
    })

    describe('#removeProject', () => {
      it('removes project by path', async () => {
        await cache.insertProject('/Users/brian/app')
        await cache.removeProject('/Users/brian/app')
        const projects = await cache.__get('PROJECTS')

        expect(projects).to.deep.eq([])
      })
    })
  })

  describe('#getProjectRoots', () => {
    beforeEach(function () {
      this.statAsync = sinon.stub(fs, 'statAsync')
    })

    afterEach(function () {
      this.statAsync.restore()
    })

    it('returns an array of paths', async function () {
      this.statAsync.withArgs('/Users/brian/app').resolves()
      this.statAsync.withArgs('/Users/sam/app2').resolves()

      await cache.insertProject('/Users/brian/app')
      await cache.insertProject('/Users/sam/app2')
      const paths = await cache.getProjectRoots()

      expect(paths).to.deep.eq(['/Users/sam/app2', '/Users/brian/app'])
    })

    it('removes any paths which no longer exist on the filesystem', async function () {
      this.statAsync.withArgs('/Users/brian/app').resolves()
      this.statAsync.withArgs('/Users/sam/app2').rejects(new Error())

      await cache.insertProject('/Users/brian/app')
      await cache.insertProject('/Users/sam/app2')
      const paths = await cache.getProjectRoots()

      expect(paths).to.deep.eq(['/Users/brian/app'])
      // we have to wait on the write event because
      // of process.nextTick
      await Promise.delay(100)
      const projects = await cache.__get('PROJECTS')

      expect(projects).to.deep.eq(['/Users/brian/app'])
    })
  })
})

context('project preferences', () => {
  it('should insert a projects preferences into the cache', async () => {
    const testProjectTitle = 'launchpad'
    const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }

    await cache.insertProjectPreferences(testProjectTitle, testPreferences)
    const preferences = await cache.__get('PROJECT_PREFERENCES')

    expect(preferences[testProjectTitle]).to.deep.equal(testPreferences)
  })

  it('should insert multiple projects preferences into the cache', async () => {
    const testProjectTitle = 'launchpad'
    const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }
    const anotherTestProjectTitle = 'launchpad'
    const anotherTestPreferene = { testingType: 'e2e', browserPath: '/some/test/path' }

    await cache.insertProjectPreferences(testProjectTitle, testPreferences)
    await cache.insertProjectPreferences(anotherTestProjectTitle, anotherTestPreferene)
    const preferences = await cache.__get('PROJECT_PREFERENCES')

    expect(preferences).to.have.property(testProjectTitle)
    expect(preferences).to.have.property(anotherTestProjectTitle)
  })

  it('should clear the projects preferred preferences', async () => {
    const testProjectTitle = 'launchpad'
    const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }

    await cache.insertProjectPreferences(testProjectTitle, testPreferences)
    await cache.removeProjectPreferences(testProjectTitle)
    const preferences = await cache.__get('PROJECT_PREFERENCES')

    expect(preferences[testProjectTitle]).to.equal(null)
  })
})

context('#setUser / #getUser', () => {
  beforeEach(function () {
    this.user = {
      id: 1,
      name: 'brian',
      email: 'a@b.com',
      authToken: '1111-2222-3333-4444',
    }
  })

  it('sets and gets user', async function () {
    await cache.setUser(this.user)
    const user = await cache.getUser()

    expect(user).to.deep.eq(this.user)
  })
})

context('#removeUser', () => {
  it('sets user to empty object', async function () {
    await cache.setUser(this.user)
    await cache.removeUser()
    const user = await cache.getUser()

    expect(user).to.deep.eq({})
  })
})

context('queues public methods', () => {
  it('is able to write both values', async function () {
    await Promise.all([
      cache.setUser({ name: 'brian', authToken: 'auth-token-123' }),
      cache.insertProject('foo'),
    ])

    const json = await cache._read()

    expect(json).to.deep.eq({
      USER: {
        name: 'brian',
        authToken: 'auth-token-123',
      },
      PROJECTS: ['foo'],
      PROJECT_PREFERENCES: {},
      PROJECTS_CONFIG: {},
      COHORTS: {},
    })
  })
})

context('cohorts', () => {
  it('should get no cohorts when empty', async function () {
    const cohorts = await cache.getCohorts()

    expect(cohorts).to.deep.eq({})
  })

  it('should insert a cohort', async function () {
    const cohort = {
      name: 'cohort_id',
      cohort: 'A',
    }

    await cache.insertCohort(cohort)
    const cohorts = await cache.getCohorts()

    expect(cohorts).to.deep.eq({ [cohort.name]: cohort })
  })
})
