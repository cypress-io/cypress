#!/usr/bin/env node
import { program } from 'commander'
import { main } from './main'
import { version } from '../package.json'

program
.option('--ignore-examples', 'Ignore generating example tests and fixtures by creating one ready-to-fill spec file')
.option('--use-npm', 'Use npm even if yarn is available')
.option('--ignore-ts', 'Ignore typescript if available')
.option('--component-tests', 'Run component testing installation without asking')

program.version(version, '-v --version')
program.parse(process.argv)

main({
  useNpm: program.useNpm,
  ignoreTs: program.ignoreTs,
  ignoreExamples: Boolean(program.ignoreExamples),
  setupComponentTesting: program.componentTests,
}).catch(console.error)
