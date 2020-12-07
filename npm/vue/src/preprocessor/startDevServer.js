import { start as createDevServer } from '@cypress/webpack-dev-server'

export async function startDevServer (config, webpackConfig) {
  const server = createDevServer(webpackConfig, config)

  return config
}
