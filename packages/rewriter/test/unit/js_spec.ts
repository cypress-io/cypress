import _ from 'lodash'
import { expect } from 'chai'
import { rewriteJs } from '../..'

describe('lib/js', function () {
  context('.rewriteJs', function () {
    it('splices strings over nodes', function () {
      const actual = rewriteJs('a.b; window.top.location.href = "blah"; console.log("hello")', function (node) {
        if (_.get(node, 'object.type') === 'Identifier' && _.get(node, 'object.name') === 'window' && _.get(node, 'property.type') === 'Identifier' && _.get(node, 'property.name') === 'top') {
          return 'fakeCypressTopThang(window, top)'
        }
      })

      expect(actual).to.eq('a.b; fakeCypressTopThang(window, top).location.href = "blah"; console.log("hello")')
    })
  })
})
