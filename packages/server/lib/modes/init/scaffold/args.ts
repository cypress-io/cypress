import { Args, InitConfig } from '../types'
import { defaultValues } from './option_info'
import { warn } from './fs/log'

/**
 * Check if the argument values are valid
 */
export const checkArgs = (args: Args) => {
  const {
    fixtures,
    fixturesPath,
    support,
    supportPath,
    plugins,
    pluginsPath,
    integrationPath,
  } = args

  if (fixturesPath === '') {
    throw new Error('Empty Path: Fixtures folder path should not be empty.')
  }

  if (supportPath === '') {
    throw new Error('Empty Path: Support file path should not be empty.')
  }

  if (integrationPath === '') {
    throw new Error('Empty Path: Integration folder path should not be empty.')
  }

  if (pluginsPath === '') {
    throw new Error('Empty Path: Plugins file path should not be empty.')
  }

  if (fixtures === false && fixturesPath) {
    throw new Error('Conflicting Arguments: no-fixtures and fixtures-path cannot be defined together.')
  }

  if (support === false && supportPath) {
    throw new Error('Conflicting Arguments: no-support and support-path cannot be defined together.')
  }

  if (plugins === false && pluginsPath) {
    throw new Error('Conflicting Arguments: no-plugins and plugins-path cannot be defined together.')
  }

  if (fixturesPath === defaultValues['fixturesFolder']) {
    warn(`Fixtures folder path, '${defaultValues['fixturesFolder']}', is the default value. It'll be ignored.`)
  }

  if (supportPath === defaultValues['supportFile']) {
    warn(`Support file path, '${defaultValues['supportFile']}', is the default value. It'll be ignored.`)
  }

  if (integrationPath === defaultValues['integrationFolder']) {
    warn(`Integration folder path, '${defaultValues['integrationFolder']}', is the default value. It'll be ignored.`)
  }

  if (pluginsPath === defaultValues['pluginsFile']) {
    warn(`Plugins file path, '${defaultValues['pluginsFile']}', is the default value. It'll be ignored.`)
  }

  const cases = [
    ['fixturesFolder', 'supportFile'],
    ['fixturesFolder', 'integrationFolder'],
    ['fixturesFolder', 'pluginsFile'],
    ['supportFile', 'integrationFolder'],
    ['supportFile', 'pluginsFile'],
    ['integrationFolder', 'pluginsFile'],
  ]

  cases.forEach(([p1, p2]) => {
    if (args[p1] && args[p2] && args[p1] === args[p2]) {
      throw new Error(`Duplicate Paths: ${p1} and ${p2} should be different.`)
    }
  })
}

/**
 * Set config values from arguments.
 */
export const fromCommandArgs = (args: Args, result: InitConfig) => {
  if (args.example) {
    result.example = true
  }

  if (args.typescript) {
    result.typescript = true
  }

  if (args.eslint === false) {
    result.eslint = args.eslint
  }

  if (args.chaiFriendly) {
    result.chaiFriendly = true
  }

  if (args.fixtures === false) {
    result.config.fixturesFolder = false
  }

  if (args.fixturesPath && args.fixturesPath !== defaultValues['fixturesFolder']) {
    result.config.fixturesFolder = args.fixturesPath
  }

  if (args.support === false) {
    result.config.supportFile = false
  }

  if (args.supportPath && args.supportPath !== defaultValues['supportFile']) {
    result.config.supportFile = args.supportPath
  }

  if (args.integrationPath && args.integrationPath !== defaultValues['integrationFolder']) {
    result.config.integrationFolder = args.integrationPath
  }

  if (args.plugins === false) {
    result.config.pluginsFile = false
  }

  if (args.pluginsPath && args.pluginsPath !== defaultValues['pluginsFile']) {
    result.config.pluginsFile = args.pluginsPath
  }

  if (args.video === false) {
    result.config.video = false
  }

  return result
}
