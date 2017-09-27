#!/usr/bin/env node

const shell = require('shelljs')

shell.set('-v') // verbose

shell.rm('lib/*.js')
shell.rm('lib/**/*.js')
