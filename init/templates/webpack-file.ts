import path from 'path'
import findUp from 'find-up'
import { createFindPackageJsonIterator } from '../findPackageJson'
import { Template } from '../Template'

export function extractWebpackConfigPathFromScript(script: string) {
  if (script.includes('webpack ')) {
    const webpackCliArgs = script.split(' ').map(part => part.trim())
    const configArgIndex = webpackCliArgs.findIndex(arg => arg === '--config')

    return configArgIndex === -1 ? null : webpackCliArgs[configArgIndex + 1]
  }

  return null
}

export const WebpackTemplate: Template<{ webpackConfigPath: string }> = {
  message:
    'It looks like you have custom `webpack.config.js`. We can use it to bundle the components for testing.',
  getExampleUrl: () =>
    'https://github.com/bahmutov/cypress-react-unit-test/tree/main/examples/webpack-file',
  recommendedComponentFolder: 'cypress/component',
  getPluginsCode: (payload, { cypressProjectRoot }) => {
    const includeWarnComment = !Boolean(payload)
    const webpackConfigPath = payload
      ? path.relative(cypressProjectRoot, payload.webpackConfigPath)
      : './webpack.config.js'

    return [
      "const preprocessor = require('cypress-react-unit-test/plugins/load-webpack')",
      'module.exports = (on, config) => {',
      includeWarnComment
        ? '// TODO replace with valid webpack config path'
        : '',
      `config.env.webpackFilename = '${webpackConfigPath}'`,
      '  preprocessor(on, config)',
      '  // IMPORTANT to return the config object',
      '  return config',
      '}',
    ].join('\n')
  },
  test: root => {
    const webpackConfigPath = findUp.sync('webpack.config.js', { cwd: root })
    if (webpackConfigPath) {
      return {
        success: true,
        payload: { webpackConfigPath },
      }
    }

    const packageJsonIterator = createFindPackageJsonIterator(root)
    return packageJsonIterator.map(({ scripts }, packageJsonPath) => {
      if (!scripts) {
        return { continue: true }
      }

      for (const script of Object.values(scripts)) {
        const webpackConfigRelativePath = extractWebpackConfigPathFromScript(
          script,
        )

        if (webpackConfigRelativePath) {
          const directoryRoot = path.resolve(packageJsonPath, '..')
          const webpackConfigPath = path.resolve(
            directoryRoot,
            webpackConfigRelativePath,
          )

          return {
            continue: false,
            payload: { webpackConfigPath },
          }
        }
      }

      return { continue: true }
    })
  },
}
