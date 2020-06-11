const { SourceMapConsumer } = require('source-map')
import {
  extractSourceMap,
  getSourceContents,
  getSourcePosition,
  initializeSourceMapConsumer,
} from '@packages/driver/src/cypress/source_map_utils'

const _ = Cypress._
const { encodeBase64Unicode } = Cypress.utils

const testContent = `it(\'simple test\', () => {
    expect(true).to.be.true
    expect(true).to.be.false
    expect(false).to.be.false
    expect('サイプリスは一番').to.be.true
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
\/\/# sourceMappingURL=data:application/json;charset=utf-8;base64,${encodeBase64Unicode(JSON.stringify(sourceMap))}
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
    it('returns null if there is no source map embedded', () => {
      const sourceMap = extractSourceMap(file2, testContent)

      expect(sourceMap).to.be.null
    })

    it('returns null if it is not an inline map', () => {
      const sourceMap = extractSourceMap(file2, `${testContent}\n\/\/# sourceMappingURL=foo.map`)

      expect(sourceMap).to.be.null
    })

    it('returns source map when content has an inline map', () => {
      const sourceMap = extractSourceMap(file1, fileContents)

      expect(sourceMap).to.be.eql(sourceMap)
    })

    // https://github.com/cypress-io/cypress/issues/7464
    it('is performant with multiple source map comments in file', () => {
      cy.spy(SourceMapConsumer, 'initialize')

      cy.fixture('problematic-source-map-urls.txt').then((fileContents) => {
        const timeLimit = 10
        const startTime = Date.now()

        extractSourceMap(file1, fileContents)

        const endTime = Date.now()

        expect(endTime - startTime, `extractSourceMap took longer than ${timeLimit}`).to.be.lt(timeLimit)
      })
    })

    // https://github.com/cypress-io/cypress/issues/7481
    it('does not garble utf-8 characters', () => {
      const sourceMap = extractSourceMap(file1, fileContents)

      expect(sourceMap.sourcesContent[1]).to.include('サイプリスは一番')
    })
  })

  context('.getSourceContents', () => {
    before(() => {
      return initializeSourceMapConsumer(file1, sourceMap)
    })

    it('provides source contents for given file', () => {
      const contents = getSourceContents(file1.fullyQualifiedUrl, file1.relative)

      expect(contents).to.equal(testContent)
    })

    it('returns null if no source map consumer can be found', () => {
      expect(getSourceContents('does/not/exist', file1.relative)).to.be.null
    })

    it('returns null if file does not have source map', () => {
      expect(getSourceContents(file2.fullyQualifiedUrl, file1.relative)).to.be.null
    })
  })

  context('.getSourcePosition', () => {
    before(() => {
      return initializeSourceMapConsumer(file1, sourceMap)
    })

    it('returns source position for generated position', () => {
      const position = getSourcePosition(file1.fullyQualifiedUrl, { line: 1, column: 2 })

      expect(_.pick(position, 'line', 'column')).to.eql({ line: 1, column: 0 })
    })
  })

  context('.initializeSourceMapConsumer', () => {
    beforeEach(() => {
      cy.spy(SourceMapConsumer, 'initialize')
    })

    it('initializes and returns source map consumer and file', () => {
      return initializeSourceMapConsumer(file1, sourceMap).then((consumer) => {
        expect(SourceMapConsumer.initialize).to.be.called
        expect(consumer).to.be.an.instanceof(SourceMapConsumer)
      })
    })

    it('resolves null and does not initialize if no source map is provided', () => {
      return initializeSourceMapConsumer(file1).then((consumer) => {
        expect(SourceMapConsumer.initialize).not.to.be.called
        expect(consumer).to.be.null
      })
    })
  })
})
