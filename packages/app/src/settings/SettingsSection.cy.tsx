import SettingsSection from './SettingsSection.vue'

describe('<SettingsSection />', () => {
  it('renders the description and title slots', () => {
    cy.viewport(800, 200)

    const title = 'Project Id'
    const description = 'A Cypress config setting used to uniquely identify your project when recording runs to Cypress Dashboard. Learn more.'
    const slots = {
      description: () => <p>{description}</p>,
      title: () => <h1>{title}</h1>,
    }
    const code = 'projectId'

    cy.mount(() => (<div class="p-24px">
      <SettingsSection
        v-slots={slots}
        code={code}
      />
    </div>))
    .get('h1').should('contain.text', title)
    .get('p').should('contain.text', description)
    .get('code').should('contain.text', code)

    cy.percySnapshot()
  })

  it('should not render DOM elements for title and description, when slots are not set', () => {
    cy.viewport(800, 200)

    cy.mount(() => (
      <div class="p-24px">
        <SettingsSection>
          <div>You haven not connected any Cypress projects</div>
        </SettingsSection>
      </div>))

    cy.get('section')
    .should('contain.text', 'You haven not connected any Cypress projects')
    .children().should('have.length', 1)
  })
})
