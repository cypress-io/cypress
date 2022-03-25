const path = require('path')

require('@packages/ts/register')
require('@packages/ts/registerFunction')(path.resolve(__dirname, 'scripts', 'gulp'))
require('./scripts/gulp/gulpfile')
