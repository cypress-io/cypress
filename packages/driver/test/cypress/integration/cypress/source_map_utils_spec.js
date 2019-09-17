const { SourceMapConsumer } = require('source-map')
import { extractSourceMap, getSourceContents, getSourcePosition } from '../../../../src/cypress/source_map_utils'

const _ = Cypress._
const Promise = Cypress.Promise

const testContent = `it(\'simple test\', () => {
    expect(true).to.be.true
    expect(true).to.be.false
    expect(false).to.be.false
})
`
const sourceMap = {
  version: 3,
  sources: [
    'node_modules/browser-pack/_prelude.js',
    'cypress/integration/file1.js',
  ],
  names: [],
  mappings: 'AAAA;;;ACAA,EAAE,CAAC,kBAAD,EAAqB,YAAM;AAC3B,EAAA,MAAM,CAAC,IAAD,CAAN,CAAa,EAAb,CAAgB,EAAhB,CAAmB,IAAnB;AACA,EAAA,MAAM,CAAC,IAAD,CAAN,CAAa,EAAb,CAAgB,EAAhB,CAAmB,KAAnB;AACA,EAAA,MAAM,CAAC,KAAD,CAAN,CAAc,EAAd,CAAiB,EAAjB,CAAoB,KAApB;AACD,CAJC,CAAF',
  file: 'generated.js',
  sourceRoot: '',
  sourcesContent: [
    '(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module \'"+o+"\'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})',
    testContent,
  ],
}

const fileContents = `${testContent}
\/\/# sourceMappingURL=data:application/json;charset=utf-8;base64,${btoa(JSON.stringify(sourceMap))}
`
const createFile = (fileName) => {
  const base = `cypress/integration/${fileName}.js`

  return {
    fullyQualifiedUrl: `http://localhost:1234/tests?p=${base}`,
    relativeUrl: `/tests?p=${base}`,
    relative: base,
  }
}
const file1 = createFile('file1')
const file2 = createFile('file2')

describe('driver/src/cypress/source_map_utils', () => {
  context('.extractSourceMap', () => {
    it('initializes and returns source map consumer and file', () => {
      cy.spy(SourceMapConsumer, 'initialize')

      return extractSourceMap(file1, fileContents).then((result) => {
        expect(SourceMapConsumer.initialize).to.be.called
        expect(result.consumer).to.be.an.instanceof(SourceMapConsumer)
        expect(result.file).to.eql(file1)
      })
    })

    it('resolves null if there is no source map embedded', () => {
      return extractSourceMap(file2, testContent).then((result) => {
        expect(result).to.be.null
      })
    })

    it('resolves null if it is not an inline map', () => {
      return extractSourceMap(file2, `${testContent}\n\/\/# sourceMappingURL=foo.map`).then((result) => {
        expect(result).to.be.null
      })
    })
  })

  context('.getSourceContents', () => {
    before(() => {
      return Promise.join(
        extractSourceMap(file1, fileContents),
        extractSourceMap(file2, testContent)
      )
    })

    it('provides source contents for given file', () => {
      const contents = getSourceContents(file1.relativeUrl)

      expect(contents).to.equal(testContent)
    })

    it('returns null if no source map consumer can be found', () => {
      expect(getSourceContents('does/not/exist')).to.be.null
    })

    it('returns null if file does not have source map', () => {
      expect(getSourceContents(file2.relativeUrl)).to.be.null
    })
  })

  context('.getSourcePosition', () => {
    before(() => {
      return extractSourceMap(file1, fileContents)
    })

    it('returns source position for generated position', () => {
      const position = getSourcePosition(file1.relativeUrl, { line: 1, column: 2 })

      expect(_.pick(position, 'line', 'column')).to.eql({ line: 1, column: 0 })
    })
  })
})
