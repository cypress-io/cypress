// chai 5+ exposes `chai.util` as a read-only module namespace. `Reflect.set`
// returns false there instead of throwing, so chai's own functions stay.
export const overrideChaiUtil = (util: object, overrides: Record<string, unknown>) => {
  Object.entries(overrides).forEach(([name, value]) => {
    Reflect.set(util, name, value)
  })
}
