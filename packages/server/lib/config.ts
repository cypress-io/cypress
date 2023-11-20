import _ from 'lodash'
import type { ResolvedFromConfig } from '@packages/types'
import * as configUtils from '@packages/config'

export const setUrls = configUtils.setUrls

export function getResolvedRuntimeConfig (config, runtimeConfig) {
  const resolvedRuntimeFields = _.mapValues(runtimeConfig, (v): ResolvedFromConfig => ({ value: v, from: 'runtime' }))

  return {
    ...config,
    ...runtimeConfig,
    resolved: { ...config.resolved, ...resolvedRuntimeFields },
  }
}
