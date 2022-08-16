import { Rule, Tree, SchematicsException } from '@angular-devkit/schematics'

import { Schema } from './schema'

import {
  getDirectoriesAndCreateSpecs,
  getAngularJsonValue,
} from '../../utils'

export default function (options: Schema): Rule {
  return (tree: Tree) => {
    if (options.createSpecs) {
      if (!options.project) {
        throw new SchematicsException(`Invalid project name: ${options.project}`)
      }

      const angularJsonValue = getAngularJsonValue(tree)
      const { projects } = angularJsonValue
      const project = projects[options.project]

      const appPath = `${project.sourceRoot}`

      return getDirectoriesAndCreateSpecs({ tree, appPath })
    }
  }
}
