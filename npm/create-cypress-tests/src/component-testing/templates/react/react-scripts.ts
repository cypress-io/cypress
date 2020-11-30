import chalk from 'chalk'
import { createFindPackageJsonIterator } from '../../../findPackageJson'
import { Template } from '../Template'
import { validateSemverVersion } from '../../../utils'
import { MIN_SUPPORTED_VERSION } from '../../versions'
import * as babel from '@babel/core'

export const ReactScriptsTemplate: Template = {
  recommendedComponentFolder: 'src',
  message: 'It looks like you are using create-react-app.',
  getExampleUrl: ({ componentFolder }) => {
    return componentFolder === 'src'
      ? 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/react-scripts'
      : 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/react-scripts-folder'
  },
  getPluginsCodeAst: () => {
    return {
      Require: babel.template.ast('const preprocessor = require(\'@cypress/react/plugins/react-scripts\')'),
      ModuleExportsBody: babel.template.ast([
        'preprocessor(on, config)',
        'return config // IMPORTANT to return the config object',
      ].join('\n'), { preserveComments: true }),
    }
  },
  test: () => {
    // TODO also determine ejected create react app
    const packageJsonIterator = createFindPackageJsonIterator(process.cwd())

    return packageJsonIterator.map(({ dependencies, devDependencies }) => {
      if (dependencies || devDependencies) {
        const allDeps = { ...devDependencies, ...dependencies } || {}

        if (!allDeps['react-scripts']) {
          return { success: false }
        }

        if (
          !validateSemverVersion(
            allDeps['react-scripts'],
            MIN_SUPPORTED_VERSION['react-scripts'],
          )
        ) {
          console.warn(
            `It looks like you are using ${chalk.green(
              'create-react-app',
            )}, but we support only projects with version ${chalk.bold(
              MIN_SUPPORTED_VERSION['react-scripts'],
            )} of react-scripts.`,
          )

          // yey found the template
          return { success: false }
        }

        return { success: true }
      }

      return { success: false }
    })
  },
}
