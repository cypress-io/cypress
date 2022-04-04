import webpackDevServerPkg from 'webpack-dev-server/package.json'

export const webpackDevServerFacts = {
  version: webpackDevServerPkg.version,
  isV3 (version = webpackDevServerPkg.version) {
    return /^3\./.test(version)
  },
  isV4 (version = webpackDevServerPkg.version) {
    return /^4\./.test(version)
  },
  unsupported () {
    return Error(`@cypress/webpack-dev-server only supports webpack-dev-server v3 and v4. Found: ${webpackDevServerFacts.version}.`)
  },
}
