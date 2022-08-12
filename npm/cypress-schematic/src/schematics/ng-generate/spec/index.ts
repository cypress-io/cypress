import {
  Rule, Tree, SchematicsException,
  apply, url, applyTemplates, move,
  chain, mergeWith, SchematicContext,
} from '@angular-devkit/schematics'

import { strings, normalize, virtualFs, workspaces } from '@angular-devkit/core'

import { Schema } from './schema'

function createSpec (tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile (path: string): Promise<string> {
      const data = tree.read(path)

      if (!data) {
        throw new SchematicsException('File not found.')
      }

      return virtualFs.fileBufferToString(data)
    },
    async writeFile (path: string, data: string): Promise<void> {
      return tree.overwrite(path, data)
    },
    async isDirectory (path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0
    },
    async isFile (path: string): Promise<boolean> {
      return tree.exists(path)
    },
  }
}

export default function (options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const host = createSpec(tree)
    const { workspace } = await workspaces.readWorkspace('/', host)

    let project

    if (!options.project) {
      project = workspace.projects.get(workspace.extensions.defaultProject as string)
    } else {
      project = workspace.projects.get(options.project)
    }

    if (!project) {
      throw new SchematicsException(`Invalid project name: ${options.project}`)
    }

    if (options.name === undefined) {
      throw new SchematicsException(`No file name specified. This is required to generate a new Cypress file.`)
    }

    if (options.path === undefined) {
      options.path = options.testingType === 'component' ? `${project.sourceRoot}/${project.prefix}` : `${project.root}/cypress/e2e`
    }

    context.logger.debug(`Creating new ${options.testingType} spec named: ${options.name}`)

    const templatePath = options.testingType === 'component' ? '../files/ct/__path__' : '../files/e2e/__path__'
    const templateSource = apply(url(templatePath), [
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        name: options.name,
      }),
      move(normalize(options.path as string)),
    ])

    return chain([
      mergeWith(templateSource),
    ])
  }
}
