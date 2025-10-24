#!/usr/bin/env node

import { includeTypes } from './utils'
import { join } from 'path'
import shell from 'shelljs'

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.rm('-rf', 'build')
shell.mkdir('-p', 'build/bin')
shell.mkdir('-p', 'build/types')
shell.cp('bin/cypress', 'build/bin/cypress')
shell.cp('NPM_README.md', 'build/README.md')
shell.cp('.release.json', 'build/.release.json')
// copies our typescript definitions
shell.cp('-R', 'types/*.ts', 'build/types/')
// copies 3rd party typescript definitions
includeTypes.forEach((folder: string) => {
  const source: string = join('types', folder)

  shell.cp('-R', source, 'build/types')
})

// build the project and copy the build files over to the build directory
shell.exec('tsc -p tsconfig.build.json')
shell.exec('tsc -p tsconfig.esm.json')

shell.mkdir('-p', 'build/dist')
shell.cp('dist/*.js', 'build/dist/')
shell.cp('dist/*.mjs', 'build/dist/')

shell.mkdir('-p', 'build/dist/exec')
shell.cp('dist/exec/*.js', 'build/dist/exec')

shell.mkdir('-p', 'build/dist/tasks')
shell.cp('dist/tasks/*.js', 'build/dist/tasks')

shell.mkdir('-p', 'build/dist/bin')
shell.cp('dist/bin/cypress.js', 'build/dist/bin/cypress')
// because this is a compiled file, it is read only and we need to grant execute permissions
shell.chmod('+x', 'build/dist/bin/cypress')
