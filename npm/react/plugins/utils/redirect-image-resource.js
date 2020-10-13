const debug = require('debug')('cypress-react-unit-test')
const path = require('path')
const mime = require('mime-types')
const fs = require('fs')

/**
 * User code:
 *   import image from './path/to/image.png'
 *   <img src={image} />
 * This loader will return you
 *   image is "/__root/path/to/image.png"
 *   <img src={image} />
 */
function staticResourceLoader() {
  debug('loading static resource %s', this.resourcePath)
  debug('cwd', process.cwd())
  const relativeResourcePath = path.relative(process.cwd(), this.resourcePath)
  debug('relative resource', relativeResourcePath)

  if (relativeResourcePath.startsWith('..')) {
    debug('resource is outside of the current working directory')
    debug('inlining it instead (performance hit!)')
    const mimetype = mime.lookup(this.resourcePath)
    const content = fs.readFileSync(this.resourcePath)
    const encoded = new Buffer(content).toString('base64')
    return `module.exports = "data:${mimetype};base64,${encoded}"`
  }

  const staticResourceUrl = `/__root/${relativeResourcePath}`
  debug('static resource url: %s', staticResourceUrl)

  return `module.exports = ${JSON.stringify(staticResourceUrl)}`
}

module.exports = staticResourceLoader
