'use strict'

/* global hexo */
/* eslint-disable no-console */
const chalk = require('chalk')

// https://github.com/mamboer/hexo-filter-cleanup
// only run the filter_cleanup if we are in
// production mode -- deploying static asset
// this will combine multiple JS files into single "application.js"
// note that --debug mode in hexo disables clean up automatically
if (process.env.NODE_ENV !== 'production' &&
  process.env.NODE_ENV !== 'staging') {
  console.log('disabling filter cleanup for environment', process.env.NODE_ENV)
  hexo.config.filter_cleanup = false
} else {
  console.log('NODE_ENV', process.env.NODE_ENV)
  console.log('has filter cleanup', hexo.config.filter_cleanup)
}

if (process.env.NODE_ENV === 'staging') {
  const url = 'https://docs-staging.cypress.io'
  console.log('in environment %s site url is %s', process.env.NODE_ENV, url)
  hexo.config.url = url
}

// hexo does this weird thing where it literally sets
// an 'env' property on the 'env' object
// so we take that into account (and any other way its set)
const env = hexo.env.NODE_ENV || hexo.env.env || process.env.NODE_ENV || 'development'

// set this on both our process + hexo
process.env.NODE_ENV = hexo.env.NODE_ENV = env

console.log('NODE_ENV is:', chalk.cyan(env))
