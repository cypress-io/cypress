import chalk from 'chalk'
import findUp from 'find-up'
import * as babel from '@babel/core'
import { Template } from '../Template'
import { createFindPackageJsonIterator } from '../../../findPackageJson'

export const BabelTemplate: Template = {
  message: `It looks like you have babel config defined. We can use it to transpile your components for testing.\n ${chalk.red(
    '>>',
  )} This is not a replacement for bundling tool. We will use ${chalk.red(
    'webpack',
  )} to bundle the components for testing.`,
  recommendedComponentFolder: 'cypress/component',
  dependencies: ['webpack', '@cypress/webpack-dev-server'],
  getExampleUrl: () => 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/babel',
  getPluginsCodeAst: () => {
    return {
      Require: babel.template.ast('const injectDevServer = require(\'@cypress/react/plugins/babel\')'),
      ModuleExportsBody: babel.template.ast([
        'injectDevServer(on, config)',
        'return config // IMPORTANT to return the config object',
      ].join('\n'), { preserveComments: true }),
    }
  },
  test: (cwd) => {
    const babelConfig = findUp.sync(
      ['babel.config.js', 'babel.config.json', '.babelrc', '.babelrc.json'],
      { type: 'file', cwd },
    )

    if (babelConfig) {
      return { success: true }
    }

    // babel config can also be declared in package.json with `babel` key https://babeljs.io/docs/en/configuration#packagejson
    const packageJsonIterator = createFindPackageJsonIterator(cwd)

    return packageJsonIterator.map(({ babel }) => {
      return {
        success: Boolean(babel),
      }
    })
  },
}
