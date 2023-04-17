import HighlightedFilesList from './HighlightedFilesList.vue'
import type { FilePart } from '@packages/data-context/src/sources/migration'

describe('<HighlightedFilesList/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    type PropType = Readonly<Array<{ parts: readonly FilePart[] }>>

    const parts: readonly FilePart[] = [
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

    const files: PropType = [{ parts }]

    cy.mount(() => (<div class="border mx-auto my-[120px] w-[400px]">
      <HighlightedFilesList
        files={files}
        highlightClass="text-red-500"
      />
    </div>))
  })
})
