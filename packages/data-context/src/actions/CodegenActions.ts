import type { NexusGenObjects, NexusGenUnions } from '@packages/graphql/src/gen/nxs.gen'
import assert from 'assert'
import path from 'path'
import type { DataContext } from '..'
import { SpecOptions, codeGenerator } from '../codegen'
import templates from '../codegen/templates'
import type { CodeGenType } from '../gen/graphcache-config.gen'
import { visit } from 'ast-types'

export interface ReactComponentDescriptor {
  exportName: string
  isDefault: boolean
}

export class CodegenActions {
  constructor (private ctx: DataContext) {}

  async getReactComponentsFromFile (filePath: string, reactDocgen?: typeof import('react-docgen')): Promise<{components: ReactComponentDescriptor[], errored?: boolean }> {
    try {
      // this dance to get react-docgen is for now because react-docgen is a module and our typescript settings are set up to transpile to commonjs
      // which will require the module, which will fail because it's an es module. This is a temporary workaround.
      let actualReactDocgen = reactDocgen

      if (!actualReactDocgen) {
        actualReactDocgen = await import('react-docgen')
      }

      const { parse: parseReactComponent, builtinResolvers: reactDocgenResolvers } = actualReactDocgen

      const src = await this.ctx.fs.readFile(filePath, 'utf8')

      const exportResolver: ExportResolver = new Map()
      let result = parseReactComponent(src, {
        resolver: findAllWithLink(exportResolver, reactDocgenResolvers),
        babelOptions: {
          parserOpts: {
            plugins: ['typescript', 'jsx'],
          },
        },
      })

      // types appear to be incorrect in react-docgen@6.0.0-alpha.3
      // TODO: update when 6.0.0 stable is out for fixed types.
      const defs = (Array.isArray(result) ? result : [result]) as { displayName: string }[]

      const resolvedDefs = defs.reduce<ReactComponentDescriptor[]>((acc, descriptor) => {
        const displayName = descriptor.displayName || ''
        const resolved = exportResolver.get(displayName)

        // Limitation of resolving an export to a detected react component means we will filter out
        // some valid components, but trying to generate them without knowing what the exportName is or
        // if it is a default export will lead to bugs
        if (resolved) {
          acc.push(resolved)
        }

        return acc
      }, [])

      return { components: resolvedDefs }
    } catch (err) {
      this.ctx.debug(err)

      // react-docgen throws an error if it doesn't find any components in a file.
      // This is okay for our purposes, so if this is the error, catch it and return [].
      if (err.message === 'No suitable component definition found.') {
        return { components: [] }
      }

      return { errored: true, components: [] }
    }
  }

  async codeGenSpec (codeGenCandidate: string, codeGenType: CodeGenType, componentName?: string, isDefault?: boolean): Promise<NexusGenUnions['GeneratedSpecResult']> {
    const project = this.ctx.currentProject

    assert(project, 'Cannot create spec without currentProject.')

    const getCodeGenPath = () => {
      return codeGenType === 'e2e'
        ? this.ctx.path.join(
          project,
          codeGenCandidate,
        )
        : codeGenCandidate
    }

    const codeGenPath = getCodeGenPath()

    const { specPattern = [] } = await this.ctx.project.specPatterns()

    const newSpecCodeGenOptions = new SpecOptions({
      codeGenPath,
      codeGenType,
      framework: this.getWizardFrameworkFromConfig(),
      isDefaultSpecPattern: await this.ctx.project.getIsDefaultSpecPattern(),
      specPattern,
      currentProject: this.ctx.currentProject,
      specs: this.ctx.project.specs,
      componentName,
      isDefault,
    })

    let codeGenOptions = await newSpecCodeGenOptions.getCodeGenOptions()

    const codeGenResults = await codeGenerator(
      { templateDir: templates[codeGenOptions.templateKey], target: codeGenOptions.overrideCodeGenDir || path.parse(codeGenPath).dir },
      codeGenOptions,
    )

    if (!codeGenResults.files[0] || codeGenResults.failed[0]) {
      throw (codeGenResults.failed[0] || 'Unable to generate spec')
    }

    const [newSpec] = codeGenResults.files

    const cfg = await this.ctx.project.getConfig()

    if (cfg && this.ctx.currentProject) {
      const testingType = (codeGenType === 'component') ? 'component' : 'e2e'

      await this.ctx.actions.project.setSpecsFoundBySpecPattern({
        projectRoot: this.ctx.currentProject,
        testingType,
        specPattern: cfg.specPattern ?? [],
        configSpecPattern: cfg.specPattern ?? [],
        excludeSpecPattern: cfg.excludeSpecPattern,
        additionalIgnorePattern: cfg.additionalIgnorePattern,
      })
    }

    return {
      status: 'valid',
      file: { absolute: newSpec.file, contents: newSpec.content },
      description: 'Generated spec',
    }
  }

