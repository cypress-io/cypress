import fs from 'fs'
import findUp from 'find-up'
import chalk from 'chalk'
import util from 'util'
import inquirer from 'inquirer'
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

async function getGitStatus () {
  const execAsync = util.promisify(exec)

  try {
    let { stdout } = await execAsync(`git status --porcelain`)

    console.log(stdout)

    return stdout.trim()
  } catch (e) {
    return ''
  }
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
  const { shouldSetupComponentTesting } = await inquirer.prompt({
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
    console.log(`${chalk.bold.red(`It looks like you are running cypress installation wizard outside of npm module.`)}\nIf you would like to setup a new project for cypress tests please run the ${chalk.inverse(useNpm ? ' npm init ' : ' yarn init ')} first.`)
    process.exit(1)
  }

  const { name = 'unknown', version = '0.0.0' } = JSON.parse(fs.readFileSync(rootPackageJsonPath).toString())

  console.log(`Running ${chalk.green('cypress 🌲')} installation wizard for ${chalk.cyan(`${name}@${version}`)}`)

  const gitStatus = await getGitStatus()

  if (gitStatus) {
    console.error(`\n${chalk.bold.red('This repository has untracked files or uncommmited changes.')}\nThis command will ${chalk.cyan('make changes in the codebase')}, so please remove untracked files, stash or commit any changes, and try again.`)
    process.exit(1)
  }

  const { config, cypressConfigPath } = await findInstalledOrInstallCypress({ useYarn, useTypescript, ignoreExamples })
  const shouldSetupComponentTesting = setupComponentTesting ?? await askForComponentTesting()

  if (shouldSetupComponentTesting) {
    await initComponentTesting({ config, cypressConfigPath, useYarn })
  }

  console.log(`\n👍  Success! Cypress is installed and ready to run tests.`)
  printCypressCommandsHelper({ useYarn })

  console.log(`\nHappy testing with ${chalk.green('cypress.io')} 🌲\n`)
}
