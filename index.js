require('app-module-path').addPath(__dirname)
require('coffee-script/register')

module.exports = require('./lib/cypress')
