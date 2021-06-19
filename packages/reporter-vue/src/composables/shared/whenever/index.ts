import { WatchOptions, watch, WatchSource } from 'vue'
import { Fn } from '../utils'

/**
 * Shorthand for watching value to be truthy
 *
 * @see https://vueuse.js.org/whenever
 */
export function whenever<T = boolean>(source: WatchSource<T>, cb: Fn, options?: WatchOptions) {
  return watch(
    source,
    (v) => { if (v) cb() },
    options,
  )
}
