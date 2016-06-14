var vfs = require('vinyl-fs')
var zunder = require('zunder')

function copyFonts (dir) {
  return function () {
    vfs.src('bower_components/font-awesome/fonts/**').pipe(vfs.dest(dir + '/fonts'))
  }
}

zunder.on('before:watch', copyFonts(zunder.config.devDir))
zunder.on('before:build-prod', copyFonts(zunder.config.prodDir))
