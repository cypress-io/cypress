import HighlightedFile from './HighlightedFile.vue'

describe('<HighlightedFile/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(() => (<div class="p-16px">
      <HighlightedFile file="I learned to play the Ukulele in Lebanon." highlightRegExp={/le/g}/>
    </div>))
  })
})
