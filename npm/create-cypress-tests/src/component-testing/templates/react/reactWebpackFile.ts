import * as babel from '@babel/core'
import path from 'path'
import { Template } from '../Template'
import { findWebpackConfig } from '../templateUtils'

export const WebpackTemplate: Template<{ webpackConfigPath: string }> = {
  message:
    'It looks like you have custom `webpack.config.js`. We can use it to bundle the components for testing.',
  getExampleUrl: () => {
    return 'https://github.com/cypress-io/cypress/tree/develop/npm/react/examples/webpack-file'
  },
  recommendedComponentFolder: 'cypress/component',
  dependencies: ['@cypress/webpack-dev-server'],
  getPluginsCodeAst: (payload, { cypressProjectRoot }) => {
    const includeWarnComment = !payload
    const webpackConfigPath = payload
      ? path.relative(cypressProjectRoot, payload.webpackConfigPath)
      : './webpack.config.js'

    return {
      Require: babel.template.ast('const injectDevServer = require("@cypress/react/plugins/load-webpack")'),
      ModuleExportsBody: babel.template.ast([
        includeWarnComment
          ? '// TODO replace with valid webpack config path'
          : '',
        `config.env.webpackFilename = '${webpackConfigPath}'`,
        'injectDevServer(on, config)',
        'return config // IMPORTANT to return the config object',
      ].join('\n'), { preserveComments: true }),
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
