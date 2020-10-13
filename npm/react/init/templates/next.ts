import chalk from 'chalk'
import { createFindPackageJsonIterator } from '../findPackageJson'
import { Template } from '../Template'
import { validateSemverVersion } from '../utils'
import { MIN_SUPPORTED_VERSION } from '../versions'

export const NextTemplate: Template = {
  message: 'It looks like you are using next.js.',
  getExampleUrl: () =>
    'https://github.com/bahmutov/cypress-react-unit-test/tree/main/examples/nextjs',
  recommendedComponentFolder: 'cypress/component',
  getPluginsCode: () =>
    [
      "const preprocessor = require('cypress-react-unit-test/plugins/next')",
      'module.exports = (on, config) => {',
      '  preprocessor(on, config)',
      '  // IMPORTANT to return the config object',
      '  return config',
      '}',
    ].join('\n'),
  test: () => {
    const packageJsonIterator = createFindPackageJsonIterator(process.cwd())

    return packageJsonIterator.map(({ dependencies, devDependencies }) => {
      if (!dependencies && !devDependencies) {
        return { continue: true }
      }

      const allDeps = {
        ...(devDependencies || {}),
        ...(dependencies || {}),
      } as Record<string, string>

      const nextVersion = allDeps['next']
      if (!nextVersion) {
        return { continue: true }
      }

      if (
        !validateSemverVersion(
          nextVersion,
          MIN_SUPPORTED_VERSION['next'],
          'next',
        )
      ) {
        return { continue: true }
      }

      // yey found the next
      return { continue: false }
    })
  },
}
