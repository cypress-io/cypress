path    = require("path")
yeoman  = require('yeoman-generator')
Storage = require("yeoman-generator/lib/util/storage")

yeoman.generators.Base::_setStorage = ->
  storePath = path.join(@destinationRoot(), '.eclectus.json')
  @config = new Storage(@rootGeneratorName(), storePath)

class Base extends yeoman.generators.Base

class NamedBase extends Base

module.exports = {Base: Base, NamedBase: NamedBase}