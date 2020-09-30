const Module = require('module')
const path = require('path')
const fs = require('fs')

const builtins = Module.builtinModules

if (process.env.CAPTURE_REQUIRE != null) hookRequire()

function hookRequire () {
  const modules = new Set()
  const modulesFile = path.join(__dirname, '..', 'results', 'modules.json')

  const origRequire = Module.prototype.require

  Module.prototype.require = function (id) {
    const isCore = builtins.includes(id)
    const isNodeModule =
      !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('@package')

    if (!isCore && isNodeModule) modules.add(id)

    return origRequire.apply(this, arguments)
  }

  process.on('exit', () => {
    fs.writeFileSync(
      modulesFile,
      JSON.stringify(Array.from(modules).sort(), null, 2),
      'utf8',
    )
  })
}