  get defaultE2EPath () {
    const projectRoot = this.ctx.currentProject

    assert(projectRoot, `Cannot create e2e directory without currentProject.`)

    return path.join(projectRoot, 'cypress', 'e2e')
  }

  async e2eExamples (): Promise<NexusGenObjects['ScaffoldedFile'][]> {
    const projectRoot = this.ctx.currentProject

    assert(projectRoot, `Cannot create spec without currentProject.`)

    const results = await codeGenerator(
      { templateDir: templates['e2eExamples'], target: this.defaultE2EPath },
      {},
    )

    if (results.failed.length) {
      throw new Error(`Failed generating files: ${results.failed.map((e) => `${e}`)}`)
    }

    return results.files.map(({ status, file, content }) => {
      return {
        status: (status === 'add' || status === 'overwrite') ? 'valid' : 'skipped',
        file: { absolute: file, contents: content },
        description: 'Generated spec',
      }
    })
  }

  getWizardFrameworkFromConfig (): Cypress.ResolvedComponentFrameworkDefinition | undefined {
    const config = this.ctx.lifecycleManager.loadedConfigFile

    // If devServer is a function, they are using a custom dev server.
    if (!config?.component?.devServer || typeof config?.component?.devServer === 'function') {
      return undefined
    }

    // @ts-ignore - because of the conditional above, we know that devServer isn't a function
    return this.ctx.coreData.wizard.frameworks.find((framework) => framework.configFramework === config?.component?.devServer.framework)
  }
}

type ExportResolver = Map<string, ReactComponentDescriptor>

function findAllWithLink (exportResolver: ExportResolver, reactDocgenResolvers: typeof import('react-docgen').builtinResolvers) {
  return (fileState: any) => {
    visit(fileState.ast, {
      // export const Foo, export { Foo, Bar }, export function FooBar () { ... }
      visitExportNamedDeclaration: (path) => {
        const declaration = path.node.declaration as any

        if (declaration) { // export const Foo
          if (declaration.id) {
            exportResolver.set(declaration.id.name, { exportName: declaration.id.name, isDefault: false })
          } else { // export const Foo, Bar
            (path.node.declaration as any).declarations.forEach((node: any) => {
              const id = node.name ?? node.id?.name

              if (id) {
                exportResolver.set(id, { exportName: id, isDefault: false })
              }
            })
          }
        } else { // export { Foo, Bar }
          path.node.specifiers?.forEach((node) => {
            if (!node.local?.name) {
              return
            }

            if (node.exported?.name === 'default') { // export { Foo as default }
              exportResolver.set(node.local.name, {
                exportName: node.local.name,
                isDefault: true,
              })
            } else {
              exportResolver.set(node.local.name, {
                exportName: node.exported.name,
                isDefault: false,
              })
            }
          })
        }

        return false
      },
      // export default Foo
      visitExportDefaultDeclaration: (path) => {
        const declaration: any = path.node.declaration
        const id: string = declaration.name || declaration.id?.name

        if (id) { // export default Foo
          exportResolver.set(id, {
            exportName: id,
            isDefault: true,
          })
        } else { // export default () => {}
          exportResolver.set('', {
            exportName: 'Component',
            isDefault: true,
          })
        }

        return false
      },
    })

    const exportedDefinitionsResolver = new reactDocgenResolvers.FindExportedDefinitionsResolver()

    return exportedDefinitionsResolver.resolve(fileState)
  }
}
