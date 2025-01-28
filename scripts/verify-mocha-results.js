// this is a safety script to ensure that Mocha tests ran, by checking:
// 1. that there are N test results in the reports dir (or at least 1, if N is not set)
// 2. each of them contains 0 failures and >0 tests
// additionally, it checks that no secrets are in the reports, since CI does not scrub
// reports for environment variables
// usage: yarn verify:mocha:results <N>

const Bluebird = require('bluebird')
const fs = require('fs').promises
const la = require('lazy-ass')
const path = require('path')
const { readCircleEnv } = require('./circle-env')
const { XMLParser } = require('fast-xml-parser')

const REPORTS_PATH = '/tmp/cypress/junit'

const expectedResultCount = Number(process.argv[process.argv.length - 1])

const parseResult = (xml) => {
  const { testsuites } = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  }).parse(xml)

  const { name, time, tests, failures, skipped } = testsuites

  return {
    name, time, tests: Number(tests), failures: Number(failures), skipped: Number(skipped || 0),
  }
}

const total = { tests: 0, failures: 0, skipped: 0 }

console.log(`Looking for reports in ${REPORTS_PATH}`)

// some env is ok in reports. this is based off of what Circle doesn't mask in stdout:
// https://circleci.com/blog/keep-environment-variables-private-with-secret-masking/
function isWhitelistedEnv (key, value) {
  return ['true', 'false', 'TRUE', 'FALSE'].includes(value)
    || ['nodejs_version', 'CF_DOMAIN', 'SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES'].includes(key)
    || value.length < 4
}

async function checkReportFile (filename, circleEnv) {
  console.log(`Checking that ${filename} contains a valid report...`)

  let xml; let result

  try {
    xml = await fs.readFile(path.join(REPORTS_PATH, filename))
  } catch (err) {
    throw new Error(`Unable to read the report in ${filename}: ${err.message}`)
  }

  try {
    result = parseResult(xml)
  } catch (err) {
    throw new Error(`Error parsing result: ${err.message}. File contents:\n\n${xml}`)
  }

  const { name, time, tests, failures, skipped } = result

  console.log(`Report parsed successfully. Name: ${name}\tTests ran: ${tests}\tFailing: ${failures}\tSkipped: ${skipped}\tTotal time: ${time}`)

  la(tests > 0, 'Expected the total number of tests to be >0, but it was', tests, 'instead.')
  la(failures === 0, 'Expected the number of failures to be equal to 0, but it was', failures, '. This stage should not have been reached. Check why the failed test stage did not cause this entire build to fail.')

  for (const key in circleEnv) {
    const value = circleEnv[key]

    if (!isWhitelistedEnv(key, value) && xml.includes(value)) {
      await fs.rm(REPORTS_PATH, { recursive: true, force: true })
      throw new Error(`Report contained the value of ${key}, which is a CI environment variable. This means that a failing test is exposing environment variables. Test reports will not be persisted for this job.`)
    }
  }

  total.tests += tests
  total.failures += failures
  total.skipped += skipped
}

async function checkReportFiles (filenames) {
  let circleEnv

  try {
    circleEnv = await readCircleEnv()
  } catch (err) {
    // set SKIP_CIRCLE_ENV to bypass, for local development
    if (!process.env.SKIP_CIRCLE_ENV && process.env.CI_DOCKER) throw err

    circleEnv = {}
  }

  await Bluebird.mapSeries(filenames, (f) => checkReportFile(f, circleEnv))

  console.log('All reports are valid.')
  console.log(`Total tests ran: ${total.tests}\tTotal failing: ${total.failures}\tTotal skipped: ${total.skipped}`)
}

async function verifyMochaResults () {
  try {
    try {
      await fs.access(REPORTS_PATH)
    } catch {
      console.log('Reports directory does not exist - assuming no tests ran')

      return
    }

    const filenames = await fs.readdir(REPORTS_PATH)

    const resultCount = filenames.length

    console.log(`Found ${resultCount} files in ${REPORTS_PATH}:`, filenames)

    if (!expectedResultCount) {
      console.log('Expecting at least 1 report...')
      la(resultCount > 0, 'Expected at least 1 report, but found', resultCount, '. Verify that all tests ran as expected.')
    } else {
      console.log(`Expecting exactly ${expectedResultCount} reports...`)
      la(expectedResultCount === resultCount, 'Expected', expectedResultCount, 'reports, but found', resultCount, '. Verify that all tests ran as expected.')
    }

    await checkReportFiles(filenames)
  } catch (err) {
    throw new Error(`Problem reading from ${REPORTS_PATH}: ${err.message}`)
  }
}

if (require.main === module) verifyMochaResults()

module.exports = { verifyMochaResults }
