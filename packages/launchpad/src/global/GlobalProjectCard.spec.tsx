import GlobalProjectCard from './GlobalProjectCard.vue'

describe('<GlobalProjectCard />', () => {
  it('renders', () => {
    const project = {
      name: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      lastRun: new Date('2021-08-01T00:00:00.000Z').getTime(),
      lastRunStatus: 'passed',
    }

    cy.mount(() => <div class="p-12 overflow-auto resize-x max-w-600px"><GlobalProjectCard project={project} /></div>)
    cy.findByText(project.name).should('be.visible')
    cy.findByText('1 week ago').should('be.visible')
  })
})
