import fs from 'fs-extra'
import path from 'path'

/**
 * Looks in common places for a webpack.config.
 */
export function detectRelativeWebpackConfig (projectRoot: string): string | undefined {
  const dirs = ['.', 'config']
  const files = ['webpack.config.js', 'webpack.config.ts']

  for (const dir of dirs) {
    for (const f of files) {
      const p = path.join(projectRoot, dir, f)

      if (fs.existsSync(p)) {
        return `./${path.join(dir, f)}`
      }
    }
  }

  return undefined
}

/**
 * Looks in common places for a webpack.config.
 */
export function detectRelativeViteConfig (projectRoot: string): string | undefined {
  const dirs = ['.', 'config']
  const files = ['vite.config.js', 'vite.config.ts']

  for (const dir of dirs) {
    for (const f of files) {
      const p = path.join(projectRoot, dir, f)

      if (fs.existsSync(p)) {
        return `./${path.join(dir, f)}`
      }
    }
  }

  return undefined
}
