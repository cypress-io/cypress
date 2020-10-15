import path from 'path'
import { Template } from '../Template'
import { findWebpackConfig } from '../templateUtils'

export const VueWebpackTemplate: Template<{ webpackConfigPath: string }> = {
  message:
    'It looks like you have custom `webpack.config.js`. We can use it to bundle the components for testing.',
  getExampleUrl: () => {
    return 'https://github.com/cypress-io/cypress/tree/develop/npm/vue/examples/cli'
  },
  recommendedComponentFolder: 'cypress/component',
  getPluginsCode: (payload, { cypressProjectRoot }) => {
    const includeWarnComment = !payload
    const webpackConfigPath = payload
      ? path.relative(cypressProjectRoot, payload.webpackConfigPath)
      : './webpack.config.js'

    return [
      'const {',
      '  onFilePreprocessor',
      '} = require(\'@cypress/vue/preprocessor/webpack\')',
      '',
      'module.exports = (on, config) => {',
      includeWarnComment
        ? '// TODO replace with valid webpack config path'
        : '',
      ` on('file:preprocessor', onFilePreprocessor('${webpackConfigPath}'))`,
      '}',
    ].join('\n')
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
