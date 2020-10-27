import fs from 'fs'
import findUp from 'find-up'
import chalk from 'chalk'
import inqueier from 'inquirer'
import { initComponentTesting } from './component-testing/init-component-testing'
import { execSync } from 'child_process'
import { scanFSForAvailableDependency } from './findPackageJson'
import { findInstalledOrInstallCypress } from './installCypress'

type MainArgv = {
  useNpm: boolean
  ignoreTs: boolean
  ignoreExamples: boolean
  setupComponentTesting: boolean
}

function shouldUseYarn () {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' })

    return true
  } catch (e) {
    return false
  }
}

function shouldUseTypescript () {
  return scanFSForAvailableDependency(process.cwd(), ['typescript'])
}

async function askForComponentTesting () {
  const { shouldSetupComponentTesting } = await inqueier.prompt({
    type: 'confirm',
    name: 'shouldSetupComponentTesting',
    message: `Do you want to setup ${chalk.cyan('component testing')}? ${chalk.grey('You can do this later by running this command')}.`,
  })

  return shouldSetupComponentTesting
}

export async function main ({ useNpm, ignoreTs, setupComponentTesting, ignoreExamples }: MainArgv) {
  const rootPackageJsonPath = await findUp('package.json')
  const useYarn = useNpm ? false : shouldUseYarn()
  const useTypescript = ignoreTs ? false : shouldUseTypescript()

  if (!rootPackageJsonPath) {
    throw new Error(`It looks like you are running this script outside of npm module. If you want to install cypress in this folder please run ${chalk.inverse('npm init')} first`)
  }

  const { name, version } = JSON.parse(fs.readFileSync(rootPackageJsonPath).toString())

  console.log(`Running ${chalk.green('cypress 🌲')} installation wizard for ${chalk.cyan(`${name}@${version}`)}...`)

  const { config, cypressConfigPath } = await findInstalledOrInstallCypress({ useYarn, useTypescript, ignoreExamples })
  const shouldSetupComponentTesting = setupComponentTesting ?? await askForComponentTesting()

  if (shouldSetupComponentTesting) {
    await initComponentTesting({ config, cypressConfigPath, useYarn })
  }

  console.log(`✅ Cypress is installed and ready to use!`)

  console.log(`\nHappy testing with ${chalk.green('cypress.io')} 🌲\n`)
}
