import { Args } from '../args'
import { defaultValues } from './option_info'

export const checkArgs = (args: Args) => {
  const {
    noFixtures,
    fixturesPath,
    noSupport,
    supportPath,
    noPlugins,
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

  if (noFixtures && fixturesPath) {
    throw new Error('Conflicting Arguments: no-fixtures and fixtures-path cannot be defined together.')
  }

  if (noSupport && supportPath) {
    throw new Error('Conflicting Arguments: no-support and support-path cannot be defined together.')
  }

  if (noPlugins && pluginsPath) {
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

export const fromCommandArgs = (args) => {
  return {
    config: {},
  }
}

export const fromPrompts = (args) => {
  throw new Error('Not implemented yet')
}

const warn = (message: string) => {
  // eslint-disable-next-line no-console
  console.warn(message)
}
