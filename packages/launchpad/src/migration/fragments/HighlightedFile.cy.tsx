import { FilePart, formatMigrationFile, regexps } from '@packages/data-context/src/util/migrationFormat'
import HighlightedFile from './HighlightedFile.vue'

describe('<HighlightedFile/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    const part: readonly FilePart[] = formatMigrationFile(
      'cypress/e2e/foo.cy.js',
      new RegExp(regexps.e2e.usingDefaultIntegrationFolder.afterRegexp),
    )

    cy.mount(() => (<div class="p-16px">
      <HighlightedFile
        parts={part}
        highlightClass="text-gray-500"
      />
    </div>))
  })
})
