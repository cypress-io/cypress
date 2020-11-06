import fs from 'fs'
import findUp from 'find-up'
import chalk from 'chalk'
import util from 'util'
import inqueier from 'inquirer'
import { initComponentTesting } from './component-testing/init-component-testing'
import { exec } from 'child_process'
import { scanFSForAvailableDependency } from './findPackageJson'
import { findInstalledOrInstallCypress } from './installCypress'

type MainArgv = {
  useNpm: boolean
  ignoreTs: boolean
  ignoreExamples: boolean
  setupComponentTesting: boolean
}

async function shouldUseYarn () {
  const execAsync = util.promisify(exec)

  return execAsync('yarn --version')
  .then(() => true)
  .catch(() => false)
}

function shouldUseTypescript () {
  return scanFSForAvailableDependency(process.cwd(), ['typescript'])
}

async function askForComponentTesting () {
  const { shouldSetupComponentTesting } = await inqueier.prompt({
    type: 'confirm',
    name: 'shouldSetupComponentTesting',
    message: `Do you want to setup ${chalk.cyan('component testing')}? ${chalk.grey('You can do this later by rerunning this command')}.`,
  })

  return shouldSetupComponentTesting
}

function printCypressCommandsHelper ({ useYarn }: { useYarn: boolean }) {
  const displayedCommand = useYarn ? 'yarn' : 'npx'

  console.log('Inside this directory, you can run several commands:')
  console.log()
  console.log(chalk.cyan(`  ${displayedCommand} cypress open`))
  console.log('    Opens cypress local development app.')
  console.log()
  console.log(chalk.cyan(`  ${displayedCommand} cypress run`))
  console.log('    Runs tests in headless mode.')
}

export async function main ({ useNpm, ignoreTs, setupComponentTesting, ignoreExamples }: MainArgv) {
  const rootPackageJsonPath = await findUp('package.json')
  const useYarn = useNpm === true ? false : await shouldUseYarn()
  const useTypescript = ignoreTs ? false : shouldUseTypescript()

  if (!rootPackageJsonPath) {
    throw new Error(`It looks like you are running this script outside of npm module. If you want to install cypress in this folder please run ${chalk.inverse('npm init')} first`)
  }

  const { name = 'unknown', version = '0.0.0' } = JSON.parse(fs.readFileSync(rootPackageJsonPath).toString())

  console.log(`Running ${chalk.green('cypress 🌲')} installation wizard for ${chalk.cyan(`${name}@${version}`)}`)

  const { config, cypressConfigPath } = await findInstalledOrInstallCypress({ useYarn, useTypescript, ignoreExamples })
  const shouldSetupComponentTesting = setupComponentTesting ?? await askForComponentTesting()

  if (shouldSetupComponentTesting) {
    await initComponentTesting({ config, cypressConfigPath, useYarn })
  }

  console.log(`\n👍  Success! Cypress is installed and ready to run tests.`)
  printCypressCommandsHelper({ useYarn })

  console.log(`\nHappy testing with ${chalk.green('cypress.io')} 🌲\n`)
}
