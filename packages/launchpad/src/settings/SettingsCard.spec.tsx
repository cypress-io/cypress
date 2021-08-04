import SettingsCard from './SettingsCard.vue'
import IconLaptop from 'virtual:vite-icons/mdi/laptop'

describe('<SettingsCard />', () => {
  it('renders', () => {
    const title = 'My Device Settings'
    const description = 'The configuration I\'m passing in.'
    const headerSelector = '[data-testid=settings-card-header]'
    const titleSelector = '[data-testid=settings-card-title]'
    const descriptionSelector = '[data-testid=settings-card-description]'
    const contentSelector = '[data-testid=content]'

    cy.mount(() => (
      <div class="">
        <SettingsCard title={title} description={description} icon={IconLaptop}>
          <div data-testid="content">
            <p>The body of the content</p>
          </div>
        </SettingsCard>
      </div>
    ))
    .get(titleSelector).should('contain.text', title).get(descriptionSelector).should('contain.text', description)
    .get(contentSelector).should('not.exist')
    .get(headerSelector).click()
    .get(contentSelector).should('be.visible')
    .get(headerSelector).click()
    .get(contentSelector).should('not.exist')
  })
})
