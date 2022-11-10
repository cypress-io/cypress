import { buildSpecTree, SpecMap } from '../specsBackend/buildtree'
import { it } from 'vitest'
import type { FoundSpec } from '@packages/types/src'

const spec: FoundSpec = {
  baseName: 'cow.cy.js',
  fileExtension: '.js',
  fileName: 'cow',
  name: 'cow',
  relative: 'cypress/e2e/cow.cy.js',
  specFileExtension: '.cy.js',
  specType: 'integration',
  absolute: '/cypress/e2e/cow.cy.js',
}

const hardSpec: FoundSpec = {
  baseName: 'foo.cy.js',
  fileExtension: '.js',
  fileName: 'foo',
  name: 'foo',
  relative: 'hello/cypress/e2e/foo.cy.js',
  specFileExtension: '.cy.js',
  specType: 'integration',
  absolute: '/hello/cypress/e2e/foo.cy.js',
}

const unique: FoundSpec = {
  baseName: 'quacks.cy.js',
  fileExtension: '.js',
  fileName: 'quacks',
  name: 'quacks',
  relative: 'hello/quacks.cy.js',
  specFileExtension: '.cy.js',
  specType: 'integration',
  absolute: '/hello/quacks.cy.js',
}

const answer: SpecMap = new Map([['hello', [spec, hardSpec, unique]], ['hello/cypress', [spec, hardSpec]], ['hello/cypress/e2e', [spec, hardSpec]]])
// const easyAnswer: SpecMap = new Map([['cypress', [spec]], ['cypress/e2e', [spec]]])

describe('only test', () => {
  it('does something', () => {
    const result = buildSpecTree([spec, hardSpec, unique])

    //console.log(result.map)
    expect(answer).to.equal(result.map)
    // console.log(result.map.get('hello'))
    // console.log(JSON.stringify(result.map))
    // console.log(answer)
    // for (const key of easyAnswer.keys()) {
    //   for (const resultK of result.map.keys()) {
    //     expect(easyAnswer.get(key)).to.equal(result.map.get(resultK))
    //   }
    // }
  })
})
