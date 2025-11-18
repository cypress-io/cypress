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

// Strips out values that can be aribitrarily sized from config payload sent for recording
export function filterRuntimeConfigForRecording (config) {
  const { rawJson, devServer, env, ...configRest } = config
  const { webpackConfig, viteConfig, ...devServerRest } = devServer ?? {}
  const resultConfig = { ...configRest }

  if (env) {
    resultConfig.env = _.mapValues(env ?? {}, (val, key) => typeof val === 'boolean' ? val : `omitted: ${typeof val}`)
  }

  if (devServer) {
    resultConfig.devServer = { ...devServerRest }
    if (typeof webpackConfig !== 'undefined') {
      resultConfig.devServer.webpackConfig = `omitted`
    }

    if (typeof viteConfig !== 'undefined') {
      resultConfig.devServer.viteConfig = `omitted`
    }
  }

  if (resultConfig.resolved?.env) {
    resultConfig.resolved = {
      ...resultConfig.resolved,
      env: _.mapValues(resultConfig.resolved.env ?? {}, (val, key) => ({
        ...val,
        value: typeof val.value === 'boolean' ? val.value : `omitted: ${typeof val.value}`,
      })),
    }
  }

  return resultConfig
}
