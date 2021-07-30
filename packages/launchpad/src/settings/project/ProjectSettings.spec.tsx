import ProjectSettings from './ProjectSettings.vue'

describe('<ProjectSettings />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <ProjectSettings/>
      </div>
      
    ))
  })
})
