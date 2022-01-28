import HighlightedFilesList from './HighlightedFilesList.vue'
import { FilePart, formatMigrationFile } from '@packages/data-context/src/util/migrationFormat'
import { regexps } from '@packages/data-context/src/sources/migration/regexps'

describe('<HighlightedFilesList/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    type PropType = Readonly<Array<{ parts: readonly FilePart[] }>>
    const _files = [
      'cypress/integration/app.spec.js',
      'cypress/integration/blog-post.spec.js',
      'cypress/integration/homeSpec.spec.js',
      'cypress/integration/company.spec.js',
      'cypress/integration/sign-up.spec.js',
    ].map((x) => formatMigrationFile(x, new RegExp(regexps.e2e.before.defaultFolderDefaultTestFiles)))

    const files: PropType = _files.map((x) => ({ parts: x }))

    cy.mount(() => (<div class="border mx-auto my-120px w-400px">
      <HighlightedFilesList
        files={files}
        highlightClass="text-red-500"
      />
    </div>))
  })
})
