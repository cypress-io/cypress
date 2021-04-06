/* eslint-disable no-console */
const execa = require('execa')
const { chdir } = require('process')
const path = require('path')
const fs = require('fs')
const minimist = require('minimist')

const args = minimist(process.argv.slice(2))

const filePath = path.resolve(process.cwd(), args.examplesList)

const PROJECTS_FOR_CI = fs.readFileSync(filePath, { encoding: 'utf8' })
.split('\n')
.filter((a) => !/^\#/.test(a))

const testResultsDestination = path.resolve(process.cwd(), 'test_results')

const runTests = async (dir) => {
  try {
    chdir(dir)

    if (dir !== __dirname) {
      console.log(`Running yarn install in project ${dir}`)
      await execa('yarn', ['install', '--frozen-lockfile'], { stdout: 'inherit' })
    }

    console.log(`Running yarn test in project ${dir}`)
    await execa('yarn', [
      'test',
      '--reporter',
      'cypress-circleci-reporter',
      '--reporter-options',
      `resultsDir=${testResultsDestination}`,
    ], { stdout: 'inherit' })
  } catch (e) {
    if (e.stdout) {
      console.error(e.stdout)
    }

    const exitCode = e.exitCode ? e.exitCode : 1

    console.error(`Tests failed with exit code ${exitCode}`)
    process.exit(exitCode)
  }
}

const main = async () => {
  const NODE_INDEX = process.env.CIRCLE_NODE_INDEX || 0

  if (NODE_INDEX > PROJECTS_FOR_CI.length - 1) {
    return
  }

  const projectDir = `${process.cwd()}${PROJECTS_FOR_CI[NODE_INDEX]}`

  console.log(`Running tests in ${projectDir}`)
  await runTests(projectDir)
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
