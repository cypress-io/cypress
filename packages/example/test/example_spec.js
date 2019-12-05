let expect = require('chai').expect
const path = require('path')
const { curry, each, flow, map } = require('lodash/fp')
let example = require('../index')

const cwd = process.cwd()

/* global describe, it */
describe('Cypress Example', function () {
  it('returns path to example_spec', function () {
    const expected = `${cwd}/cypress/integration/examples`
    return example.getPathToExamples()
      .then(expectToAllEqual(expected))
  })
})

// ---
function expectToAllEqual(expectedPath) {
  return flow([
    map(p => {
      const pathParts = p.split(path.sep)
      return pathParts.slice(0, pathParts.length - 1)
    }),
    map(p => {
      return path.join('/', ...p)
    }),
    map(path.normalize),
    each(p => {
      expect(p).to.eq(path.normalize(expectedPath))
    })
  ])
}
