import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: { 'suite 1': { tests: [{ name: 'test 1' }] } },
})
