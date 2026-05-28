import _ from 'lodash'
import { getCloudRecordingConfigKeys, setUrls } from '@packages/config'

export { setUrls }

const devServerConfigRecordingPreservedKeys = ['bundler', 'framework'] as const

function sanitizeDevServerConfigForRecording (devServerConfig: Record<string, unknown>) {
  const preserved = _.pick(devServerConfig, devServerConfigRecordingPreservedKeys)
  const rest = _.omit(devServerConfig, devServerConfigRecordingPreservedKeys)

  return {
    ...preserved,
    ..._.mapValues(rest, (val) => `omitted: ${typeof val}`),
  }
}

function sanitizeEnvLikeForRecording (obj: Record<string, unknown>) {
  return _.mapValues(obj ?? {}, (val) => `omitted: ${typeof val}`)
}

// Strips out values that can be aribitrarily sized / are duplicated from config
// payload sent for recording (env and expose values replaced with typeof placeholders)
export function filterRuntimeConfigForRecording (config) {
  const { rawJson, devServer, devServerConfig, env, expose, resolved, ...configRest } = config
  const { webpackConfig, viteConfig, ...devServerRest } = devServer ?? {}
  const resultConfig = { ...configRest }

  if (env) {
    resultConfig.env = sanitizeEnvLikeForRecording(env)
  }

  if (expose) {
    resultConfig.expose = sanitizeEnvLikeForRecording(expose)
  }

  if (devServerConfig !== undefined) {
    if (_.isPlainObject(devServerConfig)) {
      resultConfig.devServerConfig = sanitizeDevServerConfigForRecording(devServerConfig)
    } else {
      resultConfig.devServerConfig = `omitted: ${typeof devServerConfig}`
    }
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

  return _.pick(resultConfig, getCloudRecordingConfigKeys())
}
