require('../spec_helper')

import fs from 'fs'
import { resolve } from 'path'
import { getStackDetails, extractSourceMap, getSourcePosition, getContentsOfLines } from '../../lib/util/source_map_util'

describe('source map utils', () => {
  let artifactFilePath = resolve(__dirname, '../support/fixtures/example_artifact.js')
  let artifactContents = fs.readFileSync(artifactFilePath, 'utf8')
  let sourceFilePath = resolve(__dirname, '../support/fixtures/example_source.js')
  let sourceContents = fs.readFileSync(sourceFilePath, 'utf8')

  context('.getStackDetails', () => {
    it('pulls detailed information from stack line', () => {
      const stack = (new Error('foo')).stack

      expect(getStackDetails(stack)).to.eql({
        file: 'test/unit/source_map_util_spec.ts',
        function: 'Context.<anonymous>',
        line: 17,
        column: 26,
      })
      expect(getStackDetails(stack, 1)).to.eql({
        file: 'node_modules/mocha/lib/runnable.js',
        function: 'callFn',
        line: 315,
        column: 21,
      })
    })
  })

  context('.extractSourceMap', () => {
    it('pulls out and decodes inline source map from artifact file', () => {
      const sourceMap = extractSourceMap(artifactContents)

      expect(sourceMap).to.be.an('object')
      expect(sourceMap.version).to.be.a('number')
      expect(sourceMap.sources[1]).to.equal('cypress/integration/source_map_spec.js')
    })

    it('errors if file does not contain a source map', () => {
      expect(() => {
        extractSourceMap(sourceContents)
      }).to.throw('Code does not contain a source map url')
    })

    it('errors if source map cannot be parsed', () => {
      const contents = artifactContents.replace(/sourceMappingURL\=.*/, 'sourceMappingURL=data:application/json;charset=utf-8;base64,abcdefg')
      expect(() => {
        extractSourceMap(contents)
      }).to.throw('Cannot parse inline source map: SyntaxError: Unexpected token')
    })
  })

  context('.getSourcePosition', () => {
    it('provides source position for given artifact position', () => {
      const sourceMap = extractSourceMap(artifactContents)

      return getSourcePosition(sourceMap, { line: 5, column: 2 }).then((sourcePosition) => {
        expect(sourcePosition).to.eql({ line: 2, column: 2 })
      })
    })
  })

  context('.getContentsOfLines', () => {
    it('returns contents of lines', () => {
      const lines = getContentsOfLines(sourceContents, 2, 4)
      expect(lines).to.equal('  expect(true).to.be.true\n  expect(true).to.be.false\n  expect(false).to.be.false')
    })
  })
})
