import { AppComponent } from './app.component'

// Validating Mocha syntax of *.only is still valid after being patched by `zone.js/testing`
// Actual test content is not important but rather the parsing of the test structure
// Github Issue: https://github.com/cypress-io/cypress/issues/23409
describe('only', () => {
  describe('suite', () => {
    suite.only('should exist on `suite`', () => {
      it('succeeds', () => {})
    })
  })
  
  describe('describe', () => {
    describe.only('should exist on `describe`', () => {
      it('succeeds', () => {})
    })
  })

  describe('context', () => {
    context.only('should exist on `context`', () => {
      it('succeeds', () => {})
    })
  })

  describe('specify', () => {
    specify.only('should exist on `specify`', () => {})
  })

  describe('test', () => {
    test.only('should exist on `test`', () => {})
  })

  describe('it', () => {
    it.only('should exist on `it`', () => {})
  })
})

it('empty passing test', () => {})
