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
export function filterRuntimeConfigForRecoding (config) {
  const { rawJson, devServer, env, resolved = {}, ...configRest } = config
  const { webpackConfig, viteConfig, ...devServerRest } = devServer ?? {}
  const resultConfig = { ...configRest }

  resultConfig.env = _.mapValues(env ?? {}, (val, key) => `omitted: ${typeof val}`)

  if (devServer) {
    resultConfig.devServer = { ...devServerRest }
    if (typeof webpackConfig !== 'undefined') {
      resultConfig.devServer.webpackConfig = `omitted`
    }

    if (typeof viteConfig !== 'undefined') {
      resultConfig.devServer.viteConfig = `omitted`
    }
  }

  resultConfig.resolved = {
    ...resolved,
    env: _.mapValues(resolved.env ?? {}, (val, key) => ({
      ...val,
      value: `omitted: ${typeof val.value}`,
    })),
  }

  return resultConfig
}
