import type { DataContext } from '../../../src'
import { ProjectActions } from '../../../src/actions/ProjectActions'
import { createTestDataContext } from '../helper'
import { expect } from 'chai'
import sinon from 'sinon'
import path from 'path'
import { SpecWithRelativeRoot } from '@packages/types'

describe('ProjectActions', () => {
  let ctx: DataContext
  let actions: ProjectActions

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new ProjectActions(ctx)
  })

  context('getReactComponentsFromFile', () => {
    const absolutePathPrefix = path.resolve('./test/unit/actions/project')

    it('returns React components from file with class component', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-class.jsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].displayName).to.equal('Counter')
    })

    it('returns React components from file with functional component', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-functional.jsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].displayName).to.equal('Counter')
    })

    it('returns only exported React components from file with functional components', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-multiple-components.jsx`)

      expect(reactComponents).to.have.length(2)
      expect(reactComponents[0].displayName).to.equal('CounterContainer')
      expect(reactComponents[1].displayName).to.equal('CounterView')
    })

    it('returns both named and default exports', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-mixed-multiple-components.tsx`)

      expect(reactComponents).to.have.length(2)
      expect(reactComponents[0].displayName).to.equal('CounterContainer')
      expect(reactComponents[1].displayName).to.equal('CounterView')
    })

    it('returns React components from a tsx file', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter.tsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].displayName).to.equal('Counter')
    })

    it('returns React components that are exported by default', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-default.tsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].displayName).to.equal('CounterDefault')
    })

    it('returns React components defined with arrow functions', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-arrow-function.jsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].displayName).to.equal('Counter')
    })

    it('returns React components from a file with multiple separate export statements', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-separate-exports.jsx`)

      expect(reactComponents).to.have.length(2)
      expect(reactComponents[0].displayName).to.equal('CounterView')
      expect(reactComponents[1].displayName).to.equal('CounterContainer')
    })

    it('does not throw while parsing empty file', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/empty.jsx`)

      expect(reactComponents).to.have.length(0)
    })
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
