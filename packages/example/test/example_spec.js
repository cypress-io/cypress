let example = require('../index')
let expect = require('chai').expect

let cwd = process.cwd()

/* global describe, it */
describe('Cypress Example', function () {
  it('returns path to example_spec', function () {
    expect(example.getPathToExample()).to.eq(`${cwd}/cypress/integration/example_spec.js`)
  })
})
