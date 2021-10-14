import CreateSpecModal from './CreateSpecModal.vue'
import { ImportFromComponentGenerator } from './generators'

it('renders the currently active generator', () => {
  cy.mount(() => <CreateSpecModal currentGenerator={ImportFromComponentGenerator}/>)
})