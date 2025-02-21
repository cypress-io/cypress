import PromptContent from './PromptContent.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<PromptContent />', { viewportWidth: 500, viewportHeight: 800 }, () => {
  const { ci1, orchestration1 } = defaultMessages.topNav.docsMenu.prompts
  const expectedContent = [...Object.values(ci1), ...Object.values(orchestration1)]

  it('renders with expected content', () => {
    cy.mount({
      render: () => {
        return (<div class="border w-[486px]">
          <h2>{ci1.title}</h2>
          <PromptContent type="ci1" />
          <hr class="my-[32px]" />
          <h2>{orchestration1.title}</h2>
          <PromptContent type="orchestration1" />
        </div>)
      },
    })

    expectedContent.forEach((text) => {
      cy.contains(text as string).should('be.visible')
    })

    // links populate with params
    cy.get('[data-testid="provider-list"] li')
    .should('have.length', 6)
    .eq(0)
    .find('a')
    .should('have.attr', 'href', 'https://on.cypress.io/setup-ci-circleci?utm_medium=CI+Prompt+1&utm_campaign=Circle&utm_content=Manual&utm_source=Binary%3A+Launchpad')

    cy.contains('a', defaultMessages.topNav.docsMenu.prompts.ci1.intro)
    .should('have.attr', 'href', 'https://on.cypress.io/ci?utm_medium=CI+Prompt+1&utm_campaign=Learn+More&utm_source=Binary%3A+Launchpad')
  })
})
