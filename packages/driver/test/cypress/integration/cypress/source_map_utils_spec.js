import { initialize, getSourceContents, getSourcePosition } from '../../../../src/cypress/source_map_utils'

const _ = Cypress._

const sourceMap = {
  version: 3,
  sources: [
    'node_modules/browser-pack/_prelude.js',
    'cypress/integration/source_map_spec.js',
  ],
  names: [],
  mappings: 'AAAA;;;ACAA,EAAE,CAAC,kBAAD,EAAqB,YAAM;AAC3B,EAAA,MAAM,CAAC,IAAD,CAAN,CAAa,EAAb,CAAgB,EAAhB,CAAmB,IAAnB;AACA,EAAA,MAAM,CAAC,IAAD,CAAN,CAAa,EAAb,CAAgB,EAAhB,CAAmB,KAAnB;AACA,EAAA,MAAM,CAAC,KAAD,CAAN,CAAc,EAAd,CAAiB,EAAjB,CAAoB,KAApB;AACD,CAJC,CAAF',
  file: 'generated.js',
  sourceRoot: '',
  sourcesContent: [
    '(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module \'"+o+"\'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})',
    'it(\'simple test\', () => {\n  expect(true).to.be.true\n  expect(true).to.be.false\n  expect(false).to.be.false\n})\n',
  ],
}
const sourceMapBase64 = btoa(JSON.stringify(sourceMap))
const file = {
  fullyQualified: 'http://localhost:1234/tests?p=cypress/integration/source_map_spec.js',
  relative: 'cypress/integration/source_map_spec.js',
}

describe('driver/src/cypress/source_map_utils', () => {
  before(() => {
    return initialize(file, sourceMapBase64)
  })

  context('.getSourceContents', () => {
    it('provides source contents for given file', () => {
      const contents = getSourceContents(file.fullyQualified)

      expect(contents).to.equal(`it('simple test', () => {
  expect(true).to.be.true
  expect(true).to.be.false
  expect(false).to.be.false
})
`)
    })
  })

  context('.getSourcePosition', () => {
    it('returns source position for generated position', () => {
      const position = getSourcePosition(file.fullyQualified, { line: 1, column: 2 })

      expect(_.pick(position, 'line', 'column')).to.eql({ line: 1, column: 0 })
    })
  })
})
