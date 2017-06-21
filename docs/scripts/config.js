/* global hexo */

const chalk = require('chalk')

// only run the filter_cleanup if we are in
// production mode -- deploying static asset
if (process.env.NODE_ENV !== 'production') {
  hexo.config.filter_cleanup = false
}

// hexo does this weird thing where it literally sets
// an 'env' property on the 'env' object
// so we take that into account (and any other way its set)
const env = hexo.env.NODE_ENV || hexo.env.env || process.env.NODE_ENV || 'development'

// set this on both our process + hexo
process.env.NODE_ENV = hexo.env.NODE_ENV = env

/* eslint-disable no-console */
console.log('NODE_ENV is:', chalk.cyan(env))
