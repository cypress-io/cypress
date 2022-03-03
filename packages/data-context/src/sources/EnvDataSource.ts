import type { DataContext } from '../DataContext'

/**
 * Centralizes all of the "env"
 * TODO: see if/how we might want to use this?
 */
export class EnvDataSource {
  constructor (private ctx: DataContext) {}

  get isProduction () {
    return process.env.CYPRESS_INTERNAL_ENV === 'production'
  }

  get HTTP_PROXY () {
    return process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  }

  get NO_PROXY () {
    return process.env.NO_PROXY
  }
}
