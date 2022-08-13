'use strict'

let chai = require('chai')
let expect = chai.expect

let stealthyRequire = require('../../')

describe('When native modules are involved, Stealthy-Require', function () {
  it('should require a module with native deps', function () {
    let req1 = require('../fixtures/native-deps.js')

    let req2 = null

    expect(function () {
      req2 = stealthyRequire(require.cache, function () {
        return require('../fixtures/native-deps.js')
      })
    }).not.to.throw(/* Error: Module did not self-register. */)

    let req3 = require('../fixtures/native-deps.js')

    expect(req1).to.eql(req3)
    expect(req1).to.not.eql(req2)
  })
})
