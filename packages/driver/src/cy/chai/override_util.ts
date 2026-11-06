import Debug from 'debug'

const debug = Debug('cypress:driver:chai')

// chai 5+ makes `chai.util` read-only: a module namespace, or an object with
// getter-only properties in chai's bundled build. `Reflect.set` returns false
// for both instead of throwing, so chai's own functions stay.
export const overrideChaiUtil = (util: object, overrides: Record<string, unknown>) => {
  Object.entries(overrides).forEach(([name, value]) => {
    if (!Reflect.set(util, name, value)) {
      debug('chai.util.%s is read-only, so assertion messages use chai\'s own %s', name, name)
    }
  })
}
