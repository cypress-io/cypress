import { AppComponent } from './app.component'

// Validating Mocha syntax of *.skip is still valid after being patched by `zone.js/testing`
// Actual test content is not important but rather the parsing of the test structure
// Github Issue: https://github.com/cypress-io/cypress/issues/23409
describe('skip', () => {
  describe('suite', () => {
    suite.skip('should exist on `suite`', () => {
      it('skipped', () => {})
    })
  })
  
  describe('describe', () => {
    describe.skip('should exist on `describe`', () => {
      it('skipped', () => {})
    })
  })

  describe('context', () => {
    context.skip('should exist on `context`', () => {
      it('skipped', () => {})
    })
  })

  describe('specify', () => {
    specify.skip('should exist on `specify`', () => {})
  })

  describe('test', () => {
    test.skip('should exist on `test`', () => {})
  })

  describe('it', () => {
    it.skip('should exist on `it`', () => {})
  })
})

it('empty passing test', () => {})
