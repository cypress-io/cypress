require('../spec_helper')

import fs from 'fs'
import { resolve } from 'path'
import { embedSourceMap } from '../../lib/util/source_map_util'

describe('source map utils', () => {
  let artifactFilePath = resolve(__dirname, '../support/fixtures/example_artifact.js')
  let artifactContents = fs.readFileSync(artifactFilePath, 'utf8')
  let sourceFilePath = resolve(__dirname, '../support/fixtures/example_source.js')
  let sourceContents = fs.readFileSync(sourceFilePath, 'utf8')

  context('.embedSourceMap', () => {
    it('embeds Cypress.onSourceMap invocation with base64 source map', () => {
      const contents = embedSourceMap('cypress/integration/spec.js', artifactContents)
      expect(contents).to.include('window.Cypress.onSourceMap(\'cypress/integration/spec.js\', \'eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW')
      expect(contents).to.include('ufSlcbiJdfQ==\');\n//# sourceMappingURL=')
    })

    it('returns original contents if no source map', () => {
      const contents = embedSourceMap('cypress/integration/spec.js', sourceContents)
      expect(contents).to.equal(sourceContents)
    })

    it('returns original contents if not an inline source map', () => {
      const externalSourceMapContents = artifactContents.replace(/data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/, 'foo.js.map')
      const contents = embedSourceMap('cypress/integration/spec.js', externalSourceMapContents)
      expect(contents).to.equal(externalSourceMapContents)
    })
  })
})
