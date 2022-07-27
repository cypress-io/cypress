import _ from 'lodash'

// combines the default configuration object with values specified in the
// configuration file like "cypress.{ts|js}". Values in configuration file
// overwrite the defaults.
export function resolveConfigValues (config, src: string) {
  // pick out only known configuration keys
  return _
  .chain(config)
  .mapValues((val) => {
    return {
      value: val,
      from: src,
    }
  })
}
