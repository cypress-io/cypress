import fs from 'fs-extra'
import findUp from 'find-up'
import path from 'path'
import example from '../initial-template'
import { installDependency } from './utils'

type InstallCypressOpts = {
  useYarn: boolean
  useTypescript: boolean
  ignoreExamples: boolean
}

async function copyFiles ({ ignoreExamples, useTypescript }: InstallCypressOpts) {
  await fs.outputFile(path.resolve(process.cwd(), 'cypress.json'), '{}\n')
  await fs.copy(example.getPathToPlugins(), path.resolve('cypress', 'plugins/index.js'))
  const supportFiles: string[] = await example.getPathToSupportFiles()

  await Promise.all(
    supportFiles.map((supportFilePath) => {
      const newSupportFilePath = path.resolve('cypress', 'support', path.basename(supportFilePath))

      return fs.copy(supportFilePath, newSupportFilePath)
    }),
  )

  if (useTypescript) {
    await fs.copy(example.getPathToTsConfig(), path.resolve('cypress', 'tsconfig.json'))
  }
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
