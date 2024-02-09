import type { DataContext } from '../../../src'
import { CodegenActions } from '../../../src/actions/CodegenActions'
import { createTestDataContext } from '../helper'
import { expect } from 'chai'
import sinon from 'sinon'
import path from 'path'

describe('CodegenActions', () => {
  let ctx: DataContext
  let actions: CodegenActions
  let reactDocgen: typeof import('react-docgen')

  beforeEach(async () => {
    sinon.restore()

    ctx = createTestDataContext('open')

    reactDocgen = await eval('import("react-docgen")')

    actions = new CodegenActions(ctx)
  })

  context('getReactComponentsFromFile', () => {
    const absolutePathPrefix = path.resolve('./test/unit/actions/project')

    it('returns React components from file with class component', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-class.jsx`, reactDocgen)

      expect(components).to.have.length(1)
      expect(components[0].exportName).to.equal('Counter')
      expect(components[0].isDefault).to.equal(false)
    })

    it('returns React components from file with functional component', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-functional.jsx`, reactDocgen)

      expect(components).to.have.length(1)
      expect(components[0].exportName).to.equal('Counter')
      expect(components[0].isDefault).to.equal(false)
    })

    it('returns only exported React components from file with functional components', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-multiple-components.jsx`, reactDocgen)

      expect(components).to.have.length(2)
      expect(components[0].exportName).to.equal('CounterContainer')
      expect(components[0].isDefault).to.equal(false)

      expect(components[1].exportName).to.equal('CounterView')
      expect(components[1].isDefault).to.equal(false)
    })

    it('returns React components from a tsx file', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter.tsx`, reactDocgen)

      expect(components).to.have.length(1)
      expect(components[0].exportName).to.equal('Counter')
      expect(components[0].isDefault).to.equal(false)
    })

    it('returns React components that are exported by default', async () => {
      let reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-default.tsx`, reactDocgen)).components

      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('CounterDefault')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-anonymous.jsx`, reactDocgen)).components
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('Component')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-function.jsx`, reactDocgen)).components
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('HelloWorld')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-class.jsx`, reactDocgen)).components
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('HelloWorld')
      expect(reactComponents[0].isDefault).to.equal(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-specifier.jsx`, reactDocgen)).components
      expect(reactComponents).to.have.length(1)
      expect(reactComponents[0].exportName).to.equal('HelloWorld')
      expect(reactComponents[0].isDefault).to.equal(true)
    })

    it('returns React components defined with arrow functions', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-arrow-function.jsx`, reactDocgen)

      expect(components).to.have.length(1)
      expect(components[0].exportName).to.equal('Counter')
      expect(components[0].isDefault).to.equal(false)
    })

    it('returns React components from a file with multiple separate export statements', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-separate-exports.jsx`, reactDocgen)

      expect(components).to.have.length(2)
      expect(components[0].exportName).to.equal('CounterView')
      expect(components[0].isDefault).to.equal(false)
      expect(components[1].exportName).to.equal('CounterContainer')
      expect(components[1].isDefault).to.equal(true)
    })

    it('returns React components that are exported and aliased', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/export-alias.jsx`, reactDocgen)

      expect(components).to.have.length(1)
      expect(components[0].exportName).to.equal('HelloWorld')
      expect(components[0].isDefault).to.equal(false)
    })

    // TODO: "react-docgen" will resolve HOCs but our export detection does not. Can fall back to displayName here
    it.skip('handles higher-order-components', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-hoc.jsx`, reactDocgen)

      expect(components).to.have.length(1)
      expect(components[0].exportName).to.equal('Counter')
      expect(components[0].isDefault).to.equal(true)
    })

    it('correctly parses typescript files', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/LoginForm.tsx`, reactDocgen)

      expect(components).to.have.length(1)
      expect(components[0].exportName).to.equal('LoginForm')
      expect(components[0].isDefault).to.equal(true)
    })

    it('does not throw while parsing empty file', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/empty.jsx`, reactDocgen)

      expect(components).to.have.length(0)
    })
  })
})
