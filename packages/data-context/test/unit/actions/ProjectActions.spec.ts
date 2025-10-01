import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import { ProjectActions } from '../../../src/actions/ProjectActions'
import { createTestDataContext } from '../helper'
import { SpecWithRelativeRoot, TestingType } from '@packages/types'

describe('ProjectActions', () => {
  let ctx: DataContext
  let actions: ProjectActions

  beforeEach(() => {
    ctx = createTestDataContext('open')

    actions = new ProjectActions(ctx)
  })

  describe('hasNonExampleSpec', () => {
    describe('testing type not set yet', () => {
      it('should indicate there are NO non example spec files if empty', async () => {
        expect(ctx.project.specs).toHaveLength(0)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).toBe(false)
      })
    })

    describe('testing type is e2e', () => {
      beforeEach(() => {
        ctx.coreData.currentTestingType = 'e2e'
      })

      it('should indicate there are NO non example spec files with only examples', async () => {
        const mockSpecs = [
          {
            name: 'todo.cy.js',
            relativeToCommonRoot: '1-getting-started/todo.cy.js',
          },
        ] as SpecWithRelativeRoot[]

        ctx.project.setSpecs(mockSpecs)

        expect(ctx.project.specs).toHaveLength(1)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).toBe(false)
      })

      it('should indicate there are non example spec files with examples and non example', async () => {
        const mockSpecs = [
          {
            name: 'todo.cy.js',
            relativeToCommonRoot: '1-getting-started/todo.cy.js',
          },
          {
            name: 'my-example.cy.js',
            relativeToCommonRoot: 'my-example.cy.js',
          },
        ] as SpecWithRelativeRoot[]

        ctx.project.setSpecs(mockSpecs)

        expect(ctx.project.specs).toHaveLength(2)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).toBe(true)
      })
    })

    describe('testing type is component', () => {
      it('should indicate there are NO non example spec files with no specs', async () => {
        const mockSpecs = [] as SpecWithRelativeRoot[]

        ctx.coreData.currentTestingType = 'component'
        ctx.project.setSpecs(mockSpecs)

        expect(ctx.project.specs).toHaveLength(0)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).toBe(false)
      })

      // there are no examples for component tests, so any component spec file should be a non-example
      it('should indicate there are non example spec files with any spec', async () => {
        const mockSpecs = [
          { name: 'test-1.cy.js' },
        ] as SpecWithRelativeRoot[]

        ctx.coreData.currentTestingType = 'component'
        ctx.project.setSpecs(mockSpecs)

        expect(ctx.project.specs).toHaveLength(1)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).toBe(true)
      })
    })
  })

  describe('runSpec', () => {
    describe('no project', () => {
      it('should fail with `NO_PROJECT`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: '/Users/blah/Desktop/application/cypress/e2e/abc.cy.ts' })

        expect(result).toMatchObject({
          code: 'NO_PROJECT',
          detailMessage: expect.any(String),
        })
      })
    })

    describe('empty specPath', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
      })

      it('should fail with `NO_SPEC_PATH`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: '' })

        expect(result).toMatchObject({
          code: 'NO_SPEC_PATH',
          detailMessage: expect.any(String),
        })
      })
    })

    describe('no specPattern match', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
        jest.spyOn(ctx.project, 'matchesSpecPattern').mockResolvedValue(false)
      })

      it('should fail with `NO_SPEC_PATTERN_MATCH`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: '/Users/blah/Desktop/application/e2e/abc.cy.ts' })

        expect(result).toMatchObject({
          code: 'NO_SPEC_PATTERN_MATCH',
          detailMessage: expect.any(String),
        })
      })
    })

    describe('spec file not found', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
        jest.spyOn(ctx.project, 'matchesSpecPattern').mockImplementation((specFile: string) => {
          if (specFile.includes('e2e')) {
            return Promise.resolve(true)
          }

          return Promise.resolve(false)
        })

        jest.spyOn(ctx.fs, 'existsSync').mockReturnValue(false)
      })

      it('should fail with `SPEC_NOT_FOUND`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: '/Users/blah/Desktop/application/e2e/abc.cy.ts' })

        expect(result).toMatchObject({
          code: 'SPEC_NOT_FOUND',
          detailMessage: expect.any(String),
        })
      })
    })

    describe('matched testing type not configured', () => {
      beforeEach(() => {
        ctx.coreData.currentTestingType = null
        ctx.coreData.currentProject = '/cy-project'
        jest.spyOn(ctx.project, 'matchesSpecPattern').mockImplementation((specFile: string) => {
          if (specFile.includes('e2e')) {
            return Promise.resolve(true)
          }

          return Promise.resolve(false)
        })

        jest.spyOn(ctx.fs, 'existsSync').mockReturnValue(true)
        jest.spyOn(ctx.lifecycleManager, 'isTestingTypeConfigured').mockImplementation((testingType: TestingType) => {
          if (testingType === 'e2e') {
            return false
          }

          return true
        })
      })

      it('should fail with `TESTING_TYPE_NOT_CONFIGURED`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: '/Users/blah/Desktop/application/e2e/abc.cy.ts' })

        expect(result).toMatchObject({
          code: 'TESTING_TYPE_NOT_CONFIGURED',
          detailMessage: expect.any(String),
        })
      })
    })

    describe('spec can be executed', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
        jest.spyOn(ctx.project, 'matchesSpecPattern').mockImplementation((specFile: string) => {
          if (specFile.includes('e2e')) {
            return Promise.resolve(true)
          }

          return Promise.resolve(false)
        })

        jest.spyOn(ctx.fs, 'existsSync').mockReturnValue(true)
        jest.spyOn(ctx.project, 'getCurrentSpecByAbsolute').mockReturnValue({ id: 'xyz' } as any)
        jest.spyOn(ctx.lifecycleManager, 'setInitialActiveBrowser')
        ctx.coreData.activeBrowser = { id: 'abc' } as any
        jest.spyOn(ctx.lifecycleManager, 'setCurrentTestingType').mockReturnValue(undefined)
        jest.spyOn(ctx.lifecycleManager, 'setAndLoadCurrentTestingType').mockReturnValue(undefined)
        jest.spyOn(ctx.actions.project, 'switchTestingTypesAndRelaunch')
        jest.spyOn(ctx.actions.browser, 'closeBrowser').mockReturnValue(undefined)
        ctx.coreData.app.browserStatus = 'open'
        jest.spyOn(ctx.emitter, 'subscribeTo').mockReturnValue({
          next: () => {},
          return: () => {},
        } as any)
      })

      describe('no current testing type', () => {
        beforeEach(() => {
          ctx.coreData.currentTestingType = null
          jest.spyOn(ctx.lifecycleManager, 'isTestingTypeConfigured').mockImplementation((testingType: TestingType) => {
            if (testingType === 'e2e') {
              return true
            }

            return false
          })
        })

        it('should succeed', async () => {
          const result = await ctx.actions.project.runSpec({ specPath: '/Users/blah/Desktop/application/e2e/abc.cy.ts' })

          expect(result).toMatchObject({
            testingType: 'e2e',
            browser: expect.any(Object),
            spec: expect.any(Object),
          })

          expect(ctx.lifecycleManager.setCurrentTestingType).toHaveBeenCalledWith('e2e')
          expect(ctx.actions.project.switchTestingTypesAndRelaunch).toHaveBeenCalledWith('e2e')
          expect(ctx._apis.projectApi.runSpec).toHaveBeenCalled()
        })
      })

      describe('testing type needs to change', () => {
        beforeEach(() => {
          ctx.coreData.currentTestingType = 'component'
          jest.spyOn(ctx.lifecycleManager, 'isTestingTypeConfigured').mockImplementation((testingType: TestingType) => {
            if (testingType === 'e2e') {
              return true
            }

            return false
          })
        })

        it('should succeed', async () => {
          const result = await ctx.actions.project.runSpec({ specPath: '/Users/blah/Desktop/application/e2e/abc.cy.ts' })

          expect(result).toMatchObject({
            testingType: 'e2e',
            browser: expect.any(Object),
            spec: expect.any(Object),
          })

          expect(ctx.lifecycleManager.setCurrentTestingType).toHaveBeenCalledWith('e2e')
          expect(ctx.actions.project.switchTestingTypesAndRelaunch).toHaveBeenCalledWith('e2e')
          expect(ctx._apis.projectApi.runSpec).toHaveBeenCalled()
        })
      })

      describe('testing type does not need to change', () => {
        beforeEach(() => {
          ctx.coreData.currentTestingType = 'e2e'
        })

        it('should succeed', async () => {
          const result = await ctx.actions.project.runSpec({ specPath: '/Users/blah/Desktop/application/e2e/abc.cy.ts' })

          expect(result).toMatchObject({
            testingType: 'e2e',
            browser: expect.any(Object),
            spec: expect.any(Object),
          })

          expect(ctx.lifecycleManager.setCurrentTestingType).not.toHaveBeenCalled()
          expect(ctx.actions.project.switchTestingTypesAndRelaunch).not.toHaveBeenCalled()

          expect(ctx._apis.projectApi.runSpec).toHaveBeenCalled()
        })
      })
    })
  })

  describe('debugCloudRun', () => {
    beforeEach(() => {
      jest.spyOn(ctx.relevantRuns, 'moveToRun')
    })

    it('should call moveToRun and routeToDebug', async () => {
      await ctx.actions.project.debugCloudRun(123)

      expect(ctx.relevantRuns.moveToRun).toHaveBeenCalledWith(123, [])
      expect(ctx._apis.projectApi.routeToDebug).toHaveBeenCalled()
    })
  })
})
