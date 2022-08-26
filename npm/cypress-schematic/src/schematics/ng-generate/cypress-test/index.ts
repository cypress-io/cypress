import {
  Rule, Tree, SchematicsException, chain, mergeWith,
} from '@angular-devkit/schematics'

import { virtualFs, workspaces } from '@angular-devkit/core'

import { Schema } from './schema'

import { createTemplate } from '../../utils'

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
  return async (tree: Tree) => {
    const host = createSpec(tree)
    const { workspace } = await workspaces.readWorkspace('/', host)
    const testType = options.component ? 'component' : 'e2e'

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
      options.path = testType === 'component' ? `${project.sourceRoot}/${project.prefix}` : `${project.root}/cypress/e2e`
    }

    console.log(`Creating new ${testType} spec named: ${options.name}`)

    const templatePath = testType === 'component' ? '../files/ct/__path__' : '../files/e2e/__path__'
    const templateSource = createTemplate({ templatePath, options })

    return chain([
      mergeWith(templateSource),
    ])
  }
}
