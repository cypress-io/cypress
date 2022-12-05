const Module = require('module')
const path = require('path')

process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'
try {
  require('./node_modules/bytenode/lib/index.js')
  const filename = path.join(__dirname, 'packages', 'server', 'index.jsc')
  const dirname = path.dirname(filename)

  Module._extensions['.jsc']({
    require: module.require,
    id: filename,
    filename,
    loaded: false,
    path: dirname,
    paths: Module._nodeModulePaths(dirname),
  }, filename)
} catch (error) {
  console.error(error)
  process.exit(1)
}
