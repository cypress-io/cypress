import ProjectSettingsSection from './ProjectSettingsSection.vue'

describe('<ProjectSettingsSection />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <ProjectSettingsSection>
      </ProjectSettingsSection>
    ))
  })
})
