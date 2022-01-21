import HighlightedFilesList from './HighlightedFilesList.vue'
import { FilePart, formatMigrationFile, regexps } from '@packages/data-context/src/util/migration'

describe('<HighlightedFilesList/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    type PropType = Readonly<Array<{ parts: readonly FilePart[] }>>
    const _files = [
      'cypress/e2e/app.cy.js',
      'cypress/e2e/blog-post.cy.js',
      'cypress/e2e/homeSpec.cy.js',
      'cypress/e2e/company.cy.js',
      'cypress/e2e/sign-up.cy.js',
    ].map((x) => formatMigrationFile(x, new RegExp(regexps.e2e.afterRegexp)))

    const files: PropType = _files.map((x) => ({ parts: x }))

    cy.mount(() => (<div class="border mx-auto my-120px w-400px">
      <HighlightedFilesList
        files={files}
        highlightClass="text-red-500"
      />
    </div>))
  })
})
