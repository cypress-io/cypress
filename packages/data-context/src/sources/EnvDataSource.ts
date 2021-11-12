import type { DataContext } from '../DataContext'

/**
 * Centralizes all of the "env"
 */
export class EnvDataSource {
  constructor (private ctx: DataContext) {}

  get CYPRESS_INTERNAL_VITE_APP_PORT () {
    return process.env.CYPRESS_INTERNAL_VITE_APP_PORT
  }
}
