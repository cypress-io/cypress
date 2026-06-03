import assert from 'node:assert'
import path from 'path'
import fs from 'fs'
import debug from 'debug'

const debugInstance = debug('cypress:grep:compare-results')

/**
 * `after:run` handler shared by the integration test configs. Reduces the run
 * results to `{ name, tests: [{ name, state }] }` per spec and asserts they match
 * the checked-in `expected-json/<PROJECT_NAME>.json` snapshot. Set
 * `OVERWRITE_EXPECTED=1` to regenerate the snapshot instead of asserting.
 */
export function compareResults (results: any) {
  if (!process.env.PROJECT_NAME) {
    debugInstance('PROJECT_NAME is not set, skipping comparison...')

    return
  }

  // compare the file to the expected output
  const actualArr = []

  for (const run of results.runs) {
    const specObj: { name: string, tests: { name: string, state: string }[] } = { name: run.spec.name, tests: [] }

    // iterate through tests and add to results object
    for (const test of run.tests) {
      specObj.tests.push({
        name: test.title[0],
        state: test.state,
      })
    }

    actualArr.push(specObj)
  }

  const expectedPath = path.join(__dirname, 'expected-json', `${process.env.PROJECT_NAME}.json`)

  try {
    const expectedArr = JSON.parse(fs.readFileSync(expectedPath, 'utf8'))

    debugInstance('expected results are: %o', expectedArr)

    debugInstance('actual results are: %o', actualArr)
    debugInstance('comparing results')

    // Use JSON.stringify for deep equality comparison since both arrays are JSON-serializable
    assert.strictEqual(
      JSON.stringify(actualArr, null, 2),
      JSON.stringify(expectedArr, null, 2),
    )
  } catch (error) {
    if (process.env.OVERWRITE_EXPECTED) {
      debugInstance('Overwriting expected results')
      fs.writeFileSync(expectedPath, JSON.stringify(actualArr, null, 2), {
        encoding: 'utf8',
        flag: 'w',
      })
    } else {
      debugInstance('Error comparing actual and expected results', error)
      assert.fail(error)
    }
  }
}
