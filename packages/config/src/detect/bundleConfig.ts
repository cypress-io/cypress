import * as fs from 'fs'
import path from 'path'

function detectConfig (projectRoot: string, dirs: string[], files: string[]): string | undefined {
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
export const detectRelativeWebpackConfig = (projectRoot: string) => {
  return detectConfig(projectRoot, ['.', 'config'], ['webpack.config.js', 'webpack.config.ts'])
}

/**
 * Looks in common places for a vite.config.
 */
export const detectRelativeViteConfig = (projectRoot: string) => {
  return detectConfig(projectRoot, ['.', 'config'], ['vite.config.js', 'vite.config.ts'])
}
