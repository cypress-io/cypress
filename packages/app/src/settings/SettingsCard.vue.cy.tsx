import SettingsCard from './SettingsCard.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import IconLaptop from '~icons/mdi/laptop'

describe('<SettingsCard />', () => {
  const title = 'My Device Settings'
  const description = 'The configuration I\'m passing in.'
  const headerSelector = '[data-cy="collapsible-header"]'
  const collapsibleSelector = `[data-cy="${title}"]`

  it('renders', () => {
    const contentSelector = '[data-testid=content]'

    cy.mount(() => (
      <div class="p-[24px]">
        <SettingsCard title={title} description={description} icon={IconLaptop} maxHeight="800px">
          <div data-testid="content">
            <p>The body of the content</p>
          </div>
        </SettingsCard>
      </div>
    ))

    cy.get(contentSelector).should('not.exist')
    cy.findByText(title).click()
    cy.get(contentSelector).should('be.visible')
    cy.percySnapshot('expanded state')
    cy.findByText(title).click()
    .get(contentSelector).should('not.exist')

    cy.percySnapshot('collapsed state')

    // expected aria and keyboard behavior with space and enter keys:
    cy.get(collapsibleSelector).should('be.focused')
    .get('body').type(' ')
    .get(contentSelector).should('be.visible')
    .get(headerSelector).should('have.attr', 'aria-expanded', 'true')
    .get('body').type(' ')
    .get(contentSelector).should('not.exist')
    .get(headerSelector).should('have.attr', 'aria-expanded', 'false')
    .get('body').type('{enter}')
    .get(contentSelector).should('be.visible')
    .get('body').type('{enter}')
    .get(contentSelector).should('not.exist')
  })

  it('displays a nice focus state', () => {
    const title2 = 'Project Settings again'
    const description2 = 'Lorem ipsum dolor sit amet'

    cy.mount(() => (
      <div class="flex flex-col p-[24px] gap-[24px]">
        <SettingsCard title={title} description={description} icon={IconLaptop} maxHeight="800px">
          <div data-testid="content">
            <p>The body of the content</p>
          </div>
        </SettingsCard>
        <SettingsCard title={title2} description={description2} icon={IconLaptop} maxHeight="800px">
          <div data-testid="content">
            <p>Second content</p>
          </div>
        </SettingsCard>
      </div>
    ))

    cy.contains(collapsibleSelector, title).focus().type(' ')
    cy.findByTestId('setting-expanded-container').contains('The body of the content').should('be.visible')
  })
})
