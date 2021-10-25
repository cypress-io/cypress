import PromptContent from './PromptContent.vue'
import { defaultMessages } from '@cy/i18n'

describe('<PromptContent />', { viewportWidth: 500, viewportHeight: 800 }, () => {
  const { ci, orchestration } = defaultMessages.topNav.docsMenu.prompts
  const expectedContent = [...Object.values(ci), ...Object.values(orchestration)]

  it('renders with expected content', () => {
    cy.mount({
      render: () => {
        return (<div class="w-486px border">
          <h2>{ci.title}</h2>
          <PromptContent type="ci" />
          <hr class="my-32px" />
          <h2>{orchestration.title}</h2>
          <PromptContent type="orchestration" />
        </div>)
      },
    })

    expectedContent.forEach((text) => {
      cy.contains(text).should('be.visible')
    })

    // links populate with params
    cy.get('[data-testid="provider-list"] li')
    .should('have.length', 6)
    .eq(0)
    .find('a')
    .should('have.attr', 'href', 'https://on.cypress.io/setup-ci-circleci?utm_medium=CI+Prompt+1&utm_campaign=Circle&utm_content=Manual')
  })
})
