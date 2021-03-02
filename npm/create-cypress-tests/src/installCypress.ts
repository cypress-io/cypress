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

  await fs.outputFile(path.resolve(process.cwd(), 'cypress.json'), '{}\n')
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

    const specFileToCreate = path.resolve('cypress', 'integration', useTypescript ? 'spec.ts' : 'spec.js')

    await fs.outputFile(path.resolve('cypress', 'integration', useTypescript ? 'spec.js' : 'spec.ts'), dummySpec)
    console.log(`In order to ignore examples a spec file ${chalk.green(path.relative(process.cwd(), specFileToCreate))}.`)
  }

  fileSpinner.succeed()
}

export async function findInstalledOrInstallCypress (options: InstallCypressOpts) {
  let cypressJsonPath = await findUp('cypress.json')

  if (!cypressJsonPath) {
    await installDependency('cypress', options)
    await copyFiles(options)

    cypressJsonPath = await findUp('cypress.json')
  }

  if (!cypressJsonPath) {
    throw new Error('Unexpected error during cypress installation.')
  }

  return {
    cypressConfigPath: cypressJsonPath,
    config: JSON.parse(
      fs.readFileSync(cypressJsonPath, { encoding: 'utf-8' }).toString(),
    ) as Record<string, string>,
  }
}
