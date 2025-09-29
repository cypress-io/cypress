import { describe, expect, it, beforeEach } from '@jest/globals'
import type { DataContext } from '../../../src'
import { CodegenActions } from '../../../src/actions/CodegenActions'
import { createTestDataContext } from '../helper'
import path from 'path'

describe('CodegenActions', () => {
  let ctx: DataContext
  let actions: CodegenActions
  let reactDocgen: typeof import('react-docgen')

  beforeEach(async () => {
    ctx = createTestDataContext('open')

    actions = new CodegenActions(ctx)

    reactDocgen = await eval('import("react-docgen")')
  })

  describe('getReactComponentsFromFile', () => {
    let absolutePathPrefix: string

    beforeEach(() => {
      absolutePathPrefix = path.resolve(__dirname, './project')
    })

    it('returns React components from file with class component', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-class.jsx`, reactDocgen)

      expect(components).toHaveLength(1)
      expect(components[0].exportName).toEqual('Counter')
      expect(components[0].isDefault).toEqual(false)
    })

    it('returns React components from file with functional component', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-functional.jsx`, reactDocgen)

      expect(components).toHaveLength(1)
      expect(components[0].exportName).toEqual('Counter')
      expect(components[0].isDefault).toEqual(false)
    })

    it('returns only exported React components from file with functional components', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-multiple-components.jsx`, reactDocgen)

      expect(components).toHaveLength(2)
      expect(components[0].exportName).toEqual('CounterContainer')
      expect(components[0].isDefault).toEqual(false)

      expect(components[1].exportName).toEqual('CounterView')
      expect(components[1].isDefault).toEqual(false)
    })

    it('returns React components from a tsx file', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter.tsx`, reactDocgen)

      expect(components).toHaveLength(1)
      expect(components[0].exportName).toEqual('Counter')
      expect(components[0].isDefault).toEqual(false)
    })

    it('returns React components that are exported by default', async () => {
      let reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-default.tsx`, reactDocgen)).components

      expect(reactComponents).toHaveLength(1)
      expect(reactComponents[0].exportName).toEqual('CounterDefault')
      expect(reactComponents[0].isDefault).toEqual(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-anonymous.jsx`, reactDocgen)).components
      expect(reactComponents).toHaveLength(1)
      expect(reactComponents[0].exportName).toEqual('Component')
      expect(reactComponents[0].isDefault).toEqual(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-function.jsx`, reactDocgen)).components
      expect(reactComponents).toHaveLength(1)
      expect(reactComponents[0].exportName).toEqual('HelloWorld')
      expect(reactComponents[0].isDefault).toEqual(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-class.jsx`, reactDocgen)).components
      expect(reactComponents).toHaveLength(1)
      expect(reactComponents[0].exportName).toEqual('HelloWorld')
      expect(reactComponents[0].isDefault).toEqual(true)

      reactComponents = await (await actions.getReactComponentsFromFile(`${absolutePathPrefix}/default-specifier.jsx`, reactDocgen)).components
      expect(reactComponents).toHaveLength(1)
      expect(reactComponents[0].exportName).toEqual('HelloWorld')
      expect(reactComponents[0].isDefault).toEqual(true)
    })

    it('returns React components defined with arrow functions', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-arrow-function.jsx`, reactDocgen)

      expect(components).toHaveLength(1)
      expect(components[0].exportName).toEqual('Counter')
      expect(components[0].isDefault).toEqual(false)
    })

    it('returns React components from a file with multiple separate export statements', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-separate-exports.jsx`, reactDocgen)

      expect(components).toHaveLength(2)
      expect(components[0].exportName).toEqual('CounterView')
      expect(components[0].isDefault).toEqual(false)
      expect(components[1].exportName).toEqual('CounterContainer')
      expect(components[1].isDefault).toEqual(true)
    })

    it('returns React components that are exported and aliased', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/export-alias.jsx`, reactDocgen)

      expect(components).toHaveLength(1)
      expect(components[0].exportName).toEqual('HelloWorld')
      expect(components[0].isDefault).toEqual(false)
    })

    // TODO: "react-docgen" will resolve HOCs but our export detection does not. Can fall back to displayName here
    it.skip('handles higher-order-components', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/counter-hoc.jsx`, reactDocgen)

      expect(components).toHaveLength(1)
      expect(components[0].exportName).toEqual('Counter')
      expect(components[0].isDefault).toEqual(true)
    })

    it('correctly parses typescript files', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/LoginForm.tsx`, reactDocgen)

      expect(components).toHaveLength(1)
      expect(components[0].exportName).toEqual('LoginForm')
      expect(components[0].isDefault).toEqual(true)
    })

    it('does not throw while parsing empty file', async () => {
      const { components } = await actions.getReactComponentsFromFile(`${absolutePathPrefix}/empty.jsx`, reactDocgen)

      expect(components).toHaveLength(0)
    })

    it('ensure that Babel is instructed to not use a config file', async () => {
      let capturedOptions = null
      const mockReactDocgen = {
        parse: (src, options) => {
          capturedOptions = options

          return [{ displayName: 'TestComponent' }]
        },
        builtinResolvers: {
          FindExportedDefinitionsResolver: class {
            resolve () {
              return []
            }
          },
        },
      }

      const filePath = path.join(__dirname, 'project/counter-class.jsx')

      await actions.getReactComponentsFromFile(filePath, mockReactDocgen as unknown as typeof import('react-docgen'))

      expect(capturedOptions.babelOptions.configFile).toEqual(false)
    })
  })
})
