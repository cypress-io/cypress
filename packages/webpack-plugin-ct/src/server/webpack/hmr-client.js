// TODO: move this file into a "webpack" plugin
// `packages/webpack-plugin-ct`

module.exports = function (files) {
  return `
  if (module.hot) {
    module.hot.accept(
      ${JSON.stringify(files.map((f) => f.relativeToThisFile))}, specs => window.runAllSpecs()
    )
  }
  `
}
