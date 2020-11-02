#!/usr/bin/env node
import chalk from 'chalk'
import { program } from 'commander'
import { main } from './main'

program
.option('--ignore-examples', 'Ignore generating example tests and fixtures by creating one simple dummy spec file.')
.option('--use-npm', 'Use npm even if yarn is available')
.option('--ignore-ts', 'Ignore typescript if available')
.option('--component-tests', 'Run component testing installation wizard without asking')

program.parse(process.argv)

main({
  useNpm: program.useNpm,
  ignoreTs: program.ignoreTs,
  ignoreExamples: Boolean(program.ignoreExamples),
  setupComponentTesting: program.componentTests,
}).catch(console.error)
