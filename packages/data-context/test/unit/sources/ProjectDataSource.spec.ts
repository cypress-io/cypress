import { matchedSpecs } from '../../../src/sources'
import { expect } from 'chai'

//   {
//   projectRoot: '/var/folders/T/cy-projects/e2e',
//   testingType: 'e2e',
//   specPattern: [
//   ],
//   specAbsolutePaths: [
//
//   ]
// }

describe('ProjectDataSource', () => {
  context('got a single spec pattern from --spec via cli', () => {
    it('returns spec name only', () => {
      const result = matchedSpecs({
        projectRoot: '/var/folders/T/cy-projects/e2e',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/var/folders/T/cy-projects/e2e/cypress/integration/screenshot_element_capture_spec.js',
        ],
        specPattern: '/var/folders/T/cy-projects/e2e/cypress/integration/screenshot_element_capture_spec.js',
      })

      expect(result[0].relativeToCommonRoot).to.eq('screenshot_element_capture_spec.js')
    })
  })

  context('got a multi spec pattern from --spec via cli', () => {
    it('removes all common path', () => {
      const result = matchedSpecs({
        projectRoot: '/var/folders/T/cy-projects/e2e',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_passing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_hooks_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_hook_spec.js',
        ],
        specPattern: [
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_passing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_hooks_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_h*_spec.js',
        ],
      })

      expect(result[0].relativeToCommonRoot).to.eq('simple_passing_spec.js')
      expect(result[1].relativeToCommonRoot).to.eq('simple_hooks_spec.js')
      expect(result[2].relativeToCommonRoot).to.eq('simple_failing_spec.js')
      expect(result[3].relativeToCommonRoot).to.eq('simple_failing_hook_spec.js')
    })
  })

  context('generic glob from config', () => {
    it('infers common path from glob and returns spec name', () => {
      const result = matchedSpecs({
        projectRoot: '/Users/lachlan/code/work/cypress6/packages/app',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/Users/lachlan/code/work/cypress6/packages/app/cypress/e2e/integration/files.spec.ts',
          '/Users/lachlan/code/work/cypress6/packages/app/cypress/e2e/integration/index.spec.ts',
        ],
        specPattern: 'cypress/e2e/integration/**/*.spec.ts',
      })

      expect(result[0].relativeToCommonRoot).to.eq('files.spec.ts')
      expect(result[1].relativeToCommonRoot).to.eq('index.spec.ts')
    })
  })

  context('deeply nested test', () => {
    xit('infers common path from glob and returns spec name', () => {
      const result = matchedSpecs({
        projectRoot: '/var/folders/y5/T/cy-projects/e2e',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/var/folders/y5/T/cy-projects/e2e/cypress/integration/nested-1/nested-2/screenshot_nested_file_spec.js',
        ],
        specPattern: '/var/folders/y5/T/cy-projects/e2e/cypress/integration/nested-1/nested-2/screenshot_nested_file_spec.js',
      })

      // previous was nested-1/nested-2/screenshot_nested_file_spec.js'
      // now impossible to remove `cypress/integration`
      // see system-tests/test/screenshot_nested_file_spec.js
      expect(result[1].relativeToCommonRoot).to.eq('cypress/integration/nested-1/nested-2/screenshot_nested_file_spec.js')
    })
  })
})
