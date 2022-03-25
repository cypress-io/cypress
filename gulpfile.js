const path = require('path')

require('@packages/ts/registerPackages')
require('@packages/ts/registerFunction')(path.resolve(__dirname, 'scripts', 'gulp'))
require('./scripts/gulp/gulpfile')
