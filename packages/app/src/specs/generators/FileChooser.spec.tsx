import FileList from './FileList.vue'

describe('<FileList />', () => {
  it('renders', () => {
    cy.mount(() => (<FileList />))
  })
})