import GlobalProjectCard from './GlobalProjectCard.vue'

const lastWeek = () => {
  const today = new Date()

  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).getTime()
}

describe('<GlobalProjectCard />', () => {
  it('renders', () => {
    const project = {
      name: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      lastRun: lastWeek(),
      lastRunStatus: 'passed',
    }

    cy.mount(() => <div class="p-12 overflow-auto resize-x max-w-600px"><GlobalProjectCard project={project} /></div>)
    cy.findByText(project.name).should('be.visible')
    cy.findByText('1 week ago').should('be.visible')
  })
})
