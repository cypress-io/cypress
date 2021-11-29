import { ConfigFormatter } from './formatters'

/**
 * Formatters are "utility methods" for pure in -> out data transforms
 */
export class DataFormatters {
  get config () {
    return new ConfigFormatter()
  }
}
