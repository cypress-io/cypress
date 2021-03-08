import * as babel from '@babel/core'
import path from 'path'
import { Template } from '../Template'
import { findWebpackConfig } from '../templateUtils'

export const VueWebpackTemplate: Template<{ webpackConfigPath: string }> = {
  message:
    'It looks like you have custom `webpack.config.js`. We can use it to bundle the components for testing.',
  getExampleUrl: () => 'https://github.com/cypress-io/cypress/tree/develop/npm/vue/examples/cli',
  recommendedComponentFolder: 'cypress/component',
  dependencies: ['@cypress/webpack-dev-server'],
  getPluginsCodeAst: (payload, { cypressProjectRoot }) => {
    const includeWarnComment = !payload
    const webpackConfigPath = payload
      ? path.relative(cypressProjectRoot, payload.webpackConfigPath)
      : './webpack.config.js'

    return {
      Require: babel.template.ast([
        'const { startDevServer } = require("@cypress/webpack-dev-server")',

        `const webpackConfig = require("${webpackConfigPath}")`,
        includeWarnComment
          ? '// TODO replace with valid webpack config path'
          : '',
      ].join('\n'), { preserveComments: true }),
      ModuleExportsBody: babel.template.ast([
        `on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))`,
      ].join('\n')),
    }
  },
  test: (root) => {
    const webpackConfigPath = findWebpackConfig(root)

    return webpackConfigPath ? {
      success: true,
      payload: { webpackConfigPath },
    } : {
      success: false,
    }
  },
}
