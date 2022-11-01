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
})
