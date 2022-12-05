import type { NexusGenObjects, NexusGenUnions } from '@packages/graphql/src/gen/nxs.gen'
import assert from 'assert'
import path from 'path'
import type { DataContext } from '..'
import { SpecOptions, codeGenerator } from '../codegen'
import templates from '../codegen/templates'
import type { CodeGenType } from '../gen/graphcache-config.gen'
import { WizardFrontendFramework, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import { parse as parseReactComponent, resolver as reactDocgenResolvers } from 'react-docgen'
import { visit } from 'ast-types'

interface ReactComponentDescriptor {
  displayName: string
  exportName: string
  isDefault: boolean
}

export class CodegenActions {
  constructor (private ctx: DataContext) {}

  async getReactComponentsFromFile (filePath: string): Promise<ReactComponentDescriptor[]> {
    try {
      const src = await this.ctx.fs.readFile(filePath, 'utf8')

      const linker: Linker = {}
      let result = parseReactComponent(src, findAllWithLink(linker))

      // types appear to be incorrect in react-docgen@6.0.0-alpha.3
      // TODO: update when 6.0.0 stable is out for fixed types.
      const defs = (Array.isArray(result) ? result : [result]) as ReactComponentDescriptor[]

      const mappedDefs = defs.map((meta) => {
        const displayName = meta.displayName || ''

        return { ...meta, displayName, ...linker[displayName] }
      })

      return mappedDefs
    } catch (err) {
      this.ctx.debug(err)

      return []
    }
  }

  async codeGenSpec (codeGenCandidate: string, codeGenType: CodeGenType, componentName?: string): Promise<NexusGenUnions['GeneratedSpecResult']> {
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

  async scaffoldIntegration (): Promise<NexusGenObjects['ScaffoldedFile'][]> {
    const projectRoot = this.ctx.currentProject

    assert(projectRoot, `Cannot create spec without currentProject.`)

    const results = await codeGenerator(
      { templateDir: templates['scaffoldIntegration'], target: this.defaultE2EPath },
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

  getWizardFrameworkFromConfig (): WizardFrontendFramework | undefined {
    const config = this.ctx.lifecycleManager.loadedConfigFile

    // If devServer is a function, they are using a custom dev server.
    if (!config?.component?.devServer || typeof config?.component?.devServer === 'function') {
      return undefined
    }

    // @ts-ignore - because of the conditional above, we know that devServer isn't a function
    return WIZARD_FRAMEWORKS.find((framework) => framework.configFramework === config?.component?.devServer.framework)
  }
}

type Linker = Record<string, { exportName: string, isDefault: boolean }>
function findAllWithLink (linker: Linker) {
  return (ast: any, parser: any, importer: any) => {
    visit(ast, {
      // export const Foo, export { Foo, Bar }, export function FooBar () { ... }
      visitExportNamedDeclaration: (path) => {
        const declaration = path.node.declaration as any

        if (declaration) { // export const Foo
          if (declaration.id) {
            linker[declaration.id.name] = { exportName: declaration.id.name, isDefault: false }
          } else { // export const Foo, Bar
            (path.node.declaration as any).declarations.forEach((node: any) => {
              const id = node.name ?? node.id?.name

              if (id) {
                linker[id] = { exportName: id, isDefault: false }
              }
            })
          }
        } else { // export { Foo, Bar }
          path.node.specifiers?.forEach((node) => {
            if (!node.local?.name) {
              return
            }

            if (node.exported?.name === 'default') { // export { Foo as default }
              linker[node.local.name] = {
                exportName: node.local.name,
                isDefault: true,
              }
            } else {
              linker[node.local.name] = {
                exportName: node.exported.name,
                isDefault: false,
              }
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
          linker[id] = {
            exportName: id,
            isDefault: true,
          }
        } else { // export default () => {}
          linker[''] = {
            exportName: 'Component',
            isDefault: true,
          }
        }

        return false
      },
    })

    return reactDocgenResolvers.findAllExportedComponentDefinitions(ast, parser, importer)
  }
}
