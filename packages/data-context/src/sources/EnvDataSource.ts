import type { DataContextShell } from '../DataContextShell'

/**
 * Centralizes all of the "env"
 */
export class EnvDataSource {
  constructor (private ctx: DataContextShell) {}

  get CYPRESS_INTERNAL_VITE_APP_PORT () {
    return process.env.CYPRESS_INTERNAL_VITE_APP_PORT
  }
}
