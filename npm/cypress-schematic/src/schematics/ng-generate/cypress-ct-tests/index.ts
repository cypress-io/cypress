import { Rule, Tree, SchematicsException } from '@angular-devkit/schematics'

import { getAngularJsonValue, getDirectoriesAndCreateSpecs } from '../../utils'
import { Schema } from './schema'

export default function (options: Schema): Rule {
  return (tree: Tree) => {
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
