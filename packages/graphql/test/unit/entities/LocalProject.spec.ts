import { expect } from 'chai'
import type { Cfg } from '@packages/server/lib/project-base'
import { LocalProject } from '../../../src'
import { TestActions, TestContext } from '../../integration/utils'

describe('LocalProject', () => {
  describe('#hasSetupE2ETesting', () => {
    it('returns false when resolved e2e key has no overrides', () => {
      class MyActions extends TestActions {
        resolveOpenProjectConfig (): Cfg {
          return {
            projectRoot: '/project/root',
            resolved: {
              e2e: {
                value: {},
                from: 'default',
              },
            },
          }
        }
      }

      const project = new LocalProject('/foo/bar/', new TestContext({ Actions: MyActions }))

      expect(project.hasSetupE2ETesting()).to.eq(false)
    })

    it('returns true when resolved e2e key has one override', () => {
      class MyActions extends TestActions {
        resolveOpenProjectConfig (): Cfg {
          return {
            projectRoot: '/project/root',
            resolved: {
              e2e: {
                value: {
                  baseUrl: 'http://localhost:3000',
                },
                from: 'default',
              },
            },
          }
        }
      }

      const project = new LocalProject('/foo/bar/', new TestContext({ Actions: MyActions }))

      expect(project.hasSetupE2ETesting()).to.eq(true)
    })
  })

  describe('#hasSetupComponentTesting', () => {
    it('returns false when resolved component key has no overrides', () => {
      class MyActions extends TestActions {
        resolveOpenProjectConfig (): Cfg {
          return {
            projectRoot: '/project/root',
            resolved: {
              component: {
                value: {},
                from: 'default',
              },
            },
          }
        }
      }

      const project = new LocalProject('/foo/bar/', new TestContext({ Actions: MyActions }))

      expect(project.hasSetupComponentTesting()).to.eq(false)
    })

    it('returns true when resolved component key has one override', () => {
      class MyActions extends TestActions {
        resolveOpenProjectConfig (): Cfg {
          return {
            projectRoot: '/project/root',
            resolved: {
              component: {
                value: {
                  baseUrl: 'http://localhost:3000',
                },
                from: 'default',
              },
            },
          }
        }
      }

      const project = new LocalProject('/foo/bar/', new TestContext({ Actions: MyActions }))

      expect(project.hasSetupComponentTesting()).to.eq(true)
    })
  })
})
