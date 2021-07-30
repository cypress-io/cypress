import ProjectId from './ProjectId.vue'

describe('<ProjectId />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <ProjectId/>
      </div>
      
    ))
  })
})
