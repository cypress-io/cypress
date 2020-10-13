import chalk from 'chalk'
import { createFindPackageJsonIterator } from '../findPackageJson'
import { Template } from '../Template'
import { validateSemverVersion } from '../utils'
import { MIN_SUPPORTED_VERSION } from '../versions'

export const ReactScriptsTemplate: Template = {
  recommendedComponentFolder: 'src',
  message: 'It looks like you are using create-react-app.',
  getExampleUrl: ({ componentFolder }) =>
    componentFolder === 'src'
      ? 'https://github.com/bahmutov/cypress-react-unit-test/tree/main/examples/react-scripts'
      : 'https://github.com/bahmutov/cypress-react-unit-test/tree/main/examples/react-scripts-folder',
  getPluginsCode: () =>
    [
      "const preprocessor = require('cypress-react-unit-test/plugins/react-scripts')",
      'module.exports = (on, config) => {',
      '   preprocessor(on, config)',
      '  // IMPORTANT to return the config object',
      '  return config',
      '}',
    ].join('\n'),
  test: () => {
    // TODO also determine ejected create react app
    const packageJsonIterator = createFindPackageJsonIterator(process.cwd())

    return packageJsonIterator.map(({ dependencies, devDependencies }) => {
      if (dependencies || devDependencies) {
        const allDeps = { ...devDependencies, ...dependencies } || {}

        if (!allDeps['react-scripts']) {
          return { continue: true }
        }

        if (
          !validateSemverVersion(
            allDeps['react-scripts'],
            MIN_SUPPORTED_VERSION['react-scripts'],
          )
        ) {
          console.warn(
            `It looks like you are using ${chalk.green(
              'crate-react-app',
            )}, but we support only projects with version ${chalk.bold(
              MIN_SUPPORTED_VERSION['react-scripts'],
            )} of react-scripts.`,
          )

          // yey found the template
          return { continue: true }
        }

        return { continue: false }
      }

      return { continue: true }
    })
  },
}
