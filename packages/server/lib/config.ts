import _ from 'lodash'
import type { ResolvedFromConfig } from '@packages/types'
import * as configUtils from '@packages/config'

// an object with a few utility methods for easy stubbing from unit tests
export const utils = configUtils.utils

export const setupFullConfigWithDefaults = configUtils.setupFullConfigWithDefaults

export const mergeDefaults = configUtils.mergeDefaults

export const updateWithPluginValues = configUtils.updateWithPluginValues

export const relativeToProjectRoot = configUtils.relativeToProjectRoot

export const setSupportFileAndFolder = configUtils.setSupportFileAndFolder

export const setUrls = configUtils.setUrls

export function getResolvedRuntimeConfig (config, runtimeConfig) {
  const resolvedRuntimeFields = _.mapValues(runtimeConfig, (v): ResolvedFromConfig => ({ value: v, from: 'runtime' }))

  return {
    ...config,
    ...runtimeConfig,
    resolved: { ...config.resolved, ...resolvedRuntimeFields },
  }
}
