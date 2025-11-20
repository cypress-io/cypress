import _ from 'lodash'
import * as configUtils from '@packages/config'

export const setUrls = configUtils.setUrls

// Strips out values that can be aribitrarily sized / are duplicated from config
// payload sent for recording
export function filterRuntimeConfigForRecording (config) {
  const { rawJson, devServer, env, resolved, ...configRest } = config
  const { webpackConfig, viteConfig, ...devServerRest } = devServer ?? {}
  const resultConfig = { ...configRest }

  if (env) {
    resultConfig.env = _.mapValues(env ?? {}, (val, key) => `omitted: ${typeof val}`)
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

  return resultConfig
}
