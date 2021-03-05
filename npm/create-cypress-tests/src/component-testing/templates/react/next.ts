import * as babel from '@babel/core'
import { createFindPackageJsonIterator } from '../../../findPackageJson'
import { Template } from '../Template'
import { validateSemverVersion } from '../../../utils'
import { MIN_SUPPORTED_VERSION } from '../../versions'

export const NextTemplate: Template = {
  message: 'It looks like you are using next.js.',
  getExampleUrl: () => {
    return 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/nextjs'
  },
  recommendedComponentFolder: 'cypress/component',
  dependencies: ['@cypress/webpack-dev-server'],
  getPluginsCodeAst: () => {
    return {
      Require: babel.template.ast('const injectDevServer = require(\'@cypress/react/plugins/next\')'),
      ModuleExportsBody: babel.template.ast([
        'injectDevServer(on, config)',
        'return config // IMPORTANT to return the config object',
      ].join('\n'), { preserveComments: true }),
    }
  },
  test: (cwd) => {
    const packageJsonIterator = createFindPackageJsonIterator(cwd)

    return packageJsonIterator.map(({ dependencies, devDependencies }, path) => {
      if (!dependencies && !devDependencies) {
        return { success: false }
      }

      const allDeps = {
        ...(devDependencies || {}),
        ...(dependencies || {}),
      } as Record<string, string>

      const nextVersion = allDeps['next']

      if (!nextVersion) {
        return { success: false }
      }

      if (
        !validateSemverVersion(
          nextVersion,
          MIN_SUPPORTED_VERSION['next'],
          'next.js',
        )
      ) {
        return { success: false }
      }

      return { success: true }
    })
  },
}
