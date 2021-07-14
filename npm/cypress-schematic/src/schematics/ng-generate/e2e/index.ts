import {
  Rule, Tree, SchematicsException,
  apply, url, applyTemplates, move,
  chain, mergeWith,
} from '@angular-devkit/schematics'

import { strings, normalize, virtualFs, workspaces } from '@angular-devkit/core'

import { Schema } from './schema'

const updateNotifier = require('update-notifier')
const pkg = require('./package.json')

updateNotifier({ pkg }).notify()

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

    if (!options.project) {
      // @ts-ignore
      options.project = workspace.extensions.defaultProject
    }

    //@ts-ignore
    const project = workspace.projects.get(options.project)

    if (!project) {
      throw new SchematicsException(`Invalid project name: ${options.project}`)
    }

    if (options.path === undefined) {
      options.path = `${project.root}/cypress/integration`
    }

    const templateSource = apply(url('../files/__path__'), [
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
