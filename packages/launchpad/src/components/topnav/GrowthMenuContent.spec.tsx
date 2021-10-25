import GrowthMenuContent from './GrowthMenuContent.vue'
import { defaultMessages } from '@cy/i18n'

describe('<GrowthMenuContent />', { viewportWidth: 500, viewportHeight: 800 }, () => {
  const { ci, orchestration } = defaultMessages.topNav.docsMenu.prompts
  const expectedContent = [...Object.values(ci), ...Object.values(orchestration)]

  it('renders with expected content', () => {
    cy.mount({
      render: () => {
        return (<div class="w-486px border">
          <h2>{ci.title}</h2>
          <GrowthMenuContent type="ci"/>
          <hr class="my-32px" />
          <h2>{orchestration.title}</h2>
          <GrowthMenuContent type="orchestration"/>
        </div>)
      },
    })

    expectedContent.forEach((text) => {
      cy.contains(text).should('be.visible')
    })

    cy.get('[data-testid="provider-list"] li').should('have.length', 6)
  })
})
