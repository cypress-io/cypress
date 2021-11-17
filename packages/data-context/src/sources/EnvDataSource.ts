import type { DataContext } from '../DataContext'

/**
 * Centralizes all of the "env"
 */
export class EnvDataSource {
  constructor (private ctx: DataContext) {}

  get CYPRESS_INTERNAL_VITE_APP_PORT () {
    return process.env.CYPRESS_INTERNAL_VITE_APP_PORT
  }

  get HTTP_PROXY () {
    return process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  }

  get NO_PROXY () {
    return process.env.NO_PROXY
  }
}
