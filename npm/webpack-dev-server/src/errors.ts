export class UnsupportedWebpackVersionUnder4 extends Error {
  constructor (version: number) {
    super(`webpack-dev-server v${version} is no longer supported by @cypress/webpack-dev-server. Please update to webpack-dev-server v4 or use an older version of @cypress/webpack-dev-server.`)
    this.name = 'UnsupportedWebpackVersionUnder4'
  }
}

export class UnsupportedWebpackVersion extends Error {
  constructor (version: number) {
    super(`webpack-dev-server v${version} is not supported by @cypress/webpack-dev-server.`)
    this.name = 'UnsupportedWebpackVersion'
  }
}
