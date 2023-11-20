import type { FilePart } from '@packages/data-context/src/sources/migration'
import HighlightedFile from './HighlightedFile.vue'

describe('<HighlightedFile/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    const part: readonly FilePart[] = [
      {
        highlight: false,
        text: 'cypress/',
      },
      {
        highlight: true,
        group: 'folder',
        text: 'integration',
      },
      {
        highlight: false,
        text: '/foo.spec.js',
      },
    ]

    cy.mount(() => (<div class="p-[16px]">
      <HighlightedFile
        parts={part}
        highlightClass="text-gray-500"
      />
    </div>))
  })
})
