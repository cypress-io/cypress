import type { DataContext } from '../../../src'
import { ProjectActions } from '../../../src/actions/ProjectActions'
import { createTestDataContext } from '../helper'
import { expect } from 'chai'
import sinon from 'sinon'
import { SpecWithRelativeRoot } from '@packages/types'

describe('ProjectActions', () => {
  let ctx: DataContext
  let actions: ProjectActions

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new ProjectActions(ctx)
  })

  context('hasNonExampleSpec', () => {
    context('testing type not set yet', () => {
      it('should indicate there are NO non example spec files if empty', async () => {
        expect(ctx.project.specs).to.have.length(0)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).to.be.false
      })
    })

    context('testing type is e2e', () => {
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

        expect(ctx.project.specs).to.have.length(1)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).to.be.false
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

        expect(ctx.project.specs).to.have.length(2)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).to.be.true
      })
    })

    context('testing type is component', () => {
      it('should indicate there are NO non example spec files with no specs', async () => {
        const mockSpecs = [] as SpecWithRelativeRoot[]

        ctx.coreData.currentTestingType = 'component'
        ctx.project.setSpecs(mockSpecs)

        expect(ctx.project.specs).to.have.length(0)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).to.be.false
      })

      // there are no examples for component tests, so any component spec file should be a non-example
      it('should indicate there are non example spec files with any spec', async () => {
        const mockSpecs = [
          { name: 'test-1.cy.js' },
        ] as SpecWithRelativeRoot[]

        ctx.coreData.currentTestingType = 'component'
        ctx.project.setSpecs(mockSpecs)

        expect(ctx.project.specs).to.have.length(1)

        const hasNonExampleSpec = await actions.hasNonExampleSpec()

        expect(hasNonExampleSpec).to.be.true
      })
    })
  })

  describe('runSpec', () => {
    context('no project', () => {
      it('should fail with `NO_PROJECT`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: 'e2e/abc.cy.ts' })

        sinon.assert.match(result, {
          code: 'NO_PROJECT',
          detailMessage: sinon.match.string,
        })
      })
    })

    context('empty specPath', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
      })

      it('should fail with `NO_SPEC_PATH`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: '' })

        sinon.assert.match(result, {
          code: 'NO_SPEC_PATH',
          detailMessage: sinon.match.string,
        })
      })
    })

    context('no specPattern match', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
        sinon.stub(ctx.project, 'matchesSpecPattern').resolves(false)
      })

      it('should fail with `NO_SPEC_PATTERN_MATCH`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: 'e2e/abc.cy.ts' })

        sinon.assert.match(result, {
          code: 'NO_SPEC_PATTERN_MATCH',
          detailMessage: sinon.match.string,
        })
      })
    })

    context('spec file not found', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
        sinon.stub(ctx.project, 'matchesSpecPattern').withArgs(sinon.match.string, 'e2e').resolves(true)
        sinon.stub(ctx.fs, 'existsSync').returns(false)
      })

      it('should fail with `SPEC_NOT_FOUND`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: 'e2e/abc.cy.ts' })

        sinon.assert.match(result, {
          code: 'SPEC_NOT_FOUND',
          detailMessage: sinon.match.string,
        })
      })
    })

    context('matched testing type not configured', () => {
      beforeEach(() => {
        ctx.coreData.currentTestingType = null
        ctx.coreData.currentProject = '/cy-project'
        sinon.stub(ctx.project, 'matchesSpecPattern').withArgs(sinon.match.string, 'e2e').resolves(true)
        sinon.stub(ctx.fs, 'existsSync').returns(true)
        sinon.stub(ctx.lifecycleManager, 'isTestingTypeConfigured').withArgs('e2e').returns(false)
        sinon.stub(ctx.actions.project, 'setAndLoadCurrentTestingType')
      })

      it('should fail with `TESTING_TYPE_NOT_CONFIGURED`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: 'e2e/abc.cy.ts' })

        expect(ctx.actions.project.setAndLoadCurrentTestingType).not.to.have.been.called

        sinon.assert.match(result, {
          code: 'TESTING_TYPE_NOT_CONFIGURED',
          detailMessage: sinon.match.string,
        })
      })
    })

    context('no browser available', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
        sinon.stub(ctx.project, 'matchesSpecPattern').withArgs(sinon.match.string, 'e2e').resolves(true)
        sinon.stub(ctx.fs, 'existsSync').returns(true)
        sinon.stub(ctx.lifecycleManager, 'isTestingTypeConfigured').withArgs('e2e').returns(true)
        sinon.stub(ctx.actions.project, 'setAndLoadCurrentTestingType')
        sinon.stub(ctx.project, 'getCurrentSpecByAbsolute').returns({ id: 'xyz' } as any)
        ctx.coreData.activeBrowser = null
        sinon.stub(ctx.browser, 'allBrowsers').resolves([])
      })

      it('should fail with `NO_BROWSER`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: 'e2e/abc.cy.ts' })

        expect(ctx.actions.project.setAndLoadCurrentTestingType).to.have.been.calledWith('e2e')

        sinon.assert.match(result, {
          code: 'NO_BROWSER',
          detailMessage: sinon.match.string,
        })
      })
    })

    context('spec can be executed', () => {
      beforeEach(() => {
        ctx.coreData.currentProject = '/cy-project'
        sinon.stub(ctx.project, 'matchesSpecPattern').withArgs(sinon.match.string, 'e2e').resolves(true)
        sinon.stub(ctx.fs, 'existsSync').returns(true)
        sinon.stub(ctx.lifecycleManager, 'isTestingTypeConfigured').withArgs('e2e').returns(true)
        sinon.stub(ctx.actions.project, 'setAndLoadCurrentTestingType')
        sinon.stub(ctx.project, 'getCurrentSpecByAbsolute').returns({ id: 'xyz' } as any)
        ctx.coreData.activeBrowser = { id: 'abc' } as any
        sinon.stub(ctx.actions.project, 'launchProject')
      })

      it('should succeed with `SUCCESS`', async () => {
        const result = await ctx.actions.project.runSpec({ specPath: 'e2e/abc.cy.ts' })

        expect(ctx.actions.project.setAndLoadCurrentTestingType).to.have.been.calledWith('e2e')
        expect(ctx.actions.project.launchProject).to.have.been.called

        sinon.assert.match(result, {
          code: 'SUCCESS',
          testingType: 'e2e',
          browser: sinon.match.object,
          spec: sinon.match.object,
        })
      })
    })
  })
})
