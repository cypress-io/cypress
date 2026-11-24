import PromptContent from './PromptContent.vue'

describe('<PromptContent />', { viewportWidth: 500, viewportHeight: 800 }, () => {
  const expectedContent = [
    'Configure CI',
    'Optimize your tests in CI by following these guides.',
    'See other guides',
    'Introduction to CI',
    'Learn the basics of running Cypress in CI.',
    'Run tests faster in CI',
    '5 mins',
    '12 mins',
    'with Parallelization',
    'without Parallelization',
    'With Smart Orchestration, you\'ll be able to:',
    'Run spec files in parallel',
    'Prioritize failed specs to run first',
    'Cancel CI runs on test failure',
    'Learn more',
  ]

  it('renders with expected content', () => {
    cy.mount({
      render: () => {
        return (<div class="border w-[486px]">
          <h2>Configure CI</h2>
          <PromptContent type="ci1" />
          <hr class="my-[32px]" />
          <h2>Run tests faster in CI</h2>
          <PromptContent type="orchestration1" />
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
    .should('have.attr', 'href', 'https://on.cypress.io/setup-ci-circleci?utm_medium=CI+Prompt+1&utm_campaign=Circle&utm_content=Manual&utm_source=Binary%3A+Launchpad')

    cy.contains('a', 'Introduction to CI')
    .should('have.attr', 'href', 'https://on.cypress.io/ci?utm_medium=CI+Prompt+1&utm_campaign=Learn+More&utm_source=Binary%3A+Launchpad')
  })
})
