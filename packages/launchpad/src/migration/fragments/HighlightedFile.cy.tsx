import { FilePart, formatMigrationFile } from '@packages/data-context/src/util/migrationFormat'
import { regexps } from '@packages/data-context/src/sources/migration/regexps'
import HighlightedFile from './HighlightedFile.vue'

describe('<HighlightedFile/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    const part: readonly FilePart[] = formatMigrationFile(
      'cypress/integration/foo.spec.js',
      new RegExp(regexps.e2e.before.defaultFolderDefaultTestFiles),
    )

    cy.mount(() => (<div class="p-16px">
      <HighlightedFile
        parts={part}
        highlightClass="text-gray-500"
      />
    </div>))
  })
})
