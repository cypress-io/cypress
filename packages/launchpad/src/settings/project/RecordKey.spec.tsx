import RecordKey from './RecordKey.vue'

describe('<RecordKey />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <RecordKey/>
      </div>
      
    ))
  })
})
