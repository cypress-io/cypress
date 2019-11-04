let example = require('../index')
let expect = require('chai').expect
const { join, normalize, sep } = require('path')
const { chain, curry } = require('lodash')


const cwd = process.cwd()

/* global describe, it */
describe('Cypress Example', function () {
  it('returns path to example_spec', function () {
    const expected = normalize(`${cwd}/cypress/integration/examples`)

    return example.getPathToExamples()
      .then(expectToAllEqual(expected))
  })
})

// ---
function expectToAllEqual(expectedPath) {
  return (paths) => chain(paths)
    .map(result => {
      const pathParts = result.split(sep)
      return pathParts.slice(0, pathParts.length - 1)
    })
    .map(curry(join))
    .map(curry(normalize))
    .forEach(p => {
      expect(p).to.eq(normalize(expectedPath))
    })
}
