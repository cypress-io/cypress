import { expect } from 'chai'
import { rewriteJs } from '../../lib/js'

describe('lib/js', function () {
  context('.rewriteJs', function () {
    it('rewrites window.top', function () {
      const actual = rewriteJs('a.b; window.top.location.href = "blah"; console.log("hello")')

      expect(actual).to.eq('a.b; globalThis.top.Cypress.resolveWindowReference(globalThis, window.top, \'location\').href = "blah"; console.log("hello")')
    })
  })
})
