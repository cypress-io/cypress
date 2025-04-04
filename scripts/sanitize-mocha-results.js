// this is a safety script to ensure that Mocha test reports don't contain any environment variables
// usage: yarn sanitize:mocha:results

const Bluebird = require('bluebird')
const fs = require('fs').promises
const path = require('path')
const { readProcessEnv } = require('./circle-env')

const REPORTS_PATH = '/tmp/cypress/junit'

function isAllowlistedEnv (key, value) {
  return (
    // allow some env values that are not sensitive. this is based off of what Circle doesn't mask in stdout:
    // https://circleci.com/docs/env-vars/#secrets-masking
    // > The value of the environment variable or context will not be masked in the job output if:
    // >   * the value of the environment variable is less than 4 characters
    // >   * the value of the environment variable is equal to one of true, True, false, or False
    ['true', 'false', 'TRUE', 'FALSE', 'True', 'False'].includes(value)
    || value.length < 4
    // allow some envs that are not sensitive
    || ['nodejs_version', 'CF_DOMAIN', 'SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES', 'CIRCLE_PROJECT_REPONAME', 'CIRCLE_PR_REPONAME', 'CIRCLE_BRANCH',
      'HOME', 'HOMEPATH', 'PLATFORM', 'HOSTNAME', 'PWD', 'INIT_CWD', 'USER', 'SUDO_USER', 'USERNAME', 'USERPROFILE', 'LOGNAME', 'npm_config_loglevel'].includes(key)
    // ignore npm_package_ envs https://docs.npmjs.com/cli/v11/using-npm/scripts#packagejson-vars
    || key.startsWith('npm_package_')
  )
}

async function checkReportFile (filename, circleEnv) {
  console.log(`Checking that ${filename} doesn't contains any environment variables...`)

  let report

  try {
    report = await fs.readFile(path.join(REPORTS_PATH, filename))
  } catch (err) {
    throw new Error(`Unable to read the report in ${filename}: ${err.message}`)
  }

  // go through all the env vars and check if they're in the report,
  // if they are, delete the report and throw an error.
  const foundKeys = []

  for (const key in circleEnv) {
    const value = circleEnv[key]

    if (!isAllowlistedEnv(key, value) && report.includes(value)) {
      foundKeys.push(key)
    }
  }

  if (foundKeys.length) {
    await fs.rm(REPORTS_PATH, { recursive: true, force: true })
    throw new Error(`Report contained the value of ${foundKeys.join(', ')}, which is a CI environment variable. This means that a failing test is exposing environment variables. Test reports will not be persisted for this job.`)
  }

  console.log('Report parsed successfully.')
}

async function checkReportFiles (filenames) {
  const circleEnv = readProcessEnv()

  await Bluebird.mapSeries(filenames, (f) => checkReportFile(f, circleEnv))

  console.log('All reports are valid.')
}

async function sanitizeMochaResults () {
  console.log('Sanitizing Mocha results...')
  console.log(`Looking for reports in ${REPORTS_PATH}`)

  try {
    await fs.access(REPORTS_PATH)
  } catch {
    console.log('Reports directory does not exist - assuming no tests ran')

    return
  }

  let filenames

  try {
    filenames = await fs.readdir(REPORTS_PATH)
  } catch (err) {
    throw new Error(`Problem reading from ${REPORTS_PATH}: ${err.message}`)
  }

  const resultCount = filenames.length

  console.log(`Found ${resultCount} files in ${REPORTS_PATH}:`, filenames)

  await checkReportFiles(filenames)
}

if (require.main === module) {
  sanitizeMochaResults()
}

module.exports = { sanitizeMochaResults }
