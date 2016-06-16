var vfs = require('vinyl-fs')
var zunder = require('zunder')

zunder.setConfig({
  staticGlobs: {
    'static/**': '',
    'bower_components/font-awesome/fonts/**': '/fonts',
  }
})
