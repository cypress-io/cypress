if (!process.browser) {
  var cwd = process.cwd()
  module.paths.push(cwd, path.join(cwd, 'node_modules'))
}
