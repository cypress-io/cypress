import SettingsSection from './SettingsSection.vue'

describe('<SettingsSection />', () => {
  it('renders the description and title slots', () => {
    cy.viewport(800, 200)

    const title = 'Project Id'
    const description = 'A Cypress config setting used to uniquely identify your project when recording runs to Cypress Cloud. Learn more.'
    const slots = {
      description: () => <p>{description}</p>,
      title: () => <h1>{title}</h1>,
    }
    const code = 'projectId'
    const anchorId = 'the-projectId'

    cy.mount(() => (<div className="p-24px">
      <SettingsSection
        v-slots={slots}
        code={code}
        anchorId={anchorId}
      />
    </div>))
    .get('h1').should('contain.text', title)
    .get('p').should('contain.text', description)
    .get('code').should('contain.text', code)
    .get(`#${anchorId}-anchor`).should('exist')

    cy.percySnapshot()
  })
})
