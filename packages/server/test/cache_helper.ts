import { CYPRESS_CONFIG_FILES } from '../lib/configFiles'

/**
 * Since we load the cypress.json via `require`,
 * we need to clear the `require.cache` before/after some tests
 * to ensure we are not using a cached configuration file.
 */
export function clearCypressJsonCache () {
  Object.keys(require.cache).forEach((key) => {
    if (CYPRESS_CONFIG_FILES.some((file) => key.includes(file))) {
      delete require.cache[key]
    }
  })
}
