require('../spec_helper')
require(`../../lib/cwd`)

const Promise = require('bluebird')
const { __get } = require('../../lib/cache')
const cache = require(`../../lib/cache`)
const { fs } = require(`../../lib/util/fs`)
const Fixtures = require('@tooling/system-tests')

describe('lib/cache', () => {
  beforeEach(() => {
    return cache.remove()
  })

  context('#_applyRewriteRules', () => {
    beforeEach(function () {
      return fs.readJsonAsync(Fixtures.path('server/old_cache.json')).then((oldCache) => {
        this.oldCache = oldCache
      })
    })

    it('converts object to array of paths', function () {
      const obj = cache._applyRewriteRules(this.oldCache)

      expect(obj).to.deep.eq({
        USER: { name: 'brian', sessionToken: 'abc123' },
        PROJECTS: [
          '/Users/bmann/Dev/examples-angular-circle-ci',
          '/Users/bmann/Dev/cypress-core-gui',
          '/Users/bmann/Dev/cypress-app/spec/fixtures/projects/todos',
        ],
      })
    })

    it('compacts non PATH values', () => {
      const obj = cache._applyRewriteRules({
        USER: {},
        PROJECTS: {
          one: { PATH: 'foo/bar' },
          two: { FOO: 'baz' },
        },
      })

      expect(obj).to.deep.eq({
        USER: {},
        PROJECTS: ['foo/bar'],
      })
    })

    it('converts session_token to session_token', () => {
      const obj = cache._applyRewriteRules({
        USER: { id: 1, session_token: 'abc123' },
        PROJECTS: [],
      })

      expect(obj).to.deep.eq({
        USER: { id: 1, sessionToken: 'abc123' },
        PROJECTS: [],
      })
    })
  })

  context('projects', () => {
    describe('#insertProject', () => {
      it('inserts project by path', () => {
        return cache.insertProject('foo/bar')
        .then(() => {
          return cache.__get('PROJECTS')
        }).then((projects) => {
          expect(projects).to.deep.eq(['foo/bar'])
        })
      })

      it('inserts project at the start', () => {
        return cache.insertProject('foo')
        .then(() => {
          return cache.insertProject('bar')
        }).then(() => {
          return cache.__get('PROJECTS')
        }).then((projects) => {
          expect(projects).to.deep.eq(['bar', 'foo'])
        })
      })

      it('can insert multiple projects in a row', () => {
        return Promise.all([
          cache.insertProject('baz'),
          cache.insertProject('bar'),
          cache.insertProject('foo'),
        ])
        .then(() => {
          return cache.__get('PROJECTS')
        }).then((projects) => {
          expect(projects).to.deep.eq(['foo', 'bar', 'baz'])
        })
      })

      it('moves project to start if it already exists', () => {
        return Promise.all([
          cache.insertProject('foo'),
          cache.insertProject('bar'),
          cache.insertProject('baz'),
        ])
        .then(() => {
          return cache.insertProject('bar')
        }).then(() => {
          return cache.__get('PROJECTS')
        }).then((projects) => {
          expect(projects).to.deep.eq(['bar', 'baz', 'foo'])
        })
      })
    })

    describe('#removeProject', () => {
      it('removes project by path', () => {
        return cache.insertProject('/Users/brian/app')
        .then(() => {
          return cache.removeProject('/Users/brian/app')
        }).then(() => {
          return cache.__get('PROJECTS').then((projects) => {
            expect(projects).to.deep.eq([])
          })
        })
      })
    })

    describe('#getProjectRoots', () => {
      beforeEach(function () {
        this.statAsync = sinon.stub(fs, 'statAsync')
      })

      it('returns an array of paths', function () {
        this.statAsync.withArgs('/Users/brian/app').resolves()
        this.statAsync.withArgs('/Users/sam/app2').resolves()

        return cache.insertProject('/Users/brian/app')
        .then(() => {
          return cache.insertProject('/Users/sam/app2')
        }).then(() => {
          return cache.getProjectRoots().then((paths) => {
            expect(paths).to.deep.eq(['/Users/sam/app2', '/Users/brian/app'])
          })
        })
      })

      it('removes any paths which no longer exist on the filesystem', function () {
        this.statAsync.withArgs('/Users/brian/app').resolves()
        this.statAsync.withArgs('/Users/sam/app2').rejects(new Error())

        return cache.insertProject('/Users/brian/app')
        .then(() => {
          return cache.insertProject('/Users/sam/app2')
        }).then(() => {
          return cache.getProjectRoots().then((paths) => {
            expect(paths).to.deep.eq(['/Users/brian/app'])
          })
        })
        .then(() => {
          // we have to wait on the write event because
          // of process.nextTick
          return Promise.delay(100).then(() => {
            return cache.__get('PROJECTS').then((projects) => {
              expect(projects).to.deep.eq(['/Users/brian/app'])
            })
          })
        })
      })
    })
  })

  context('project preferences', () => {
    it('should insert a projects preferences into the cache', () => {
      const testProjectTitle = 'launchpad'
      const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }

      return cache.insertProjectPreferences(testProjectTitle, testPreferences)
      .then(() => cache.__get('PROJECT_PREFERENCES'))
      .then((preferences) => {
        expect(preferences[testProjectTitle]).to.deep.equal(testPreferences)
      })
    })

    it('should insert multiple projects preferences into the cache', () => {
      const testProjectTitle = 'launchpad'
      const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }
      const anotherTestProjectTitle = 'launchpad'
      const anotherTestPreferene = { testingType: 'e2e', browserPath: '/some/test/path' }

      return cache.insertProjectPreferences(testProjectTitle, testPreferences)
      .then(() => cache.insertProjectPreferences(anotherTestProjectTitle, anotherTestPreferene))
      .then(() => cache.__get('PROJECT_PREFERENCES'))
      .then((preferences) => {
        expect(preferences).to.have.property(testProjectTitle)
        expect(preferences).to.have.property(anotherTestProjectTitle)
      })
    })

    it('should clear the projects preferred preferences', async () => {
      const testProjectTitle = 'launchpad'
      const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }

      return cache.insertProjectPreferences(testProjectTitle, testPreferences)
      .then(() => cache.removeProjectPreferences(testProjectTitle))
      .then(() => __get('PROJECT_PREFERENCES'))
      .then((preferences) => {
        expect(preferences[testProjectTitle]).to.equal(null)
      })
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

    it('sets and gets user', function () {
      return cache.setUser(this.user).then(() => {
        return cache.getUser().then((user) => {
          expect(user).to.deep.eq(this.user)
        })
      })
    })
  })

  context('#removeUser', () => {
    it('sets user to empty object', function () {
      return cache.setUser(this.user).then(() => {
        return cache.removeUser().then(() => {
          return cache.getUser().then((user) => {
            expect(user).to.deep.eq({})
          })
        })
      })
    })
  })

  context('queues public methods', () => {
    it('is able to write both values', () => {
      return Promise.all([
        cache.setUser({ name: 'brian', authToken: 'auth-token-123' }),
        cache.insertProject('foo'),
      ])
      .then(() => {
        return cache.read()
      }).then((json) => {
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
  })

  context('cohorts', () => {
    it('should get no cohorts when empty', () => {
      return cache.getCohorts().then((cohorts) => {
        expect(cohorts).to.deep.eq({})
      })
    })

    it('should insert a cohort', () => {
      const cohort = {
        name: 'cohort_id',
        cohort: 'A',
      }

      return cache.insertCohort(cohort).then(() => {
        return cache.getCohorts().then((cohorts) => {
          expect(cohorts).to.deep.eq({ [cohort.name]: cohort })
        })
      })
    })
  })
})
