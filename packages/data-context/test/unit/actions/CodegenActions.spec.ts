import type { DataContext } from '../../../src'
import { CodegenActions } from '../../../src/actions/CodegenActions'
import { createTestDataContext } from '../helper'
import { expect } from 'chai'
import sinon from 'sinon'
import path from 'path'

describe('CodegenActions', () => {
  let ctx: DataContext
  let actions: CodegenActions

  beforeEach(() => {
    sinon.restore()

    ctx = createTestDataContext('open')

    actions = new CodegenActions(ctx)
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
})
