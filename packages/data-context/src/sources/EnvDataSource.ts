import type { DataContext } from '../DataContext'

/**
 * Centralizes all of the "env"
 * TODO: see if/how we might want to use this?
 */
export class EnvDataSource {
  constructor (private ctx: DataContext) {}
}
