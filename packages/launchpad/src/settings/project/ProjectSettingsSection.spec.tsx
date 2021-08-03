import ProjectSettingsSection from './ProjectSettingsSection.vue'

describe('<ProjectSettingsSection />', () => {
  it('renders the description and title slots', () => {
    cy.viewport(800, 600)

    const description = '👋 This is my description'
    const title = '📝 This is my title'
    const slots = {
      description: () => <p>{description}</p>,
      title: () => <h1>{title}</h1>,
    }

    cy.mount(() => <ProjectSettingsSection vSlots={slots} />)
    .get('h1').should('contain.text', title)
    .get('p').should('contain.text', description)
  })
})
