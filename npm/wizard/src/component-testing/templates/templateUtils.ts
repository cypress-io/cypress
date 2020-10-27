import findUp from 'find-up'
import path from 'path'
import { createFindPackageJsonIterator } from '../../findPackageJson'

export function extractWebpackConfigPathFromScript (script: string) {
  if (script.includes('webpack ') || script.includes('webpack-dev-server ')) {
    const webpackCliArgs = script.split(' ').map((part) => part.trim())
    const configArgIndex = webpackCliArgs.findIndex((arg) => arg === '--config')

    return configArgIndex === -1 ? null : webpackCliArgs[configArgIndex + 1]
  }

  return null
}

export function findWebpackConfig (root: string) {
  const webpackConfigPath = findUp.sync('webpack.config.js', { cwd: root })

  if (webpackConfigPath) {
    return webpackConfigPath
  }

  const packageJsonIterator = createFindPackageJsonIterator(root)

  const { success, payload } = packageJsonIterator.map(({ scripts }, packageJsonPath) => {
    if (!scripts) {
      return { success: false }
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
          success: true,
          payload: { webpackConfigPath },
        }
      }
    }

    return { success: false }
  })

  return success ? payload?.webpackConfigPath : null
}
