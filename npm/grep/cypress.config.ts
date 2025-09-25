import { defineConfig } from 'cypress'
import { plugin as cypressGrepPlugin } from './src/plugin'
import assert from 'node:assert'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import debug from 'debug'

const debugInstance = debug('cypress:grep:compare-results')

export default defineConfig({
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents (on, config) {
      cypressGrepPlugin(config)

      on('task', {
        grep (config) {
          return cypressGrepPlugin(config)
        },
      })

      on('after:run', (results) => {
        if (!process.env.PROJECT_NAME) {
          debugInstance('PROJECT_NAME is not set, skipping comparison...')

          return
        }

        // compare the file to the expected output
        let actualArr = []

        // @ts-expect-error - runs is not typed
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

          assert.ok(_.isEqual(actualArr, expectedArr))
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
      })

      return config
    },
  },
  fixturesFolder: false,
})
