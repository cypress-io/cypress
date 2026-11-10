import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import { CodegenActions } from '../../../src/actions/CodegenActions'
import { createTestDataContext } from '../helper'
import type { FullConfig } from '@packages/types'
import { CT_FRAMEWORKS, resolveComponentFrameworkDefinition } from '@packages/scaffold-config'
import fs from 'fs-extra'
import os from 'os'
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

      ctx.update((s) => {
        s.currentProject = absolutePathPrefix
      })
    })

    it('does not read a file outside of the project', async () => {
      const readFile = jest.spyOn(ctx.fs, 'readFile')
      const result = await actions.getReactComponentsFromFile(path.join(__dirname, 'CodegenActions.spec.ts'), reactDocgen)

      expect(result).toEqual({ errored: true, components: [] })
      expect(readFile).not.toHaveBeenCalled()
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

  describe('codeGenSpec', () => {
    let tmpRoot: string
    let projectRoot: string
    let outsideRoot: string

    beforeEach(async () => {
      // Nest the project so paths that escape it land in a directory this test owns
      tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'codegen-'))
      projectRoot = path.join(tmpRoot, 'project')
      outsideRoot = path.join(tmpRoot, 'other')
      await fs.ensureDir(projectRoot)

      ctx.update((s) => {
        s.currentProject = projectRoot
      })

      jest.spyOn(ctx.project, 'specPatterns').mockResolvedValue({ specPattern: ['cypress/e2e/**/*.cy.{js,ts}'] })
      jest.spyOn(ctx.project, 'getIsDefaultSpecPattern').mockResolvedValue(true)
      // Safe because codeGenSpec only refreshes the spec list when a config is loaded
      jest.spyOn(ctx.project, 'getConfig').mockResolvedValue(undefined as unknown as FullConfig)
    })

    afterEach(async () => {
      await fs.remove(tmpRoot)
    })

    const useReactFramework = () => {
      const react = CT_FRAMEWORKS.find((framework) => framework.type === 'react')

      if (!react) {
        throw new Error('React framework definition not found')
      }

      jest.spyOn(actions, 'getWizardFrameworkFromConfig').mockReturnValue(resolveComponentFrameworkDefinition(react))
    }

    it('generates an e2e spec inside the project', async () => {
      const result = await actions.codeGenSpec('cypress/e2e/new.cy.js', 'e2e')

      expect(result).toMatchObject({ status: 'valid', file: { absolute: path.join(projectRoot, 'cypress/e2e/new.cy.js') } })
      expect(await fs.pathExists(path.join(projectRoot, 'cypress/e2e/new.cy.js'))).toBe(true)
    })

    it('generates an e2e spec from an absolute path inside the project', async () => {
      const spec = path.join(projectRoot, 'cypress/e2e/absolute.cy.js')

      await actions.codeGenSpec(spec, 'e2e')

      expect(await fs.pathExists(spec)).toBe(true)
    })

    it('generates a componentEmpty spec from a project-relative path', async () => {
      const result = await actions.codeGenSpec('cypress/component/Empty.cy.js', 'componentEmpty')

      expect(result).toMatchObject({ status: 'valid', file: { absolute: path.join(projectRoot, 'cypress/component/Empty.cy.js') } })
    })

    it('generates a React component spec next to the component', async () => {
      useReactFramework()
      await fs.outputFile(path.join(projectRoot, 'src/Button.jsx'), 'export const Button = () => null')

      const result = await actions.codeGenSpec(path.join(projectRoot, 'src/Button.jsx'), 'component', 'Button', false)

      expect(result).toMatchObject({ status: 'valid', file: { absolute: path.join(projectRoot, 'src/Button.cy.jsx') } })
      expect(await fs.readFile(path.join(projectRoot, 'src/Button.cy.jsx'), 'utf8')).toContain(`import { Button } from './Button'`)
    })

    it('rejects an e2e candidate that traverses out of the project', async () => {
      await expect(actions.codeGenSpec('cypress/e2e/../../../other/x.cy.js', 'e2e')).rejects.toThrow('Cannot generate a spec outside of the project')
      expect(await fs.pathExists(outsideRoot)).toBe(false)
    })

    it('rejects an absolute componentEmpty candidate outside the project', async () => {
      await expect(actions.codeGenSpec(path.join(outsideRoot, 'x.cy.js'), 'componentEmpty')).rejects.toThrow('Cannot generate a spec outside of the project')
      expect(await fs.pathExists(outsideRoot)).toBe(false)
    })

    it('rejects a candidate that leaves the project through a symlink', async () => {
      await fs.ensureDir(outsideRoot)
      await fs.symlink(outsideRoot, path.join(projectRoot, 'linked'), 'junction')

      await expect(actions.codeGenSpec('linked/x.cy.js', 'e2e')).rejects.toThrow('Cannot generate a spec outside of the project')
      expect(await fs.readdir(outsideRoot)).toEqual([])
    })

    it('rejects a component candidate outside the project', async () => {
      await expect(actions.codeGenSpec(path.join(__dirname, 'project/counter-class.jsx'), 'component', 'Counter')).rejects.toThrow('Cannot generate a spec outside of the project')
    })

    it('rejects a component that does not exist', async () => {
      await expect(actions.codeGenSpec(path.join(projectRoot, 'src/Missing.jsx'), 'component', 'Missing')).rejects.toThrow('Cannot generate a spec for a component that does not exist')
    })

    it('rejects a component name that is not an identifier', async () => {
      await fs.outputFile(path.join(projectRoot, 'src/Button.jsx'), '')

      await expect(actions.codeGenSpec(path.join(projectRoot, 'src/Button.jsx'), 'component', 'Button Group')).rejects.toThrow('Invalid component name')
    })

    it('accepts a component name with non-ASCII letters', async () => {
      useReactFramework()
      await fs.outputFile(path.join(projectRoot, 'src/Menu.jsx'), 'export const Café = () => null')

      const result = await actions.codeGenSpec(path.join(projectRoot, 'src/Menu.jsx'), 'component', 'Café', false)

      expect(result).toMatchObject({ status: 'valid', file: { absolute: path.join(projectRoot, 'src/MenuCafé.cy.jsx') } })
    })
  })
})
