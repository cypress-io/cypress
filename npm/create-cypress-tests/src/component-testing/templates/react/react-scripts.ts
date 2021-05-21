import chalk from 'chalk'
import { createFindPackageJsonIterator, readPackageJsonSync, writePackageJsonSync } from '../../../findPackageJson'
import { Template } from '../Template'
import { installDependency, validateSemverVersion } from '../../../utils'
import { MIN_SUPPORTED_VERSION } from '../../versions'
import * as babel from '@babel/core'

export const ReactScriptsTemplate: Template = {
  recommendedComponentFolder: 'src',
  message: 'It looks like you are using create-react-app.',
  dependencies: ['@cypress/webpack-dev-server'],
  getExampleUrl: ({ componentFolder }) => {
    return componentFolder === 'src'
      ? 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/react-scripts'
      : 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/react-scripts-folder'
  },
  getPluginsCodeAst: () => {
    return {
      requiresReturnConfig: true,
      RequireAst: babel.template.ast('const injectDevServer = require(\'@cypress/react/plugins/react-scripts\')'),
      IfComponentTestingPluginsAst: babel.template.ast([
        'injectDevServer(on, config)',
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
  customSetup: async (cwd, useYarn) => {
    const packageJsonIterator = createFindPackageJsonIterator(cwd)

    const eslintInPackageJson = packageJsonIterator.map((pkgJson, path) => {
      if (!pkgJson.dependencies && !pkgJson.devDependencies) {
        return { success: false }
      }

      const eslintConfig = pkgJson['eslintConfig']

      return eslintConfig ? { success: true, payload: path } : { success: false }
    })

    if (!eslintInPackageJson.success || !eslintInPackageJson.payload) {
      console.warn(
        `It looks like you are not using a stock ${chalk.green(
          'eslint',
        )} config. You may want to install and use ${chalk.green('eslint-plugin-cypress')}`,
      )

      return
    }

    const packageJsonPath = eslintInPackageJson.payload

    await installDependency('eslint-plugin-cypress', { useYarn })

    const packageData = readPackageJsonSync(packageJsonPath)

    const eslintConfig: any = packageData['eslintConfig']

    eslintConfig['extends'] ??= []

    eslintConfig['extends'].push('plugin:cypress/recommended')

    writePackageJsonSync(packageJsonPath, packageData)
  },
}
