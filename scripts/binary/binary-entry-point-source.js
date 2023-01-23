import Module from 'module'
import path from 'path'
import { runBytecodeAsModule } from 'bytenode'

process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'
try {
  const filename = path.join(__dirname, 'packages', 'server', 'index.jsc')
  const dirname = path.dirname(filename)

  runBytecodeAsModule({
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
