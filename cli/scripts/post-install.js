#!/usr/bin/env node

const shell = require('shelljs')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.cp('-R', 'node_modules/@types/lodash', 'types')
