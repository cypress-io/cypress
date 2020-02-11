let example = require('../index')
let expect = require('chai').expect
const path = require('path')
const _ = require('lodash')


const cwd = process.cwd()

/* global describe, it */
describe('Cypress Example', function () {
  it('returns path to example_spec', function () {
    const expected = path.normalize(`${cwd}/cypress/integration/examples`)

    return example.getPathToExamples()
      .then(expectToAllEqual(expected))
  })
})

// ---
function expectToAllEqual(expectedPath) {
  return (paths) => _.chain(paths)
    .map(result => {
      const pathParts = result.split(path.sep)
      return pathParts.slice(0, pathParts.length - 1)
    })
    .map(_.curry(path.join))
    .map(_.curry(path.normalize))
    .forEach(p => {
      expect(p).to.eq(path.normalize(expectedPath))
    })
}
