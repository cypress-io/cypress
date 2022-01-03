import HighlightedFilesList from './HighlightedFilesList.vue'

describe('<HighlightedFilesList/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(() => (<div class="border mx-auto my-120px w-400px">
      <HighlightedFilesList
        files={[
          'cypress/e2e/app.cy.js',
          'cypress/e2e/blog-post.cy.js',
          'cypress/e2e/homeSpec.cy.js',
          'cypress/e2e/company.cy.js',
          'cypress/e2e/sign-up.cy.js',
        ]}
        highlightRegExp={/e2e/g}
        highlightClass="text-red-500"
      />
    </div>))
  })
})
