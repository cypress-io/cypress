import * as babel from '@babel/core'
import { scanFSForAvailableDependency } from '../../../findPackageJson'
import { Template } from '../Template'

export const VueCliTemplate: Template = {
  message:
    'It looks like you are using vue-cli-service to run and build an application.',
  getExampleUrl: () => 'https://github.com/cypress-io/cypress/tree/develop/npm/vue/examples/cli',
  recommendedComponentFolder: 'src',
  dependencies: ['@cypress/webpack-dev-server'],
  getPluginsCodeAst: () => {
    return {
      Require: babel.template.ast([
        'const { startDevServer } = require("@cypress/webpack-dev-server")',
        `const webpackConfig = require("@vue/cli-service/webpack.config.js")`,
      ].join('\n')),
      ModuleExportsBody: babel.template.ast([
        `on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))`,
      ].join('\n'), { preserveComments: true }),
    }
  },
  test: (root) => {
    const hasVueCliService = scanFSForAvailableDependency(root, ['@vue/cli-service'])

    return {
      success: hasVueCliService,
    }
  },
}
