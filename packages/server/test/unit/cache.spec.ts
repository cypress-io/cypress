import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { cache } from '../../lib/cache'
import { fs } from '../../lib/util/fs'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
  await cache.remove()
})

describe('lib/cache', () => {
  beforeEach(async () => {
    await cache.remove()
  })

  describe('projects', () => {
    describe('#insertProject', () => {
      it('inserts project by path', async () => {
        await cache.insertProject('foo/bar')
        const projects = await cache.__get('PROJECTS')

        expect(projects).toStrictEqual(['foo/bar'])
      })

      it('inserts project at the start', async () => {
        await cache.insertProject('foo')
        await cache.insertProject('bar')
        const projects = await cache.__get('PROJECTS')

        expect(projects).toStrictEqual(['bar', 'foo'])
      })

      it('can insert multiple projects in a row', async () => {
        await cache.insertProject('baz')
        await cache.insertProject('bar')
        await cache.insertProject('foo')
        const projects = await cache.__get('PROJECTS')

        expect(projects).toStrictEqual(['foo', 'bar', 'baz'])
      })

      it('moves project to start if it already exists', async () => {
        await cache.insertProject('foo')
        await cache.insertProject('bar')
        await cache.insertProject('baz')
        await cache.insertProject('bar')
        const projects = await cache.__get('PROJECTS')

        expect(projects).toStrictEqual(['bar', 'baz', 'foo'])
      })
    })

    describe('#removeProject', () => {
      it('removes project by path', async () => {
        await cache.insertProject('/Users/brian/app')
        await cache.removeProject('/Users/brian/app')
        const projects = await cache.__get('PROJECTS')

        expect(projects).toStrictEqual([])
      })
    })
  })

  describe('#getProjectRoots', () => {
    let statAsync: MockInstance

    // Mirrors sinon `withArgs(path)`: paths not listed answer undefined.
    function statByPath (results: Record<string, () => Promise<unknown>>) {
      statAsync.mockImplementation((path: string) => results[path]?.())
    }

    beforeEach(() => {
      statAsync = vi.spyOn(fs, 'statAsync').mockImplementation(() => undefined as any)
    })

    afterEach(() => {
      statAsync.mockRestore()
    })

    it('returns an array of paths', async () => {
      statByPath({
        '/Users/brian/app': () => Promise.resolve(),
        '/Users/sam/app2': () => Promise.resolve(),
      })

      await cache.insertProject('/Users/brian/app')
      await cache.insertProject('/Users/sam/app2')
      const paths = await cache.getProjectRoots()

      expect(paths).toStrictEqual(['/Users/sam/app2', '/Users/brian/app'])
    })

    it('removes any paths which no longer exist on the filesystem', async () => {
      statByPath({
        '/Users/brian/app': () => Promise.resolve(),
        '/Users/sam/app2': () => Promise.reject(new Error()),
      })

      await cache.insertProject('/Users/brian/app')
      await cache.insertProject('/Users/sam/app2')
      const paths = await cache.getProjectRoots()

      expect(paths).toStrictEqual(['/Users/brian/app'])
      // we have to wait on the write event because
      // of process.nextTick
      await delay(100)
      const projects = await cache.__get('PROJECTS')

      expect(projects).toStrictEqual(['/Users/brian/app'])
    })
  })
})

describe('project preferences', () => {
  it('should insert a projects preferences into the cache', async () => {
    const testProjectTitle = 'launchpad'
    const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }

    await cache.insertProjectPreferences(testProjectTitle, testPreferences)
    const preferences = await cache.__get('PROJECT_PREFERENCES')

    expect(preferences[testProjectTitle]).toStrictEqual(testPreferences)
  })

  it('should insert multiple projects preferences into the cache', async () => {
    const testProjectTitle = 'launchpad'
    const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }
    const anotherTestProjectTitle = 'launchpad'
    const anotherTestPreferene = { testingType: 'e2e', browserPath: '/some/test/path' }

    await cache.insertProjectPreferences(testProjectTitle, testPreferences)
    await cache.insertProjectPreferences(anotherTestProjectTitle, anotherTestPreferene)
    const preferences = await cache.__get('PROJECT_PREFERENCES')

    expect(preferences).toHaveProperty(testProjectTitle)
    expect(preferences).toHaveProperty(anotherTestProjectTitle)
  })

  it('should clear the projects preferred preferences', async () => {
    const testProjectTitle = 'launchpad'
    const testPreferences = { testingType: 'e2e', browserPath: '/some/test/path' }

    await cache.insertProjectPreferences(testProjectTitle, testPreferences)
    await cache.removeProjectPreferences(testProjectTitle)
    const preferences = await cache.__get('PROJECT_PREFERENCES')

    expect(preferences[testProjectTitle]).toBeNull()
  })
})

describe('#setUser / #getUser', () => {
  let user

  beforeEach(() => {
    user = {
      id: 1,
      name: 'brian',
      email: 'a@b.com',
      authToken: '1111-2222-3333-4444',
    }
  })

  it('sets and gets user', async () => {
    await cache.setUser(user)
    const cachedUser = await cache.getUser()

    expect(cachedUser).toStrictEqual(user)
  })
})

describe('#removeUser', () => {
  it('sets user to empty object', async () => {
    await cache.setUser(undefined as any)
    await cache.removeUser()
    const user = await cache.getUser()

    expect(user).toStrictEqual({})
  })
})

describe('queues public methods', () => {
  it('is able to write both values', async () => {
    await Promise.all([
      cache.setUser({ name: 'brian', authToken: 'auth-token-123' }),
      cache.insertProject('foo'),
    ])

    const json = await cache._read()

    expect(json).toStrictEqual({
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

describe('cohorts', () => {
  it('should get no cohorts when empty', async () => {
    const cohorts = await cache.getCohorts()

    expect(cohorts).toStrictEqual({})
  })

  it('should insert a cohort', async () => {
    const cohort = {
      name: 'cohort_id',
      cohort: 'A',
    }

    await cache.insertCohort(cohort)
    const cohorts = await cache.getCohorts()

    expect(cohorts).toStrictEqual({ [cohort.name]: cohort })
  })
})
