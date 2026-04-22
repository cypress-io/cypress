import path from 'path'

// Typeless modules loaded via require to avoid `@types/*` deps.
const ospath = require('ospath') as { data: () => string }
const pkg = require('@packages/root')

const PRODUCT_NAME: string = pkg.productName || pkg.name

/**
 * Mirrors the base path logic in `packages/server/lib/util/app_data.js`:
 *   `{ospath.data()}/{PRODUCT_NAME}/cy/{env}`
 *
 * The env segment is `process.env.CYPRESS_INTERNAL_ENV || 'production'`.
 */
function appDataRoot (): string {
  const env = process.env.CYPRESS_INTERNAL_ENV || 'production'

  return path.join(ospath.data(), PRODUCT_NAME, 'cy', env)
}

/**
 * Directory where per-instance "running" descriptor files live.
 *
 * e.g. `~/Library/Application Support/Cypress/cy/production/running`
 */
export function runningDir (): string {
  return path.join(appDataRoot(), 'running')
}

/**
 * Absolute path to the descriptor file for the given pid.
 */
export function descriptorFilePath (pid: number): string {
  return path.join(runningDir(), `${pid}.json`)
}
