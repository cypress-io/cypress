import type { FullConfig } from '@packages/types'
import type { Immutable } from 'immer'
import _ from 'lodash'
import type { DataContext } from '..'

/**
 * Utilities for taking the config & merging into what we're after in different states
 */
export class ConfigFormatter {
  /**
   * Parse the environment into
   */
  parseEnv () {

  }

  __fromInitializeConfig (config) {
    let theCfg: Cfg = await config.get(this.ctx, this.options)

    if (!theCfg.browsers || theCfg.browsers.length === 0) {
      // @ts-ignore - we don't know if the browser is headed or headless at this point.
      // this is handled in open_project#launch.
      theCfg.browsers = browsers
    }

    if (theCfg.browsers) {
      theCfg.browsers = theCfg.browsers?.map((browser) => {
        if (browser.family === 'chromium' || theCfg.chromeWebSecurity) {
          return browser
        }

        return {
          ...browser,
          warning: browser.warning || errors.getMsgByType('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name),
        }
      })
    }
  }

  /**
   * Adds in the "runtime" values which may be provided on a test-by-test basis in Cypress
   */
  getResolvedRuntimeConfig (config: Immutable<FullConfig>, runtimeConfig: Immutable<Cypress.TestConfigOverrides>) {
    const resolvedRuntimeFields = _.mapValues(runtimeConfig, (v) => {
      return {
        value: v,
        from: 'runtime',
      }
    })

    return {
      ...config,
      ...runtimeConfig,
      resolved: {
        ...config.resolved,
        ...resolvedRuntimeFields,
      },
    }
  }

  /**
   *
   */
  mergeDefaults () {}

  /**
   *
   */
  validatePluginConfig () {

  }
}
