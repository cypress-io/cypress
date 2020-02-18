/* eslint-disable no-console */

// this is a safety script to ensure that Mocha tests ran, by checking:
// 1. that there are N test results in the reports dir (or at least 1, if N = -1)
// 2. each of them contains 0 failures and >0 tests

const Bluebird = require('bluebird')
const fse = Bluebird.promisifyAll(require('fs-extra'))
const la = require('lazy-ass')
const path = require('path')

const RESULT_REGEX = /<testsuites name="([^"]+)" time="([^"]+)" tests="([^"]+)" failures="([^"]+)"(?: skipped="([^"]+)"|)>/
const REPORTS_PATH = '/tmp/cypress/junit'

const expectedResultCount = Number(process.argv[process.argv.length - 1])

la(expectedResultCount, `Expected expectedResultCount to be a number, but got ${expectedResultCount} instead. Usage: yarn verify:mocha:results <expectedResultCount>`)

const parseResult = (xml) => {
  const [name, time, tests, failures, skipped] = RESULT_REGEX.exec(xml).slice(1)

  return {
    name, time, tests: Number(tests), failures: Number(failures), skipped: Number(skipped),
  }
}

console.log(`Looking for reports in ${REPORTS_PATH}`)

fse.readdir(REPORTS_PATH)
.catch((err) => {
  throw new Error(`Problem reading from ${REPORTS_PATH}: ${err.message}`)
})
.then((files) => {
  const resultCount = files.length

  console.log(`Found ${resultCount} files in ${REPORTS_PATH}:`, files)

  if (expectedResultCount === -1) {
    la(resultCount > 0, 'Expected at least 1 report, but found', resultCount, '. Verify that all tests ran as expected.')
  } else {
    la(expectedResultCount === resultCount, 'Expected', expectedResultCount, 'reports, but found', resultCount, '. Verify that all tests ran as expected.')
  }

  return Bluebird.mapSeries(files, (file) => {
    console.log(`Checking that ${file} contains a valid report...`)

    return fse.readFile(path.join(REPORTS_PATH, file))
    .catch((err) => {
      throw new Error(`Unable to read the report in ${file}: ${err.message}`)
    })
    .then((xml) => {
      try {
        return parseResult(xml)
      } catch (err) {
        throw new Error(`Error parsing result: ${err.message}. File contents:\n\n${xml}`)
      }
    })
    .then(({ name, time, tests, failures, skipped }) => {
      console.log(`Report parsed successfully. Name: ${name}\tTests ran: ${tests}\tFailing: ${failures}\tSkipped: ${skipped}\tTotal time: ${time}`)

      la(tests > 0, 'Expected the total number of tests to be >0, but it was', tests, 'instead.')
      la(failures === 0, 'Expected the number of failures to be equal to 0, but it was', failures, '. This stage should not have been reached. Check why the failed test stage did not cause this entire build to fail.')
    })
  })
})
.catch((err) => {
  console.error(err)
  process.exit(1)
})
