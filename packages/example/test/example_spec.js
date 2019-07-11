let example = require('../index')
let expect = require('chai').expect
let normalize = require('path').normalize

let cwd = process.cwd()

/* global describe, it */
describe('Cypress Example', function () {
  it('returns path to example_spec', function () {
    let result = example.getPathToExample()
    let expected = `${cwd}/cypress/integration/example_spec.js`

    expect(normalize(result)).to.eq(normalize(expected))
  })
})
