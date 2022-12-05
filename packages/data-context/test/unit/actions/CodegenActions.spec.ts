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
      expect(reactComponents[0].exportName).to.equal('Counter')
      expect(reactComponents[0].isDefault).to.equal(false)
    })

    it('returns React components from file with functional component', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-functional.jsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('Counter')
      expect(reactComponents[0].isDefault).to.equal(false)
    })

    it('returns only exported React components from file with functional components', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-multiple-components.jsx`)

      expect(reactComponents).to.have.length(2)
      expect(reactComponents[0].exportName).to.equal('CounterContainer')
      expect(reactComponents[0].isDefault).to.equal(false)

      expect(reactComponents[1].exportName).to.equal('CounterView')
      expect(reactComponents[1].isDefault).to.equal(false)
    })

    it('returns React components from a tsx file', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter.tsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('Counter')
      expect(reactComponents[0].isDefault).to.equal(false)
    })

    it('returns React components that are exported by default', async () => {
      let reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-default.tsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('CounterDefault')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-anonymous.jsx`)
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('Component')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-function.jsx`)
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('HelloWorld')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-class.jsx`)
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('HelloWorld')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-specifier.jsx`)
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('HelloWorld')
      expect(reactComponents[0].isDefault).to.equal(true)
    })

    it('returns React components defined with arrow functions', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-arrow-function.jsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('Counter')
      expect(reactComponents[0].isDefault).to.equal(false)
    })

    it('returns React components from a file with multiple separate export statements', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-separate-exports.jsx`)

      expect(reactComponents).to.have.length(2)
      expect(reactComponents[0].exportName).to.equal('CounterView')
      expect(reactComponents[0].isDefault).to.equal(false)
      expect(reactComponents[1].exportName).to.equal('CounterContainer')
      expect(reactComponents[1].isDefault).to.equal(true)
    })

    it('returns React components that are exported and aliased', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/export-alias.jsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('HelloWorld')
      expect(reactComponents[0].isDefault).to.equal(false)
    })

    // TODO: "react-docgen" will resolve HOCs but our export detection does not. Can fall back to displayName here
    it.skip('handles higher-order-components', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-hoc.jsx`)

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('Counter')
      expect(reactComponents[0].isDefault).to.equal(true)
    })

    it('does not throw while parsing empty file', async () => {
      const reactComponents = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/empty.jsx`)

      expect(reactComponents).to.have.length(0)
    })
  })
})
