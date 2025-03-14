// this is a safety script to ensure that Mocha tests ran, by checking:
// 1. that there are N test results in the reports dir (or at least 1, if N is not set)
// 2. each of them contains 0 failures and >0 tests
// usage: yarn verify:mocha:results <N>

const Bluebird = require('bluebird')
const fs = require('fs').promises
const la = require('lazy-ass')
const path = require('path')
const { XMLParser } = require('fast-xml-parser')

const REPORTS_PATH = '/tmp/cypress/junit'

const total = { tests: 0, failures: 0, skipped: 0 }

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

async function checkReportFile (filename) {
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
  la(failures === 0, 'Expected the number of failures to be equal to 0, but it was', failures, 'instead. This stage should not have been reached. Check why the failed test stage did not cause this entire build to fail.')

  total.tests += tests
  total.failures += failures
  total.skipped += skipped
}

async function checkReportFiles (filenames) {
  await Bluebird.mapSeries(filenames, (f) => checkReportFile(f))

  console.log('All reports are valid.')
  console.log(`Total tests ran: ${total.tests}\tTotal failing: ${total.failures}\tTotal skipped: ${total.skipped}`)
}

async function verifyMochaResults ({ expectedResultCount }) {
  console.log(`Verifying Mocha results...`)
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

  if (!expectedResultCount) {
    console.log('Expecting at least 1 report...')
    la(resultCount > 0, 'Expected at least 1 report, but found', resultCount, 'instead. Verify that all tests ran as expected.')
  } else {
    console.log(`Expecting exactly ${expectedResultCount} reports...`)
    la(expectedResultCount === resultCount, 'Expected', expectedResultCount, 'reports, but found', resultCount, 'instead. Verify that all tests ran as expected.')
  }

  await checkReportFiles(filenames)
}

if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length !== 1) {
    throw new Error(`Usage: ${path.basename(process.argv[1])} <expectedResultCount>`)
  }

  verifyMochaResults({ expectedResultCount: Number(args[0]) })
}

module.exports = { verifyMochaResults }
