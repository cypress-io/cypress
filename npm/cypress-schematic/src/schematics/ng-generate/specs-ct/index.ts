import { Rule, Tree } from '@angular-devkit/schematics'

import { Schema } from './schema'

import {
  getAngularJsonValue,
  getDirectoriesAndCreateSpecs,
} from '../../utils'

export default function (options: Schema): Rule {
  return async (tree: Tree) => {
    if (options.createSpecs) {
      const angularJsonValue = getAngularJsonValue(tree)
      const { projects } = angularJsonValue

      Object.keys(projects).map((name) => {
        const project = projects[name]
        const appPath = `${project.sourceRoot}/${project.prefix}`

        getDirectoriesAndCreateSpecs({ tree, appPath })
      })
    }
  }
}
