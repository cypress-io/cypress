import fs from 'fs-extra'
import findUp from 'find-up'
import path from 'path'
import { installDependency } from './utils'
import chalk from 'chalk'
import ora from 'ora'
import * as initialTemplate from './initialTemplate'

type InstallCypressOpts = {
  useYarn: boolean
  useTypescript: boolean
  ignoreExamples: boolean
}

async function copyFiles ({ ignoreExamples, useTypescript }: InstallCypressOpts) {
  let fileSpinner = ora('Creating config files').start()

  await fs.outputFile(path.resolve(process.cwd(), useTypescript ? 'cypress.config.ts' : 'cypress.config.js'), useTypescript ? `export default {}` : `module.exports = {}\n`)
  await fs.copy(
    initialTemplate.getInitialPluginsFilePath(),
    path.resolve('cypress', 'plugins/index.js'),
  )

  const supportFiles: string[] = await initialTemplate.getInitialSupportFilesPaths()

  await Promise.all(
    supportFiles.map((supportFilePath) => {
      const newSupportFilePath = path.resolve('cypress', 'support', path.basename(supportFilePath))

      return fs.copy(supportFilePath, newSupportFilePath)
    }),
  )

  if (useTypescript) {
    await fs.copy(initialTemplate.getInitialTsConfigPath(), path.resolve('cypress', 'tsconfig.json'))
  }

  // TODO think about better approach
  if (ignoreExamples) {
    const dummySpec = [
      'describe("Spec", () => {',
      '',
      '})',
      '',
    ].join('\n')

    const specFileName = useTypescript ? 'spec.cy.ts' : 'spec.cy.js'
    const specFileToCreate = path.resolve('cypress', 'e2e', specFileName)

    await fs.outputFile(specFileToCreate, dummySpec)
    console.log(`In order to ignore examples a spec file ${chalk.green(path.relative(process.cwd(), specFileToCreate))}.`)
  }

  fileSpinner.succeed()
}

export async function findInstalledOrInstallCypress (options: InstallCypressOpts) {
  const configFile = options.useTypescript ? 'cypress.config.ts' : 'cypress.config.js'
  let cypressConfigPath = await findUp(configFile)

  if (!cypressConfigPath) {
    await installDependency('cypress', options)
    await copyFiles(options)

    cypressConfigPath = await findUp(configFile)
  }

  if (!cypressConfigPath) {
    throw new Error('Unexpected error during cypress installation.')
  }

  const config = await import(cypressConfigPath)

  return {
    cypressConfigPath,
    config: config.default,
  }
}
