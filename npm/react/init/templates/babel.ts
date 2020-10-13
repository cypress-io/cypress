import chalk from 'chalk'
import findUp from 'find-up'
import { Template } from '../Template'
import { createFindPackageJsonIterator } from '../findPackageJson'

export const BabelTemplate: Template = {
  message: `It looks like you have babel config defined. We can use it to transpile your components for testing.\n ${chalk.red(
    '>>',
  )} This is not a replacement for bundling tool. We will use ${chalk.red(
    'webpack',
  )} to bundle the components for testing.`,
  getExampleUrl: () =>
    'https://github.com/bahmutov/cypress-react-unit-test/tree/main/examples/babel',
  recommendedComponentFolder: 'cypress/component',
  getPluginsCode: () =>
    [
      "const preprocessor = require('cypress-react-unit-test/plugins/babel')",
      'module.exports = (on, config) => {',
      '  preprocessor(on, config)',
      '  // IMPORTANT to return the config object',
      '  return config',
      '}',
    ].join('\n'),
  test: cwd => {
    const babelConfig = findUp.sync(
      ['babel.config.js', 'babel.config.json', '.babelrc', '.babelrc.json'],
      { type: 'file', cwd },
    )

    if (babelConfig) {
      return { success: true }
    }

    // babel config can also be declared in package.json with `babel` key https://babeljs.io/docs/en/configuration#packagejson
    const packageJsonIterator = createFindPackageJsonIterator(cwd)
    return packageJsonIterator.map(({ babel }) => ({
      continue: !Boolean(babel),
    }))
  },
}
