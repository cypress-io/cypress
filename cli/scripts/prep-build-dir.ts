#!/usr/bin/env node
import shell from 'shelljs'

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.mkdir('-p', 'build')

shell.cp('NPM_README.md', 'build/README.md')
shell.cp('.release.json', 'build/.release.json')

shell.cp('-R', 'bin', 'build')
shell.cp('-R', 'types', 'build')
