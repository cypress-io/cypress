#!/usr/bin/env node

require('app-module-path').addPath(__dirname)

const minimist = require('minimist')

const args = minimist(process.argv.slice(2))

switch (args.exec) {
  case 'run':
    require('coffee-script/register')
    require('dev/run')(args)
    break
  case 'install':
    //// TODO: do this through lib/cli.js?
    require('packages/core-download').install()
    break
  case undefined:
    throw new Error('Must pass --exec option')
  default:
    throw new Error(`Invalid --exec option: '${args.exec}'`)
}
